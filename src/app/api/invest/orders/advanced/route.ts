import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const orderType = searchParams.get('orderType');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;

    const orders = await prisma.investmentOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        asset: {
          select: {
            name: true,
            symbol: true,
            type: true,
            currentPrice: true
          }
        }
      }
    });

    // Group orders by type for analytics
    const ordersByType = orders.reduce((acc, order) => {
      if (!acc[order.orderType]) {
        acc[order.orderType] = [];
      }
      acc[order.orderType].push(order);
      return acc;
    }, {});

    const analytics = Object.keys(ordersByType).map(type => ({
      type,
      count: ordersByType[type].length,
      pending: ordersByType[type].filter(o => o.status === 'PENDING').length,
      executed: ordersByType[type].filter(o => o.status === 'EXECUTED').length,
      failed: ordersByType[type].filter(o => o.status === 'FAILED').length
    }));

    return NextResponse.json({
      success: true,
      orders,
      analytics,
      summary: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        executed: orders.filter(o => o.status === 'EXECUTED').length,
        failed: orders.filter(o => o.status === 'FAILED').length
      }
    });
  } catch (error) {
    console.error('Get advanced orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced orders' },
      { status: 500 }
    );
  }
}

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
      userId,
      assetId,
      assetType,
      orderType,
      orderMode,
      quantity,
      price,
      triggerPrice,
      stopLoss,
      target,
      validity,
      productType,
      tradingMode
    } = body;

    // Validate order type
    const validOrderTypes = ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT', 'BRACKET', 'COVER'];
    if (!validOrderTypes.includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Validate required fields based on order type
    const validation = validateOrderType(orderType, { price, triggerPrice, stopLoss, target });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create advanced order
    const order = await prisma.investmentOrder.create({
      data: {
        userId,
        assetId,
        assetType,
        orderType,
        orderMode,
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : null,
        triggerPrice: triggerPrice ? parseFloat(triggerPrice) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
        validity: validity || 'DAY',
        productType: productType || 'DELIVERY',
        tradingMode,
        status: 'PENDING',
        createdAt: new Date(),
        // Set expiry for conditional orders
        ...(orderType !== 'MARKET' && { 
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        })
      }
    });

    // Process order based on type and trading mode
    if (tradingMode === 'paper') {
      const result = await processPaperOrder(order);
      
      return NextResponse.json({
        success: true,
        order: result.order,
        execution: result.execution,
        message: result.message
      });
    } else {
      // For real trading, place with broker
      const brokerResult = await placeBrokerOrder(order);
      
      if (brokerResult.success) {
        await prisma.investmentOrder.update({
          where: { id: order.id },
          data: {
            status: 'PLACED',
            brokerOrderId: brokerResult.orderId,
            brokerResponse: brokerResult
          }
        });

        return NextResponse.json({
          success: true,
          order: { ...order, brokerOrderId: brokerResult.orderId },
          message: 'Advanced order placed successfully with broker'
        });
      } else {
        await prisma.investmentOrder.update({
          where: { id: order.id },
          data: {
            status: 'FAILED',
            errorMessage: brokerResult.error
          }
        });

        return NextResponse.json(
          { error: brokerResult.error },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Create advanced order error:', error);
    return NextResponse.json(
      { error: 'Failed to create advanced order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, action, userId } = body;

    if (!orderId || !action || !userId) {
      return NextResponse.json(
        { error: 'Order ID, action, and user ID required' },
        { status: 400 }
      );
    }

    const order = await prisma.investmentOrder.findFirst({
      where: { id: orderId, userId }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        result = await cancelOrder(order);
        break;
      
      case 'modify':
        result = await modifyOrder(order, body.data);
        break;
      
      case 'execute':
        result = await executeOrder(order);
        break;
      
      case 'trigger':
        result = await triggerOrder(order);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Order ${action}d successfully`
    });
  } catch (error) {
    console.error('Update advanced order error:', error);
    return NextResponse.json(
      { error: 'Failed to update advanced order' },
      { status: 500 }
    );
  }
}

// Helper functions
function validateOrderType(orderType: string, data: any): { isValid: boolean; error?: string } {
  switch (orderType) {
    case 'MARKET':
      return { isValid: true };
    
    case 'LIMIT':
      if (!data.price) {
        return { isValid: false, error: 'Limit price is required for limit orders' };
      }
      return { isValid: true };
    
    case 'STOP_LOSS':
      if (!data.triggerPrice) {
        return { isValid: false, error: 'Trigger price is required for stop-loss orders' };
      }
      return { isValid: true };
    
    case 'STOP_LIMIT':
      if (!data.triggerPrice || !data.price) {
        return { isValid: false, error: 'Both trigger price and limit price are required for stop-limit orders' };
      }
      return { isValid: true };
    
    case 'BRACKET':
      if (!data.stopLoss || !data.target) {
        return { isValid: false, error: 'Both stop-loss and target prices are required for bracket orders' };
      }
      return { isValid: true };
    
    case 'COVER':
      if (!data.stopLoss) {
        return { isValid: false, error: 'Stop-loss price is required for cover orders' };
      }
      return { isValid: true };
    
    default:
      return { isValid: false, error: 'Unknown order type' };
  }
}

async function processPaperOrder(order: any) {
  const currentPrice = getSimulatedMarketPrice(order.assetId);
  let execution = null;
  let message = '';

  switch (order.orderType) {
    case 'MARKET':
      execution = await executeMarketOrder(order, currentPrice);
      message = 'Market order executed at current market price';
      break;
    
    case 'LIMIT':
      if (order.price) {
        const shouldExecute = order.orderMode === 'BUY' ? 
          currentPrice <= order.price : 
          currentPrice >= order.price;
        
        if (shouldExecute) {
          execution = await executeLimitOrder(order, order.price);
          message = `Limit order executed at ₹${order.price}`;
        } else {
          message = 'Limit order pending - price condition not met';
          return { order, execution: null, message };
        }
      }
      break;
    
    case 'STOP_LOSS':
      if (order.triggerPrice) {
        const shouldTrigger = order.orderMode === 'BUY' ? 
          currentPrice >= order.triggerPrice : 
          currentPrice <= order.triggerPrice;
        
        if (shouldTrigger) {
          execution = await executeMarketOrder(order, currentPrice);
          message = `Stop-loss order triggered at ₹${currentPrice}`;
        } else {
          message = 'Stop-loss order pending - trigger condition not met';
          return { order, execution: null, message };
        }
      }
      break;
    
    case 'STOP_LIMIT':
      if (order.triggerPrice && order.price) {
        const shouldTrigger = order.orderMode === 'BUY' ? 
          currentPrice >= order.triggerPrice : 
          currentPrice <= order.triggerPrice;
        
        if (shouldTrigger) {
          const shouldExecute = order.orderMode === 'BUY' ? 
            currentPrice <= order.price : 
            currentPrice >= order.price;
          
          if (shouldExecute) {
            execution = await executeLimitOrder(order, order.price);
            message = `Stop-limit order executed at ₹${order.price}`;
          } else {
            message = 'Stop-limit order pending - limit price not reached';
            return { order, execution: null, message };
          }
        } else {
          message = 'Stop-limit order pending - trigger condition not met';
          return { order, execution: null, message };
        }
      }
      break;
    
    case 'BRACKET':
      if (order.stopLoss && order.target) {
        const shouldTrigger = order.orderMode === 'BUY' ? 
          currentPrice >= order.triggerPrice || currentPrice <= order.stopLoss : 
          currentPrice <= order.triggerPrice || currentPrice >= order.stopLoss;
        
        if (shouldTrigger) {
          const exitPrice = order.orderMode === 'BUY' ? 
            (currentPrice >= order.target ? order.target : order.stopLoss) :
            (currentPrice <= order.target ? order.target : order.stopLoss);
          
          execution = await executeBracketOrder(order, exitPrice);
          message = `Bracket order executed at ₹${exitPrice}`;
        } else {
          message = 'Bracket order pending - trigger condition not met';
          return { order, execution: null, message };
        }
      }
      break;
  }

  if (execution) {
    // Update order with execution details
    const updatedOrder = await prisma.investmentOrder.update({
      where: { id: order.id },
      data: {
        status: 'EXECUTED',
        executedPrice: execution.price,
        executedAt: new Date(),
        totalAmount: order.quantity * execution.price,
        brokerage: execution.brokerage,
        netAmount: (order.quantity * execution.price) - execution.brokerage,
        executionDetails: execution
      }
    });

    // Update portfolio
    if (order.orderMode === 'BUY') {
      await updatePortfolioOnBuy(order.userId, order.assetId, order.quantity, execution.price);
    } else {
      await updatePortfolioOnSell(order.userId, order.assetId, order.quantity);
    }

    return { order: updatedOrder, execution, message };
  }

  return { order, execution: null, message };
}

async function executeMarketOrder(order: any, marketPrice: number) {
  const price = marketPrice;
  const brokerage = calculateBrokerage(order.quantity * price);
  
  return {
    type: 'MARKET',
    price,
    brokerage,
    totalAmount: order.quantity * price,
    netAmount: (order.quantity * price) - brokerage,
    timestamp: new Date()
  };
}

async function executeLimitOrder(order: any, limitPrice: number) {
  const brokerage = calculateBrokerage(order.quantity * limitPrice);
  
  return {
    type: 'LIMIT',
    price: limitPrice,
    brokerage,
    totalAmount: order.quantity * limitPrice,
    netAmount: (order.quantity * limitPrice) - brokerage,
    timestamp: new Date()
  };
}

async function executeBracketOrder(order: any, exitPrice: number) {
  const entryPrice = order.price || getSimulatedMarketPrice(order.assetId);
  const brokerage = calculateBrokerage(order.quantity * exitPrice);
  const pnl = (exitPrice - entryPrice) * order.quantity;
  
  return {
    type: 'BRACKET',
    entryPrice,
    exitPrice,
    brokerage,
    pnl,
    totalAmount: order.quantity * exitPrice,
    netAmount: (order.quantity * exitPrice) - brokerage + pnl,
    timestamp: new Date()
  };
}

function getSimulatedMarketPrice(assetId: string): number {
  const basePrices: { [key: string]: number } = {
    'RELIANCE': 2480,
    'TCS': 3180,
    'HDFCBANK': 1590,
    'INFY': 1390,
    'ITC': 445,
    'AXISBLUECHIP': 45.67
  };

  const basePrice = basePrices[assetId] || 1000;
  const volatility = 0.01; // 1% volatility
  const randomChange = (Math.random() - 0.5) * volatility;
  
  return Math.round(basePrice * (1 + randomChange) * 100) / 100;
}

function calculateBrokerage(amount: number): number {
  const brokerageRate = 0.001; // 0.1%
  const calculatedBrokerage = amount * brokerageRate;
  return Math.max(calculatedBrokerage, 20);
}

async function updatePortfolioOnBuy(userId: string, assetId: string, quantity: number, price: number) {
  const existingHolding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId }
  });

  if (existingHolding) {
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

async function updatePortfolioOnSell(userId: string, assetId: string, sellQuantity: number) {
  const holding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId }
  });

  if (holding && holding.quantity >= sellQuantity) {
    const newQuantity = holding.quantity - sellQuantity;
    
    if (newQuantity === 0) {
      await prisma.portfolioHolding.delete({
        where: { id: holding.id }
      });
    } else {
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

async function placeBrokerOrder(order: any) {
  // In production, this would integrate with actual broker APIs
  try {
    // Simulate broker integration
    const brokerOrderId = `BRK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      orderId: brokerOrderId,
      broker: 'SIMULATED_BROKER',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Broker integration failed'
    };
  }
}

async function cancelOrder(order: any) {
  if (order.status === 'EXECUTED') {
    throw new Error('Cannot cancel executed order');
  }

  await prisma.investmentOrder.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });

  return { status: 'CANCELLED', cancelledAt: new Date() };
}

async function modifyOrder(order: any, modifyData: any) {
  if (order.status !== 'PENDING') {
    throw new Error('Can only modify pending orders');
  }

  const updatedOrder = await prisma.investmentOrder.update({
    where: { id: order.id },
    data: {
      ...modifyData,
      modifiedAt: new Date()
    }
  });

  return updatedOrder;
}

async function executeOrder(order: any) {
  if (order.status !== 'PENDING') {
    throw new Error('Can only execute pending orders');
  }

  const result = await processPaperOrder(order);
  return result;
}

async function triggerOrder(order: any) {
  if (order.orderType === 'STOP_LOSS' || order.orderType === 'STOP_LIMIT') {
    const currentPrice = getSimulatedMarketPrice(order.assetId);
    const shouldTrigger = order.orderMode === 'BUY' ? 
      currentPrice >= (order.triggerPrice || 0) : 
      currentPrice <= (order.triggerPrice || 0);
    
    if (shouldTrigger) {
      await prisma.investmentOrder.update({
        where: { id: order.id },
        data: {
          status: 'TRIGGERED',
          triggeredAt: new Date()
        }
      });
      
      return { status: 'TRIGGERED', triggeredAt: new Date() };
    }
  }

  throw new Error('Order trigger conditions not met');
}