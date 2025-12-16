import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const symbols = searchParams.get("symbols")?.split(",") || [];

    switch (type) {
      case "quote":
        return await getRealTimeQuote(searchParams);
      
      case "quotes":
        return await getMultipleQuotes(symbols);
      
      case "overview":
        return await getRealtimeOverview();
      
      case "indices":
        return await getIndicesRealtime();
      
      case "watchlist":
        return await getWatchlistRealtime(symbols);
      
      case "portfolio":
        return await getPortfolioRealtime(symbols);
      
      default:
        return await getRealtimeOverview();
    }

  } catch (error) {
    console.error('Realtime market data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch realtime market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbols, userId } = body;

    switch (action) {
      case "subscribe":
        return await subscribeToStream(symbols, userId);
      
      case "unsubscribe":
        return await unsubscribeFromStream(symbols, userId);
      
      case "update":
        return await forceUpdatePrices(symbols);
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Realtime market data action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute realtime action' },
      { status: 500 }
    );
  }
}

// Get real-time quote for a single symbol
async function getRealTimeQuote(searchParams: URLSearchParams) {
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  const quote = await generateRealTimeQuote(symbol);
  
  return NextResponse.json({
    success: true,
    data: quote,
    timestamp: new Date().toISOString(),
    isLive: isMarketOpen()
  });
}

// Multiple quotes
async function getMultipleQuotes(symbols: string[]) {
  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "At least one symbol required" },
      { status: 400 }
    );
  }

  const quotes = await Promise.all(
    symbols.map(symbol => generateRealTimeQuote(symbol))
  );

  return NextResponse.json({
    success: true,
    data: quotes,
    timestamp: new Date().toISOString(),
    isLive: isMarketOpen()
  });
}

// Realtime overview
async function getRealtimeOverview() {
  const [indices, gainers, losers, active] = await Promise.all([
    getIndicesRealtime(),
    getTopGainersRealtime(),
    getTopLosersRealtime(),
    getMostActiveRealtime()
  ]);

  const marketStatus = getMarketStatus();

  return NextResponse.json({
    success: true,
    data: {
      indices: indices.data,
      topGainers: gainers.data,
      topLosers: losers.data,
      mostActive: active.data,
      marketStatus,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    isLive: marketStatus.isOpen
  });
}

// Indices realtime
async function getIndicesRealtime() {
  const indices = [
    { symbol: 'NIFTY', name: 'NIFTY 50', value: 19850 + Math.random() * 300 },
    { symbol: 'SENSEX', name: 'BSE SENSEX', value: 66500 + Math.random() * 500 },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', value: 44800 + Math.random() * 400 },
    { symbol: 'NIFTYIT', name: 'NIFTY IT', value: 31800 + Math.random() * 200 }
  ];

  const updatedIndices = indices.map(index => ({
    ...index,
    change: Math.round((Math.random() - 0.5) * 200 * 100) / 100,
    changePercent: Math.round((Math.random() - 0.5) * 2 * 100) / 100,
    volume: Math.floor(Math.random() * 100000000) + 50000000,
    dayHigh: Math.round(index.value * 1.005 * 100) / 100,
    dayLow: Math.round(index.value * 0.995 * 100) / 100,
    updatedAt: new Date().toISOString()
  }));

  return NextResponse.json({
    success: true,
    data: updatedIndices
  });
}

// Watchlist realtime
async function getWatchlistRealtime(symbols: string[]) {
  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "Watchlist symbols required" },
      { status: 400 }
    );
  }

  const watchlistData = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await generateRealTimeQuote(symbol);
      return {
        symbol,
        ...quote,
        isInWatchlist: true
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: watchlistData,
    timestamp: new Date().toISOString()
  });
}

// Portfolio realtime
async function getPortfolioRealtime(symbols: string[]) {
  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "Portfolio symbols required" },
      { status: 400 }
    );
  }

  const portfolioData = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await generateRealTimeQuote(symbol);
      return {
        symbol,
        ...quote,
        isInPortfolio: true
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: portfolioData,
    timestamp: new Date().toISOString()
  });
}

// Helper functions
async function generateRealTimeQuote(symbol: string) {
  const basePrice = getBasePriceForSymbol(symbol);
  const volatility = isMarketOpen() ? 0.001 : 0.0001; // Less volatility when market is closed
  const randomChange = (Math.random() - 0.5) * volatility;
  const currentPrice = basePrice * (1 + randomChange);
  
  return {
    symbol,
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round((currentPrice - basePrice) * 100) / 100,
    changePercent: Math.round(((currentPrice - basePrice) / basePrice) * 10000) / 100,
    bid: Math.round((currentPrice - 0.05) * 100) / 100,
    ask: Math.round((currentPrice + 0.05) * 100) / 100,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    dayHigh: Math.round(currentPrice * 1.02 * 100) / 100,
    dayLow: Math.round(currentPrice * 0.98 * 100) / 100,
    lastTradeTime: new Date().toISOString(),
    isMarketOpen: isMarketOpen()
  };
}

function getBasePriceForSymbol(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'RELIANCE': 2480,
    'TCS': 3180,
    'HDFCBANK': 1590,
    'INFY': 1390,
    'ITC': 445,
    'BHARTIARTL': 795,
    'LT': 2780,
    'SBIN': 595,
    'ASIANPAINT': 2785,
    'KOTAKBANK': 1745,
    'AXISBLUECHIP': 45.67,
    'GOLD': 6180
  };

  return basePrices[symbol] || 1000;
}

function isMarketOpen(): boolean {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = istNow.getHours();
  const minute = istNow.getMinutes();
  const day = istNow.getDay();

  // Market is open Monday to Friday, 9:15 AM to 3:30 PM IST
  return day >= 1 && day <= 5 && hour >= 9 && (hour < 15 || (hour === 15 && minute <= 30));
}

function getMarketStatus() {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const isOpen = isMarketOpen();
  
  return {
    isOpen,
    status: isOpen ? "OPEN" : "CLOSED",
    nextOpen: getNextMarketOpen(),
    nextClose: getNextMarketClose(),
    currentTimeIST: istNow.toISOString()
  };
}

function getNextMarketOpen(): string {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = istNow.getDay();
  const hour = istNow.getHours();
  const minute = istNow.getMinutes();

  let nextOpen = new Date(istNow);
  
  if (day === 6) { // Saturday
    nextOpen.setDate(nextOpen.getDate() + 2); // Next Monday
    nextOpen.setHours(9, 15, 0, 0);
  } else if (day === 0) { // Sunday
    nextOpen.setDate(nextOpen.getDate() + 1); // Next Monday
    nextOpen.setHours(9, 15, 0, 0);
  } else if (hour >= 15 || (hour === 15 && minute > 30)) { // After market close
    nextOpen.setDate(nextOpen.getDate() + 1);
    if (day === 5) nextOpen.setDate(nextOpen.getDate() + 2); // Friday -> Monday
    nextOpen.setHours(9, 15, 0, 0);
  } else {
    nextOpen.setHours(9, 15, 0, 0);
  }

  return nextOpen.toISOString();
}

function getNextMarketClose(): string {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = istNow.getDay();
  const hour = istNow.getHours();

  let nextClose = new Date(istNow);
  
  if (day === 6 || day === 0) { // Weekend
    nextClose = new Date(getNextMarketOpen());
    nextClose.setHours(15, 30, 0, 0);
  } else if (hour < 9 || (hour === 9 && istNow.getMinutes() < 15)) {
    nextClose.setHours(15, 30, 0, 0);
  } else {
    nextClose.setDate(nextClose.getDate() + 1);
    if (day === 5) nextClose.setDate(nextClose.getDate() + 2); // Friday -> Monday
    nextClose.setHours(15, 30, 0, 0);
  }

  return nextClose.toISOString();
}

async function getTopGainersRealtime() {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'BHARTIARTL', 'LT', 'SBIN'];
  const gainers = await Promise.all(
    symbols.map(async (symbol) => ({
      ...await generateRealTimeQuote(symbol),
      rank: symbols.indexOf(symbol) + 1
    }))
  );

  const sortedGainers = gainers
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: sortedGainers
  });
}

async function getTopLosersRealtime() {
  const symbols = ['ASIANPAINT', 'KOTAKBANK', 'MARUTI', 'HCLTECH', 'TATAMOTORS', 'WIPRO', 'TECHM', 'DRREDDY'];
  const losers = await Promise.all(
    symbols.map(async (symbol) => ({
      ...await generateRealTimeQuote(symbol),
      rank: symbols.indexOf(symbol) + 1
    }))
  );

  const sortedLosers = losers
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: sortedLosers
  });
}

async function getMostActiveRealtime() {
  const symbols = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'TATAMOTORS', 'BHARTIARTL', 'HDFCBANK', 'ITC'];
  const active = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await generateRealTimeQuote(symbol);
      return {
        ...quote,
        turnover: quote.price * quote.volume,
        rank: symbols.indexOf(symbol) + 1
      };
    })
  );

  const sortedActive = active
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: sortedActive
  });
}

// Subscription management
async function subscribeToStream(symbols: string[], userId: string) {
  // In production, this would set up WebSocket connections
  return NextResponse.json({
    success: true,
    message: `Subscribed to ${symbols.length} symbols`,
    userId,
    symbols
  });
}

async function unsubscribeFromStream(symbols: string[], userId: string) {
  // In production, this would close WebSocket connections
  return NextResponse.json({
    success: true,
    message: `Unsubscribed from ${symbols.length} symbols`,
    userId,
    symbols
  });
}

async function forceUpdatePrices(symbols: string[]) {
  // In production, this would trigger real-time price updates
  return NextResponse.json({
    success: true,
    message: `Updated prices for ${symbols.length} symbols`,
    symbols,
    timestamp: new Date().toISOString()
  });
}