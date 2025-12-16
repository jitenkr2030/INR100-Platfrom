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
    const includeLiveData = searchParams.get('includeLiveData') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get portfolio holdings
    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            type: true,
            category: true,
            currentPrice: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate portfolio metrics
    const totalInvested = holdings.reduce((sum, holding) => sum + holding.totalInvested, 0);
    const currentValue = holdings.reduce((sum, holding) => {
      const currentPrice = holding.asset?.currentPrice || holding.avgPrice;
      return sum + (holding.quantity * currentPrice);
    }, 0);

    const totalReturns = currentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Get asset allocation
    const allocation = holdings.reduce((acc, holding) => {
      const assetType = holding.asset?.type || 'Unknown';
      const currentPrice = holding.asset?.currentPrice || holding.avgPrice;
      const value = holding.quantity * currentPrice;
      
      if (!acc[assetType]) {
        acc[assetType] = { value: 0, count: 0 };
      }
      acc[assetType].value += value;
      acc[assetType].count += 1;
      return acc;
    }, {} as any);

    // Calculate percentage allocation
    const allocationPercentages = Object.keys(allocation).reduce((acc, type) => {
      acc[type] = {
        ...allocation[type],
        percentage: totalValue > 0 ? (allocation[type].value / totalValue) * 100 : 0
      };
      return acc;
    }, {});

    // Get recent transactions
    const recentTransactions = await prisma.investmentOrder.findMany({
      where: { 
        userId,
        status: 'EXECUTED'
      },
      include: {
        asset: {
          select: {
            name: true,
            symbol: true
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 10
    });

    // Get performance data (mock for now - would need historical price data)
    const performanceData = await generatePerformanceData(holdings);

    const response = {
      success: true,
      portfolio: {
        totalInvested,
        currentValue,
        totalReturns,
        returnsPercentage,
        holdingsCount: holdings.length,
        holdings: holdings.map(holding => {
          const currentPrice = holding.asset?.currentPrice || holding.avgPrice;
          const marketValue = holding.quantity * currentPrice;
          const returns = marketValue - holding.totalInvested;
          const returnsPercent = holding.totalInvested > 0 ? (returns / holding.totalInvested) * 100 : 0;

          return {
            ...holding,
            currentPrice,
            marketValue,
            returns,
            returnsPercent,
            dayChange: holding.asset?.currentPrice ? 
              ((holding.asset.currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0
          };
        }),
        allocation: allocationPercentages,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          assetName: tx.asset?.name || tx.assetId,
          assetSymbol: tx.asset?.symbol || tx.assetId,
          orderMode: tx.orderMode,
          quantity: tx.quantity,
          executedPrice: tx.executedPrice,
          executedAt: tx.executedAt,
          totalAmount: tx.totalAmount
        })),
        performance: performanceData
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
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
    const { userId, action, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create_watchlist':
        result = await createWatchlistItem(userId, data);
        break;
      case 'remove_watchlist':
        result = await removeWatchlistItem(userId, data.assetId);
        break;
      case 'rebalance':
        result = await rebalancePortfolio(userId, data);
        break;
      case 'set_target':
        result = await setPortfolioTarget(userId, data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Portfolio action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute portfolio action' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generatePerformanceData(holdings: any[]) {
  // Generate mock performance data - in production, this would fetch historical data
  const days = 30;
  const data = [];
  let portfolioValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate portfolio growth with some volatility
    const growthFactor = 1 + (Math.random() - 0.4) * 0.02; // Slight upward bias
    portfolioValue *= growthFactor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(portfolioValue),
      returns: ((portfolioValue - holdings.reduce((sum, h) => sum + h.totalInvested, 0)) / holdings.reduce((sum, h) => sum + h.totalInvested, 0)) * 100
    });
  }

  return data;
}

async function createWatchlistItem(userId: string, data: any) {
  const { assetId, assetName, assetSymbol } = data;
  
  // Check if already in watchlist
  const existing = await prisma.watchlistItem.findFirst({
    where: { userId, assetId }
  });

  if (existing) {
    throw new Error('Asset already in watchlist');
  }

  const watchlistItem = await prisma.watchlistItem.create({
    data: {
      userId,
      assetId,
      assetName,
      assetSymbol,
      addedAt: new Date()
    }
  });

  return watchlistItem;
}

async function removeWatchlistItem(userId: string, assetId: string) {
  const deleted = await prisma.watchlistItem.deleteMany({
    where: { userId, assetId }
  });

  return { deletedCount: deleted.count };
}

async function rebalancePortfolio(userId: string, data: any) {
  const { targetAllocations } = data;
  
  // Get current portfolio
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          currentPrice: true
        }
      }
    }
  });

  const currentValue = holdings.reduce((sum, h) => {
    const price = h.asset?.currentPrice || h.avgPrice;
    return sum + (h.quantity * price);
  }, 0);

  // Calculate rebalancing recommendations
  const rebalancingSuggestions = Object.keys(targetAllocations).map(assetType => {
    const targetPercent = targetAllocations[assetType];
    const targetValue = (currentValue * targetPercent) / 100;
    
    const currentHolding = holdings.find(h => h.asset?.type === assetType);
    const currentValue_h = currentHolding ? 
      currentHolding.quantity * (currentHolding.asset?.currentPrice || currentHolding.avgPrice) : 0;
    
    const difference = targetValue - currentValue_h;
    const action = difference > 0 ? 'BUY' : 'SELL';
    const absDifference = Math.abs(difference);
    
    return {
      assetType,
      targetPercent,
      currentValue: currentValue_h,
      targetValue,
      difference,
      action,
      suggestedAmount: absDifference
    };
  });

  return {
    currentValue,
    suggestions: rebalancingSuggestions
  };
}

async function setPortfolioTarget(userId: string, data: any) {
  const { targetAmount, targetDate, riskLevel } = data;
  
  const target = await prisma.portfolioTarget.create({
    data: {
      userId,
      targetAmount: parseFloat(targetAmount),
      targetDate: new Date(targetDate),
      riskLevel,
      createdAt: new Date()
    }
  });

  return target;
}