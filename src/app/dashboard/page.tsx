"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Target, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  BarChart3,
  Activity,
  Sparkles,
  Gift,
  Trophy,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Maximize2,
  Filter,
  Calendar,
  TrendingDownIcon
} from "lucide-react";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any>(null);
  const [customWidgets, setCustomWidgets] = useState<string[]>(["portfolioSummary", "assetAllocation", "topPerformers", "aiInsights"]);
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/data');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Using cached data.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/charts?type=portfolio&period=1M');
      if (!response.ok) throw new Error('Failed to fetch chart data');
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }, []);

  // Fetch real-time updates
  const fetchRealTimeUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/updates');
      if (!response.ok) throw new Error('Failed to fetch updates');
      const data = await response.json();
      setRealTimeUpdates(data);
    } catch (error) {
      console.error('Error fetching real-time updates:', error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchChartData(),
        fetchRealTimeUpdates()
      ]);
      setLoading(false);
    };

    initializeData();
  }, [fetchDashboardData, fetchChartData, fetchRealTimeUpdates]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealTimeUpdates();
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRealTimeUpdates, fetchDashboardData]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchChartData(),
      fetchRealTimeUpdates()
    ]);
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard refreshed successfully"
    });
  };

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    setCustomWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Default data if API fails
  const defaultPortfolioData = {
    totalValue: 125000,
    totalInvested: 100000,
    totalReturns: 25000,
    returnsPercentage: 25,
    dailyChange: 1250,
    dailyChangePercentage: 1.0,
    assetAllocation: [
      { name: "Stocks", value: 50000, percentage: 40, color: "#10B981" },
      { name: "Mutual Funds", value: 37500, percentage: 30, color: "#3B82F6" },
      { name: "Gold", value: 25000, percentage: 20, color: "#F59E0B" },
      { name: "Global", value: 12500, percentage: 10, color: "#8B5CF6" }
    ],
    topPerformers: [
      { name: "Reliance Industries", symbol: "RELIANCE", value: 15000, returns: 15.5 },
      { name: "HDFC Bank", symbol: "HDFCBANK", value: 12000, returns: 12.3 },
      { name: "Axis Bluechip Fund", symbol: "AXISBLUECHIP", value: 10000, returns: 18.7 }
    ],
    recentActivity: [
      { type: "buy", asset: "TCS", amount: 5000, time: "2 hours ago", status: "completed" },
      { type: "sell", asset: "ITC", amount: 3000, time: "1 day ago", status: "completed" },
      { type: "sip", asset: "SBI Small Cap", amount: 2000, time: "2 days ago", status: "completed" }
    ],
    aiInsights: [
      { 
        type: "opportunity", 
        title: "Market Dip Alert", 
        description: "Quality stocks are trading at 10% discount. Consider buying the dip.",
        confidence: 85,
        priority: "high"
      },
      { 
        type: "risk", 
        title: "Portfolio Rebalancing", 
        description: "Your equity allocation is 5% above target. Consider rebalancing.",
        confidence: 92,
        priority: "medium"
      },
      { 
        type: "performance", 
        title: "SIP Performance", 
        description: "Your SIPs are outperforming benchmark by 3.2%.",
        confidence: 78,
        priority: "low"
      }
    ]
  };

  const portfolioData = dashboardData || defaultPortfolioData;

  const quickActions = [
    { 
      title: "Add Money", 
      icon: Plus, 
      description: `₹${(portfolioData.walletBalance || 15000).toLocaleString('en-IN')} available`, 
      color: "bg-green-100 text-green-600",
      action: () => toast({ title: "Add Money", description: "Redirecting to payment page..." })
    },
    { 
      title: "Invest", 
      icon: TrendingUp, 
      description: "Start investing", 
      color: "bg-blue-100 text-blue-600",
      action: () => window.location.href = '/invest'
    },
    { 
      title: "Withdraw", 
      icon: ArrowDownRight, 
      description: "Get your money", 
      color: "bg-red-100 text-red-600",
      action: () => toast({ title: "Withdraw", description: "Withdrawal feature coming soon..." })
    },
    { 
      title: "SIP", 
      icon: Clock, 
      description: "Set up SIP", 
      color: "bg-purple-100 text-purple-600",
      action: () => window.location.href = '/invest?type=sip'
    }
  ];

  if (loading) {
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={{
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      avatar: "/placeholder-avatar.jpg",
      level: 5,
      xp: 2500,
      nextLevelXp: 3000,
      walletBalance: portfolioData.walletBalance || 15000,
      notifications: 3
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, Rahul! Here's your portfolio overview.</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Badge className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active Investor
            </Badge>
            <Badge variant="outline">
              Level 5
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Real-time Status */}
        {realTimeUpdates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-900">Live Updates Active</span>
              </div>
              <div className="text-sm text-blue-700">
                Portfolio: ₹{(realTimeUpdates.portfolioValue || 0).toLocaleString('en-IN')} 
                ({realTimeUpdates.dailyChange >= 0 ? '+' : ''}{(realTimeUpdates.dailyChangePercentage || 0).toFixed(2)}%)
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
              <div className="flex items-center space-x-1">
                {realTimeUpdates && realTimeUpdates.portfolioValue !== portfolioData.totalValue && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(realTimeUpdates?.portfolioValue || portfolioData.totalValue).toLocaleString('en-IN')}</div>
              <div className="flex items-center space-x-1 text-sm">
                {(realTimeUpdates?.dailyChange || portfolioData.dailyChange) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">+₹{(realTimeUpdates?.dailyChange || portfolioData.dailyChange).toLocaleString('en-IN')} (+{(realTimeUpdates?.dailyChangePercentage || portfolioData.dailyChangePercentage).toFixed(2)}%)</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">-₹{Math.abs(realTimeUpdates?.dailyChange || portfolioData.dailyChange).toLocaleString('en-IN')} ({(realTimeUpdates?.dailyChangePercentage || portfolioData.dailyChangePercentage).toFixed(2)}%)</span>
                  </>
                )}
                <span className="text-gray-500">today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Invested</CardTitle>
              <PieChart className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(portfolioData.totalInvested || 100000).toLocaleString('en-IN')}</div>
              <p className="text-xs text-gray-600">Across {portfolioData.investmentCount || 12} investments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+₹{(portfolioData.totalReturns || 25000).toLocaleString('en-IN')}</div>
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{(portfolioData.returnsPercentage || 25).toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Wallet Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(portfolioData.walletBalance || 15000).toLocaleString('en-IN')}</div>
              <Button size="sm" className="mt-2 w-full">
                <Plus className="h-3 w-3 mr-1" />
                Add Money
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Customize
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Allocation */}
              {customWidgets.includes("assetAllocation") && (
                <Card className="border-0 shadow-lg lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5" />
                        <span>Asset Allocation</span>
                      </CardTitle>
                      <CardDescription>Your portfolio diversification across asset classes</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleWidget("assetAllocation")}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(portfolioData.assetAllocation || defaultPortfolioData.assetAllocation).map((asset: any) => (
                        <div key={asset.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: asset.color }}
                              />
                              <span className="font-medium">{asset.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">₹{asset.value.toLocaleString('en-IN')}</div>
                              <div className="text-sm text-gray-600">{asset.percentage}%</div>
                            </div>
                          </div>
                          <Progress value={asset.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Common tasks you can perform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action.title}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                        onClick={action.action}
                      >
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-sm">{action.title}</div>
                          <div className="text-xs text-gray-600">{action.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            {customWidgets.includes("topPerformers") && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Top Performers</span>
                    </CardTitle>
                    <CardDescription>Your best performing investments this month</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleWidget("topPerformers")}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(portfolioData.topPerformers || defaultPortfolioData.topPerformers).map((performer: any, index: number) => (
                      <div key={performer.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{performer.name}</div>
                            <div className="text-sm text-gray-600">{performer.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{performer.value.toLocaleString('en-IN')}</div>
                          <div className="text-sm text-green-600 flex items-center justify-end">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{performer.returns}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Performance Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Portfolio Performance</span>
                  </CardTitle>
                  <CardDescription>Your portfolio value over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData?.portfolioChart ? (
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Interactive Chart</p>
                        <p className="text-xs text-gray-500">Chart data loaded from API</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Allocation Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Asset Distribution</span>
                  </CardTitle>
                  <CardDescription>Breakdown by asset class</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData?.allocationChart ? (
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Pie Chart</p>
                        <p className="text-xs text-gray-500">Interactive allocation chart</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+{portfolioData.returnsPercentage || 25}%</div>
                      <div className="text-sm text-gray-600">Total Returns</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">₹{((portfolioData.totalReturns || 25000) / (portfolioData.totalInvested || 100000) * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">ROI</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(realTimeUpdates?.sharpeRatio || 1.25).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Sharpe Ratio</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{(realTimeUpdates?.volatility || 12.5).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Volatility</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goals Progress */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Goals Progress</span>
                  </CardTitle>
                  <CardDescription>Track your investment goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Emergency Fund</span>
                        <span>₹75,000 / ₹1,00,000</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>House Down Payment</span>
                        <span>₹2,50,000 / ₹5,00,000</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Retirement Fund</span>
                        <span>₹1,25,000 / ₹10,00,000</span>
                      </div>
                      <Progress value={12.5} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {realTimeUpdates?.aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realTimeUpdates.aiInsights.map((insight: any, index: number) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {insight.type === "opportunity" && <Sparkles className="h-5 w-5 text-green-600" />}
                          {insight.type === "risk" && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                          {insight.type === "performance" && <BarChart3 className="h-5 w-5 text-blue-600" />}
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </div>
                        <Badge 
                          variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <CardDescription>{insight.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <span className="font-medium">{insight.confidence}%</span>
                        </div>
                        <Button size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(portfolioData.aiInsights || defaultPortfolioData.aiInsights).map((insight: any, index: number) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {insight.type === "opportunity" && <Sparkles className="h-5 w-5 text-green-600" />}
                          {insight.type === "risk" && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                          {insight.type === "performance" && <BarChart3 className="h-5 w-5 text-blue-600" />}
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </div>
                        <Badge 
                          variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <CardDescription>{insight.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <span className="font-medium">{insight.confidence}%</span>
                        </div>
                        <Button size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="holdings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Current Holdings</span>
                </CardTitle>
                <CardDescription>Your investment portfolio holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(portfolioData.topPerformers || defaultPortfolioData.topPerformers).map((holding: any, index: number) => (
                    <div key={holding.symbol} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {holding.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{holding.name}</div>
                          <div className="text-sm text-gray-600">{holding.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{holding.value.toLocaleString('en-IN')}</div>
                        <div className="text-sm text-green-600">+{holding.returns}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest investment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(realTimeUpdates?.recentActivity || portfolioData.recentActivity || defaultPortfolioData.recentActivity).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          activity.type === "buy" ? "bg-green-100 text-green-600" :
                          activity.type === "sell" ? "bg-red-100 text-red-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          {activity.type === "buy" && <ArrowUpRight className="h-4 w-4" />}
                          {activity.type === "sell" && <ArrowDownRight className="h-4 w-4" />}
                          {activity.type === "sip" && <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{activity.type} - {activity.asset}</div>
                          <div className="text-sm text-gray-600">{activity.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{activity.amount.toLocaleString('en-IN')}</div>
                        <div className="flex items-center justify-end text-sm text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {activity.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}