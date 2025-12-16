import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService } from '@/lib/broker-integration';

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  quantity: number;
  price: number;
  transactionType: 'BUY' | 'SELL';
  timestamp: string;
  brokerage: number;
  netAmount: number;
  status: 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'PENDING';
  pnl?: number;
  isIntraday: boolean;
  segment: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maximumDrawdown: number;
  sharpeRatio: number;
  beta: number;
  alpha: number;
  volatility: number;
  totalReturnCAGR: number;
  monthlyReturns: MonthlyReturn[];
  sectorAllocation: SectorAllocation[];
  topPerformers: HoldingPerformance[];
  worstPerformers: HoldingPerformance[];
}

export interface MonthlyReturn {
  month: string;
  return: number;
  returnPercent: number;
  trades: number;
  winningTrades: number;
}

export interface SectorAllocation {
  sector: string;
  allocation: number;
  return: number;
  returnPercent: number;
  riskScore: number;
}

export interface HoldingPerformance {
  symbol: string;
  allocation: number;
  totalReturn: number;
  returnPercent: number;
  volatility: number;
  sharpeRatio: number;
}

export interface TradingPattern {
  timeOfDay: string;
  winRate: number;
  averageReturn: number;
  tradeCount: number;
}

export interface StrategyAnalysis {
  strategy: string;
  totalReturn: number;
  returnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  tradeCount: number;
  bestMonth: string;
  worstMonth: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const symbol = searchParams.get('symbol');

    switch (type) {
      case 'trades':
        const trades = await getTradingHistory({ startDate, endDate, symbol });
        return NextResponse.json({
          success: true,
          trades
        });

      case 'performance':
        const performance = await getPerformanceMetrics({ startDate, endDate });
        return NextResponse.json({
          success: true,
          performance
        });

      case 'patterns':
        const patterns = await getTradingPatterns();
        return NextResponse.json({
          success: true,
          patterns
        });

      case 'strategies':
        const strategies = await getStrategyAnalysis();
        return NextResponse.json({
          success: true,
          strategies
        });

      case 'analytics':
        const analytics = await getDetailedAnalytics({ startDate, endDate });
        return NextResponse.json({
          success: true,
          analytics
        });

      case 'report':
        const report = await generateTradingReport({ startDate, endDate });
        return NextResponse.json({
          success: true,
          report
        });

      default:
        // Return comprehensive overview
        const [trades, performance, patterns, strategies] = await Promise.all([
          getTradingHistory({ startDate, endDate }),
          getPerformanceMetrics({ startDate, endDate }),
          getTradingPatterns(),
          getStrategyAnalysis()
        ]);

        return NextResponse.json({
          success: true,
          overview: {
            trades,
            performance,
            patterns,
            strategies
          }
        });
    }
  } catch (error) {
    console.error('Trading history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trading history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'export':
        const exportResult = await exportTradingData(data);
        return NextResponse.json(exportResult);

      case 'calculate-metrics':
        const metricsResult = await calculateCustomMetrics(data);
        return NextResponse.json(metricsResult);

      case 'benchmark-comparison':
        const benchmarkResult = await compareWithBenchmark(data);
        return NextResponse.json(benchmarkResult);

      case 'risk-adjusted-returns':
        const riskAdjustedResult = await calculateRiskAdjustedReturns(data);
        return NextResponse.json(riskAdjustedResult);

      case 'monte-carlo':
        const monteCarloResult = await runMonteCarloSimulation(data);
        return NextResponse.json(monteCarloResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trading analytics action error:', error);
    return NextResponse.json(
      { error: 'Failed to process trading analytics action' },
      { status: 500 }
    );
  }
}

async function getTradingHistory(params: { startDate?: string | null; endDate?: string | null; symbol?: string | null }): Promise<Trade[]> {
  // Mock trading history - in production, this would come from broker API
  const mockTrades: Trade[] = [
    {
      id: 'T001',
      orderId: 'ORD001',
      symbol: 'RELIANCE',
      quantity: 100,
      price: 2450.75,
      transactionType: 'BUY',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      brokerage: 20,
      netAmount: -245095,
      status: 'COMPLETED',
      pnl: 1500,
      isIntraday: false,
      segment: 'EQ'
    },
    {
      id: 'T002',
      orderId: 'ORD002',
      symbol: 'TCS',
      quantity: 50,
      price: 3456.20,
      transactionType: 'SELL',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      brokerage: 20,
      netAmount: 172790,
      status: 'COMPLETED',
      pnl: -850,
      isIntraday: true,
      segment: 'EQ'
    }
  ];

  // Filter by date range and symbol
  let filteredTrades = mockTrades;

  if (params.startDate) {
    filteredTrades = filteredTrades.filter(trade => 
      new Date(trade.timestamp) >= new Date(params.startDate!)
    );
  }

  if (params.endDate) {
    filteredTrades = filteredTrades.filter(trade => 
      new Date(trade.timestamp) <= new Date(params.endDate!)
    );
  }

  if (params.symbol) {
    filteredTrades = filteredTrades.filter(trade => 
      trade.symbol.toLowerCase().includes(params.symbol!.toLowerCase())
    );
  }

  return filteredTrades;
}

async function getPerformanceMetrics(params: { startDate?: string | null; endDate?: string | null }): Promise<PerformanceMetrics> {
  const trades = await getTradingHistory(params);
  const holdings = await brokerIntegrationService.getHoldings();

  // Calculate performance metrics
  const totalTrades = trades.length;
  const completedTrades = trades.filter(t => t.status === 'COMPLETED');
  const winningTrades = completedTrades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = completedTrades.filter(t => (t.pnl || 0) < 0).length;
  
  const totalPnL = completedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalInvestment = completedTrades.reduce((sum, trade) => sum + Math.abs(trade.netAmount), 0);
  
  const wins = completedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = completedTrades.filter(t => (t.pnl || 0) < 0);
  
  const averageWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
  const averageLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length : 0;
  
  const profitFactor = averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0;

  // Generate monthly returns
  const monthlyReturns = generateMonthlyReturns(trades);

  // Sector allocation
  const sectorAllocation = generateSectorAllocation(holdings);

  // Top and worst performers
  const topPerformers = holdings
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5)
    .map(holding => ({
      symbol: holding.symbol,
      allocation: (holding.quantity * holding.currentPrice),
      totalReturn: holding.pnl,
      returnPercent: holding.pnlPercentage,
      volatility: Math.random() * 30 + 10, // Mock volatility
      sharpeRatio: Math.random() * 2 + 0.5 // Mock Sharpe ratio
    }));

  const worstPerformers = holdings
    .sort((a, b) => a.pnl - b.pnl)
    .slice(0, 5)
    .map(holding => ({
      symbol: holding.symbol,
      allocation: (holding.quantity * holding.currentPrice),
      totalReturn: holding.pnl,
      returnPercent: holding.pnlPercentage,
      volatility: Math.random() * 30 + 10,
      sharpeRatio: Math.random() * 2 + 0.5
    }));

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    totalReturn: totalPnL,
    totalReturnPercent: totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0,
    averageWin,
    averageLoss,
    profitFactor,
    maximumDrawdown: 8.5, // Mock value
    sharpeRatio: 1.2, // Mock value
    beta: 0.95, // Mock value
    alpha: 2.3, // Mock value
    volatility: 18.5, // Mock value
    totalReturnCAGR: 15.2, // Mock value
    monthlyReturns,
    sectorAllocation,
    topPerformers,
    worstPerformers
  };
}

async function getTradingPatterns(): Promise<TradingPattern[]> {
  return [
    {
      timeOfDay: '9:15-10:00',
      winRate: 45.2,
      averageReturn: -0.5,
      tradeCount: 25
    },
    {
      timeOfDay: '10:00-11:00',
      winRate: 52.8,
      averageReturn: 0.8,
      tradeCount: 42
    },
    {
      timeOfDay: '11:00-12:00',
      winRate: 48.5,
      averageReturn: 0.3,
      tradeCount: 38
    },
    {
      timeOfDay: '12:00-13:00',
      winRate: 44.1,
      averageReturn: -0.2,
      tradeCount: 15
    },
    {
      timeOfDay: '13:00-14:00',
      winRate: 56.3,
      averageReturn: 1.2,
      tradeCount: 33
    },
    {
      timeOfDay: '14:00-15:00',
      winRate: 51.7,
      averageReturn: 0.6,
      tradeCount: 41
    },
    {
      timeOfDay: '15:00-15:30',
      winRate: 49.2,
      averageReturn: 0.4,
      tradeCount: 28
    }
  ];
}

async function getStrategyAnalysis(): Promise<StrategyAnalysis[]> {
  return [
    {
      strategy: 'Momentum Trading',
      totalReturn: 25000,
      returnPercent: 12.5,
      maxDrawdown: 8.2,
      sharpeRatio: 1.4,
      winRate: 55.8,
      tradeCount: 85,
      bestMonth: 'March 2024',
      worstMonth: 'January 2024'
    },
    {
      strategy: 'Value Investing',
      totalReturn: 18000,
      returnPercent: 9.2,
      maxDrawdown: 5.1,
      sharpeRatio: 1.8,
      winRate: 62.3,
      tradeCount: 32,
      bestMonth: 'February 2024',
      worstMonth: 'December 2023'
    },
    {
      strategy: 'Swing Trading',
      totalReturn: 32000,
      returnPercent: 15.8,
      maxDrawdown: 12.3,
      sharpeRatio: 1.1,
      winRate: 48.9,
      tradeCount: 156,
      bestMonth: 'April 2024',
      worstMonth: 'November 2023'
    }
  ];
}

async function getDetailedAnalytics(params: { startDate?: string | null; endDate?: string | null }): Promise<any> {
  const performance = await getPerformanceMetrics(params);
  const patterns = await getTradingPatterns();
  const strategies = await getStrategyAnalysis();

  return {
    performance,
    patterns,
    strategies,
    riskMetrics: await brokerIntegrationService.getRiskMetrics(),
    benchmarkComparison: await compareWithBenchmark({ period: '1Y' }),
    correlations: generateCorrelationMatrix(),
    attributionAnalysis: generateAttributionAnalysis()
  };
}

async function generateTradingReport(params: { startDate?: string | null; endDate?: string | null }): Promise<any> {
  const analytics = await getDetailedAnalytics(params);
  
  return {
    reportId: `TR${Date.now()}`,
    generatedAt: new Date().toISOString(),
    period: {
      startDate: params.startDate,
      endDate: params.endDate
    },
    summary: {
      totalReturn: analytics.performance.totalReturn,
      returnPercent: analytics.performance.totalReturnPercent,
      totalTrades: analytics.performance.totalTrades,
      winRate: analytics.performance.winRate,
      sharpeRatio: analytics.performance.sharpeRatio,
      maxDrawdown: analytics.performance.maxDrawdown
    },
    detailedAnalysis: analytics,
    recommendations: generateRecommendations(analytics),
    riskWarnings: generateRiskWarnings(analytics)
  };
}

function generateMonthlyReturns(trades: Trade[]): MonthlyReturn[] {
  const months = ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024'];
  
  return months.map(month => {
    const monthTrades = trades.filter(t => t.timestamp.includes(month.replace(' ', '-')));
    const monthPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = monthTrades.filter(t => (t.pnl || 0) > 0).length;
    
    return {
      month,
      return: monthPnL,
      returnPercent: Math.random() * 10 - 5, // Mock percentage
      trades: monthTrades.length,
      winningTrades
    };
  });
}

function generateSectorAllocation(holdings: any[]): SectorAllocation[] {
  const sectors = [
    { name: 'IT', weight: 0.25, return: 12.5 },
    { name: 'Banking', weight: 0.20, return: -3.2 },
    { name: 'Pharma', weight: 0.15, return: 8.7 },
    { name: 'Auto', weight: 0.12, return: 15.3 },
    { name: 'Energy', weight: 0.10, return: 5.1 },
    { name: 'Others', weight: 0.18, return: 6.8 }
  ];

  return sectors.map(sector => ({
    sector: sector.name,
    allocation: sector.weight * 100,
    return: sector.return,
    returnPercent: sector.return,
    riskScore: Math.random() * 10 + 5
  }));
}

async function exportTradingData(data: any): Promise<any> {
  // Mock export functionality
  return {
    success: true,
    downloadUrl: `/exports/trading-data-${Date.now()}.csv`,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
  };
}

async function calculateCustomMetrics(data: any): Promise<any> {
  // Mock custom metrics calculation
  return {
    success: true,
    metrics: {
      calmarRatio: 1.85,
      sortinoRatio: 1.45,
      informationRatio: 0.68,
      treynorRatio: 12.3,
      jensenAlpha: 2.1
    }
  };
}

async function compareWithBenchmark(data: any): Promise<any> {
  // Mock benchmark comparison (vs NIFTY 50)
  return {
    success: true,
    comparison: {
      portfolioReturn: 15.2,
      benchmarkReturn: 12.8,
      excessReturn: 2.4,
      trackingError: 3.2,
      informationRatio: 0.75,
      beta: 0.95,
      correlation: 0.88
    }
  };
}

async function calculateRiskAdjustedReturns(data: any): Promise<any> {
  return {
    success: true,
    returns: {
      riskAdjustedReturn: 8.7,
      riskAdjustedVolatility: 12.3,
      riskAdjustedSharpe: 1.42,
      riskAdjustedSortino: 1.89
    }
  };
}

async function runMonteCarloSimulation(data: any): Promise<any> {
  // Mock Monte Carlo simulation
  const simulations = 1000;
  const results = [];
  
  for (let i = 0; i < simulations; i++) {
    const monthlyReturn = (Math.random() - 0.4) * 0.1; // Biased towards positive returns
    results.push(monthlyReturn);
  }
  
  const sortedResults = results.sort((a, b) => a - b);
  const percentile95 = sortedResults[Math.floor(sortedResults.length * 0.95)];
  const percentile5 = sortedResults[Math.floor(sortedResults.length * 0.05)];
  
  return {
    success: true,
    simulation: {
      simulations,
      expectedReturn: results.reduce((a, b) => a + b) / results.length,
      volatility: Math.sqrt(results.reduce((sum, r) => sum + r * r, 0) / results.length),
      var95: percentile5,
      var5: percentile95,
      confidenceInterval: [percentile5, percentile95]
    }
  };
}

function generateCorrelationMatrix(): any {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
  const matrix = {};
  
  symbols.forEach(symbol1 => {
    matrix[symbol1] = {};
    symbols.forEach(symbol2 => {
      matrix[symbol1][symbol2] = Math.random() * 2 - 1; // Correlation between -1 and 1
    });
  });
  
  return matrix;
}

function generateAttributionAnalysis(): any {
  return {
    totalReturn: 15.2,
    allocationEffect: 3.2,
    selectionEffect: 2.8,
    interactionEffect: 0.5,
    sectorAttribution: {
      'IT': { return: 2.1, allocation: 1.2, selection: 0.9 },
      'Banking': { return: -0.8, allocation: -0.3, selection: -0.5 },
      'Pharma': { return: 1.5, allocation: 0.8, selection: 0.7 }
    }
  };
}

function generateRecommendations(analytics: any): string[] {
  const recommendations = [];
  
  if (analytics.performance.winRate < 50) {
    recommendations.push('Consider improving entry and exit strategies to improve win rate');
  }
  
  if (analytics.performance.maxDrawdown > 10) {
    recommendations.push('Risk management could be improved to reduce maximum drawdown');
  }
  
  if (analytics.performance.sharpeRatio < 1) {
    recommendations.push('Focus on risk-adjusted returns to improve Sharpe ratio');
  }
  
  recommendations.push('Consider diversifying across more sectors to reduce concentration risk');
  recommendations.push('Monitor performance during different market conditions');
  
  return recommendations;
}

function generateRiskWarnings(analytics: any): string[] {
  const warnings = [];
  
  if (analytics.performance.maxDrawdown > 15) {
    warnings.push('High maximum drawdown detected - consider reducing position sizes');
  }
  
  if (analytics.performance.winRate < 40) {
    warnings.push('Low win rate may indicate strategy needs revision');
  }
  
  const concentrationRisk = Math.max(...analytics.performance.sectorAllocation.map(s => s.allocation));
  if (concentrationRisk > 30) {
    warnings.push('High sector concentration risk detected');
  }
  
  return warnings;
}