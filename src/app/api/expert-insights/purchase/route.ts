import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PurchaseInsightRequest {
  insightId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseInsightRequest = await request.json();
    const { insightId } = body;

    if (!insightId) {
      return NextResponse.json(
        { error: "Insight ID is required" },
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

    // Get the insight with expert info
    const insight = await db.expertInsight.findUnique({
      where: { id: insightId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
          },
        },
        purchases: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!insight || !insight.isActive) {
      return NextResponse.json(
        { error: "Insight not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user already purchased this insight
    if (insight.purchases.length > 0) {
      return NextResponse.json(
        { error: "You have already purchased this insight" },
        { status: 400 }
      );
    }

    // Check if insight is premium
    if (!insight.isPremium || !insight.price) {
      return NextResponse.json(
        { error: "This insight is not available for purchase" },
        { status: 400 }
      );
    }

    // Check user's wallet balance (simplified)
    const userWallet = await db.wallet.findUnique({
      where: { userId },
    });

    if (!userWallet || userWallet.balance < insight.price) {
      return NextResponse.json(
        { error: "Insufficient balance to purchase this insight" },
        { status: 400 }
      );
    }

    // Create purchase record
    const purchase = await db.expertInsightPurchase.create({
      data: {
        userId,
        insightId,
        amount: insight.price,
        currency: "INR",
        status: "COMPLETED",
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

    // Deduct amount from user's wallet
    await db.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: insight.price,
        },
      },
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: "INVESTMENT",
        amount: -insight.price,
        currency: "INR",
        status: "COMPLETED",
        reference: purchase.id,
        description: `Purchased expert insight: ${insight.title}`,
      },
    });

    // Create commission for the expert (e.g., 80% to expert, 20% platform)
    const commissionRate = 0.80; // 80% to expert
    const commissionAmount = insight.price * commissionRate;
    const platformAmount = insight.price - commissionAmount;

    // Create commission record for the expert
    const expertCommission = await db.commission.create({
      data: {
        userId: insight.expertId,
        partnerId: "system",
        type: "EXPERT_INSIGHT_SALE",
        amount: commissionAmount,
        currency: "INR",
        percentage: commissionRate * 100,
        reference: purchase.id,
        description: `Commission from insight sale - ${insight.title}`,
        status: "PENDING",
      },
    });

    // Create platform revenue record (if you track it separately)
    // This could be a separate revenue model or included in the commission system

    return NextResponse.json({
      message: "Expert insight purchased successfully",
      purchase: {
        id: purchase.id,
        insight: {
          id: insight.id,
          title: insight.title,
          content: insight.content, // Full content now available
          type: insight.type,
          category: insight.category,
          confidence: insight.confidence,
          targetPrice: insight.targetPrice,
          timeHorizon: insight.timeHorizon,
          tags: insight.tags,
        },
        expert: insight.expert,
        amount: purchase.amount,
        purchasedAt: purchase.purchasedAt,
      },
      commission: {
        expertShare: commissionAmount,
        platformShare: platformAmount,
        rate: commissionRate * 100,
      },
    });

  } catch (error) {
    console.error("Purchase expert insight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const insightId = searchParams.get("insightId");

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get("x-user-id");
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Build where clause
    const where: any = { userId: targetUserId };
    if (insightId) where.insightId = insightId;

    const purchases = await db.expertInsightPurchase.findMany({
      where,
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
            asset: {
              select: {
                id: true,
                symbol: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        purchasedAt: "desc",
      },
    });

    // Calculate summary statistics
    const summary = {
      totalPurchases: purchases.length,
      totalSpent: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
      averagePrice: purchases.length > 0 
        ? purchases.reduce((sum, purchase) => sum + purchase.amount, 0) / purchases.length 
        : 0,
      byType: purchases.reduce((acc, purchase) => {
        const type = purchase.insight.type;
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count++;
        acc[type].total += purchase.amount;
        return acc;
      }, {} as Record<string, { count: number; total: number }>),
    };

    return NextResponse.json({
      purchases,
      summary,
      filters: {
        userId: targetUserId,
        insightId,
      },
    });

  } catch (error) {
    console.error("Get expert insight purchases error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}