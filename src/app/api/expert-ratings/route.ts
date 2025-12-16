import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ExpertRatingRequest {
  expertId: string;
  overallRating: number;
  accuracy?: number;
  usefulness?: number;
  clarity?: number;
  comment?: string;
}

interface InsightRatingRequest {
  insightId: string;
  rating: number;
  comment?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is for expert rating or insight rating
    if (body.insightId) {
      return await rateInsight(request, body);
    } else {
      return await rateExpert(request, body);
    }
  } catch (error) {
    console.error("Create rating error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function rateExpert(request: NextRequest, body: ExpertRatingRequest) {
  const { expertId, overallRating, accuracy, usefulness, clarity, comment } = body;

  if (!expertId || !overallRating) {
    return NextResponse.json(
      { error: "Expert ID and overall rating are required" },
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

  // Validate ratings (1-5)
  if (overallRating < 1 || overallRating > 5) {
    return NextResponse.json(
      { error: "Overall rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  if (accuracy && (accuracy < 1 || accuracy > 5)) {
    return NextResponse.json(
      { error: "Accuracy rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  if (usefulness && (usefulness < 1 || usefulness > 5)) {
    return NextResponse.json(
      { error: "Usefulness rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  if (clarity && (clarity < 1 || clarity > 5)) {
    return NextResponse.json(
      { error: "Clarity rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Check if user already rated this expert
  const existingRating = await db.expertRating.findUnique({
    where: {
      expertId_userId: {
        expertId,
        userId,
      },
    },
  });

  let rating;
  if (existingRating) {
    // Update existing rating
    rating = await db.expertRating.update({
      where: { id: existingRating.id },
      data: {
        overallRating,
        accuracy,
        usefulness,
        clarity,
        comment,
        updatedAt: new Date(),
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
  } else {
    // Create new rating
    rating = await db.expertRating.create({
      data: {
        expertId,
        userId,
        overallRating,
        accuracy,
        usefulness,
        clarity,
        comment,
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
  }

  // Calculate updated average rating for the expert
  const expertRatings = await db.expertRating.findMany({
    where: { expertId },
    select: { overallRating: true },
  });

  const averageRating = expertRatings.length > 0
    ? expertRatings.reduce((sum, r) => sum + r.overallRating, 0) / expertRatings.length
    : 0;

  return NextResponse.json({
    message: "Expert rating saved successfully",
    rating,
    expertStats: {
      totalRatings: expertRatings.length,
      averageRating,
    },
  });
}

async function rateInsight(request: NextRequest, body: InsightRatingRequest) {
  const { insightId, rating, comment } = body;

  if (!insightId || !rating) {
    return NextResponse.json(
      { error: "Insight ID and rating are required" },
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

  // Validate rating (1-5)
  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Check if user purchased this insight
  const purchase = await db.expertInsightPurchase.findUnique({
    where: {
      userId_insightId: {
        userId,
        insightId,
      },
    },
  });

  if (!purchase) {
    return NextResponse.json(
      { error: "You can only rate insights you have purchased" },
      { status: 403 }
    );
  }

  // Check if user already rated this insight
  const existingRating = await db.expertInsightRating.findUnique({
    where: {
      insightId_userId: {
        insightId,
        userId,
      },
    },
  });

  let insightRating;
  if (existingRating) {
    // Update existing rating
    insightRating = await db.expertInsightRating.update({
      where: { id: existingRating.id },
      data: {
        rating,
        comment,
        updatedAt: new Date(),
      },
      include: {
        insight: {
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
  } else {
    // Create new rating
    insightRating = await db.expertInsightRating.create({
      data: {
        insightId,
        userId,
        rating,
        comment,
      },
      include: {
        insight: {
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
  }

  // Calculate updated average rating for the insight
  const insightRatings = await db.expertInsightRating.findMany({
    where: { insightId },
    select: { rating: true },
  });

  const averageRating = insightRatings.length > 0
    ? insightRatings.reduce((sum, r) => sum + r.rating, 0) / insightRatings.length
    : 0;

  // Update the insight's average rating
  await db.expertInsight.update({
    where: { id: insightId },
    data: { rating: averageRating },
  });

  return NextResponse.json({
    message: "Insight rating saved successfully",
    rating: insightRating,
    insightStats: {
      totalRatings: insightRatings.length,
      averageRating,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get("expertId");
    const insightId = searchParams.get("insightId");

    if (insightId) {
      // Get ratings for a specific insight
      const ratings = await db.expertInsightRating.findMany({
        where: { insightId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Calculate statistics
      const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings.filter(r => r.rating === rating).length,
      }));

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return NextResponse.json({
        ratings,
        statistics: {
          totalRatings: ratings.length,
          averageRating,
          ratingDistribution: ratingCounts,
        },
      });
    } else if (expertId) {
      // Get ratings for a specific expert
      const ratings = await db.expertRating.findMany({
        where: { expertId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Calculate statistics
      const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings.filter(r => r.overallRating === rating).length,
      }));

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
        : 0;

      const averageAccuracy = ratings.filter(r => r.accuracy).length > 0
        ? ratings.filter(r => r.accuracy).reduce((sum, r) => sum + (r.accuracy || 0), 0) / ratings.filter(r => r.accuracy).length
        : 0;

      const averageUsefulness = ratings.filter(r => r.usefulness).length > 0
        ? ratings.filter(r => r.usefulness).reduce((sum, r) => sum + (r.usefulness || 0), 0) / ratings.filter(r => r.usefulness).length
        : 0;

      const averageClarity = ratings.filter(r => r.clarity).length > 0
        ? ratings.filter(r => r.clarity).reduce((sum, r) => sum + (r.clarity || 0), 0) / ratings.filter(r => r.clarity).length
        : 0;

      return NextResponse.json({
        ratings,
        statistics: {
          totalRatings: ratings.length,
          averageRating,
          averageAccuracy,
          averageUsefulness,
          averageClarity,
          ratingDistribution: ratingCounts,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Either expertId or insightId is required" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}