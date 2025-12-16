'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's holdings for risk analysis
    const holdings = await prisma.holding.findMany({
      where: {
        portfolio: { userId }
      },
      include: {
        asset: true,
        portfolio: true
      }
    });

    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(holdings);

    return NextResponse.json(riskMetrics);
  } catch (error) {
    console.error('Risk metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch risk metrics' }, { status: 500 });
  }
}

function calculateRiskMetrics(holdings: any[]) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  
  // Calculate concentration risk
  const allocations = holdings.map(holding => ({
    symbol: holding.asset.symbol,
    allocation: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
  }));

  // Find top holdings
  const topHoldings = allocations
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, 5);

  const concentrationRisk = topHoldings.reduce((sum, holding) => sum + holding.allocation, 0);

  // Calculate diversification score (0-100)
  const diversificationScore = Math.max(0, 100 - concentrationRisk);

  // Mock sector and geographic exposure
  const sectorExposure = {
    'Technology': 25 + Math.random() * 20,
    'Banking': 15 + Math.random() * 15,
    'Healthcare': 10 + Math.random() * 10,
    'Energy': 8 + Math.random() * 12,
    'Consumer Goods': 12 + Math.random() * 10,
    'Others': 100 - (25 + 15 + 10 + 8 + 12) // Remaining percentage
  };

  const geographicExposure = {
    'India': 70 + Math.random() * 20,
    'USA': 5 + Math.random() * 15,
    'Europe': 3 + Math.random() * 10,
    'Asia Pacific': 5 + Math.random() * 10,
    'Others': 100 - (70 + 5 + 3 + 5) // Remaining percentage
  };

  // Calculate overall portfolio risk
  const portfolioRisk = calculatePortfolioRisk(holdings, totalValue);

  // Determine risk level
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  if (portfolioRisk < 10) {
    riskLevel = 'LOW';
  } else if (portfolioRisk < 20) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'HIGH';
  }

  // Generate recommendations
  const recommendations = generateRiskRecommendations(concentrationRisk, diversificationScore, riskLevel, sectorExposure);

  return {
    portfolioRisk,
    diversificationScore,
    concentrationRisk,
    sectorExposure,
    geographicExposure,
    riskLevel,
    recommendations,
    topHoldings
  };
}

function calculatePortfolioRisk(holdings: any[], totalValue: number): number {
  // Simplified risk calculation based on allocation and volatility
  let weightedRisk = 0;
  
  holdings.forEach(holding => {
    const allocation = totalValue > 0 ? holding.totalValue / totalValue : 0;
    const assetVolatility = 15 + Math.random() * 20; // Mock volatility 15-35%
    weightedRisk += allocation * assetVolatility;
  });

  return Math.round(weightedRisk * 100) / 100;
}

function generateRiskRecommendations(
  concentrationRisk: number,
  diversificationScore: number,
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH',
  sectorExposure: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  // Concentration risk recommendations
  if (concentrationRisk > 50) {
    recommendations.push("Consider reducing concentration in top holdings to improve diversification");
  }

  // Diversification score recommendations
  if (diversificationScore < 60) {
    recommendations.push("Portfolio lacks diversification. Consider adding more asset classes");
  }

  // Sector exposure recommendations
  Object.entries(sectorExposure).forEach(([sector, exposure]) => {
    if (exposure > 30) {
      recommendations.push(`High exposure to ${sector} sector. Consider reducing allocation`);
    }
  });

  // Risk level recommendations
  if (riskLevel === 'HIGH') {
    recommendations.push("Portfolio risk is high. Consider rebalancing with lower-risk assets");
    recommendations.push("Implement stop-loss strategies to manage downside risk");
  } else if (riskLevel === 'MODERATE') {
    recommendations.push("Portfolio risk is moderate. Monitor market conditions regularly");
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push("Portfolio is well-balanced. Continue monitoring performance");
    recommendations.push("Consider periodic rebalancing to maintain target allocations");
  }

  return recommendations;
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}