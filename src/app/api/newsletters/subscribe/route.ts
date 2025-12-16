import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SubscribeNewsletterRequest {
  newsletterId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeNewsletterRequest = await request.json();
    const { newsletterId } = body;

    if (!newsletterId) {
      return NextResponse.json(
        { error: "Newsletter ID is required" },
        { status: 400 }
      );
    }

    // Get user ID from headers (in real app, get from auth)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Get the newsletter
    const newsletter = await db.newsletter.findUnique({
      where: { id: newsletterId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
          },
        },
        subscriptions: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!newsletter || !newsletter.isActive) {
      return NextResponse.json(
        { error: "Newsletter not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user already subscribed
    if (newsletter.subscriptions.length > 0) {
      const existingSubscription = newsletter.subscriptions[0];
      
      if (existingSubscription.status === "ACTIVE") {
        return NextResponse.json(
          { error: "You are already subscribed to this newsletter" },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        const subscription = await db.newsletterSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "ACTIVE",
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
          include: {
            newsletter: {
              include: {
                expert: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        // Update subscriber count
        await db.newsletter.update({
          where: { id: newsletterId },
          data: {
            subscriberCount: {
              increment: 1,
            },
          },
        });

        return NextResponse.json({
          message: "Successfully re-subscribed to newsletter",
          subscription,
        });
      }
    }

    // Create new subscription
    const subscription = await db.newsletterSubscription.create({
      data: {
        newsletterId,
        userId,
        status: "ACTIVE",
      },
      include: {
        newsletter: {
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update subscriber count
    await db.newsletter.update({
      where: { id: newsletterId },
      data: {
        subscriberCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      message: "Successfully subscribed to newsletter",
      subscription,
    });

  } catch (error) {
    console.error("Subscribe to newsletter error:", error);
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

    // Get user ID from headers (in real app, get from auth)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Find active subscription
    const subscription = await db.newsletterSubscription.findFirst({
      where: {
        newsletterId,
        userId,
        status: "ACTIVE",
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found for this newsletter" },
        { status: 404 }
      );
    }

    // Update subscription status
    await db.newsletterSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        unsubscribedAt: new Date(),
      },
    });

    // Update subscriber count
    await db.newsletter.update({
      where: { id: newsletterId },
      data: {
        subscriberCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      message: "Successfully unsubscribed from newsletter",
    });

  } catch (error) {
    console.error("Unsubscribe from newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const newsletterId = searchParams.get("newsletterId");

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get("x-user-id");
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Build where clause
    const where: any = { userId: targetUserId, status: "ACTIVE" };
    if (newsletterId) where.newsletterId = newsletterId;

    const subscriptions = await db.newsletterSubscription.findMany({
      where,
      include: {
        newsletter: {
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                subscriptions: {
                  where: { status: "ACTIVE" },
                },
              },
            },
          },
        },
      },
      orderBy: {
        subscribedAt: "desc",
      },
    });

    // Process subscriptions to include subscriber count
    const processedSubscriptions = subscriptions.map(subscription => ({
      ...subscription,
      newsletter: {
        ...subscription.newsletter,
        activeSubscribers: subscription.newsletter._count.subscriptions,
      },
    }));

    // Calculate summary statistics
    const summary = {
      totalSubscriptions: subscriptions.length,
      byFrequency: subscriptions.reduce((acc, subscription) => {
        const frequency = subscription.newsletter.frequency;
        if (!acc[frequency]) {
          acc[frequency] = 0;
        }
        acc[frequency]++;
        return acc;
      }, {} as Record<string, number>),
      byCategory: subscriptions.reduce((acc, subscription) => {
        const category = subscription.newsletter.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category]++;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      subscriptions: processedSubscriptions,
      summary,
      filters: {
        userId: targetUserId,
        newsletterId,
      },
    });

  } catch (error) {
    console.error("Get newsletter subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}