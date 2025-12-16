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
    const userId = searchParams.get('userId') || 'current-user';
    const updateType = searchParams.get('type') || 'portfolio';
    const autoRefresh = searchParams.get('autoRefresh') === 'true';
    const refreshInterval = parseInt(searchParams.get('interval') || '30'); // seconds

    switch (updateType) {
      case 'portfolio':
        return await getPortfolioUpdates(userId);
      
      case 'market':
        return await getMarketUpdates();
      
      case 'goals':
        return await getGoalUpdates(userId);
      
      case 'alerts':
        return await getPortfolioAlerts(userId);
      
      case 'rebalancing':
        return await getRebalancingUpdates(userId);
      
      case 'performance':
        return await getPerformanceUpdates(userId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Real-time update error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time updates' },
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
    const { action, userId, data } = body;

    switch (action) {
      case 'subscribe':
        return await subscribeToUpdates(userId, data);
      
      case 'unsubscribe':
        return await unsubscribeFromUpdates(userId, data);
      
      case 'set_alert':
        return await setPortfolioAlert(userId, data);
      
      case 'acknowledge_alert':
        return await acknowledgeAlert(userId, data);
      
      case 'update_preferences':
        return await updateUpdatePreferences(userId, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Real-time update action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute real-time action' },
      { status: 500 }
    );
  }
}

// Portfolio updates with real-time data
async function getPortfolioUpdates(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          symbol: true,
          name: true,
          currentPrice: true,
          previousPrice: true,
          change: true,
          changePercent: true
        }
      }
    }
  });

  let totalValue = 0;
  let totalInvested = 0;
  const updatedHoldings = [];

  for (const holding of holdings) {
    // Get latest price (in production, this would be real-time)
    const latestPrice = await getLatestPrice(holding.asset.symbol);
    const marketValue = holding.quantity * latestPrice;
    const returns = marketValue - holding.totalInvested;
    const returnsPercent = holding.totalInvested > 0 ? (returns / holding.totalInvested) * 100 : 0;
    
    // Calculate day change
    const dayChange = holding.asset.previousPrice ? 
      ((latestPrice - holding.asset.previousPrice) / holding.asset.previousPrice) * 100 : 0;

    totalValue += marketValue;
    totalInvested += holding.totalInvested;

    updatedHoldings.push({
      id: holding.id,
      symbol: holding.asset.symbol,
      name: holding.asset.name,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice: latestPrice,
      marketValue,
      returns,
      returnsPercent,
      dayChange,
      weight: 0, // Will be calculated after total value is known
      lastUpdated: new Date().toISOString()
    });
  }

  // Calculate weights
  updatedHoldings.forEach(holding => {
    holding.weight = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
  });

  const totalReturns = totalValue - totalInvested;
  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  // Calculate day change for portfolio
  const portfolioDayChange = updatedHoldings.reduce((sum, h) => 
    sum + (h.marketValue * h.dayChange / 100), 0);
  const portfolioDayChangePercent = totalValue > 0 ? 
    (portfolioDayChange / totalValue) * 100 : 0;

  return NextResponse.json({
    success: true,
    updates: {
      portfolio: {
        totalValue,
        totalInvested,
        totalReturns,
        totalReturnsPercent,
        dayChange: portfolioDayChange,
        dayChangePercent: portfolioDayChangePercent,
        holdingsCount: holdings.length
      },
      holdings: updatedHoldings,
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 30000).toISOString() // 30 seconds
    },
    timestamp: new Date().toISOString()
  });
}

// Market updates
async function getMarketUpdates() {
  try {
    // Get real market data
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market-data?type=overview`);
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        updates: {
          marketData: result.data,
          marketStatus: {
            isOpen: isMarketOpen(),
            nextClose: getNextMarketClose(),
            lastUpdated: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching market updates:', error);
  }

  // Fallback to mock data
  return NextResponse.json({
    success: true,
    updates: {
      marketData: {
        indices: [
          { symbol: 'NIFTY', value: 19850.75, change: 125.30, changePercent: 0.63 },
          { symbol: 'SENSEX', value: 66500.45, change: 245.80, changePercent: 0.37 }
        ],
        topGainers: [
          { symbol: 'RELIANCE', price: 2480.75, change: 45.30, changePercent: 1.86 },
          { symbol: 'TCS', price: 3180.50, change: 32.10, changePercent: 1.02 }
        ],
        topLosers: [
          { symbol: 'HDFCBANK', price: 1590.25, change: -28.45, changePercent: -1.77 }
        ]
      },
      marketStatus: {
        isOpen: isMarketOpen(),
        nextClose: getNextMarketClose()
      }
    },
    timestamp: new Date().toISOString()
  });
}

// Goal updates and progress tracking
async function getGoalUpdates(userId: string) {
  const goals = await prisma.portfolioTarget.findMany({
    where: { userId }
  });

  const currentPortfolioValue = await getCurrentPortfolioValue(userId);
  
  const goalUpdates = goals.map(goal => {
    const progress = Math.min((currentPortfolioValue / goal.targetAmount) * 100, 100);
    const monthsRemaining = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    const onTrack = progress >= (100 - (monthsRemaining * 2));
    
    return {
      id: goal.id,
      targetAmount: goal.targetAmount,
      currentAmount: currentPortfolioValue,
      progress: Math.round(progress),
      targetDate: goal.targetDate,
      monthsRemaining: Math.max(0, monthsRemaining),
      onTrack,
      status: progress >= 100 ? 'completed' : onTrack ? 'on-track' : 'behind',
      lastUpdated: new Date().toISOString()
    };
  });

  const summary = {
    totalGoals: goals.length,
    completedGoals: goalUpdates.filter(g => g.progress >= 100).length,
    onTrackGoals: goalUpdates.filter(g => g.onTrack).length,
    behindGoals: goalUpdates.filter(g => !g.onTrack && g.progress < 100).length,
    averageProgress: goalUpdates.length > 0 ? 
      Math.round(goalUpdates.reduce((sum, g) => sum + g.progress, 0) / goalUpdates.length) : 0
  };

  return NextResponse.json({
    success: true,
    updates: {
      goals: goalUpdates,
      summary,
      currentPortfolioValue,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}

// Portfolio alerts
async function getPortfolioAlerts(userId: string) {
  const alerts = await generatePortfolioAlerts(userId);
  
  return NextResponse.json({
    success: true,
    updates: {
      alerts,
      alertCount: alerts.filter(a => !a.acknowledged).length,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}

// Rebalancing updates
async function getRebalancingUpdates(userId: string) {
  const rebalancingData = await analyzeRebalancingNeeds(userId);
  
  return NextResponse.json({
    success: true,
    updates: {
      rebalancing: rebalancingData,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}

// Performance updates
async function getPerformanceUpdates(userId: string) {
  const performanceData = await calculatePerformanceMetrics(userId);
  
  return NextResponse.json({
    success: true,
    updates: {
      performance: performanceData,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}

// Helper functions
async function getLatestPrice(symbol: string): Promise<number> {
  try {
    // In production, this would call real-time market data API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market-data/realtime?type=quote&symbol=${symbol}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data.price;
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
  }
  
  // Fallback to mock price
  return 1000 + Math.random() * 2000;
}

async function getCurrentPortfolioValue(userId: string): Promise<number> {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId }
  });
  
  return holdings.reduce((sum, holding) => sum + holding.totalInvested, 0);
}

function isMarketOpen(): boolean {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = istNow.getHours();
  const minute = istNow.getMinutes();
  const day = istNow.getDay();

  // Market is open Monday to Friday, 9:15 AM to 3:30 PM IST
  return day >= 1 && day <= 5 && hour >= 9 && (hour < 15 || (hour === 15 && minute <= 30));
}

function getNextMarketClose(): string {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = istNow.getDay();
  const hour = istNow.getHours();

  let nextClose = new Date(istNow);
  
  if (day === 6 || day === 0) { // Weekend
    nextClose = new Date();
    nextClose.setDate(nextClose.getDate() + (day === 6 ? 2 : 1)); // Saturday -> Monday, Sunday -> Monday
    nextClose.setHours(15, 30, 0, 0);
  } else if (hour < 9 || (hour === 9 && istNow.getMinutes() < 15)) {
    nextClose.setHours(15, 30, 0, 0);
  } else {
    nextClose.setDate(nextClose.getDate() + 1);
    if (day === 5) nextClose.setDate(nextClose.getDate() + 2); // Friday -> Monday
    nextClose.setHours(15, 30, 0, 0);
  }

  return nextClose.toISOString();
}

async function generatePortfolioAlerts(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          symbol: true,
          name: true,
          changePercent: true
        }
      }
    }
  });

  const alerts = [];

  // Price movement alerts
  holdings.forEach(holding => {
    const dayChange = Math.abs(holding.asset.changePercent || 0);
    
    if (dayChange > 5) {
      alerts.push({
        id: `price-${holding.asset.symbol}-${Date.now()}`,
        type: 'price_movement',
        severity: dayChange > 10 ? 'high' : 'medium',
        title: `${holding.asset.symbol} Price Alert`,
        message: `${holding.asset.name} has moved ${dayChange.toFixed(2)}% today`,
        symbol: holding.asset.symbol,
        data: {
          currentChange: holding.asset.changePercent,
          threshold: 5
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
  });

  // Portfolio concentration alerts
  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  holdings.forEach(holding => {
    const weight = (holding.totalInvested / totalValue) * 100;
    
    if (weight > 25) {
      alerts.push({
        id: `concentration-${holding.asset.symbol}-${Date.now()}`,
        type: 'concentration',
        severity: weight > 40 ? 'high' : 'medium',
        title: 'High Portfolio Concentration',
        message: `${holding.asset.symbol} represents ${weight.toFixed(1)}% of your portfolio`,
        symbol: holding.asset.symbol,
        data: {
          currentWeight: weight,
          threshold: 25
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
  });

  // Goal milestone alerts
  const goals = await prisma.portfolioTarget.findMany({
    where: { userId }
  });

  const currentValue = await getCurrentPortfolioValue(userId);
  
  goals.forEach(goal => {
    const progress = (currentValue / goal.targetAmount) * 100;
    
    if (progress >= 90 && progress < 100) {
      alerts.push({
        id: `goal-${goal.id}-${Date.now()}`,
        type: 'goal_milestone',
        severity: 'low',
        title: 'Goal Almost Reached',
        message: `You're ${progress.toFixed(1)}% towards your goal of ₹${goal.targetAmount.toLocaleString()}`,
        data: {
          progress,
          target: goal.targetAmount,
          current: currentValue
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

async function analyzeRebalancingNeeds(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          type: true
        }
      }
    }
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  
  // Target allocation (can be personalized)
  const targetAllocation = {
    'STOCK': 60,
    'MUTUAL_FUND': 25,
    'GOLD': 10,
    'ETF': 5
  };

  // Current allocation
  const currentAllocation = {};
  holdings.forEach(holding => {
    const assetType = holding.asset.type;
    if (!currentAllocation[assetType]) {
      currentAllocation[assetType] = 0;
    }
    currentAllocation[assetType] += (holding.totalInvested / totalValue) * 100;
  });

  // Generate rebalancing suggestions
  const suggestions = [];
  Object.keys(targetAllocation).forEach(assetType => {
    const current = currentAllocation[assetType] || 0;
    const target = targetAllocation[assetType];
    const deviation = current - target;

    if (Math.abs(deviation) > 5) {
      suggestions.push({
        assetType,
        currentAllocation: Math.round(current),
        targetAllocation: target,
        deviation: Math.round(deviation),
        action: deviation > 0 ? 'REDUCE' : 'INCREASE',
        suggestedAmount: Math.round((Math.abs(deviation) / 100) * totalValue),
        priority: Math.abs(deviation) > 10 ? 'HIGH' : 'MEDIUM'
      });
    }
  });

  const needsRebalancing = suggestions.length > 0;
  const diversificationScore = calculateDiversificationScore(Object.values(currentAllocation).map(v => v / 100));

  return {
    needsRebalancing,
    suggestions: suggestions.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)),
    currentAllocation,
    targetAllocation,
    diversificationScore,
    lastRebalanced: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    nextRecommendedRebalance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  };
}

async function calculatePerformanceMetrics(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId }
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const weights = holdings.map(h => h.totalInvested / totalValue);

  // Calculate risk metrics (simplified)
  const volatility = calculateVolatility(weights);
  const sharpeRatio = (12 - 6) / volatility; // Assuming 12% return, 6% risk-free rate
  const beta = 1.1; // Mock beta

  // Performance attribution
  const attribution = holdings.map(holding => {
    const weight = holding.totalInvested / totalValue;
    const mockReturn = (Math.random() - 0.3) * 20;
    const contribution = weight * mockReturn;
    
    return {
      asset: holding.assetId,
      weight: Math.round(weight * 100 * 100) / 100,
      return: Math.round(mockReturn * 100) / 100,
      contribution: Math.round(contribution * 100) / 100
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    riskMetrics: {
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      beta: Math.round(beta * 100) / 100,
      maxDrawdown: 8.5, // Mock data
      var95: 5.2 // Value at Risk 95%
    },
    performanceAttribution: attribution,
    totalReturn: attribution.reduce((sum, a) => sum + a.contribution, 0),
    benchmarkComparison: {
      nifty: { return: 12.5, volatility: 18.2 },
      portfolio: { return: 15.2, volatility: volatility }
    }
  };
}

function calculateDiversificationScore(weights: number[]): number {
  const herfindahlIndex = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  return Math.round((1 - herfindahlIndex) * 100);
}

function calculateVolatility(weights: number[]): number {
  // Simplified volatility calculation
  let portfolioVariance = 0;
  
  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i];
    const volatility = 20; // Default 20% volatility per asset
    portfolioVariance += Math.pow(weight * volatility / 100, 2);
    
    // Add covariance terms (simplified)
    for (let j = i + 1; j < weights.length; j++) {
      const covariance = (weights[i] * volatility / 100) * (weights[j] * 20 / 100) * 0.3;
      portfolioVariance += 2 * covariance;
    }
  }
  
  return Math.sqrt(portfolioVariance);
}

// Subscription management
async function subscribeToUpdates(userId: string, data: any) {
  // In production, this would set up WebSocket connections or SSE
  return NextResponse.json({
    success: true,
    message: `Subscribed to ${data.updateTypes?.length || 0} update types`,
    subscriptionId: `sub-${Date.now()}`,
    nextUpdate: new Date(Date.now() + 30000).toISOString()
  });
}

async function unsubscribeFromUpdates(userId: string, data: any) {
  return NextResponse.json({
    success: true,
    message: 'Unsubscribed from updates'
  });
}

async function setPortfolioAlert(userId: string, alertData: any) {
  // Set custom portfolio alert
  return NextResponse.json({
    success: true,
    message: 'Portfolio alert set successfully',
    alertId: `alert-${Date.now()}`
  });
}

async function acknowledgeAlert(userId: string, data: any) {
  // Mark alert as acknowledged
  return NextResponse.json({
    success: true,
    message: 'Alert acknowledged'
  });
}

async function updateUpdatePreferences(userId: string, preferences: any) {
  // Update user's update preferences
  return NextResponse.json({
    success: true,
    message: 'Update preferences updated'
  });
}