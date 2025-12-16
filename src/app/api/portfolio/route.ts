import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's portfolios
    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: {
            asset: {
              select: {
                id: true,
                symbol: true,
                name: true,
                type: true,
                currentPrice: true,
                logo: true,
              },
            },
          },
        },
        _count: {
          select: {
            holdings: true,
          },
        },
      },
      orderBy: [
        { isPublic: false }, // Private portfolio first
        { createdAt: "desc" },
      ],
    });

    // Calculate portfolio summaries
    const portfolioSummaries = portfolios.map(portfolio => ({
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      isPublic: portfolio.isPublic,
      totalValue: portfolio.totalValue,
      totalInvested: portfolio.totalInvested,
      totalReturns: portfolio.totalReturns,
      totalReturnsPercent: portfolio.totalInvested > 0 
        ? ((portfolio.totalReturns / portfolio.totalInvested) * 100) 
        : 0,
      riskLevel: portfolio.riskLevel,
      holdingsCount: portfolio._count.holdings,
      createdAt: portfolio.createdAt,
      topHoldings: portfolio.holdings
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5)
        .map(holding => ({
          asset: holding.asset,
          quantity: holding.quantity,
          totalValue: holding.totalValue,
          returns: holding.returns,
          returnsPercent: holding.returnsPercent,
        })),
    }));

    // Get overall portfolio summary (sum of all portfolios)
    const totalValue = portfolioSummaries.reduce((sum, p) => sum + p.totalValue, 0);
    const totalInvested = portfolioSummaries.reduce((sum, p) => sum + p.totalInvested, 0);
    const totalReturns = totalValue - totalInvested;
    const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    const overallSummary = {
      totalValue,
      totalInvested,
      totalReturns,
      totalReturnsPercent,
      portfoliosCount: portfolios.length,
      bestPerformingPortfolio: portfolioSummaries.length > 0 
        ? portfolioSummaries.reduce((best, current) => 
            current.totalReturnsPercent > best.totalReturnsPercent ? current : best
          )
        : null,
      worstPerformingPortfolio: portfolioSummaries.length > 0 
        ? portfolioSummaries.reduce((worst, current) => 
            current.totalReturnsPercent < worst.totalReturnsPercent ? current : worst
          )
        : null,
    };

    return NextResponse.json({
      portfolios: portfolioSummaries,
      summary: overallSummary,
    });

  } catch (error) {
    console.error("Get portfolios error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, isPublic = false, riskLevel = 3 } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    // Check if portfolio name already exists for this user
    const existingPortfolio = await db.portfolio.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { error: "Portfolio with this name already exists" },
        { status: 400 }
      );
    }

    // Create new portfolio
    const portfolio = await db.portfolio.create({
      data: {
        userId,
        name,
        description: description || "",
        isPublic,
        riskLevel,
        totalValue: 0,
        totalInvested: 0,
        totalReturns: 0,
      },
    });

    return NextResponse.json({
      message: "Portfolio created successfully",
      portfolio,
    });

  } catch (error) {
    console.error("Create portfolio error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}