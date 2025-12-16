import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get expert ID from headers (in real app, get from auth)
    const expertId = request.headers.get("x-user-id");
    if (!expertId) {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 401 }
      );
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get portfolio template statistics
    const portfolioStats = await db.portfolioTemplate.aggregate({
      where: { expertId, isActive: true },
      _count: { id: true },
    });

    // Get portfolio template copies
    const portfolioCopies = await db.portfolioTemplateCopy.count({
      where: {
        template: { expertId },
        isActive: true,
      },
    });

    // Get expert insights statistics
    const insightsStats = await db.expertInsight.aggregate({
      where: { expertId, isActive: true },
      _count: { id: true },
    });

    // Get insight purchases
    const insightPurchases = await db.expertInsightPurchase.count({
      where: {
        insight: { expertId },
      },
    });

    // Get newsletter statistics
    const newsletterStats = await db.newsletter.aggregate({
      where: { expertId, isActive: true },
      _count: { id: true },
    });

    // Get newsletter subscribers
    const newsletterSubscribers = await db.newsletterSubscription.count({
      where: {
        newsletter: { expertId },
        status: "ACTIVE",
      },
    });

    // Get earnings from commissions (this month)
    const earningsThisMonth = await db.commission.aggregate({
      where: {
        userId: expertId,
        status: "PAID",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    // Get earnings from commissions (last month)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const earningsLastMonth = await db.commission.aggregate({
      where: {
        userId: expertId,
        status: "PAID",
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: { amount: true },
    });

    // Get average ratings
    const expertRatings = await db.expertRating.aggregate({
      where: { expertId },
      _avg: { overallRating: true },
    });

    // Calculate monthly growth
    const currentMonthEarnings = earningsThisMonth._sum.amount || 0;
    const lastMonthEarnings = earningsLastMonth._sum.amount || 0;
    const monthlyGrowth = lastMonthEarnings > 0 
      ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : currentMonthEarnings > 0 ? 100 : 0;

    const dashboardStats = {
      totalEarnings: currentMonthEarnings,
      totalPortfolios: portfolioStats._count.id,
      totalInsights: insightsStats._count.id,
      totalNewsletters: newsletterStats._count.id,
      totalSubscribers: newsletterSubscribers,
      totalPortfolioCopies: portfolioCopies,
      totalInsightPurchases: insightPurchases,
      averageRating: expertRatings._avg.overallRating || 0,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error("Get expert dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}