import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock market indices data
    const indices = [
      {
        symbol: 'NIFTY',
        name: 'NIFTY 50',
        value: 21500.75,
        change: 125.30,
        changePercent: 0.58,
        high: 21580.20,
        low: 21420.15,
        volume: 125000000,
        turnover: 125000000000
      },
      {
        symbol: 'SENSEX',
        name: 'BSE SENSEX',
        value: 71200.45,
        change: 245.80,
        changePercent: 0.35,
        high: 71350.20,
        low: 70980.15,
        volume: 85000000,
        turnover: 85000000000
      },
      {
        symbol: 'NIFTY_BANK',
        name: 'NIFTY BANK',
        value: 48500.30,
        change: -180.45,
        changePercent: -0.37,
        high: 48750.80,
        low: 48220.15,
        volume: 45000000,
        turnover: 45000000000
      },
      {
        symbol: 'NIFTY_IT',
        name: 'NIFTY IT',
        value: 35200.85,
        change: 125.60,
        changePercent: 0.36,
        high: 35280.20,
        low: 35120.15,
        volume: 35000000,
        turnover: 35000000000
      },
      {
        symbol: 'NIFTY_FMCG',
        name: 'NIFTY FMCG',
        value: 52800.45,
        change: 95.30,
        changePercent: 0.18,
        high: 52920.80,
        low: 52680.15,
        volume: 25000000,
        turnover: 25000000000
      }
    ];

    return NextResponse.json({
      success: true,
      data: indices,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market indices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}