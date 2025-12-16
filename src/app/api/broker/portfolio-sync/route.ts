import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService, PortfolioHolding } from '@/lib/broker-integration';

export interface SyncStatus {
  lastSync: string;
  status: 'syncing' | 'completed' | 'failed' | 'pending';
  totalPositions: number;
  syncedPositions: number;
  errors: SyncError[];
  autoSyncEnabled: boolean;
  syncInterval: number; // minutes
}

export interface SyncError {
  symbol: string;
  error: string;
  timestamp: string;
}

export interface PortfolioSnapshot {
  timestamp: string;
  totalValue: number;
  totalPnL: number;
  dayChange: number;
  dayChangePercent: number;
  positions: PortfolioHolding[];
  cashBalance: number;
  marginUsed: number;
}

export interface RebalanceRequest {
  targetAllocations: { [symbol: string]: number }; // percentages
  tolerance: number; // percentage tolerance
  executeTrades: boolean;
  dryRun: boolean;
}

export interface RebalanceResult {
  currentAllocation: { [symbol: string]: number };
  targetAllocation: { [symbol: string]: number };
  requiredTrades: TradeInstruction[];
  estimatedCost: number;
  taxImplications: TaxImplication[];
  status: 'ready' | 'executed' | 'failed';
}

export interface TradeInstruction {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
  reason: string;
}

export interface TaxImplication {
  type: 'capital_gain' | 'dividend' | 'interest';
  amount: number;
  taxRate: number;
  estimatedTax: number;
  description: string;
}

export interface PortfolioAlert {
  id: string;
  type: 'rebalance' | 'stop_loss' | 'profit_target' | 'allocation' | 'volatility';
  symbol?: string;
  condition: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  triggeredAt?: string;
  message: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        const status = await getSyncStatus();
        return NextResponse.json({
          success: true,
          status
        });

      case 'holdings':
        const holdings = await brokerIntegrationService.getHoldings();
        return NextResponse.json({
          success: true,
          holdings
        });

      case 'snapshot':
        const snapshot = await getPortfolioSnapshot();
        return NextResponse.json({
          success: true,
          snapshot
        });

      case 'alerts':
        const alerts = await getPortfolioAlerts();
        return NextResponse.json({
          success: true,
          alerts
        });

      case 'allocation':
        const allocation = await getCurrentAllocation();
        return NextResponse.json({
          success: true,
          allocation
        });

      case 'performance':
        const performance = await getPortfolioPerformance();
        return NextResponse.json({
          success: true,
          performance
        });

      case 'diversification':
        const diversification = await getDiversificationMetrics();
        return NextResponse.json({
          success: true,
          diversification
        });

      default:
        // Return comprehensive portfolio data
        const [syncStatus, snapshot, alerts, allocation, performance] = await Promise.all([
          getSyncStatus(),
          getPortfolioSnapshot(),
          getPortfolioAlerts(),
          getCurrentAllocation(),
          getPortfolioPerformance()
        ]);

        return NextResponse.json({
          success: true,
          portfolio: {
            syncStatus,
            snapshot,
            alerts,
            allocation,
            performance
          }
        });
    }
  } catch (error) {
    console.error('Portfolio sync error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'sync':
        const syncResult = await syncPortfolio();
        return NextResponse.json(syncResult);

      case 'rebalance':
        const rebalanceResult = await rebalancePortfolio(data as RebalanceRequest);
        return NextResponse.json(rebalanceResult);

      case 'create-alert':
        const alertResult = await createPortfolioAlert(data);
        return NextResponse.json(alertResult);

      case 'update-alert':
        const updateResult = await updatePortfolioAlert(data);
        return NextResponse.json(updateResult);

      case 'delete-alert':
        const deleteResult = await deletePortfolioAlert(data.id);
        return NextResponse.json(deleteResult);

      case 'optimize':
        const optimizeResult = await optimizePortfolio(data);
        return NextResponse.json(optimizeResult);

      case 'export':
        const exportResult = await exportPortfolio(data);
        return NextResponse.json(exportResult);

      case 'import':
        const importResult = await importPortfolio(data);
        return NextResponse.json(importResult);

      case 'set-auto-sync':
        const autoSyncResult = await setAutoSync(data);
        return NextResponse.json(autoSyncResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Portfolio action error:', error);
    return NextResponse.json(
      { error: 'Failed to process portfolio action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    // Toggle portfolio alert
    const result = await togglePortfolioAlert(id, isActive);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update portfolio alert error:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio alert' },
      { status: 500 }
    );
  }
}

async function getSyncStatus(): Promise<SyncStatus> {
  // Mock sync status
  return {
    lastSync: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    status: 'completed',
    totalPositions: 15,
    syncedPositions: 15,
    errors: [],
    autoSyncEnabled: true,
    syncInterval: 5 // minutes
  };
}

async function getPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const holdings = await brokerIntegrationService.getHoldings();
  const balance = await brokerIntegrationService.getAccountBalance();
  
  const totalValue = holdings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  ) + (balance.balance?.availableCash || 0);
  
  const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
  const dayChange = holdings.reduce((sum, holding) => 
    sum + (holding.dayChange || 0), 0
  );
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    timestamp: new Date().toISOString(),
    totalValue,
    totalPnL,
    dayChange,
    dayChangePercent,
    positions: holdings,
    cashBalance: balance.balance?.availableCash || 0,
    marginUsed: balance.balance?.marginUsed || 0
  };
}

async function getPortfolioAlerts(): Promise<PortfolioAlert[]> {
  return [
    {
      id: 'ALT001',
      type: 'rebalance',
      condition: 'Technology sector allocation exceeds 40%',
      threshold: 40,
      currentValue: 45.2,
      isActive: true,
      message: 'Technology sector allocation is above target threshold'
    },
    {
      id: 'ALT002',
      type: 'stop_loss',
      symbol: 'RELIANCE',
      condition: 'Price falls below stop loss level',
      threshold: 2350,
      currentPrice: 2445.75, // This would be actual current price
      isActive: true,
      message: 'Reliance approaching stop loss level'
    },
    {
      id: 'ALT003',
      type: 'profit_target',
      symbol: 'TCS',
      condition: 'Price exceeds profit target',
      threshold: 3500,
      currentPrice: 3487.25,
      isActive: true,
      message: 'TCS has reached profit target'
    },
    {
      id: 'ALT004',
      type: 'volatility',
      condition: 'Portfolio volatility exceeds 25%',
      threshold: 25,
      currentValue: 28.3,
      isActive: false,
      message: 'Portfolio volatility is elevated'
    }
  ];
}

async function getCurrentAllocation(): Promise<any> {
  const holdings = await brokerIntegrationService.getHoldings();
  const totalValue = holdings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );

  const allocation: { [symbol: string]: number } = {};
  holdings.forEach(holding => {
    const value = holding.quantity * holding.currentPrice;
    allocation[holding.symbol] = totalValue > 0 ? (value / totalValue) * 100 : 0;
  });

  return {
    totalValue,
    allocation,
    cashPercentage: 0, // Would calculate actual cash percentage
    marginPercentage: 0
  };
}

async function getPortfolioPerformance(): Promise<any> {
  return {
    totalReturn: 15.2,
    annualizedReturn: 18.5,
    volatility: 22.3,
    sharpeRatio: 0.85,
    maxDrawdown: 8.7,
    beta: 1.12,
    alpha: 2.3,
    trackingError: 3.1,
    informationRatio: 0.74,
    sortinoRatio: 1.21,
    calmarRatio: 2.13,
    period: '1Y',
    benchmarkReturn: 12.8,
    excessReturn: 2.4
  };
}

async function getDiversificationMetrics(): Promise<any> {
  return {
    herfindahlIndex: 0.12, // Lower is better (more diversified)
    effectiveNumber: 8.5, // Effective number of positions
    sectorConcentration: {
      'Technology': 28.5,
      'Banking': 22.3,
      'Healthcare': 15.7,
      'Consumer Goods': 12.8,
      'Energy': 8.9,
      'Others': 11.8
    },
    top5Weight: 58.2,
    geographicConcentration: {
      'India': 85.2,
      'US': 8.7,
      'Europe': 4.1,
      'Others': 2.0
    },
    liquidityScore: 8.2, // Out of 10
    correlationRisk: 'Medium'
  };
}

async function syncPortfolio(): Promise<any> {
  try {
    // Simulate sync process
    const syncId = `SYNC_${Date.now()}`;
    
    // This would trigger actual broker API sync
    await brokerIntegrationService.getHoldings();
    await brokerIntegrationService.getAccountBalance();
    
    return {
      success: true,
      syncId,
      message: 'Portfolio synchronized successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to sync portfolio',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function rebalancePortfolio(request: RebalanceRequest): Promise<RebalanceResult> {
  const currentAllocation = await getCurrentAllocation();
  const holdings = await brokerIntegrationService.getHoldings();
  const totalValue = currentAllocation.totalValue;

  // Calculate required trades
  const requiredTrades: TradeInstruction[] = [];
  let estimatedCost = 0;

  Object.entries(request.targetAllocations).forEach(([symbol, targetPercent]) => {
    const currentPercent = currentAllocation.allocation[symbol] || 0;
    const difference = targetPercent - currentPercent;
    
    if (Math.abs(difference) > request.tolerance) {
      const targetValue = (targetPercent / 100) * totalValue;
      const currentValue = (currentPercent / 100) * totalValue;
      const tradeValue = targetValue - currentValue;
      
      // Get current price (this would come from market data)
      const holding = holdings.find(h => h.symbol === symbol);
      const currentPrice = holding?.currentPrice || 0;
      
      if (currentPrice > 0 && Math.abs(tradeValue) > 1000) { // Minimum trade value
        const quantity = Math.floor(Math.abs(tradeValue) / currentPrice);
        
        requiredTrades.push({
          symbol,
          action: tradeValue > 0 ? 'BUY' : 'SELL',
          quantity,
          estimatedPrice: currentPrice,
          estimatedValue: quantity * currentPrice,
          reason: `Rebalance to ${targetPercent}% allocation`
        });
        
        estimatedCost += quantity * currentPrice * 0.001; // Estimated brokerage
      }
    }
  });

  // Generate tax implications
  const taxImplications: TaxImplication[] = requiredTrades
    .filter(trade => trade.action === 'SELL')
    .map(trade => ({
      type: 'capital_gain',
      amount: trade.estimatedValue,
      taxRate: 0.1, // 10% tax rate
      estimatedTax: trade.estimatedValue * 0.1,
      description: `Capital gains tax on ${trade.symbol} sale`
    }));

  let status: 'ready' | 'executed' | 'failed' = 'ready';
  
  if (request.executeTrades && requiredTrades.length > 0 && !request.dryRun) {
    // Execute trades (this would integrate with broker API)
    status = 'executed';
  }

  return {
    currentAllocation: currentAllocation.allocation,
    targetAllocation: request.targetAllocations,
    requiredTrades,
    estimatedCost,
    taxImplications,
    status
  };
}

async function createPortfolioAlert(alertData: any): Promise<any> {
  const newAlert: PortfolioAlert = {
    id: `ALT${Date.now()}`,
    type: alertData.type,
    symbol: alertData.symbol,
    condition: alertData.condition,
    threshold: alertData.threshold,
    currentValue: 0,
    isActive: true,
    message: alertData.message
  };

  // In production, save to database
  return {
    success: true,
    alert: newAlert
  };
}

async function updatePortfolioAlert(alertData: any): Promise<any> {
  // In production, update database record
  return {
    success: true,
    message: 'Portfolio alert updated successfully'
  };
}

async function deletePortfolioAlert(id: string): Promise<any> {
  // In production, delete from database
  return {
    success: true,
    message: 'Portfolio alert deleted successfully'
  };
}

async function togglePortfolioAlert(id: string, isActive: boolean): Promise<any> {
  // In production, update database record
  return {
    success: true,
    message: `Portfolio alert ${isActive ? 'activated' : 'deactivated'}`
  };
}

async function optimizePortfolio(data: any): Promise<any> {
  // Mock portfolio optimization
  const currentHoldings = await brokerIntegrationService.getHoldings();
  const optimization = {
    currentSharpe: 0.85,
    optimizedSharpe: 1.12,
    currentVolatility: 22.3,
    optimizedVolatility: 18.7,
    suggestedChanges: [
      {
        action: 'REDUCE',
        symbol: 'RELIANCE',
        currentWeight: 15.2,
        suggestedWeight: 8.0,
        reason: 'High correlation with market'
      },
      {
        action: 'INCREASE',
        symbol: 'HDFCBANK',
        currentWeight: 3.2,
        suggestedWeight: 7.5,
        reason: 'Low correlation and good risk-adjusted returns'
      }
    ],
    expectedImprovement: {
      sharpeImprovement: 0.27,
      volatilityReduction: 3.6,
      diversificationScore: 'Improved'
    }
  };

  return {
    success: true,
    optimization
  };
}

async function exportPortfolio(data: any): Promise<any> {
  // Mock export functionality
  const holdings = await brokerIntegrationService.getHoldings();
  const snapshot = await getPortfolioSnapshot();
  
  return {
    success: true,
    downloadUrl: `/exports/portfolio-${Date.now()}.csv`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    data: {
      holdings,
      snapshot,
      exportedAt: new Date().toISOString()
    }
  };
}

async function importPortfolio(data: any): Promise<any> {
  // Mock import functionality
  return {
    success: true,
    imported: true,
    message: 'Portfolio imported successfully',
    importedPositions: data.positions?.length || 0
  };
}

async function setAutoSync(data: any): Promise<any> {
  // In production, save to user preferences
  return {
    success: true,
    autoSyncEnabled: data.enabled,
    syncInterval: data.interval,
    message: `Auto-sync ${data.enabled ? 'enabled' : 'disabled'} with ${data.interval} minute interval`
  };
}