import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // ALL, DEPOSIT, WITHDRAWAL, INVESTMENT, DIVIDEND, FEE
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build where clause for transactions
    let whereClause: any = { userId };

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    // Get transactions with pagination
    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            asset: {
              select: {
                symbol: true,
                name: true,
                type: true,
              },
            },
          },
        },
        fee: {
          select: {
            type: true,
            amount: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await db.transaction.count({
      where: whereClause,
    });

    // Calculate summary statistics
    const deposits = await db.transaction.aggregate({
      where: {
        userId,
        type: "DEPOSIT",
      },
      _sum: {
        amount: true,
      },
    });

    const withdrawals = await db.transaction.aggregate({
      where: {
        userId,
        type: "WITHDRAWAL",
      },
      _sum: {
        amount: true,
      },
    });

    const investments = await db.transaction.aggregate({
      where: {
        userId,
        type: "INVESTMENT",
      },
      _sum: {
        amount: true,
      },
    });

    const dividends = await db.transaction.aggregate({
      where: {
        userId,
        type: "DIVIDEND",
      },
      _sum: {
        amount: true,
      },
    });

    const fees = await db.transaction.aggregate({
      where: {
        userId,
        type: "FEE",
      },
      _sum: {
        amount: true,
      },
    });

    // Group transactions by month for chart data
    const monthlyData: Record<string, {
      deposits: number;
      withdrawals: number;
      investments: number;
      dividends: number;
      fees: number;
    }> = {};

    transactions.forEach(transaction => {
      const monthKey = transaction.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          deposits: 0,
          withdrawals: 0,
          investments: 0,
          dividends: 0,
          fees: 0,
        };
      }

      switch (transaction.type) {
        case "DEPOSIT":
          monthlyData[monthKey].deposits += transaction.amount;
          break;
        case "WITHDRAWAL":
          monthlyData[monthKey].withdrawals += Math.abs(transaction.amount);
          break;
        case "INVESTMENT":
          monthlyData[monthKey].investments += Math.abs(transaction.amount);
          break;
        case "DIVIDEND":
          monthlyData[monthKey].dividends += transaction.amount;
          break;
        case "FEE":
          monthlyData[monthKey].fees += Math.abs(transaction.amount);
          break;
      }
    });

    // Convert to array and sort by date
    const monthlyChartData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalDeposits: deposits._sum.amount || 0,
        totalWithdrawals: withdrawals._sum.amount || 0,
        totalInvestments: investments._sum.amount || 0,
        totalDividends: dividends._sum.amount || 0,
        totalFees: fees._sum.amount || 0,
        netFlow: (deposits._sum.amount || 0) - (withdrawals._sum.amount || 0),
      },
      monthlyChartData,
    });

  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create a transaction record
export async function createTransaction(
  userId: string,
  type: "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT" | "DIVIDEND" | "FEE",
  amount: number,
  description: string,
  reference?: string,
  metadata?: any
) {
  try {
    const transaction = await db.transaction.create({
      data: {
        userId,
        type,
        amount,
        description,
        status: "COMPLETED",
        reference,
        metadata,
      },
    });

    return transaction;
  } catch (error) {
    console.error("Create transaction error:", error);
    throw error;
  }
}