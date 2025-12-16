import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService, RiskMetrics } from '@/lib/broker-integration';

export interface RiskLimit {
  id: string;
  name: string;
  type: 'position_size' | 'daily_loss' | 'stop_loss' | 'max_drawdown' | 'concentration';
  value: number;
  currentValue: number;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  alertThreshold?: number;
}

export interface StopLossRule {
  id: string;
  symbol: string;
  stopLossPercentage: number;
  trailingStopLoss: boolean;
  trailingDistance: number;
  isActive: boolean;
  createdAt: string;
}

export interface PositionSizingRule {
  id: string;
  name: string;
  maxPositionSize: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  isActive: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'metrics':
        const riskMetrics = await brokerIntegrationService.getRiskMetrics();
        return NextResponse.json({
          success: true,
          metrics: riskMetrics
        });

      case 'limits':
        const riskLimits = await getRiskLimits();
        return NextResponse.json({
          success: true,
          limits: riskLimits
        });

      case 'stop-loss':
        const stopLossRules = await getStopLossRules();
        return NextResponse.json({
          success: true,
          rules: stopLossRules
        });

      case 'position-sizing':
        const positionRules = await getPositionSizingRules();
        return NextResponse.json({
          success: true,
          rules: positionRules
        });

      case 'risk-score':
        const riskScore = await calculateOverallRiskScore();
        return NextResponse.json({
          success: true,
          riskScore
        });

      default:
        // Return all risk management data
        const [metrics, limits, stopLoss, positionRules, riskScore] = await Promise.all([
          brokerIntegrationService.getRiskMetrics(),
          getRiskLimits(),
          getStopLossRules(),
          getPositionSizingRules(),
          calculateOverallRiskScore()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            metrics,
            limits,
            stopLoss,
            positionRules,
            riskScore
          }
        });
    }
  } catch (error) {
    console.error('Risk management error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk management data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create-limit':
        const limitResult = await createRiskLimit(data);
        return NextResponse.json(limitResult);

      case 'create-stop-loss':
        const stopLossResult = await createStopLossRule(data);
        return NextResponse.json(stopLossResult);

      case 'create-position-rule':
        const positionResult = await createPositionSizingRule(data);
        return NextResponse.json(positionResult);

      case 'update-limit':
        const updateResult = await updateRiskLimit(data);
        return NextResponse.json(updateResult);

      case 'delete-limit':
        const deleteResult = await deleteRiskLimit(data.id);
        return NextResponse.json(deleteResult);

      case 'execute-stop-loss':
        const executeResult = await executeStopLossRule(data.symbol);
        return NextResponse.json(executeResult);

      case 'calculate-position-size':
        const positionSizeResult = await calculatePositionSize(data);
        return NextResponse.json(positionSizeResult);

      case 'validate-trade':
        const validationResult = await validateTrade(data);
        return NextResponse.json(validationResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Risk management action error:', error);
    return NextResponse.json(
      { error: 'Failed to process risk management action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    // Toggle risk limit active status
    const result = await toggleRiskLimit(id, isActive);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update risk limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update risk limit' },
      { status: 500 }
    );
  }
}

async function getRiskLimits(): Promise<RiskLimit[]> {
  // Mock risk limits
  return [
    {
      id: 'RL001',
      name: 'Maximum Position Size',
      type: 'position_size',
      value: 50000,
      currentValue: 25000,
      percentage: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
      alertThreshold: 80
    },
    {
      id: 'RL002',
      name: 'Daily Loss Limit',
      type: 'daily_loss',
      value: 10000,
      currentValue: 2500,
      percentage: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      alertThreshold: 70
    },
    {
      id: 'RL003',
      name: 'Max Drawdown',
      type: 'max_drawdown',
      value: 20,
      currentValue: 8.5,
      percentage: 42.5,
      isActive: true,
      createdAt: new Date().toISOString(),
      alertThreshold: 80
    }
  ];
}

async function getStopLossRules(): Promise<StopLossRule[]> {
  return [
    {
      id: 'SL001',
      symbol: 'RELIANCE',
      stopLossPercentage: 5,
      trailingStopLoss: true,
      trailingDistance: 2,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'SL002',
      symbol: 'TCS',
      stopLossPercentage: 3,
      trailingStopLoss: false,
      trailingDistance: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

async function getPositionSizingRules(): Promise<PositionSizingRule[]> {
  return [
    {
      id: 'PS001',
      name: 'Conservative Position Sizing',
      maxPositionSize: 10000,
      riskPerTrade: 2,
      maxDailyLoss: 5000,
      isActive: true
    },
    {
      id: 'PS002',
      name: 'Aggressive Position Sizing',
      maxPositionSize: 25000,
      riskPerTrade: 5,
      maxDailyLoss: 10000,
      isActive: false
    }
  ];
}

async function calculateOverallRiskScore(): Promise<any> {
  const riskMetrics = await brokerIntegrationService.getRiskMetrics();
  
  // Calculate composite risk score (0-100, lower is better)
  let riskScore = 0;
  
  // Risk factors
  riskScore += Math.min(riskMetrics.riskScore, 40); // Max 40 points
  riskScore += Math.min((riskMetrics.maxDrawdown / 100) * 30, 30); // Max 30 points
  riskScore += Math.min((riskMetrics.var95 / 100000) * 20, 20); // Max 20 points
  riskScore += Math.min(Math.abs(riskMetrics.beta - 1) * 10, 10); // Max 10 points
  
  return {
    overallScore: Math.round(riskScore),
    riskLevel: riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High',
    factors: {
      portfolioRisk: Math.min(riskMetrics.riskScore, 40),
      drawdown: Math.min((riskMetrics.maxDrawdown / 100) * 30, 30),
      var: Math.min((riskMetrics.var95 / 100000) * 20, 20),
      beta: Math.min(Math.abs(riskMetrics.beta - 1) * 10, 10)
    },
    recommendations: generateRiskRecommendations(riskScore, riskMetrics)
  };
}

function generateRiskRecommendations(riskScore: number, metrics: RiskMetrics): string[] {
  const recommendations = [];
  
  if (riskScore > 70) {
    recommendations.push('Consider reducing position sizes');
    recommendations.push('Implement stricter stop-loss rules');
    recommendations.push('Diversify across more sectors');
  }
  
  if (metrics.maxDrawdown > 15) {
    recommendations.push('Review and adjust stop-loss levels');
    recommendations.push('Consider reducing concentration in single stocks');
  }
  
  if (metrics.var95 > 50000) {
    recommendations.push('Your portfolio has high volatility - consider hedging');
  }
  
  return recommendations;
}

async function createRiskLimit(limitData: any): Promise<any> {
  // In production, save to database
  const newLimit: RiskLimit = {
    id: `RL${Date.now()}`,
    name: limitData.name,
    type: limitData.type,
    value: limitData.value,
    currentValue: 0,
    percentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    alertThreshold: limitData.alertThreshold
  };
  
  return {
    success: true,
    limit: newLimit
  };
}

async function createStopLossRule(ruleData: any): Promise<any> {
  const newRule: StopLossRule = {
    id: `SL${Date.now()}`,
    symbol: ruleData.symbol,
    stopLossPercentage: ruleData.stopLossPercentage,
    trailingStopLoss: ruleData.trailingStopLoss,
    trailingDistance: ruleData.trailingDistance,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  return {
    success: true,
    rule: newRule
  };
}

async function createPositionSizingRule(ruleData: any): Promise<any> {
  const newRule: PositionSizingRule = {
    id: `PS${Date.now()}`,
    name: ruleData.name,
    maxPositionSize: ruleData.maxPositionSize,
    riskPerTrade: ruleData.riskPerTrade,
    maxDailyLoss: ruleData.maxDailyLoss,
    isActive: true
  };
  
  return {
    success: true,
    rule: newRule
  };
}

async function updateRiskLimit(data: any): Promise<any> {
  // In production, update database record
  return {
    success: true,
    message: 'Risk limit updated successfully'
  };
}

async function deleteRiskLimit(id: string): Promise<any> {
  // In production, delete from database
  return {
    success: true,
    message: 'Risk limit deleted successfully'
  };
}

async function toggleRiskLimit(id: string, isActive: boolean): Promise<any> {
  // In production, update database record
  return {
    success: true,
    message: `Risk limit ${isActive ? 'activated' : 'deactivated'}`
  };
}

async function executeStopLossRule(symbol: string): Promise<any> {
  try {
    // Get current price and stop loss rule
    const stopLossRule = await getStopLossRuleBySymbol(symbol);
    
    if (!stopLossRule || !stopLossRule.isActive) {
      return {
        success: false,
        message: 'No active stop loss rule found'
      };
    }
    
    // Execute stop loss order
    const result = await brokerIntegrationService.placeOrder({
      symbol,
      quantity: 100, // This should come from actual position
      orderType: 'MARKET',
      transactionType: 'SELL',
      product: 'CNC'
    });
    
    return {
      success: result.status !== 'FAILED',
      message: result.message,
      order: result
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to execute stop loss'
    };
  }
}

async function calculatePositionSize(tradeData: any): Promise<any> {
  const { accountBalance, riskPercentage, stopLossPercentage } = tradeData;
  
  const riskAmount = (accountBalance * riskPercentage) / 100;
  const positionSize = riskAmount / (stopLossPercentage / 100);
  
  return {
    success: true,
    recommendedPositionSize: Math.round(positionSize),
    riskAmount,
    riskPercentage
  };
}

async function validateTrade(tradeData: any): Promise<any> {
  const { symbol, quantity, price } = tradeData;
  
  // Check risk limits
  const riskLimits = await getRiskLimits();
  const validationResults = [];
  
  // Check position size limit
  const positionSizeLimit = riskLimits.find(limit => limit.type === 'position_size');
  const positionValue = quantity * price;
  
  if (positionSizeLimit && positionValue > positionSizeLimit.value) {
    validationResults.push({
      type: 'error',
      message: `Position size exceeds limit of ₹${positionSizeLimit.value}`
    });
  }
  
  // Check daily loss limit
  const dailyLossLimit = riskLimits.find(limit => limit.type === 'daily_loss');
  if (dailyLossLimit && dailyLossLimit.currentValue > dailyLossLimit.value * 0.8) {
    validationResults.push({
      type: 'warning',
      message: 'Approaching daily loss limit'
    });
  }
  
  // Check concentration risk
  const holdings = await brokerIntegrationService.getHoldings();
  const currentExposure = holdings.reduce((total, holding) => 
    total + (holding.quantity * holding.currentPrice), 0
  );
  const totalPortfolio = currentExposure + positionValue;
  const concentration = (positionValue / totalPortfolio) * 100;
  
  if (concentration > 20) {
    validationResults.push({
      type: 'warning',
      message: `High concentration risk: ${concentration.toFixed(1)}% in single position`
    });
  }
  
  return {
    success: validationResults.filter(r => r.type === 'error').length === 0,
    validationResults
  };
}

async function getStopLossRuleBySymbol(symbol: string): Promise<StopLossRule | null> {
  const rules = await getStopLossRules();
  return rules.find(rule => rule.symbol === symbol) || null;
}