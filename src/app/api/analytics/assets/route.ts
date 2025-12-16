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

    // Fetch user's holdings with asset data
    const holdings = await prisma.holding.findMany({
      where: {
        portfolio: { userId }
      },
      include: {
        asset: true,
        portfolio: true
      },
      orderBy: {
        totalValue: 'desc'
      }
    });

    // Calculate performance for each asset
    const assetPerformance = holdings.map(holding => {
      const currentValue = holding.quantity * (holding.asset.currentPrice || 0);
      const investedValue = holding.quantity * holding.avgBuyPrice;
      const totalReturn = currentValue - investedValue;
      const totalReturnPercent = investedValue > 0 ? (totalReturn / investedValue) * 100 : 0;

      // Mock calculations for demonstration
      const dayChange = currentValue * (Math.random() - 0.5) * 0.02; // ±1%
      const dayChangePercent = currentValue > 0 ? (dayChange / currentValue) * 100 : 0;
      const volatility = 10 + Math.random() * 20; // 10-30%
      const beta = 0.5 + Math.random() * 1.0; // 0.5-1.5

      return {
        symbol: holding.asset.symbol,
        name: holding.asset.name,
        allocation: 0, // Will be calculated below
        value: currentValue,
        dayChange,
        dayChangePercent,
        totalReturn,
        totalReturnPercent,
        volatility,
        beta
      };
    });

    // Calculate allocation percentages
    const totalValue = assetPerformance.reduce((sum, asset) => sum + asset.value, 0);
    assetPerformance.forEach(asset => {
      asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
    });

    return NextResponse.json(assetPerformance);
  } catch (error) {
    console.error('Asset performance error:', error);
    return NextResponse.json({ error: 'Failed to fetch asset performance' }, { status: 500 });
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}