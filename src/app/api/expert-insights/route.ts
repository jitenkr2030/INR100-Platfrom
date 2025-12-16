import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ExpertInsightRequest {
  title: string;
  content: string;
  type: "TECHNICAL_ANALYSIS" | "FUNDAMENTAL_ANALYSIS" | "NEWS_ANALYSIS" | "MARKET_OUTLOOK" | "STOCK_RECOMMENDATION" | "PORTFOLIO_ADVICE" | "RISK_WARNING" | "OPPORTUNITY_ALERT";
  category: string;
  assetId?: string;
  confidence: number;
  targetPrice?: number;
  timeHorizon?: string;
  isPremium?: boolean;
  price?: number;
  tags?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get("expertId");
    const assetId = searchParams.get("assetId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const isPremium = searchParams.get("isPremium");
    const userId = searchParams.get("userId"); // To check user's purchases
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: any = { isActive: true };
    if (expertId) where.expertId = expertId;
    if (assetId) where.assetId = assetId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (isPremium !== null) where.isPremium = isPremium === "true";

    // Get insights with pagination
    const insights = await db.expertInsight.findMany({
      where,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        asset: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
        purchases: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            ratings: true,
          },
        },
      },
      orderBy: [
        { publishedAt: "desc" },
        { confidence: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Process insights to include user purchase status and average rating
    const processedInsights = insights.map(insight => {
      const avgRating = insight.ratings.length > 0 
        ? insight.ratings.reduce((sum, rating) => sum + rating.rating, 0) / insight.ratings.length
        : 0;

      return {
        ...insight,
        ratings: undefined, // Remove detailed ratings from response
        isPurchased: insight.purchases && insight.purchases.length > 0,
        averageRating: avgRating,
        totalRatings: insight._count.ratings,
        totalPurchases: insight._count.purchases,
      };
    });

    // Get total count for pagination
    const total = await db.expertInsight.count({ where });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      insights: processedInsights,
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
        assetId,
        type,
        category,
        isPremium,
        userId,
      },
    });

  } catch (error) {
    console.error("Get expert insights error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExpertInsightRequest = await request.json();
    const { 
      title, 
      content, 
      type, 
      category, 
      assetId, 
      confidence, 
      targetPrice, 
      timeHorizon, 
      isPremium, 
      price, 
      tags 
    } = body;

    if (!title || !content || !type || !category || confidence === undefined) {
      return NextResponse.json(
        { error: "Title, content, type, category, and confidence are required" },
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

    // Validate confidence score (0-1)
    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: "Confidence must be between 0 and 1" },
        { status: 400 }
      );
    }

    // Validate premium pricing
    if (isPremium && !price) {
      return NextResponse.json(
        { error: "Price is required for premium insights" },
        { status: 400 }
      );
    }

    // Create expert insight
    const insight = await db.expertInsight.create({
      data: {
        expertId,
        title,
        content,
        type,
        category,
        assetId,
        confidence,
        targetPrice,
        timeHorizon,
        isPremium: isPremium ?? false,
        price,
        tags: tags ? JSON.stringify(tags) : null,
      },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        asset: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Expert insight created successfully",
      insight,
    });

  } catch (error) {
    console.error("Create expert insight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightId, ...updateData } = body;

    if (!insightId) {
      return NextResponse.json(
        { error: "Insight ID is required" },
        { status: 400 }
      );
    }

    // Process arrays for JSON fields
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    // Validate confidence if provided
    if (updateData.confidence !== undefined && (updateData.confidence < 0 || updateData.confidence > 1)) {
      return NextResponse.json(
        { error: "Confidence must be between 0 and 1" },
        { status: 400 }
      );
    }

    const insight = await db.expertInsight.update({
      where: { id: insightId },
      data: updateData,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        asset: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Expert insight updated successfully",
      insight,
    });

  } catch (error) {
    console.error("Update expert insight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get("insightId");

    if (!insightId) {
      return NextResponse.json(
        { error: "Insight ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await db.expertInsight.update({
      where: { id: insightId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Expert insight deactivated successfully",
    });

  } catch (error) {
    console.error("Delete expert insight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}