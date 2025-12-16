import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface NewsletterRequest {
  title: string;
  description: string;
  frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY";
  category: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get("expertId");
    const category = searchParams.get("category");
    const frequency = searchParams.get("frequency");
    const isActive = searchParams.get("isActive");
    const userId = searchParams.get("userId"); // To check user's subscriptions
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: any = { isActive: true };
    if (expertId) where.expertId = expertId;
    if (category) where.category = category;
    if (frequency) where.frequency = frequency;
    if (isActive !== null) where.isActive = isActive === "true";

    // Get newsletters with pagination
    const newsletters = await db.newsletter.findMany({
      where,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        subscriptions: userId ? {
          where: { userId },
          select: { id: true, status: true },
        } : false,
        _count: {
          select: {
            subscriptions: {
              where: { status: "ACTIVE" },
            },
            issues: true,
          },
        },
      },
      orderBy: [
        { subscriberCount: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Process newsletters to include subscription status
    const processedNewsletters = newsletters.map(newsletter => {
      const subscription = newsletter.subscriptions && newsletter.subscriptions[0];
      
      return {
        ...newsletter,
        subscriptions: undefined, // Remove detailed subscriptions from response
        isSubscribed: subscription ? subscription.status === "ACTIVE" : false,
        subscriptionStatus: subscription ? subscription.status : null,
        activeSubscribers: newsletter._count.subscriptions,
        totalIssues: newsletter._count.issues,
      };
    });

    // Get total count for pagination
    const total = await db.newsletter.count({ where });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      newsletters: processedNewsletters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        expertId,
        category,
        frequency,
        isActive,
        userId,
      },
    });

  } catch (error) {
    console.error("Get newsletters error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NewsletterRequest = await request.json();
    const { title, description, frequency, category } = body;

    if (!title || !description || !frequency || !category) {
      return NextResponse.json(
        { error: "Title, description, frequency, and category are required" },
        { status: 400 }
      );
    }

    // Get expert ID from headers (in real app, get from auth)
    const expertId = request.headers.get("x-user-id");
    if (!expertId) {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 401 }
      );
    }

    // Validate frequency
    const validFrequencies = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency. Must be one of: " + validFrequencies.join(", ") },
        { status: 400 }
      );
    }

    // Create newsletter
    const newsletter = await db.newsletter.create({
      data: {
        expertId,
        title,
        description,
        frequency,
        category,
      },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Newsletter created successfully",
      newsletter,
    });

  } catch (error) {
    console.error("Create newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletterId, ...updateData } = body;

    if (!newsletterId) {
      return NextResponse.json(
        { error: "Newsletter ID is required" },
        { status: 400 }
      );
    }

    // Validate frequency if provided
    if (updateData.frequency) {
      const validFrequencies = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"];
      if (!validFrequencies.includes(updateData.frequency)) {
        return NextResponse.json(
          { error: "Invalid frequency. Must be one of: " + validFrequencies.join(", ") },
          { status: 400 }
        );
      }
    }

    const newsletter = await db.newsletter.update({
      where: { id: newsletterId },
      data: updateData,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Newsletter updated successfully",
      newsletter,
    });

  } catch (error) {
    console.error("Update newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsletterId = searchParams.get("newsletterId");

    if (!newsletterId) {
      return NextResponse.json(
        { error: "Newsletter ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await db.newsletter.update({
      where: { id: newsletterId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Newsletter deactivated successfully",
    });

  } catch (error) {
    console.error("Delete newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}