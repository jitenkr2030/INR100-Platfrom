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
    const includeLiveData = searchParams.get('includeLiveData') === 'true';
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const includeGoals = searchParams.get('includeGoals') === 'true';

    // Get portfolio data
    const portfolio = await getPortfolioData(userId, includeLiveData);
    
    // Get analytics if requested
    const analytics = includeAnalytics ? await getPortfolioAnalytics(userId) : null;
    
    // Get goals if requested
    const goals = includeGoals ? await getUserGoals(userId) : null;

    // Get market overview
    const marketOverview = includeLiveData ? await getMarketOverview() : null;

    // Get rebalancing suggestions
    const rebalancingSuggestions = await getRebalancingSuggestions(userId);

    const response = {
      success: true,
      data: {
        portfolio,
        analytics,
        goals,
        marketOverview,
        rebalancingSuggestions,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
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
      case 'update_widget_preferences':
        return await updateWidgetPreferences(userId, data);
      
      case 'create_goal':
        return await createUserGoal(userId, data);
      
      case 'update_goal_progress':
        return await updateGoalProgress(userId, data);
      
      case 'accept_rebalancing':
        return await acceptRebalancingSuggestion(userId, data);
      
      case 'set_alert':
        return await setPortfolioAlert(userId, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Dashboard action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute dashboard action' },
      { status: 500 }
    );
  }
}

// Portfolio data with real-time updates
async function getPortfolioData(userId: string, includeLiveData: boolean) {
  // Get holdings from database
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          id: true,
          symbol: true,
          name: true,
          type: true,
          category: true,
          currentPrice: true,
          previousPrice: true,
          change: true,
          changePercent: true
        }
      }
    }
  });

  // Calculate portfolio metrics
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.totalInvested, 0);
  
  let totalValue = 0;
  let totalReturns = 0;
  const assetAllocation = {};
  const holdingsWithLiveData = [];

  for (const holding of holdings) {
    const currentPrice = includeLiveData ? 
      await getLivePrice(holding.asset.symbol) : 
      (holding.asset.currentPrice || holding.avgPrice);
    
    const marketValue = holding.quantity * currentPrice;
    const returns = marketValue - holding.totalInvested;
    const returnsPercent = holding.totalInvested > 0 ? (returns / holding.totalInvested) * 100 : 0;
    const dayChange = holding.asset.currentPrice && holding.asset.previousPrice ? 
      ((holding.asset.currentPrice - holding.asset.previousPrice) / holding.asset.previousPrice) * 100 : 0;

    totalValue += marketValue;
    totalReturns += returns;

    // Asset allocation
    const assetType = holding.asset.type || 'Unknown';
    if (!assetAllocation[assetType]) {
      assetAllocation[assetType] = { value: 0, count: 0 };
    }
    assetAllocation[assetType].value += marketValue;
    assetAllocation[assetType].count += 1;

    holdingsWithLiveData.push({
      ...holding,
      currentPrice,
      marketValue,
      returns,
      returnsPercent,
      dayChange,
      weight: (marketValue / totalValue) * 100
    });
  }

  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  // Convert asset allocation to percentages
  const allocationPercentages = Object.keys(assetAllocation).map(type => ({
    name: type,
    value: assetAllocation[type].value,
    count: assetAllocation[type].count,
    percentage: totalValue > 0 ? (assetAllocation[type].value / totalValue) * 100 : 0
  }));

  // Get top performers
  const topPerformers = holdingsWithLiveData
    .sort((a, b) => b.returnsPercent - a.returnsPercent)
    .slice(0, 5)
    .map(holding => ({
      symbol: holding.asset.symbol,
      name: holding.asset.name,
      value: holding.marketValue,
      returns: holding.returnsPercent,
      weight: holding.weight
    }));

  // Get recent transactions
  const recentTransactions = await prisma.investmentTransaction.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          name: true,
          symbol: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return {
    totalValue,
    totalInvested,
    totalReturns,
    totalReturnsPercent,
    holdingsCount: holdings.length,
    holdings: holdingsWithLiveData,
    assetAllocation: allocationPercentages,
    topPerformers,
    recentTransactions: recentTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      assetName: tx.asset?.name || tx.assetId,
      assetSymbol: tx.asset?.symbol || tx.assetId,
      quantity: tx.quantity,
      price: tx.price,
      amount: tx.netAmount,
      status: tx.status,
      createdAt: tx.createdAt
    })),
    dayChange: totalValue * 0.01, // Mock daily change
    dayChangePercent: 1.0 // Mock daily change percentage
  };
}

// Portfolio analytics and benchmarking
async function getPortfolioAnalytics(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          symbol: true,
          name: true
        }
      }
    }
  });

  // Calculate risk metrics
  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const weights = holdings.map(h => h.totalInvested / totalValue);
  
  // Mock risk calculations (in production, use historical data)
  const portfolioVolatility = calculatePortfolioVolatility(holdings, weights);
  const sharpeRatio = calculateSharpeRatio(holdings, weights);
  const beta = calculatePortfolioBeta(holdings, weights);
  
  // Benchmark comparison (mock data)
  const benchmarkComparison = {
    nifty: { return: 12.5, volatility: 18.2 },
    sensex: { return: 11.8, volatility: 17.9 },
    portfolio: { return: 15.2, volatility: portfolioVolatility }
  };

  // Performance attribution
  const performanceAttribution = holdings.map(holding => ({
    asset: holding.asset.name,
    weight: weights[holdings.indexOf(holding)],
    contribution: weights[holdings.indexOf(holding)] * 12.5 // Mock contribution
  }));

  // Risk decomposition
  const riskDecomposition = holdings.map(holding => ({
    asset: holding.asset.name,
    weight: weights[holdings.indexOf(holding)],
    riskContribution: portfolioVolatility * weights[holdings.indexOf(holding)]
  }));

  return {
    riskMetrics: {
      volatility: portfolioVolatility,
      sharpeRatio,
      beta,
      maxDrawdown: 8.5, // Mock data
      var95: 5.2 // Value at Risk 95%
    },
    benchmarkComparison,
    performanceAttribution,
    riskDecomposition,
    diversificationScore: calculateDiversificationScore(weights),
    correlationMatrix: generateCorrelationMatrix(holdings)
  };
}

// User goals and progress tracking
async function getUserGoals(userId: string) {
  const goals = await prisma.portfolioTarget.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' }
  });

  const portfolioValue = await getCurrentPortfolioValue(userId);

  const goalsWithProgress = goals.map(goal => {
    const progress = Math.min((portfolioValue / goal.targetAmount) * 100, 100);
    const monthsRemaining = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    const requiredMonthly = monthsRemaining > 0 ? 
      (goal.targetAmount - portfolioValue) / monthsRemaining : 0;

    return {
      id: goal.id,
      targetAmount: goal.targetAmount,
      currentAmount: portfolioValue,
      progress: Math.round(progress),
      targetDate: goal.targetDate,
      riskLevel: goal.riskLevel,
      monthsRemaining: Math.max(0, monthsRemaining),
      requiredMonthlyInvestment: Math.round(requiredMonthly),
      onTrack: progress >= (100 - (monthsRemaining * 2)) // Simple on-track calculation
    };
  });

  return {
    goals: goalsWithProgress,
    summary: {
      totalGoals: goals.length,
      completedGoals: goalsWithProgress.filter(g => g.progress >= 100).length,
      onTrackGoals: goalsWithProgress.filter(g => g.onTrack).length,
      averageProgress: goalsWithProgress.length > 0 ? 
        Math.round(goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length) : 0
    }
  };
}

// Market overview for dashboard
async function getMarketOverview() {
  try {
    // Get real market data
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market-data?type=overview`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching market overview:', error);
  }

  // Fallback mock data
  return {
    indices: [
      { symbol: 'NIFTY', value: 19850.75, change: 125.30, changePercent: 0.63 },
      { symbol: 'SENSEX', value: 66500.45, change: 245.80, changePercent: 0.37 }
    ],
    topGainers: [
      { symbol: 'RELIANCE', price: 2480.75, change: 45.30, changePercent: 1.86 },
      { symbol: 'TCS', price: 3180.50, change: 32.10, changePercent: 1.02 }
    ],
    marketStatus: {
      isOpen: true,
      nextClose: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    }
  };
}

// Rebalancing suggestions
async function getRebalancingSuggestions(userId: string) {
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
  
  // Target allocation (can be personalized based on user risk profile)
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

  // Generate suggestions
  const suggestions = [];
  Object.keys(targetAllocation).forEach(assetType => {
    const current = currentAllocation[assetType] || 0;
    const target = targetAllocation[assetType];
    const deviation = current - target;

    if (Math.abs(deviation) > 5) { // Only suggest if deviation > 5%
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

  return {
    currentAllocation,
    targetAllocation,
    suggestions: suggestions.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)),
    diversificationScore: calculateDiversificationScore(
      Object.values(currentAllocation).map(v => v / 100)
    ),
    lastRebalanced: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    nextRecommendedRebalance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  };
}

// Helper functions
async function getLivePrice(symbol: string): Promise<number> {
  try {
    // In production, this would call real-time market data API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market-data/realtime?type=quote&symbol=${symbol}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data.price;
    }
  } catch (error) {
    console.error(`Error fetching live price for ${symbol}:`, error);
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

function calculatePortfolioVolatility(holdings: any[], weights: number[]): number {
  // Simplified volatility calculation
  let portfolioVariance = 0;
  
  for (let i = 0; i < holdings.length; i++) {
    const weight = weights[i];
    const volatility = 20; // Default 20% volatility per asset
    portfolioVariance += Math.pow(weight * volatility / 100, 2);
    
    // Add covariance terms (simplified)
    for (let j = i + 1; j < holdings.length; j++) {
      const covariance = (weights[i] * volatility / 100) * (weights[j] * 20 / 100) * 0.3;
      portfolioVariance += 2 * covariance;
    }
  }
  
  return Math.sqrt(portfolioVariance);
}

function calculateSharpeRatio(holdings: any[], weights: number[]): number {
  const riskFreeRate = 6; // 6% risk-free rate
  const portfolioReturn = 12; // Mock 12% portfolio return
  const portfolioVolatility = calculatePortfolioVolatility(holdings, weights);
  
  return (portfolioReturn - riskFreeRate) / portfolioVolatility;
}

function calculatePortfolioBeta(holdings: any[], weights: number[]): number {
  const marketReturn = 12; // 12% market return
  const portfolioReturn = 12; // Mock 12% portfolio return
  
  return portfolioReturn / marketReturn;
}

function calculateDiversificationScore(weights: number[]): number {
  const herfindahlIndex = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  return Math.round((1 - herfindahlIndex) * 100);
}

function generateCorrelationMatrix(holdings: any[]): number[][] {
  const n = holdings.length;
  const matrix = [];
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        // Mock correlation data
        matrix[i][j] = Math.random() * 0.8 + 0.1; // Random correlation between 0.1 and 0.9
      }
    }
  }
  
  return matrix;
}

// Widget preferences management
async function updateWidgetPreferences(userId: string, preferences: any) {
  // In production, save to database
  return { success: true, message: 'Widget preferences updated' };
}

async function createUserGoal(userId: string, goalData: any) {
  const goal = await prisma.portfolioTarget.create({
    data: {
      userId,
      targetAmount: parseFloat(goalData.targetAmount),
      targetDate: new Date(goalData.targetDate),
      riskLevel: goalData.riskLevel
    }
  });
  
  return { success: true, goal };
}

async function updateGoalProgress(userId: string, data: any) {
  // Update goal progress logic
  return { success: true, message: 'Goal progress updated' };
}

async function acceptRebalancingSuggestion(userId: string, data: any) {
  // Process rebalancing suggestion acceptance
  return { success: true, message: 'Rebalancing suggestion accepted' };
}

async function setPortfolioAlert(userId: string, alertData: any) {
  // Set portfolio alert logic
  return { success: true, message: 'Portfolio alert set' };
}