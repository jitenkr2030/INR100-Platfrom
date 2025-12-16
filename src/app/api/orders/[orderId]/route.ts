import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: {
    orderId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the order to verify it exists and can be cancelled
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            wallet: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    // Check if order is older than 5 minutes (cannot cancel executed or expired orders)
    const orderAge = Date.now() - order.createdAt.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (orderAge > fiveMinutes) {
      return NextResponse.json(
        { error: "Orders can only be cancelled within 5 minutes of placement" },
        { status: 400 }
      );
    }

    // Update order status to CANCELLED
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // If this was a market order that was executed, we need to reverse the transaction
    if (order.status === "EXECUTED") {
      // Reverse wallet balance
      if (order.orderType === "BUY") {
        await db.wallet.update({
          where: { userId: order.userId },
          data: {
            balance: {
              increment: order.totalAmount,
            },
          },
        });
      } else {
        // For SELL orders, we need to deduct from wallet and add back to holdings
        await db.wallet.update({
          where: { userId: order.userId },
          data: {
            balance: {
              decrement: order.totalAmount,
            },
          },
        });
      }

      // Reverse portfolio holdings for executed orders
      await reversePortfolioTransaction(order.userId, order.assetId, order.quantity, order.orderType);
    }

    // Mark fees as cancelled
    await db.fee.updateMany({
      where: {
        reference: orderId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "Order cancelled successfully",
      orderId,
    });

  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function reversePortfolioTransaction(
  userId: string,
  assetId: string,
  quantity: number,
  orderType: "BUY" | "SELL"
) {
  // Get user's default portfolio
  const portfolio = await db.portfolio.findFirst({
    where: {
      userId,
      isPublic: false,
    },
  });

  if (!portfolio) return;

  // Find the holding
  const holding = await db.holding.findFirst({
    where: {
      portfolioId: portfolio.id,
      assetId,
    },
  });

  if (!holding) return;

  if (orderType === "BUY") {
    // Reverse BUY - remove from holdings
    const newQuantity = holding.quantity - quantity;
    
    if (newQuantity <= 0) {
      await db.holding.delete({
        where: { id: holding.id },
      });
    } else {
      const newTotalInvested = holding.totalInvested - (holding.avgBuyPrice * quantity);
      const newTotalValue = newQuantity * holding.currentPrice;
      const newReturns = newTotalValue - newTotalInvested;
      const newReturnsPercent = newTotalInvested > 0 ? (newReturns / newTotalInvested) * 100 : 0;

      await db.holding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          totalInvested: newTotalInvested,
          totalValue: newTotalValue,
          returns: newReturns,
          returnsPercent: newReturnsPercent,
        },
      });
    }
  } else {
    // Reverse SELL - add back to holdings
    const newQuantity = holding.quantity + quantity;
    const newAvgBuyPrice = (holding.avgBuyPrice * holding.quantity + holding.avgBuyPrice * quantity) / newQuantity;
    const newTotalValue = newQuantity * holding.currentPrice;
    const newTotalInvested = holding.totalInvested + (holding.avgBuyPrice * quantity);
    const newReturns = newTotalValue - newTotalInvested;
    const newReturnsPercent = (newReturns / newTotalInvested) * 100;

    await db.holding.update({
      where: { id: holding.id },
      data: {
        quantity: newQuantity,
        avgBuyPrice: newAvgBuyPrice,
        totalValue: newTotalValue,
        totalInvested: newTotalInvested,
        returns: newReturns,
        returnsPercent: newReturnsPercent,
      },
    });
  }

  // Update portfolio totals
  const holdings = await db.holding.findMany({
    where: { portfolioId: portfolio.id },
  });

  const portfolioTotalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const portfolioTotalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const portfolioTotalReturns = portfolioTotalValue - portfolioTotalInvested;

  await db.portfolio.update({
    where: { id: portfolio.id },
    data: {
      totalValue: portfolioTotalValue,
      totalInvested: portfolioTotalInvested,
      totalReturns: portfolioTotalReturns,
    },
  });
}