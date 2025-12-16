import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // ALL, REGULAR, QUESTION, ACHIEVEMENT, NEWS
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause for posts
    let whereClause: any = {};

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    // Get posts with user and engagement data
    const posts = await db.socialPost.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        } : false,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                subscriptionTier: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3, // Limit comments per post for feed
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await db.socialPost.count({
      where: whereClause,
    });

    // Enrich posts with engagement data
    const enrichedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes && post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      // Remove the likes array from response as it's only for checking if current user liked
      likes: undefined,
      _count: undefined,
    }));

    // Get community statistics
    const communityStats = await db.socialPost.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const statsByType = communityStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get trending topics from recent posts
    const recentPosts = await db.socialPost.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        content: true,
      },
    });

    // Simple trending topics extraction (words with # or common investment terms)
    const trendingKeywords: Record<string, number> = {};
    const investmentKeywords = ['stocks', 'mutual funds', 'etf', 'crypto', 'trading', 'investment', 'portfolio', 'nifty', 'sensex', 'profit', 'loss'];

    recentPosts.forEach(post => {
      const words = post.content.toLowerCase().split(/\s+/);
      
      // Extract hashtags
      words.forEach(word => {
        if (word.startsWith('#') && word.length > 1) {
          const keyword = word.slice(1);
          trendingKeywords[keyword] = (trendingKeywords[keyword] || 0) + 1;
        }
      });

      // Extract investment-related keywords
      investmentKeywords.forEach(keyword => {
        if (post.content.toLowerCase().includes(keyword)) {
          trendingKeywords[keyword] = (trendingKeywords[keyword] || 0) + 1;
        }
      });
    });

    // Get top trending topics
    const trendingTopics = Object.entries(trendingKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return NextResponse.json({
      posts: enrichedPosts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      communityStats: {
        totalPosts: totalCount,
        postsByType: statsByType,
        trendingTopics,
      },
    });

  } catch (error) {
    console.error("Get community feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, images = [], type = "REGULAR", topic } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "User ID and content are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create the post
    const post = await db.socialPost.create({
      data: {
        userId,
        content,
        images,
        type,
        topic,
        status: "PUBLISHED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Create activity record for user's feed
    await db.activity.create({
      data: {
        userId,
        type: "POST_CREATED",
        description: `Created a new ${type.toLowerCase()} post`,
        metadata: {
          postId: post.id,
          postType: type,
        },
      },
    });

    return NextResponse.json({
      message: "Post created successfully",
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        _count: undefined,
      },
    });

  } catch (error) {
    console.error("Create community post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}