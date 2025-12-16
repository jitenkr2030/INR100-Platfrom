import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { brokerIntegrationService } from '@/lib/broker-integration';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      assetId,
      assetType,
      orderType,
      quantity,
      price,
      stopLoss,
      target,
      orderMode,
      userId,
      tradingMode
    } = body;

    // Validate required fields
    if (!assetId || !assetType || !orderType || !quantity || !orderMode || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate order types
    const validOrderTypes = ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT'];
    if (!validOrderTypes.includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Create order in database
    const order = await prisma.investmentOrder.create({
      data: {
        userId,
        assetId,
        assetType,
        orderType,
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
        orderMode,
        tradingMode,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    // Simulate order execution based on trading mode
    if (tradingMode === 'paper') {
      // Paper trading - simulate execution
      const simulatedExecution = await simulatePaperOrderExecution(order);
      
      // Update order with execution details
      const updatedOrder = await prisma.investmentOrder.update({
        where: { id: order.id },
        data: {
          status: 'EXECUTED',
          executedPrice: simulatedExecution.price,
          executedAt: new Date(),
          totalAmount: quantity * simulatedExecution.price,
          brokerage: simulatedExecution.brokerage,
          netAmount: (quantity * simulatedExecution.price) - simulatedExecution.brokerage
        }
      });

      // Create portfolio holding if it's a buy order
      if (orderMode === 'BUY') {
        await createOrUpdatePortfolioHolding(userId, assetId, quantity, simulatedExecution.price);
      } else if (orderMode === 'SELL') {
        await updatePortfolioHolding(userId, assetId, quantity);
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: 'Paper trade executed successfully'
      });
    } else {
      // Real trading - integrate with broker
      try {
        const brokerOrder = await brokerIntegrationService.placeOrder({
          symbol: assetId,
          quantity,
          orderType,
          price,
          stopLoss,
          target,
          orderMode
        });

        if (brokerOrder.success) {
          // Update order with broker details
          const updatedOrder = await prisma.investmentOrder.update({
            where: { id: order.id },
            data: {
              status: 'PLACED',
              brokerOrderId: brokerOrder.orderId,
              brokerResponse: brokerOrder
            }
          });

          return NextResponse.json({
            success: true,
            order: updatedOrder,
            message: 'Order placed with broker successfully'
          });
        } else {
          // Mark order as failed
          await prisma.investmentOrder.update({
            where: { id: order.id },
            data: {
              status: 'FAILED',
              errorMessage: brokerOrder.error
            }
          });

          return NextResponse.json(
            { error: brokerOrder.error },
            { status: 400 }
          );
        }
      } catch (brokerError) {
        console.error('Broker integration error:', brokerError);
        
        await prisma.investmentOrder.update({
          where: { id: order.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Broker integration failed'
          }
        });

        return NextResponse.json(
          { error: 'Failed to place order with broker' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const assetType = searchParams.get('assetType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (status) where.status = status;
    if (assetType) where.assetType = assetType;

    const [orders, total] = await Promise.all([
      prisma.investmentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          asset: {
            select: {
              name: true,
              symbol: true,
              type: true
            }
          }
        }
      }),
      prisma.investmentOrder.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function simulatePaperOrderExecution(order: any) {
  // Simulate market price based on order type
  let executionPrice;
  
  switch (order.orderType) {
    case 'MARKET':
      // Execute at current market price (simulated)
      executionPrice = getSimulatedMarketPrice(order.assetId);
      break;
    case 'LIMIT':
      // Execute only if limit price is reached
      if (order.price && getSimulatedMarketPrice(order.assetId) <= order.price) {
        executionPrice = order.price;
      } else {
        throw new Error('Limit price not reached');
      }
      break;
    case 'STOP_LOSS':
      // Execute when stop loss is triggered
      if (order.stopLoss && getSimulatedMarketPrice(order.assetId) <= order.stopLoss) {
        executionPrice = order.stopLoss;
      } else {
        throw new Error('Stop loss not triggered');
      }
      break;
    default:
      executionPrice = getSimulatedMarketPrice(order.assetId);
  }

  const brokerage = calculateBrokerage(executionPrice * order.quantity);
  
  return {
    price: executionPrice,
    brokerage
  };
}

function getSimulatedMarketPrice(assetId: string): number {
  // Simulate realistic price movements
  const basePrices: { [key: string]: number } = {
    'RELIANCE': 2500,
    'TCS': 3200,
    'HDFCBANK': 1600,
    'INFY': 1400,
    'ITC': 450,
    'AXISBLUECHIP': 45.67,
    'GOLD': 6200
  };

  const basePrice = basePrices[assetId] || 1000;
  const volatility = 0.02; // 2% volatility
  const randomChange = (Math.random() - 0.5) * volatility;
  
  return Math.round(basePrice * (1 + randomChange) * 100) / 100;
}

function calculateBrokerage(amount: number): number {
  // Calculate brokerage based on amount (0.1% minimum ₹20)
  const brokerageRate = 0.001; // 0.1%
  const calculatedBrokerage = amount * brokerageRate;
  return Math.max(calculatedBrokerage, 20);
}

async function createOrUpdatePortfolioHolding(userId: string, assetId: string, quantity: number, price: number) {
  const existingHolding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId }
  });

  if (existingHolding) {
    // Update existing holding
    const newQuantity = existingHolding.quantity + quantity;
    const newAvgPrice = ((existingHolding.quantity * existingHolding.avgPrice) + (quantity * price)) / newQuantity;
    
    await prisma.portfolioHolding.update({
      where: { id: existingHolding.id },
      data: {
        quantity: newQuantity,
        avgPrice: newAvgPrice,
        totalInvested: newQuantity * newAvgPrice,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new holding
    await prisma.portfolioHolding.create({
      data: {
        userId,
        assetId,
        quantity,
        avgPrice: price,
        totalInvested: quantity * price,
        createdAt: new Date()
      }
    });
  }
}

async function updatePortfolioHolding(userId: string, assetId: string, sellQuantity: number) {
  const holding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId }
  });

  if (holding && holding.quantity >= sellQuantity) {
    const newQuantity = holding.quantity - sellQuantity;
    
    if (newQuantity === 0) {
      // Delete holding if quantity becomes zero
      await prisma.portfolioHolding.delete({
        where: { id: holding.id }
      });
    } else {
      // Update holding
      await prisma.portfolioHolding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          updatedAt: new Date()
        }
      });
    }
  }
}