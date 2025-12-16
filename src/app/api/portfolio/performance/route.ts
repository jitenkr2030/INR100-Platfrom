import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const portfolioId = searchParams.get("portfolioId");
    const period = searchParams.get("period") || "1M"; // 1D, 1W, 1M, 3M, 6M, 1Y, ALL

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "1D":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "1W":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "ALL":
        startDate = new Date("2020-01-01"); // Far back date
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    let whereClause: any = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // If specific portfolio ID is provided
    if (portfolioId) {
      whereClause.portfolioId = portfolioId;
    } else {
      // Get user's default portfolio
      const defaultPortfolio = await db.portfolio.findFirst({
        where: {
          userId,
          isPublic: false,
        },
        select: { id: true },
      });
      
      if (defaultPortfolio) {
        whereClause.portfolioId = defaultPortfolio.id;
      } else {
        return NextResponse.json({
          performance: [],
          summary: {
            totalReturn: 0,
            totalReturnPercent: 0,
            bestDay: null,
            worstDay: null,
            volatility: 0,
            sharpeRatio: 0,
          },
        });
      }
    }

    // Get orders within the period to calculate performance
    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            symbol: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({
        performance: [],
        summary: {
          totalReturn: 0,
          totalReturnPercent: 0,
          bestDay: null,
          worstDay: null,
          volatility: 0,
          sharpeRatio: 0,
          message: "No transactions in the selected period",
        },
      });
    }

    // Calculate cumulative performance
    let cumulativeValue = 0;
    let cumulativeInvested = 0;
    const performanceData: Array<{
      date: string;
      value: number;
      invested: number;
      return: number;
      returnPercent: number;
    }> = [];

    // Group orders by date
    const ordersByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    }, {} as Record<string, typeof orders>);

    // Calculate performance for each date
    for (const [date, dayOrders] of Object.entries(ordersByDate)) {
      let dayInvested = 0;
      let dayValue = 0;

      dayOrders.forEach(order => {
        if (order.orderType === "BUY") {
          dayInvested += order.totalAmount;
          dayValue += order.quantity * order.price;
        } else {
          dayInvested -= order.totalAmount;
          dayValue -= order.quantity * order.price;
        }
      });

      cumulativeInvested += dayInvested;
      cumulativeValue += dayValue;

      const dayReturn = cumulativeValue - cumulativeInvested;
      const dayReturnPercent = cumulativeInvested > 0 ? (dayReturn / cumulativeInvested) * 100 : 0;

      performanceData.push({
        date,
        value: Math.round(cumulativeValue * 100) / 100,
        invested: Math.round(cumulativeInvested * 100) / 100,
        return: Math.round(dayReturn * 100) / 100,
        returnPercent: Math.round(dayReturnPercent * 100) / 100,
      });
    }

    // Calculate summary statistics
    const totalReturn = cumulativeValue - cumulativeInvested;
    const totalReturnPercent = cumulativeInvested > 0 ? (totalReturn / cumulativeInvested) * 100 : 0;

    // Find best and worst days
    let bestDay = null;
    let worstDay = null;
    let maxReturn = -Infinity;
    let minReturn = Infinity;

    performanceData.forEach((data, index) => {
      if (index > 0) {
        const dayReturn = data.returnPercent - performanceData[index - 1].returnPercent;
        if (dayReturn > maxReturn) {
          maxReturn = dayReturn;
          bestDay = {
            date: data.date,
            return: dayReturn,
          };
        }
        if (dayReturn < minReturn) {
          minReturn = dayReturn;
          worstDay = {
            date: data.date,
            return: dayReturn,
          };
        }
      }
    });

    // Calculate volatility (standard deviation of daily returns)
    const dailyReturns: number[] = [];
    for (let i = 1; i < performanceData.length; i++) {
      const dailyReturn = performanceData[i].returnPercent - performanceData[i - 1].returnPercent;
      dailyReturns.push(dailyReturn);
    }

    const meanReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance);

    // Simple Sharpe ratio calculation (assuming 0% risk-free rate)
    const sharpeRatio = volatility > 0 ? (totalReturnPercent / volatility) : 0;

    return NextResponse.json({
      performance: performanceData,
      summary: {
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
        bestDay,
        worstDay,
        volatility: Math.round(volatility * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        period,
        dataPoints: performanceData.length,
      },
    });

  } catch (error) {
    console.error("Get portfolio performance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}