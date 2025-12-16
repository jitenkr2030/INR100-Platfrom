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

    // Fetch user's portfolio data
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: {
            asset: true
          }
        }
      }
    });

    // Fetch transaction history for performance calculation
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate analytics
    const analytics = calculatePortfolioAnalytics(portfolio, transactions);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Portfolio analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function calculatePortfolioAnalytics(portfolio: any[], transactions: any[]) {
  // This is a simplified calculation - in production, you'd want more sophisticated calculations
  
  let totalValue = 0;
  let totalInvested = 0;
  let dayChange = 0;
  let weekChange = 0;
  let monthChange = 0;
  let yearChange = 0;

  // Calculate current portfolio value and changes
  for (const portfolioItem of portfolio) {
    for (const holding of portfolioItem.holdings) {
      const currentValue = holding.quantity * (holding.asset.currentPrice || 0);
      const investedValue = holding.quantity * holding.avgBuyPrice;
      
      totalValue += currentValue;
      totalInvested += investedValue;
      
      // Mock calculation for daily/weekly/monthly changes
      // In reality, you'd compare with historical prices
      const dayChangeAmount = currentValue * (Math.random() - 0.5) * 0.02; // ±1%
      const weekChangeAmount = currentValue * (Math.random() - 0.5) * 0.05; // ±2.5%
      const monthChangeAmount = currentValue * (Math.random() - 0.5) * 0.10; // ±5%
      const yearChangeAmount = currentValue * (Math.random() - 0.5) * 0.20; // ±10%
      
      dayChange += dayChangeAmount;
      weekChange += weekChangeAmount;
      monthChange += monthChangeAmount;
      yearChange += yearChangeAmount;
    }
  }

  const totalReturn = totalValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;
  const weekChangePercent = totalValue > 0 ? (weekChange / totalValue) * 100 : 0;
  const monthChangePercent = totalValue > 0 ? (monthChange / totalValue) * 100 : 0;
  const yearChangePercent = totalValue > 0 ? (yearChange / totalValue) * 100 : 0;

  // Mock calculations for advanced metrics
  const annualizedReturn = yearChangePercent;
  const volatility = 15 + Math.random() * 10; // 15-25%
  const sharpeRatio = (annualizedReturn - 6) / volatility; // Assuming 6% risk-free rate
  const maxDrawdown = 5 + Math.random() * 15; // 5-20%
  const beta = 0.8 + Math.random() * 0.6; // 0.8-1.4
  const alpha = (annualizedReturn - 6) - beta * (10 - 6); // Market return assumed 10%

  return {
    totalValue,
    dayChange,
    dayChangePercent,
    weekChange,
    weekChangePercent,
    monthChange,
    monthChangePercent,
    yearChange,
    yearChangePercent,
    totalReturn,
    totalReturnPercent,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    beta,
    alpha
  };
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}