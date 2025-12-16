'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  PieChart, 
  Repeat, 
  RefreshCw, 
  Shield, 
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
  Activity,
  Settings,
  Download,
  Upload,
  TrendingDownIcon,
  AlertTriangle,
  Info,
  Eye,
  Filter,
  MoreHorizontal,
  Volume2,
  ArrowUpDown,
  Crosshair,
  Target2,
  TrendingDown as TrendDown
} from 'lucide-react';
import { brokerIntegrationService } from '@/lib/broker-integration';

interface AccountInfo {
  brokerName: string;
  accountNumber: string;
  tradingAccess: boolean;
  marginAvailable: number;
  lastUpdated: string;
}

interface Balance {
  availableCash: number;
  totalBalance: number;
  marginUsed: number;
  unrealizedPnL: number;
}

interface Stock {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  timestamp?: number;
}

interface Holding {
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  ltp: number;
  pnl: number;
  pnlPercentage: number;
  isin: string;
  exchange: string;
  dayChange: number;
  dayChangePercent: number;
}

interface RiskMetrics {
  totalExposure: number;
  dailyPnL: number;
  totalPnL: number;
  riskScore: number;
  maxDrawdown: number;
  sharpeRatio: number;
  beta: number;
  var95: number;
}

interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  quantity: number;
  price: number;
  transactionType: 'BUY' | 'SELL';
  timestamp: string;
  status: string;
  pnl?: number;
}

interface OrderBook {
  bids: { price: number; quantity: number }[];
  asks: { price: number; quantity: number }[];
}

interface PortfolioAlert {
  id: string;
  type: string;
  symbol?: string;
  condition: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  message: string;
}

const RealTradingPage = () => {
  const [activeTab, setActiveTab] = useState('fractional');
  const [tradingMode, setTradingMode] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  
  // Trading form state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  
  // Advanced order types
  const [orderVariant, setOrderVariant] = useState<'regular' | 'bracket' | 'gtt' | 'oco'>('regular');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  
  // Real-time data
  const [marketData, setMarketData] = useState<{ [symbol: string]: Stock }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  // UI state
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showRiskPanel, setShowRiskPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<'simple' | 'advanced'>('simple');

  useEffect(() => {
    loadTradingData();
    if (realTimeEnabled) {
      initializeRealTimeData();
    }
  }, [realTimeEnabled]);

  const loadTradingData = async () => {
    try {
      setIsLoading(true);
      
      const [accountResult, balanceResult, watchlistResult, holdingsResult, riskResult, tradesResult, alertsResult] = await Promise.all([
        brokerIntegrationService.getAccountInfo(),
        brokerIntegrationService.getAccountBalance(),
        brokerIntegrationService.getWatchlist(),
        brokerIntegrationService.getHoldings(),
        fetchRiskMetrics(),
        fetchTradingHistory(),
        fetchPortfolioAlerts()
      ]);

      if (accountResult.success && accountResult.account) {
        setAccountInfo(accountResult.account);
      }
      
      if (balanceResult.success && balanceResult.balance) {
        setBalance(balanceResult.balance);
      }
      
      if (watchlistResult.success && watchlistResult.watchlist) {
        setWatchlist(watchlistResult.watchlist);
      }
      
      if (holdingsResult.success && holdingsResult.holdings) {
        setHoldings(holdingsResult.holdings);
      }
      
      if (riskResult) {
        setRiskMetrics(riskResult);
      }
      
      if (tradesResult) {
        setTrades(tradesResult);
      }
      
      if (alertsResult) {
        setAlerts(alertsResult);
      }
    } catch (error) {
      console.error('Error loading trading data:', error);
      alert('Failed to load trading data. Please check your broker connection.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const initializeRealTimeData = async () => {
    setConnectionStatus('connecting');
    
    try {
      // Subscribe to real-time market data
      const symbols = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];
      
      for (const symbol of symbols) {
        brokerIntegrationService.subscribeToSymbol(symbol, (data) => {
          setMarketData(prev => ({
            ...prev,
            [symbol]: data
          }));
        });
      }
      
      setConnectionStatus('connected');
      
      // Start polling for real-time updates
      const pollInterval = setInterval(() => {
        if (realTimeEnabled) {
          pollRealTimeData();
        } else {
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds
      
    } catch (error) {
      console.error('Error initializing real-time data:', error);
      setConnectionStatus('disconnected');
    }
  };

  const pollRealTimeData = async () => {
    try {
      // Update watchlist with real-time prices
      const response = await fetch('/api/broker/market-data/realtime?symbols=' + watchlist.map(s => s.symbol).join(','));
      const data = await response.json();
      
      if (data.success && data.data) {
        setMarketData(prev => ({
          ...prev,
          [data.data.symbol]: data.data
        }));
      }
    } catch (error) {
      console.error('Error polling real-time data:', error);
    }
  };

  const fetchRiskMetrics = async (): Promise<RiskMetrics | null> => {
    try {
      const response = await fetch('/api/broker/risk-management?type=metrics');
      const data = await response.json();
      return data.success ? data.metrics : null;
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      return null;
    }
  };

  const fetchTradingHistory = async (): Promise<Trade[] | null> => {
    try {
      const response = await fetch('/api/broker/trading-history?type=trades');
      const data = await response.json();
      return data.success ? data.trades : null;
    } catch (error) {
      console.error('Error fetching trading history:', error);
      return null;
    }
  };

  const fetchPortfolioAlerts = async (): Promise<PortfolioAlert[] | null> => {
    try {
      const response = await fetch('/api/broker/portfolio-sync?action=alerts');
      const data = await response.json();
      return data.success ? data.alerts : null;
    } catch (error) {
      console.error('Error fetching portfolio alerts:', error);
      return null;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTradingData();
  };

  const handleStockSelect = async (stock: Stock) => {
    setSelectedStock(stock);
    setPrice(stock.currentPrice.toString());
    
    // Load order book for selected stock
    await loadOrderBook(stock.symbol);
    
    // Update price with real-time data if available
    const realTimeData = marketData[stock.symbol];
    if (realTimeData) {
      setPrice(realTimeData.currentPrice.toString());
    }
  };

  const loadOrderBook = async (symbol: string) => {
    try {
      // Mock order book data
      const mockOrderBook: OrderBook = {
        bids: [
          { price: 2449.50, quantity: 100 },
          { price: 2449.25, quantity: 250 },
          { price: 2449.00, quantity: 175 },
          { price: 2448.75, quantity: 300 },
          { price: 2448.50, quantity: 200 }
        ],
        asks: [
          { price: 2450.00, quantity: 150 },
          { price: 2450.25, quantity: 180 },
          { price: 2450.50, quantity: 220 },
          { price: 2450.75, quantity: 160 },
          { price: 2451.00, quantity: 190 }
        ]
      };
      setOrderBook(mockOrderBook);
    } catch (error) {
      console.error('Error loading order book:', error);
    }
  };

  const calculateFractionalQuantity = () => {
    if (!selectedStock || !investmentAmount) return 0;
    
    const amount = parseFloat(investmentAmount);
    const currentPrice = selectedStock.currentPrice;
    
    return Math.floor((amount / currentPrice) * 100) / 100;
  };

  const handlePlaceOrder = async () => {
    if (!selectedStock || (!investmentAmount && !quantity)) {
      alert('Please select a stock and enter investment details.');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (orderVariant === 'regular') {
        // Regular order
        const orderData = {
          symbol: selectedStock.symbol,
          currentPrice: selectedStock.currentPrice,
          orderType: orderType === 'BUY' ? 'MARKET' : 'MARKET',
          transactionType: orderType,
          ...(activeTab === 'fractional' ? {
            investmentAmount: parseFloat(investmentAmount),
            fractionalQuantity: calculateFractionalQuantity()
          } : {
            quantity: parseFloat(quantity),
            price: parseFloat(price)
          })
        };

        result = activeTab === 'fractional' 
          ? await brokerIntegrationService.placeFractionalOrder(orderData)
          : await brokerIntegrationService.placeOrder(orderData);
          
      } else {
        // Advanced order types
        result = await placeAdvancedOrder();
      }

      if (result.success || result.status !== 'FAILED') {
        alert(`${orderType} order for ${selectedStock.symbol} has been placed successfully.`);
        setInvestmentAmount('');
        setQuantity('');
        setPrice('');
        setStopLoss('');
        setTarget('');
        setTriggerPrice('');
        loadTradingData();
      } else {
        alert(`Order Failed: ${result.error || result.message}`);
      }
    } catch (error) {
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const placeAdvancedOrder = async () => {
    const baseOrderData = {
      symbol: selectedStock.symbol,
      quantity: parseFloat(quantity) || Math.floor(parseFloat(investmentAmount) / parseFloat(price)),
      price: parseFloat(price),
      orderType: 'MARKET' as const,
      transactionType: orderType,
      product: 'CNC' as const
    };

    switch (orderVariant) {
      case 'bracket':
        return await placeBracketOrder(baseOrderData);
      case 'gtt':
        return await placeGTTOrder(baseOrderData);
      case 'oco':
        return await placeOCOOrder(baseOrderData);
      default:
        return await brokerIntegrationService.placeOrder(baseOrderData);
    }
  };

  const placeBracketOrder = async (orderData: any) => {
    const bracketData = {
      ...orderData,
      squareOff: parseFloat(target),
      stopLoss: parseFloat(stopLoss)
    };

    try {
      const response = await fetch('/api/broker/orders/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'bracket',
          orderData: bracketData
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to place bracket order' };
    }
  };

  const placeGTTOrder = async (orderData: any) => {
    const gttData = {
      symbol: orderData.symbol,
      triggerPrice: parseFloat(triggerPrice),
      targetPrice: parseFloat(target),
      stopLossPrice: parseFloat(stopLoss),
      quantity: orderData.quantity,
      transactionType: orderData.transactionType
    };

    try {
      const response = await fetch('/api/broker/orders/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'gtt',
          orderData: gttData
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to place GTT order' };
    }
  };

  const placeOCOOrder = async (orderData: any) => {
    const ocoData = {
      primaryOrder: orderData,
      stopOrder: {
        ...orderData,
        orderType: 'SL' as const,
        price: parseFloat(stopLoss)
      },
      targetOrder: {
        ...orderData,
        orderType: 'LIMIT' as const,
        price: parseFloat(target)
      }
    };

    try {
      const response = await fetch('/api/broker/orders/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'oco',
          orderData: ocoData
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to place OCO order' };
    }
  };

  const renderAccountInfo = () => {
    if (!balance) return null;

    return (
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Account Balance
              {accountInfo && (
                <Badge variant="outline">{accountInfo.brokerName}</Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <div className={`flex items-center gap-1 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'}`} />
                  <span className="text-sm">{connectionStatus}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={realTimeEnabled ? 'bg-green-50' : ''}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {realTimeEnabled ? 'Live' : 'Manual'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Available Cash</p>
                <p className="text-2xl font-bold">₹{balance.availableCash.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold">₹{balance.totalBalance.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${
                  balance.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {balance.unrealizedPnL >= 0 ? '+' : ''}₹{balance.unrealizedPnL.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {riskMetrics && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Risk Metrics
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRiskPanel(!showRiskPanel)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                  <p className={`text-lg font-bold ${
                    riskMetrics.riskScore > 70 ? 'text-red-600' : 
                    riskMetrics.riskScore > 40 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {riskMetrics.riskScore}/100
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">VaR (95%)</p>
                  <p className="text-lg font-bold">₹{riskMetrics.var95.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Max Drawdown</p>
                  <p className="text-lg font-bold text-red-600">{riskMetrics.maxDrawdown.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Sharpe Ratio</p>
                  <p className="text-lg font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTradingTabs = () => (
    <div className="mb-6">
      {/* Main Trading Mode Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'fractional' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('fractional')}
          className="flex items-center gap-2"
        >
          <PieChart className="h-4 w-4" />
          Fractional
        </Button>
        <Button
          variant={activeTab === 'direct' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('direct')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Direct
        </Button>
        <Button
          variant={activeTab === 'sip' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('sip')}
          className="flex items-center gap-2"
        >
          <Repeat className="h-4 w-4" />
          SIP
        </Button>
      </div>
      
      {/* Advanced Order Types */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={orderVariant === 'regular' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrderVariant('regular')}
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          Regular
        </Button>
        <Button
          variant={orderVariant === 'bracket' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrderVariant('bracket')}
          className="flex items-center gap-2"
        >
          <Crosshair className="h-4 w-4" />
          Bracket
        </Button>
        <Button
          variant={orderVariant === 'gtt' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrderVariant('gtt')}
          className="flex items-center gap-2"
        >
          <Target2 className="h-4 w-4" />
          GTT
        </Button>
        <Button
          variant={orderVariant === 'oco' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrderVariant('oco')}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          OCO
        </Button>
      </div>
      
      {/* Alerts and Notifications */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.filter(alert => alert.isActive).map(alert => (
            <Alert key={alert.id} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );

  const renderStockSelector = () => (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Market Watch</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOrderBook(!showOrderBook)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Order Book
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((stock, index) => {
              const realTimeData = marketData[stock.symbol];
              const currentPrice = realTimeData?.currentPrice || stock.currentPrice;
              const change = realTimeData?.change || stock.change;
              const changePercent = realTimeData?.changePercent || stock.changePercent;
              
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedStock?.symbol === stock.symbol ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleStockSelect(stock)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{stock.symbol}</h4>
                        <p className="text-sm text-gray-600 truncate">{stock.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stock.exchange || 'NSE'}
                        </Badge>
                        {realTimeData && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">₹{currentPrice.toFixed(2)}</p>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm flex items-center gap-1 ${
                          change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                        </p>
                        {realTimeData?.volume && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            {(realTimeData.volume / 1000).toFixed(0)}K
                          </p>
                        )}
                      </div>
                      {realTimeData?.bid && realTimeData?.ask && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Bid: ₹{realTimeData.bid.toFixed(2)}</span>
                          <span>Ask: ₹{realTimeData.ask.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Order Book Modal/Panel */}
      {showOrderBook && selectedStock && orderBook && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Order Book - {selectedStock.symbol}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowOrderBook(false)}
                className="ml-auto"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Bids */}
              <div>
                <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Bids (Buy Orders)
                </h4>
                <div className="space-y-1">
                  {orderBook.bids.map((bid, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-600">₹{bid.price.toFixed(2)}</span>
                      <span>{bid.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Asks */}
              <div>
                <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Asks (Sell Orders)
                </h4>
                <div className="space-y-1">
                  {orderBook.asks.map((ask, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-red-600">₹{ask.price.toFixed(2)}</span>
                      <span>{ask.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFractionalTrading = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-600" />
          Fractional Investing
          {orderVariant !== 'regular' && (
            <Badge variant="secondary">{orderVariant.toUpperCase()}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Invest any amount starting from ₹100 in fractional shares
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Investment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (min ₹100)"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
              />
            </div>

            {/* Advanced Order Parameters */}
            {orderVariant !== 'regular' && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold">Advanced Order Parameters</h4>
                
                {orderVariant === 'bracket' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Target Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Stop Loss (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Stop Loss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                {orderVariant === 'gtt' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Trigger Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Trigger"
                        value={triggerPrice}
                        onChange={(e) => setTriggerPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Target (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Stop Loss (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Stop Loss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedStock && investmentAmount && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Order Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className="font-medium">{selectedStock.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₹{investmentAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{calculateFractionalQuantity()} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Cost:</span>
                    <span className="font-medium">₹{(calculateFractionalQuantity() * (marketData[selectedStock.symbol]?.currentPrice || selectedStock.currentPrice)).toFixed(2)}</span>
                  </div>
                  
                  {orderVariant !== 'regular' && (
                    <>
                      <Separator />
                      <div className="text-xs text-gray-600">
                        <p><strong>Order Type:</strong> {orderVariant.toUpperCase()}</p>
                        {target && <p><strong>Target:</strong> ₹{target}</p>}
                        {stopLoss && <p><strong>Stop Loss:</strong> ₹{stopLoss}</p>}
                        {triggerPrice && <p><strong>Trigger:</strong> ₹{triggerPrice}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['500', '1000', '2000', '5000'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setInvestmentAmount(amount)}
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Risk Information */}
            {riskMetrics && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Risk Assessment
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Portfolio Risk Score:</span>
                    <span className={`font-medium ${
                      riskMetrics.riskScore > 70 ? 'text-red-600' : 
                      riskMetrics.riskScore > 40 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {riskMetrics.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily VaR (95%):</span>
                    <span className="font-medium">₹{riskMetrics.var95.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-medium text-red-600">{riskMetrics.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDirectTrading = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Direct Trading
          {orderVariant !== 'regular' && (
            <Badge variant="secondary">{orderVariant.toUpperCase()}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Trade full shares with market or limit orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Advanced Order Parameters */}
            {orderVariant !== 'regular' && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold">Advanced Order Parameters</h4>
                
                {orderVariant === 'bracket' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Target Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Stop Loss (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Stop Loss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                {orderVariant === 'gtt' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Trigger Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Trigger"
                        value={triggerPrice}
                        onChange={(e) => setTriggerPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Target (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Stop Loss (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Stop Loss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Order Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={orderType === 'BUY' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('BUY')}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  BUY
                </Button>
                <Button
                  variant={orderType === 'SELL' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('SELL')}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  SELL
                </Button>
              </div>
            </div>

            {selectedStock && quantity && price && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Order Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className="font-medium">{selectedStock.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">₹{price}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>₹{(parseFloat(quantity) * parseFloat(price)).toFixed(2)}</span>
                  </div>
                  
                  {orderVariant !== 'regular' && (
                    <>
                      <Separator />
                      <div className="text-xs text-gray-600">
                        <p><strong>Order Type:</strong> {orderVariant.toUpperCase()}</p>
                        {target && <p><strong>Target:</strong> ₹{target}</p>}
                        {stopLoss && <p><strong>Stop Loss:</strong> ₹{stopLoss}</p>}
                        {triggerPrice && <p><strong>Trigger:</strong> ₹{triggerPrice}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Market Depth and Recent Trades */}
          <div className="space-y-4">
            {selectedStock && orderBook && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Market Depth
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-600 font-medium mb-2">Top 3 Bids</p>
                    {orderBook.bids.slice(0, 3).map((bid, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-green-600">₹{bid.price.toFixed(2)}</span>
                        <span>{bid.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-red-600 font-medium mb-2">Top 3 Asks</p>
                    {orderBook.asks.slice(0, 3).map((ask, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-red-600">₹{ask.price.toFixed(2)}</span>
                        <span>{ask.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Trade Buttons */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Market Buy
                </Button>
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Limit Buy
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Minus className="h-4 w-4 mr-2" />
                  Market Sell
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Stop Loss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSIPTrading = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-purple-600" />
          Systematic Investment Plan (SIP)
        </CardTitle>
        <CardDescription>
          Automate your investments with regular SIPs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">SIP Feature Coming Soon</h3>
          <p className="text-gray-600">
            Systematic Investment Plans will be available in the next update.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderHoldings = () => {
    if (!holdings.length) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Holdings
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdings.map((holding, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{holding.symbol}</h4>
                    <p className="text-sm text-gray-600">{holding.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toFixed(2)} ({holding.pnlPercentage.toFixed(2)}%)
                    </p>
                    <p className="text-xs text-gray-500">
                      Day: {holding.dayChange >= 0 ? '+' : ''}{holding.dayChange.toFixed(2)} ({holding.dayChangePercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-medium">{holding.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Price</p>
                    <p className="font-medium">₹{holding.avgPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Price</p>
                    <p className="font-medium">₹{holding.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Market Value</p>
                    <p className="font-medium">₹{(holding.quantity * holding.currentPrice).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Buy More
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Minus className="h-3 w-3 mr-1" />
                    Sell
                  </Button>
                  <Button size="sm" variant="outline">
                    <Target className="h-3 w-3 mr-1" />
                    Set Alert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTradingHistory = () => {
    if (!trades.length) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trades.slice(0, 5).map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    trade.transactionType === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{trade.symbol}</p>
                    <p className="text-sm text-gray-600">
                      {trade.quantity} @ ₹{trade.price} • {new Date(trade.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    trade.transactionType === 'BUY' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {trade.transactionType === 'BUY' ? '-' : '+'}₹{Math.abs(trade.quantity * trade.price).toLocaleString()}
                  </p>
                  <Badge variant={
                    trade.status === 'COMPLETED' ? 'default' :
                    trade.status === 'PENDING' ? 'secondary' : 'destructive'
                  } className="text-xs">
                    {trade.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Trades
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Return</p>
              <p className="text-xl font-bold text-blue-600">+15.2%</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-green-600">68.5%</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sharpe Ratio</p>
              <p className="text-xl font-bold text-purple-600">1.24</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Max Drawdown</p>
              <p className="text-xl font-bold text-orange-600">-8.3%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPlaceOrderButton = () => {
    const isValid = selectedStock && 
      ((activeTab === 'fractional' && investmentAmount) || 
       (activeTab === 'direct' && quantity && price));

    return (
      <Card className="sticky bottom-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {selectedStock ? `${selectedStock.symbol} - ${orderType}` : 'Select a stock'}
              </p>
              {selectedStock && (
                <p className="text-sm text-gray-600">
                  {activeTab === 'fractional' 
                    ? `Amount: ₹${investmentAmount}` 
                    : `Qty: ${quantity} @ ₹${price}`
                  }
                </p>
              )}
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={!isValid || isLoading}
              size="lg"
              className="min-w-[140px]"
            >
              {isLoading ? 'Placing...' : `Place ${orderType} Order`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!accountInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Broker Setup Required</h3>
            <p className="text-gray-600 mb-4">
              You need to connect your broker account before you can start real trading.
            </p>
            <Button asChild>
              <a href="/broker-setup">Setup Broker</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Real Trading</h1>
        <p className="text-gray-600">
          Invest with real money through your {accountInfo.brokerName} account
        </p>
        
        {/* Real-time status indicator */}
        <div className="flex items-center gap-4 mt-4">
          <div className={`flex items-center gap-2 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
            <span className="text-sm font-medium">
              {connectionStatus === 'connected' ? 'Live Data Connected' : 'Data Disconnected'}
            </span>
          </div>
          
          {riskMetrics && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">
                Risk Score: <span className={`font-medium ${
                  riskMetrics.riskScore > 70 ? 'text-red-600' : 
                  riskMetrics.riskScore > 40 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {riskMetrics.riskScore}/100
                </span>
              </span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedView(selectedView === 'simple' ? 'advanced' : 'simple')}
          >
            {selectedView === 'simple' ? 'Advanced View' : 'Simple View'}
          </Button>
        </div>
      </div>

      {renderAccountInfo()}
      {renderTradingTabs()}
      {renderStockSelector()}
      
      {activeTab === 'fractional' && renderFractionalTrading()}
      {activeTab === 'direct' && renderDirectTrading()}
      {activeTab === 'sip' && renderSIPTrading()}
      
      {selectedView === 'advanced' && (
        <>
          {renderPerformanceMetrics()}
          {renderTradingHistory()}
        </>
      )}
      
      {renderHoldings()}
      {renderPlaceOrderButton()}
      
      {/* Risk Management Panel */}
      {showRiskPanel && riskMetrics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Risk Management Dashboard</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRiskPanel(false)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Portfolio Risk Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Exposure:</span>
                    <span>₹{riskMetrics.totalExposure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily P&L:</span>
                    <span className={riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {riskMetrics.dailyPnL >= 0 ? '+' : ''}₹{riskMetrics.dailyPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span>{riskMetrics.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VaR (95%):</span>
                    <span>₹{riskMetrics.var95.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Risk Alerts</h4>
                <div className="space-y-2">
                  {alerts.filter(alert => alert.isActive).slice(0, 3).map(alert => (
                    <Alert key={alert.id} className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Set Stop Loss
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Risk Limits
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Portfolio Analysis
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTradingPage;