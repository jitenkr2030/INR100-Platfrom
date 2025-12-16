import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: {
    symbol: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Find asset by symbol
    const asset = await db.asset.findUnique({
      where: { 
        symbol: symbol.toUpperCase() 
      },
      include: {
        // Get recent price history (last 30 days)
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
        // Get holdings count and total quantity across all users
        holdings: {
          select: {
            quantity: true,
            totalValue: true,
          },
        },
        // Get recent orders for this asset
        orders: {
          where: {
            status: "EXECUTED",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                subscriptionTier: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalHoldings = asset.holdings.reduce(
      (sum, holding) => sum + holding.quantity, 
      0
    );
    const totalValue = asset.holdings.reduce(
      (sum, holding) => sum + holding.totalValue, 
      0
    );

    // Calculate price change from previous day
    const priceHistory = asset.priceHistory;
    let dayChange = 0;
    let dayChangePercent = 0;

    if (priceHistory.length >= 2) {
      const currentPrice = priceHistory[0].price;
      const previousPrice = priceHistory[1].price;
      dayChange = currentPrice - previousPrice;
      dayChangePercent = previousPrice > 0 ? (dayChange / previousPrice) * 100 : 0;
    }

    // Calculate price volatility (standard deviation of daily returns)
    let volatility = 0;
    if (priceHistory.length > 1) {
      const returns: number[] = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const dailyReturn = (priceHistory[i - 1].price - priceHistory[i].price) / priceHistory[i].price;
        returns.push(dailyReturn);
      }
      
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
      volatility = Math.sqrt(variance) * 100; // Convert to percentage
    }

    // Get peer comparison (assets of same type)
    const peers = await db.asset.findMany({
      where: {
        type: asset.type,
        id: {
          not: asset.id,
        },
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        currentPrice: true,
        dayChangePercent: true,
        marketCap: true,
      },
      orderBy: {
        marketCap: "desc",
      },
      take: 5,
    });

    // Prepare enhanced asset data
    const enhancedAsset = {
      ...asset,
      statistics: {
        totalHoldings,
        totalValue,
        averageHoldingValue: totalHoldings > 0 ? totalValue / totalHoldings : 0,
        dayChange: Math.round(dayChange * 100) / 100,
        dayChangePercent: Math.round(dayChangePercent * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        priceHistory: priceHistory.map(ph => ({
          date: ph.date,
          price: ph.price,
          volume: ph.volume,
        })),
      },
      recentActivity: asset.orders.map(order => ({
        id: order.id,
        type: order.orderType,
        quantity: order.quantity,
        price: order.price,
        userTier: order.user.subscriptionTier,
        date: order.createdAt,
      })),
      peers,
      // Remove raw holdings and orders from response
      holdings: undefined,
      orders: undefined,
    };

    return NextResponse.json({
      asset: enhancedAsset,
    });

  } catch (error) {
    console.error("Get asset details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}