import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ExpertManagementRequest {
  expertId: string;
  action: "approve" | "reject" | "suspend" | "activate" | "verify";
  reason?: string;
}

interface ContentReviewRequest {
  contentId: string;
  contentType: "insight" | "template" | "newsletter";
  action: "approve" | "reject";
  reason?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (type) {
      case "experts":
        return await getExperts(page, limit);
      case "content":
        return await getContent(page, limit);
      case "commissions":
        return await getCommissions(page, limit);
      case "overview":
        return await getExpertMarketplaceOverview();
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Expert marketplace management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getExperts(page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;

    // Get experts (users who have created content)
    const experts = await db.user.findMany({
      where: {
        OR: [
          { expertInsights: { some: {} } },
          { portfolioTemplates: { some: {} } },
          { newsletters: { some: {} } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        kycStatus: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            expertInsights: true,
            portfolioTemplates: true,
            newsletters: true,
            expertRatings: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get average ratings for each expert
    const expertsWithRatings = await Promise.all(
      experts.map(async (expert) => {
        const ratings = await db.expertRating.findMany({
          where: { expertId: expert.id },
          select: { overallRating: true },
        });

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
          : 0;

        return {
          ...expert,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length,
        };
      })
    );

    const total = await db.user.count({
      where: {
        OR: [
          { expertInsights: { some: {} } },
          { portfolioTemplates: { some: {} } },
          { newsletters: { some: {} } },
        ],
      },
    });

    return NextResponse.json({
      experts: expertsWithRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Get experts error:", error);
    return NextResponse.json(
      { error: "Failed to get experts" },
      { status: 500 }
    );
  }
}

async function getContent(page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;

    // Get all content types
    const [insights, templates, newsletters] = await Promise.all([
      db.expertInsight.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          type: true,
          category: true,
          confidence: true,
          isPremium: true,
          price: true,
          publishedAt: true,
          expert: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              ratings: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
      }),
      db.portfolioTemplate.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          riskLevel: true,
          minInvestment: true,
          maxInvestment: true,
          expectedReturn: true,
          createdAt: true,
          expert: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              copies: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.newsletter.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          frequency: true,
          category: true,
          subscriberCount: true,
          createdAt: true,
          expert: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    // Combine all content
    const allContent = [
      ...insights.map(insight => ({
        ...insight,
        contentType: "insight" as const,
      })),
      ...templates.map(template => ({
        ...template,
        contentType: "template" as const,
      })),
      ...newsletters.map(newsletter => ({
        ...newsletter,
        contentType: "newsletter" as const,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.publishedAt);
      const dateB = new Date(b.createdAt || b.publishedAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Paginate
    const paginatedContent = allContent.slice(skip, skip + limit);

    return NextResponse.json({
      content: paginatedContent,
      pagination: {
        page,
        limit,
        total: allContent.length,
        totalPages: Math.ceil(allContent.length / limit),
      },
    });

  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json(
      { error: "Failed to get content" },
      { status: 500 }
    );
  }
}

async function getCommissions(page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;

    const commissions = await db.commission.findMany({
      where: {
        type: {
          in: ["PORTFOLIO_TEMPLATE_COPY", "EXPERT_INSIGHT_SALE"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        partner: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await db.commission.count({
      where: {
        type: {
          in: ["PORTFOLIO_TEMPLATE_COPY", "EXPERT_INSIGHT_SALE"],
        },
      },
    });

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Get commissions error:", error);
    return NextResponse.json(
      { error: "Failed to get commissions" },
      { status: 500 }
    );
  }
}

async function getExpertMarketplaceOverview() {
  try {
    // Get overview statistics
    const [
      totalExperts,
      totalInsights,
      totalTemplates,
      totalNewsletters,
      totalPurchases,
      totalCommissions,
      pendingCommissions,
    ] = await Promise.all([
      db.user.count({
        where: {
          OR: [
            { expertInsights: { some: {} } },
            { portfolioTemplates: { some: {} } },
            { newsletters: { some: {} } },
          ],
        },
      }),
      db.expertInsight.count(),
      db.portfolioTemplate.count(),
      db.newsletter.count(),
      db.expertInsightPurchase.count(),
      db.commission.aggregate({
        where: {
          type: {
            in: ["PORTFOLIO_TEMPLATE_COPY", "EXPERT_INSIGHT_SALE"],
          },
          status: "PAID",
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.commission.aggregate({
        where: {
          type: {
            in: ["PORTFOLIO_TEMPLATE_COPY", "EXPERT_INSIGHT_SALE"],
          },
          status: "PENDING",
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    // Get top performing experts
    const topExperts = await db.user.findMany({
      where: {
        OR: [
          { expertInsights: { some: {} } },
          { portfolioTemplates: { some: {} } },
          { newsletters: { some: {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        _count: {
          select: {
            expertInsights: true,
            portfolioTemplates: true,
            newsletters: true,
            expertRatings: true,
          },
        },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      statistics: {
        totalExperts,
        totalInsights,
        totalTemplates,
        totalNewsletters,
        totalPurchases,
        totalCommissions: totalCommissions._sum.amount || 0,
        totalCommissionCount: totalCommissions._count._all,
        pendingCommissions: pendingCommissions._sum.amount || 0,
        pendingCommissionCount: pendingCommissions._count._all,
      },
      topExperts,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get expert marketplace overview error:", error);
    return NextResponse.json(
      { error: "Failed to get expert marketplace overview" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is for expert management or content review
    if (body.expertId) {
      return await manageExpert(request, body);
    } else if (body.contentId) {
      return await reviewContent(request, body);
    } else {
      return NextResponse.json(
        { error: "Either expertId or contentId is required" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Expert marketplace management action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function manageExpert(request: NextRequest, body: ExpertManagementRequest) {
  const { expertId, action, reason } = body;

  const adminId = request.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json(
      { error: "Admin ID required" },
      { status: 401 }
    );
  }

  // Check if expert exists
  const expert = await db.user.findUnique({
    where: { id: expertId },
  });

  if (!expert) {
    return NextResponse.json(
      { error: "Expert not found" },
      { status: 404 }
    );
  }

  let result: any = {};

  switch (action) {
    case "approve":
    case "verify":
      // Mark expert as verified
      result = await db.user.update({
        where: { id: expertId },
        data: { isVerified: true },
      });
      break;

    case "reject":
      // Mark expert as not verified
      result = await db.user.update({
        where: { id: expertId },
        data: { isVerified: false },
      });
      break;

    case "suspend":
      // For suspension, we could add a suspended flag
      result = { message: "Expert suspended (implementation needed)" };
      break;

    case "activate":
      // Activate expert account
      result = { message: "Expert activated (implementation needed)" };
      break;

    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }

  // Log admin activity
  await db.adminActivityLog.create({
    data: {
      adminId,
      action: `EXPERT_${action.toUpperCase()}`,
      entity: "User",
      entityId: expertId,
      changes: JSON.stringify({ action, reason }),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return NextResponse.json({
    message: `Expert ${action} completed successfully`,
    result,
  });
}

async function reviewContent(request: NextRequest, body: ContentReviewRequest) {
  const { contentId, contentType, action, reason } = body;

  const adminId = request.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json(
      { error: "Admin ID required" },
      { status: 401 }
    );
  }

  let content: any = null;

  switch (contentType) {
    case "insight":
      content = await db.expertInsight.findUnique({
        where: { id: contentId },
      });
      break;
    case "template":
      content = await db.portfolioTemplate.findUnique({
        where: { id: contentId },
      });
      break;
    case "newsletter":
      content = await db.newsletter.findUnique({
        where: { id: contentId },
      });
      break;
    default:
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
  }

  if (!content) {
    return NextResponse.json(
      { error: "Content not found" },
      { status: 404 }
    );
  }

  // Log admin activity
  await db.adminActivityLog.create({
    data: {
      adminId,
      action: `CONTENT_${action.toUpperCase()}`,
      entity: contentType,
      entityId: contentId,
      changes: JSON.stringify({ action, reason }),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return NextResponse.json({
    message: `Content ${action} completed successfully`,
    content: {
      id: content.id,
      type: contentType,
      action,
      reviewed: true,
    },
  });
}