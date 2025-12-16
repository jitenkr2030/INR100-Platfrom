import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const portfolioId = searchParams.get("portfolioId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let whereClause: any = {
      portfolio: {
        userId,
      },
    };

    // If specific portfolio ID is provided
    if (portfolioId) {
      whereClause.portfolioId = portfolioId;
    } else {
      // Otherwise get holdings from user's default (non-public) portfolio
      whereClause.portfolio = {
        userId,
        isPublic: false,
      };
    }

    // Get holdings with asset details
    const holdings = await db.holding.findMany({
      where: whereClause,
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
        asset: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            currentPrice: true,
            logo: true,
            sector: true,
            marketCap: true,
            dayChange: true,
            dayChangePercent: true,
          },
        },
      },
      orderBy: {
        totalValue: "desc",
      },
    });

    // Calculate summary statistics
    const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
    const totalInvested = holdings.reduce((sum, holding) => sum + holding.totalInvested, 0);
    const totalReturns = totalValue - totalInvested;
    const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Group by asset type for diversification analysis
    const holdingsByType = holdings.reduce((acc, holding) => {
      const type = holding.asset.type;
      if (!acc[type]) {
        acc[type] = {
          type,
          totalValue: 0,
          holdings: [],
        };
      }
      acc[type].totalValue += holding.totalValue;
      acc[type].holdings.push(holding);
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentage allocation for each holding and type
    const enrichedHoldings = holdings.map(holding => ({
      ...holding,
      allocationPercent: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
      assetPerformance: {
        dayChange: holding.asset.dayChange,
        dayChangePercent: holding.asset.dayChangePercent,
        currentPrice: holding.asset.currentPrice,
      },
    }));

    const diversificationByType = Object.values(holdingsByType).map((typeGroup: any) => ({
      ...typeGroup,
      allocationPercent: totalValue > 0 ? (typeGroup.totalValue / totalValue) * 100 : 0,
    }));

    return NextResponse.json({
      holdings: enrichedHoldings,
      summary: {
        totalValue,
        totalInvested,
        totalReturns,
        totalReturnsPercent,
        holdingsCount: holdings.length,
        diversificationByType,
      },
    });

  } catch (error) {
    console.error("Get portfolio holdings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}