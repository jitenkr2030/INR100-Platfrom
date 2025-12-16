import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'track' | 'calculate' | 'compare' | 'alert'
      portfolioCopyId,
      benchmark = 'NIFTY_50',
      alerts = []
    } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'track':
        return await trackPerformance(userId, portfolioCopyId, body);
      
      case 'calculate':
        return await calculatePerformanceMetrics(userId, portfolioCopyId, benchmark);
      
      case 'compare':
        return await comparePerformance(userId, portfolioCopyId, body);
      
      case 'alert':
        return await checkPerformanceAlerts(userId, portfolioCopyId, alerts);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance tracking error:', error);
    return NextResponse.json(
      { error: 'Performance tracking failed' },
      { status: 500 }
    );
  }
}

async function trackPerformance(userId: string, portfolioCopyId: string, data: any) {
  // Verify portfolio copy belongs to user
  const portfolioCopy = await db.portfolioCopy.findFirst({
    where: {
      id: portfolioCopyId,
      userId: userId
    },
    include: {
      template: true,
      holdings: true,
      performance: true
    }
  });

  if (!portfolioCopy) {
    return NextResponse.json(
      { error: 'Portfolio copy not found or access denied' },
      { status: 404 }
    );
  }

  // Get current market prices for holdings
  const currentHoldings = await Promise.all(
    portfolioCopy.holdings.map(async (holding) => {
      // In real implementation, fetch current price from market data API
      const currentPrice = await getCurrentPrice(holding.symbol);
      const totalValue = holding.quantity * currentPrice;
      
      return {
        ...holding,
        currentPrice,
        totalValue,
        unrealizedGain: totalValue - holding.totalValue,
        unrealizedGainPercent: ((totalValue - holding.totalValue) / holding.totalValue) * 100
      };
    })
  );

  // Calculate portfolio metrics
  const totalCurrentValue = currentHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const totalInitialValue = portfolioCopy.initialInvestment;
  const totalReturn = totalCurrentValue - totalInitialValue;
  const totalReturnPercent = (totalReturn / totalInitialValue) * 100;

  // Get benchmark data
  const benchmarkReturn = await getBenchmarkReturn(portfolioCopy.copyDate, new Date(), data.benchmark);

  // Calculate risk metrics
  const volatility = await calculateVolatility(portfolioCopyId);
  const sharpeRatio = totalReturnPercent > 0 ? totalReturnPercent / volatility : 0;
  const maxDrawdown = await calculateMaxDrawdown(portfolioCopyId);

  // Update performance record
  const performance = await db.portfolioPerformance.upsert({
    where: { portfolioCopyId },
    update: {
      totalReturn,
      percentageReturn: totalReturnPercent,
      benchmarkReturn,
      alpha: totalReturnPercent - benchmarkReturn,
      beta: 1, // Simplified beta calculation
      sharpeRatio,
      maxDrawdown,
      volatility,
      currentValue: totalCurrentValue,
      trackingDate: new Date()
    },
    create: {
      portfolioCopyId,
      totalReturn,
      percentageReturn: totalReturnPercent,
      benchmarkReturn,
      alpha: totalReturnPercent - benchmarkReturn,
      beta: 1,
      sharpeRatio,
      maxDrawdown,
      volatility,
      currentValue: totalCurrentValue,
      trackingDate: new Date()
    }
  });

  // Update portfolio copy current value
  await db.portfolioCopy.update({
    where: { id: portfolioCopyId },
    data: {
      currentValue: totalCurrentValue
    }
  });

  // Update individual holdings
  for (const holding of currentHoldings) {
    await db.portfolioHolding.update({
      where: { id: holding.id },
      data: {
        currentPrice: holding.currentPrice,
        totalValue: holding.totalValue
      }
    });
  }

  // Check for alerts
  const alerts = await checkPortfolioAlerts(portfolioCopy, performance);

  // Create performance tracking record
  await db.performanceTracking.create({
    data: {
      portfolioCopyId,
      userId,
      totalValue: totalCurrentValue,
      totalReturn,
      returnPercent: totalReturnPercent,
      benchmarkReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      trackedAt: new Date()
    }
  });

  return NextResponse.json({
    message: 'Performance tracked successfully',
    performance: {
      currentValue: totalCurrentValue,
      totalReturn,
      returnPercent: totalReturnPercent,
      benchmarkComparison: {
        benchmark: data.benchmark,
        benchmarkReturn,
        alpha: totalReturnPercent - benchmarkReturn,
        outperformance: totalReturnPercent - benchmarkReturn
      },
      riskMetrics: {
        volatility,
        sharpeRatio,
        maxDrawdown
      },
      holdings: currentHoldings,
      alerts
    }
  });
}

async function calculatePerformanceMetrics(userId: string, portfolioCopyId: string, benchmark: string) {
  // Get historical performance data
  const performanceData = await db.portfolioPerformance.findMany({
    where: { portfolioCopyId },
    orderBy: { trackingDate: 'asc' }
  });

  if (performanceData.length === 0) {
    return NextResponse.json(
      { error: 'No performance data available' },
      { status: 404 }
    );
  }

  // Calculate comprehensive metrics
  const metrics = {
    returns: {
      total: performanceData[performanceData.length - 1].totalReturn,
      percentage: performanceData[performanceData.length - 1].percentageReturn,
      annualized: calculateAnnualizedReturn(performanceData),
      cumulative: calculateCumulativeReturn(performanceData)
    },
    risk: {
      volatility: calculatePortfolioVolatility(performanceData),
      sharpeRatio: calculateSharpeRatio(performanceData),
      maxDrawdown: calculatePortfolioMaxDrawdown(performanceData),
      beta: await calculateBeta(portfolioCopyId, benchmark),
      var95: calculateVaR(performanceData, 0.95)
    },
    benchmark: {
      name: benchmark,
      return: performanceData[performanceData.length - 1].benchmarkReturn,
      alpha: performanceData[performanceData.length - 1].alpha,
      trackingError: await calculateTrackingError(portfolioCopyId, benchmark)
    },
    attribution: await calculatePerformanceAttribution(portfolioCopyId),
    consistency: calculateConsistencyMetrics(performanceData)
  };

  return NextResponse.json({
    portfolioCopyId,
    benchmark,
    metrics,
    period: {
      startDate: performanceData[0].trackingDate,
      endDate: performanceData[performanceData.length - 1].trackingDate,
      days: Math.ceil(
        (performanceData[performanceData.length - 1].trackingDate.getTime() - 
         performanceData[0].trackingDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  });
}

async function comparePerformance(userId: string, portfolioCopyId: string, data: any) {
  const { compareWith, period = '1Y' } = data;

  // Get main portfolio performance
  const mainPortfolio = await db.portfolioCopy.findUnique({
    where: { id: portfolioCopyId },
    include: {
      performance: true,
      template: true
    }
  });

  if (!mainPortfolio) {
    return NextResponse.json(
      { error: 'Portfolio not found' },
      { status: 404 }
    );
  }

  // Get comparison portfolio/data
  let comparisonData: any = null;

  if (compareWith === 'benchmark') {
    comparisonData = await getBenchmarkData(period);
  } else if (compareWith === 'template') {
    // Compare with original template performance
    comparisonData = await getTemplatePerformance(mainPortfolio.templateId, period);
  } else if (compareWith === 'peer') {
    // Compare with other copied portfolios
    comparisonData = await getPeerPerformance(mainPortfolio.templateId, period);
  }

  // Calculate comparison metrics
  const comparison = {
    mainPortfolio: {
      name: mainPortfolio.template.name,
      return: mainPortfolio.performance?.percentageReturn || 0,
      volatility: mainPortfolio.performance?.volatility || 0,
      sharpeRatio: mainPortfolio.performance?.sharpeRatio || 0
    },
    comparison: comparisonData,
    relative: {
      returnDifference: (mainPortfolio.performance?.percentageReturn || 0) - (comparisonData?.return || 0),
      volatilityDifference: (mainPortfolio.performance?.volatility || 0) - (comparisonData?.volatility || 0),
      sharpeDifference: (mainPortfolio.performance?.sharpeRatio || 0) - (comparisonData?.sharpeRatio || 0)
    }
  };

  return NextResponse.json({
    comparison,
    period,
    generatedAt: new Date()
  });
}

async function checkPerformanceAlerts(userId: string, portfolioCopyId: string, alertTypes: string[]) {
  const portfolio = await db.portfolioCopy.findUnique({
    where: { id: portfolioCopyId },
    include: {
      performance: true,
      template: {
        include: { expert: true }
      }
    }
  });

  if (!portfolio || !portfolio.performance) {
    return NextResponse.json(
      { error: 'Portfolio or performance data not found' },
      { status: 404 }
    );
  }

  const alerts: any[] = [];

  for (const alertType of alertTypes) {
    switch (alertType) {
      case 'drawdown':
        if (portfolio.performance.maxDrawdown < -10) {
          alerts.push({
            type: 'drawdown',
            severity: portfolio.performance.maxDrawdown < -20 ? 'high' : 'medium',
            message: `Portfolio drawdown reached ${portfolio.performance.maxDrawdown.toFixed(1)}%`,
            threshold: -10,
            current: portfolio.performance.maxDrawdown
          });
        }
        break;

      case 'underperformance':
        if (portfolio.performance.alpha < -5) {
          alerts.push({
            type: 'underperformance',
            severity: 'medium',
            message: `Portfolio underperforming benchmark by ${Math.abs(portfolio.performance.alpha).toFixed(1)}%`,
            threshold: -5,
            current: portfolio.performance.alpha
          });
        }
        break;

      case 'high_volatility':
        if (portfolio.performance.volatility > 25) {
          alerts.push({
            type: 'high_volatility',
            severity: 'medium',
            message: `Portfolio volatility is ${portfolio.performance.volatility.toFixed(1)}%, consider rebalancing`,
            threshold: 25,
            current: portfolio.performance.volatility
          });
        }
        break;

      case 'negative_return':
        if (portfolio.performance.percentageReturn < -5) {
          alerts.push({
            type: 'negative_return',
            severity: 'high',
            message: `Portfolio showing negative returns of ${portfolio.performance.percentageReturn.toFixed(1)}%`,
            threshold: -5,
            current: portfolio.performance.percentageReturn
          });
        }
        break;
    }
  }

  // Store alerts in database
  for (const alert of alerts) {
    await db.performanceAlert.create({
      data: {
        portfolioCopyId,
        userId,
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        threshold: alert.threshold,
        currentValue: alert.current,
        triggeredAt: new Date()
      }
    });
  }

  return NextResponse.json({
    alerts,
    totalAlerts: alerts.length,
    highSeverity: alerts.filter(a => a.severity === 'high').length
  });
}

// Helper functions
async function getCurrentPrice(symbol: string): Promise<number> {
  // In real implementation, fetch from market data API
  // For now, return mock price with some volatility
  const basePrice = 100;
  const volatility = 0.02;
  const randomFactor = (Math.random() - 0.5) * 2 * volatility;
  return basePrice * (1 + randomFactor);
}

async function getBenchmarkReturn(startDate: Date, endDate: Date, benchmark: string): Promise<number> {
  // In real implementation, fetch benchmark data
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const annualReturn = 0.12; // 12% annual return
  return (annualReturn * days) / 365;
}

async function calculateVolatility(portfolioCopyId: string): Promise<number> {
  // Simplified volatility calculation
  return 18.5; // Mock volatility
}

async function calculateMaxDrawdown(portfolioCopyId: string): Promise<number> {
  // Simplified max drawdown calculation
  return -8.3; // Mock max drawdown
}

async function checkPortfolioAlerts(portfolio: any, performance: any): Promise<any[]> {
  const alerts: any[] = [];
  
  if (performance.maxDrawdown < -15) {
    alerts.push({
      type: 'high_drawdown',
      message: 'Portfolio drawdown exceeds 15%',
      severity: 'high'
    });
  }
  
  if (performance.alpha < -3) {
    alerts.push({
      type: 'underperformance',
      message: 'Portfolio underperforming benchmark',
      severity: 'medium'
    });
  }
  
  return alerts;
}

function calculateAnnualizedReturn(performanceData: any[]): number {
  if (performanceData.length < 2) return 0;
  
  const startValue = performanceData[0].currentValue;
  const endValue = performanceData[performanceData.length - 1].currentValue;
  const days = (performanceData[performanceData.length - 1].trackingDate.getTime() - 
                performanceData[0].trackingDate.getTime()) / (1000 * 60 * 60 * 24);
  
  const totalReturn = (endValue - startValue) / startValue;
  return Math.pow(1 + totalReturn, 365 / days) - 1;
}

function calculateCumulativeReturn(performanceData: any[]): number {
  if (performanceData.length === 0) return 0;
  return performanceData[performanceData.length - 1].percentageReturn;
}

function calculatePortfolioVolatility(performanceData: any[]): number {
  if (performanceData.length < 2) return 0;
  
  const returns = performanceData.map(p => p.percentageReturn);
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function calculateSharpeRatio(performanceData: any[]): number {
  const volatility = calculatePortfolioVolatility(performanceData);
  const annualizedReturn = calculateAnnualizedReturn(performanceData);
  const riskFreeRate = 0.06; // 6% risk-free rate
  
  return volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
}

function calculatePortfolioMaxDrawdown(performanceData: any[]): number {
  let maxDrawdown = 0;
  let peak = performanceData[0]?.currentValue || 0;
  
  for (const data of performanceData) {
    if (data.currentValue > peak) {
      peak = data.currentValue;
    }
    
    const drawdown = (peak - data.currentValue) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return -maxDrawdown * 100; // Convert to percentage
}

async function calculateBeta(portfolioCopyId: string, benchmark: string): Promise<number> {
  // Simplified beta calculation
  return 1.1; // Mock beta
}

function calculateVaR(performanceData: any[], confidence: number): number {
  if (performanceData.length === 0) return 0;
  
  const returns = performanceData.map(p => p.percentageReturn).sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * returns.length);
  
  return returns[index] || 0;
}

async function calculatePerformanceAttribution(portfolioCopyId: string): Promise<any> {
  // Simplified attribution analysis
  return {
    assetAllocation: 0.75,
    securitySelection: 0.15,
    interaction: 0.10,
    total: 1.00
  };
}

function calculateConsistencyMetrics(performanceData: any[]): any {
  if (performanceData.length < 2) return { score: 0, positiveMonths: 0 };
  
  const monthlyReturns = groupReturnsByMonth(performanceData);
  const positiveMonths = monthlyReturns.filter(r => r > 0).length;
  const consistencyScore = (positiveMonths / monthlyReturns.length) * 100;
  
  return {
    score: consistencyScore,
    positiveMonths,
    totalMonths: monthlyReturns.length,
    winRate: positiveMonths / monthlyReturns.length
  };
}

function groupReturnsByMonth(performanceData: any[]): number[] {
  // Group daily returns by month and calculate monthly returns
  const monthlyReturns: number[] = [];
  // Simplified implementation
  return monthlyReturns;
}

async function getBenchmarkData(period: string): Promise<any> {
  // Mock benchmark data
  return {
    name: 'NIFTY 50',
    return: 15.2,
    volatility: 20.1,
    sharpeRatio: 0.65
  };
}

async function getTemplatePerformance(templateId: string, period: string): Promise<any> {
  // Get template's original performance
  return {
    name: 'Template Performance',
    return: 18.5,
    volatility: 19.2,
    sharpeRatio: 0.82
  };
}

async function getPeerPerformance(templateId: string, period: string): Promise<any> {
  // Get average performance of other copied portfolios
  return {
    name: 'Peer Average',
    return: 16.8,
    volatility: 21.5,
    sharpeRatio: 0.58
  };
}

async function calculateTrackingError(portfolioCopyId: string, benchmark: string): Promise<number> {
  // Simplified tracking error calculation
  return 3.2; // Mock tracking error
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const portfolioCopyId = searchParams.get('portfolioCopyId');
    const period = searchParams.get('period') || '1M';

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const where: any = { userId: targetUserId };
    if (portfolioCopyId) where.portfolioCopyId = portfolioCopyId;

    // Get performance tracking data
    const trackingData = await db.performanceTracking.findMany({
      where,
      orderBy: { trackedAt: 'desc' },
      take: 100
    });

    // Get performance alerts
    const alerts = await db.performanceAlert.findMany({
      where: { userId: targetUserId },
      orderBy: { triggeredAt: 'desc' },
      take: 50
    });

    // Get summary statistics
    const summary = {
      totalPortfolios: await db.portfolioCopy.count({
        where: { userId: targetUserId, status: 'ACTIVE' }
      }),
      avgReturn: trackingData.length > 0 
        ? trackingData.reduce((sum, t) => sum + t.returnPercent, 0) / trackingData.length 
        : 0,
      totalTrackedValue: trackingData.length > 0 
        ? trackingData[0].totalValue 
        : 0,
      activeAlerts: alerts.filter(a => !a.resolved).length
    };

    return NextResponse.json({
      trackingData,
      alerts,
      summary,
      period
    });

  } catch (error) {
    console.error('Get performance tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance tracking data' },
      { status: 500 }
    );
  }
}