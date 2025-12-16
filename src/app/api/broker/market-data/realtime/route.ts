import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService, MarketData } from '@/lib/broker-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1m';
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Mock real-time market data (in production, this would come from WebSocket or real-time API)
    const mockMarketData: MarketData = {
      symbol,
      lastPrice: Math.random() * 5000 + 100,
      change: (Math.random() - 0.5) * 100,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      high: Math.random() * 5000 + 100,
      low: Math.random() * 5000 + 100,
      open: Math.random() * 5000 + 100,
      previousClose: Math.random() * 5000 + 100,
      bid: Math.random() * 5000 + 100,
      ask: Math.random() * 5000 + 100,
      timestamp: Date.now()
    };

    // Subscribe to real-time updates
    brokerIntegrationService.subscribeToSymbol(symbol, (data: MarketData) => {
      // This would be handled by WebSocket in production
    });

    return NextResponse.json({
      success: true,
      data: mockMarketData,
      interval,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Real-time market data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, action } = body;

    if (action === 'subscribe' && symbols) {
      // Subscribe to multiple symbols
      const subscriptions = symbols.map((symbol: string) => {
        brokerIntegrationService.subscribeToSymbol(symbol, (data: MarketData) => {
          // Handle real-time updates
        });
        return { symbol, status: 'subscribed' };
      });

      return NextResponse.json({
        success: true,
        subscriptions
      });
    }

    if (action === 'unsubscribe' && symbols) {
      // Unsubscribe from multiple symbols
      const unsubscriptions = symbols.map((symbol: string) => {
        brokerIntegrationService.unsubscribeFromSymbol(symbol, () => {});
        return { symbol, status: 'unsubscribed' };
      });

      return NextResponse.json({
        success: true,
        unsubscriptions
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Market data subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}