"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Clock, 
  DollarSign, 
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Info,
  Sparkles,
  Award,
  Target,
  Library,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { brokerIntegrationService } from "@/lib/broker-integration";
import Link from "next/link";

export default function InvestPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [tradingMode, setTradingMode] = useState<'paper' | 'real'>('paper');
  const [hasBrokerConnection, setHasBrokerConnection] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    checkBrokerConnection();
  }, []);

  const checkBrokerConnection = async () => {
    try {
      const activeBroker = brokerIntegrationService.getActiveBroker();
      setHasBrokerConnection(!!activeBroker);
    } catch (error) {
      console.error('Error checking broker connection:', error);
      setHasBrokerConnection(false);
    }
  };

  // Load portfolio and market data
  useEffect(() => {
    if (tradingMode === 'paper') {
      loadPortfolioData();
      loadMarketData();
      loadRecentOrders();
    }
  }, [tradingMode]);

  const loadPortfolioData = async () => {
    try {
      const response = await fetch('/api/invest/portfolio?userId=current-user&includeLiveData=true', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      const result = await response.json();
      if (result.success) {
        setPortfolioData(result.portfolio);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];
      const response = await fetch(`/api/market-data?type=stocks&symbols=${symbols.join(',')}`);
      const result = await response.json();
      if (result.success) {
        setMarketData(result.data);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await fetch('/api/invest/orders?userId=current-user&limit=5', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      const result = await response.json();
      if (result.success) {
        setRecentOrders(result.orders || []);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const handleInvestNow = (asset: any) => {
    setSelectedAsset(asset);
    setShowInvestModal(true);
  };

  const showAssetDetails = (asset: any) => {
    // Navigate to asset detail page
    window.location.href = `/invest/${asset.id}`;
  };

  const executeOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/invest/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          ...orderData,
          userId: 'current-user',
          tradingMode
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Order ${tradingMode === 'paper' ? 'executed' : 'placed'} successfully!`);
        setShowInvestModal(false);
        loadRecentOrders();
        if (tradingMode === 'paper') {
          loadPortfolioData();
        }
      } else {
        alert(`Order failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Order execution error:', error);
      alert('Order execution failed. Please try again.');
    }
  };

  // Mock data for different asset types
  const assets = {
    stocks: [
      {
        id: "1",
        name: "Reliance Industries",
        symbol: "RELIANCE",
        price: 2450.75,
        change: 1.25,
        changePercent: 0.05,
        category: "Large Cap",
        minInvestment: 100,
        isPopular: true,
        description: "India's largest private sector company"
      },
      {
        id: "2", 
        name: "TCS",
        symbol: "TCS",
        price: 3650.50,
        change: -25.30,
        changePercent: -0.69,
        category: "Large Cap",
        minInvestment: 100,
        isPopular: true,
        description: "Leading IT services company"
      },
      {
        id: "3",
        name: "HDFC Bank",
        symbol: "HDFCBANK",
        price: 1580.25,
        change: 12.45,
        changePercent: 0.79,
        category: "Banking",
        minInvestment: 100,
        isPopular: false,
        description: "India's largest private sector bank"
      }
    ],
    mutualFunds: [
      {
        id: "4",
        name: "Axis Bluechip Fund",
        symbol: "AXISBLUECHIP",
        price: 45.67,
        change: 0.85,
        changePercent: 1.90,
        category: "Large Cap",
        minInvestment: 100,
        isPopular: true,
        description: "Invests in large cap companies",
        nav: 45.67,
        returns1Y: 18.5
      },
      {
        id: "5",
        name: "SBI Small Cap Fund",
        symbol: "SBISMALLCAP",
        price: 125.89,
        change: 2.45,
        changePercent: 1.98,
        category: "Small Cap",
        minInvestment: 100,
        isPopular: true,
        description: "Focuses on small cap opportunities",
        nav: 125.89,
        returns1Y: 22.3
      },
      {
        id: "6",
        name: "ICICI Prudential Debt Fund",
        symbol: "ICICIDEBT",
        price: 35.67,
        change: 0.15,
        changePercent: 0.42,
        category: "Debt",
        minInvestment: 100,
        isPopular: false,
        description: "Stable debt fund for conservative investors",
        nav: 35.67,
        returns1Y: 8.2
      }
    ],
    gold: [
      {
        id: "7",
        name: "Digital Gold",
        symbol: "GOLD",
        price: 5620.50,
        change: 45.25,
        changePercent: 0.81,
        category: "Commodity",
        minInvestment: 100,
        isPopular: true,
        description: "24K pure digital gold",
        purity: "99.9%",
        storage: "Secure vault"
      },
      {
        id: "8",
        name: "Gold ETF",
        symbol: "GOLDBEES",
        price: 56.18,
        change: 0.45,
        changePercent: 0.81,
        category: "ETF",
        minInvestment: 100,
        isPopular: false,
        description: "Gold backed ETF traded on exchange",
        expenseRatio: 0.5
      }
    ],
    global: [
      {
        id: "9",
        name: "Apple Inc.",
        symbol: "AAPL",
        price: 175.43,
        change: 2.15,
        changePercent: 1.24,
        category: "Technology",
        minInvestment: 100,
        isPopular: true,
        description: "World's largest technology company",
        currency: "USD"
      },
      {
        id: "10",
        name: "Tesla Inc.",
        symbol: "TSLA",
        price: 238.45,
        change: -5.67,
        changePercent: -2.32,
        category: "Electric Vehicles",
        minInvestment: 100,
        isPopular: true,
        description: "Leading electric vehicle manufacturer",
        currency: "USD"
      },
      {
        id: "11",
        name: "Microsoft Corp.",
        symbol: "MSFT",
        price: 378.85,
        change: 4.23,
        changePercent: 1.13,
        category: "Technology",
        minInvestment: 100,
        isPopular: false,
        description: "Cloud and software giant",
        currency: "USD"
      }
    ]
  };

  const categories = [
    { id: "all", name: "All Assets", icon: BarChart3 },
    { id: "stocks", name: "Stocks", icon: TrendingUp },
    { id: "mutualFunds", name: "Mutual Funds", icon: Star },
    { id: "gold", name: "Gold", icon: Award },
    { id: "global", name: "Global", icon: Target }
  ];

  const getAllAssets = () => {
    return Object.values(assets).flat();
  };

  const getFilteredAssets = () => {
    let filteredAssets = getAllAssets();
    
    if (selectedCategory !== "all") {
      filteredAssets = assets[selectedCategory as keyof typeof assets] || [];
    }
    
    if (searchQuery) {
      filteredAssets = filteredAssets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort assets
    filteredAssets.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case "price_high":
          return b.price - a.price;
        case "price_low":
          return a.price - b.price;
        case "returns":
          return b.changePercent - a.changePercent;
        default:
          return 0;
      }
    });
    
    return filteredAssets;
  };

  const AssetCard = ({ asset }: { asset: any }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription className="text-sm">{asset.symbol} • {asset.category}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {asset.isPopular && (
              <Badge className="bg-orange-100 text-orange-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
            <Badge variant="outline">
              ₹{asset.minInvestment}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price and Change */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {asset.currency === "USD" ? "$" : "₹"}{asset.price.toLocaleString('en-IN')}
              </div>
              <div className={`flex items-center text-sm ${
                asset.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {asset.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {asset.change >= 0 ? '+' : ''}{asset.change} ({asset.changePercent >= 0 ? '+' : ''}{asset.changePercent}%)
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Min Investment</div>
              <div className="font-medium">₹{asset.minInvestment}</div>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-sm text-gray-600">{asset.description}</p>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              onClick={() => handleInvestNow(asset)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invest Now
            </Button>
            <Button variant="outline" size="icon" onClick={() => showAssetDetails(asset)}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout user={{
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      avatar: "/placeholder-avatar.jpg",
      level: 5,
      xp: 2500,
      nextLevelXp: 3000,
      walletBalance: 15000,
      notifications: 3
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invest</h1>
            <p className="text-gray-600 mt-1">Discover and invest in 500+ assets starting from ₹100</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Badge className="bg-green-100 text-green-800">
              <DollarSign className="h-3 w-3 mr-1" />
              Start from ₹100
            </Badge>
          </div>
        </div>

        {/* Trading Mode Selector */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Trading Mode</CardTitle>
            <CardDescription>
              Choose your trading experience - practice with virtual money or invest real funds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <Button
                  variant={tradingMode === 'paper' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTradingMode('paper')}
                  className="flex items-center gap-2"
                >
                  <Library className="h-4 w-4" />
                  Paper Trading
                </Button>
                <Button
                  variant={tradingMode === 'real' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (hasBrokerConnection) {
                      setTradingMode('real');
                    } else {
                      alert('Connect your broker account to start real money trading.');
                    }
                  }}
                  disabled={!hasBrokerConnection}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Real Trading
                  {!hasBrokerConnection && <ExternalLink className="h-3 w-3" />}
                </Button>
              </div>

              {tradingMode === 'real' && hasBrokerConnection && (
                <div className="flex-1">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Real trading mode active. You can invest with real money.</span>
                      <Link href="/real-trading">
                        <Button variant="outline" size="sm">
                          Go to Real Trading
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {tradingMode === 'real' && !hasBrokerConnection && (
                <div className="flex-1">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Broker setup required for real trading.</span>
                      <Link href="/broker-setup">
                        <Button variant="outline" size="sm">
                          Setup Broker
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stocks, mutual funds, gold, global assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="returns">Best Returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
                <category.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6">
            {/* Category Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedCategory === "all" ? "500+" : Object.keys(assets[selectedCategory as keyof typeof assets] || {}).length}
                  </div>
                  <div className="text-sm text-gray-600">Total Assets</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">₹100</div>
                  <div className="text-sm text-gray-600">Min Investment</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">Trading</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">0%</div>
                  <div className="text-sm text-gray-600">Commission</div>
                </CardContent>
              </Card>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredAssets().map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>

            {getFilteredAssets().length === 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Investment Modal */}
        {showInvestModal && selectedAsset && (
          <InvestmentModal
            asset={selectedAsset}
            tradingMode={tradingMode}
            onClose={() => setShowInvestModal(false)}
            onExecuteOrder={executeOrder}
          />
        )}

        {/* Portfolio Integration Section */}
        {portfolioData && tradingMode === 'paper' && (
          <div className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Your Portfolio
                </CardTitle>
                <CardDescription>
                  Track your paper trading portfolio performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{portfolioData.currentValue?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Current Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{portfolioData.totalInvested?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Total Invested</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${(portfolioData.totalReturns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(portfolioData.totalReturns || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Returns</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${(portfolioData.returnsPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((portfolioData.returnsPercentage || 0) >= 0 ? '+' : '')}{(portfolioData.returnsPercentage || 0).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Returns %</div>
                  </div>
                </div>

                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {recentOrders.slice(0, 3).map((order, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{order.assetId}</div>
                            <div className="text-sm text-gray-600">
                              {order.orderMode} {order.quantity} shares @ ₹{order.price}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${order.status === 'EXECUTED' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.status}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Investment Modal Component
function InvestmentModal({ asset, tradingMode, onClose, onExecuteOrder }: {
  asset: any;
  tradingMode: 'paper' | 'real';
  onClose: () => void;
  onExecuteOrder: (orderData: any) => void;
}) {
  const [orderType, setOrderType] = useState('MARKET');
  const [orderMode, setOrderMode] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(asset?.price || 0);
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [validity, setValidity] = useState('DAY');
  const [loading, setLoading] = useState(false);

  const calculateOrderValue = () => {
    let orderPrice = price;
    if (orderType === 'MARKET') {
      orderPrice = asset?.price || 0;
    }
    return quantity * orderPrice;
  };

  const calculateBrokerage = () => {
    const orderValue = calculateOrderValue();
    return Math.max(orderValue * 0.001, 20); // 0.1% or minimum ₹20
  };

  const handleExecuteOrder = async () => {
    if (quantity <= 0 || price <= 0) {
      alert('Please enter valid quantity and price');
      return;
    }

    setLoading(true);
    
    const orderData = {
      assetId: asset.id,
      assetType: asset.category,
      orderType,
      orderMode,
      quantity: quantity.toString(),
      price: orderType === 'MARKET' ? null : price.toString(),
      stopLoss: stopLoss || null,
      target: target || null,
      validity,
      orderMode: orderMode.toLowerCase()
    };

    await onExecuteOrder(orderData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Invest in {asset.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Current Price: ₹{asset.price} ({asset.change >= 0 ? '+' : ''}{asset.change}%)
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKET">Market Order</SelectItem>
                <SelectItem value="LIMIT">Limit Order</SelectItem>
                <SelectItem value="STOP_LOSS">Stop Loss</SelectItem>
                <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
                <SelectItem value="BRACKET">Bracket Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buy/Sell Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Mode
            </label>
            <div className="flex space-x-2">
              <Button
                variant={orderMode === 'BUY' ? 'default' : 'outline'}
                onClick={() => setOrderMode('BUY')}
                className="flex-1"
              >
                Buy
              </Button>
              <Button
                variant={orderMode === 'SELL' ? 'default' : 'outline'}
                onClick={() => setOrderMode('SELL')}
                className="flex-1"
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              step="1"
            />
          </div>

          {/* Price Input (for limit orders) */}
          {orderType !== 'MARKET' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹)
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0.01"
                step="0.01"
              />
            </div>
          )}

          {/* Advanced Order Options */}
          {(orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT' || orderType === 'BRACKET') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss (₹)
                </label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {(orderType === 'BRACKET' || orderType === 'STOP_LIMIT') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target (₹)
                  </label>
                  <Input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Order Value:</span>
              <span>₹{calculateOrderValue().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Brokerage:</span>
              <span>₹{calculateBrokerage().toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>₹{(calculateOrderValue() + calculateBrokerage()).toLocaleString()}</span>
            </div>
          </div>

          {/* Trading Mode Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tradingMode === 'paper' 
                ? 'This is paper trading - no real money will be used.'
                : 'This will execute with real money through your connected broker account.'
              }
            </AlertDescription>
          </Alert>
        </div>

        <div className="p-6 border-t flex space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecuteOrder}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
          >
            {loading ? 'Processing...' : `${orderMode} ${quantity} Shares`}
          </Button>
        </div>
      </div>
    </div>
  );
}