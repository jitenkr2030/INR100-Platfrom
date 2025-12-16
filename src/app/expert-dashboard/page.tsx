"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText, 
  Star, 
  Plus,
  Eye,
  MessageSquare,
  Mail,
  PieChart
} from "lucide-react";

interface DashboardStats {
  totalEarnings: number;
  totalPortfolios: number;
  totalInsights: number;
  totalNewsletters: number;
  totalSubscribers: number;
  averageRating: number;
  monthlyGrowth: number;
}

interface PortfolioTemplate {
  id: string;
  name: string;
  riskLevel: number;
  copies: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

interface ExpertInsight {
  id: string;
  title: string;
  type: string;
  category: string;
  confidence: number;
  isPremium: boolean;
  price?: number;
  purchases: number;
  averageRating: number;
  publishedAt: string;
}

interface Newsletter {
  id: string;
  title: string;
  frequency: string;
  subscriberCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function ExpertDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioTemplate[]>([]);
  const [insights, setInsights] = useState<ExpertInsight[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const statsResponse = await fetch("/api/expert-dashboard/stats", {
        headers: {
          "x-user-id": "expert-id-here", // Replace with actual auth
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load portfolio templates
      const portfoliosResponse = await fetch("/api/portfolio-templates?expertId=expert-id-here");
      if (portfoliosResponse.ok) {
        const portfoliosData = await portfoliosResponse.json();
        setPortfolios(portfoliosData.templates || []);
      }

      // Load expert insights
      const insightsResponse = await fetch("/api/expert-insights?expertId=expert-id-here");
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }

      // Load newsletters
      const newslettersResponse = await fetch("/api/newsletters?expertId=expert-id-here");
      if (newslettersResponse.ok) {
        const newslettersData = await newslettersResponse.json();
        setNewsletters(newslettersData.newsletters || []);
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRiskColor = (riskLevel: number) => {
    switch (riskLevel) {
      case 1:
      case 2:
        return "bg-green-500";
      case 3:
        return "bg-yellow-500";
      case 4:
      case 5:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getInsightTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TECHNICAL_ANALYSIS: "bg-blue-500",
      FUNDAMENTAL_ANALYSIS: "bg-purple-500",
      NEWS_ANALYSIS: "bg-orange-500",
      MARKET_OUTLOOK: "bg-indigo-500",
      STOCK_RECOMMENDATION: "bg-green-500",
      PORTFOLIO_ADVICE: "bg-yellow-500",
      RISK_WARNING: "bg-red-500",
      OPPORTUNITY_ALERT: "bg-pink-500",
    };
    return colors[type] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Dashboard</h1>
          <p className="text-gray-600">Manage your portfolio templates, insights, and newsletters</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.monthlyGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Templates</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPortfolios}</div>
                <p className="text-xs text-muted-foreground">
                  Active templates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expert Insights</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInsights}</div>
                <p className="text-xs text-muted-foreground">
                  Published insights
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                <p className="text-xs text-muted-foreground">
                  <Star className="inline h-3 w-3 mr-1" />
                  {stats.averageRating.toFixed(1)} avg rating
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolios">Portfolio Templates</TabsTrigger>
            <TabsTrigger value="insights">Expert Insights</TabsTrigger>
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your marketplace activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${getInsightTypeColor(insight.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {insight.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {insight.purchases} purchases • {formatDate(insight.publishedAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {insight.isPremium ? "Premium" : "Free"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Create new content for your marketplace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Portfolio Template
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Publish Expert Insight
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Newsletter
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Portfolio Templates Tab */}
          <TabsContent value="portfolios" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Portfolio Templates</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>

            <div className="grid gap-6">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{portfolio.name}</CardTitle>
                        <CardDescription>
                          Risk Level: {portfolio.riskLevel}/5
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={portfolio.isActive ? "default" : "secondary"}>
                          {portfolio.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(portfolio.riskLevel)}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Copies</p>
                        <p className="text-lg font-semibold">{portfolio.copies}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        <p className="text-lg font-semibold">
                          <Star className="inline h-4 w-4 mr-1" />
                          {portfolio.rating.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="text-sm">{formatDate(portfolio.createdAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {portfolios.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio templates yet</h3>
                    <p className="text-gray-500 mb-4">Create your first portfolio template to start earning</p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Expert Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Expert Insights</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Insight
              </Button>
            </div>

            <div className="grid gap-6">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{insight.title}</CardTitle>
                        <CardDescription>
                          {insight.category} • Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getInsightTypeColor(insight.type)}>
                          {insight.type.replace(/_/g, " ")}
                        </Badge>
                        {insight.isPremium && (
                          <Badge variant="secondary">
                            {formatCurrency(insight.price || 0)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Purchases</p>
                        <p className="text-lg font-semibold">{insight.purchases}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        <p className="text-lg font-semibold">
                          <Star className="inline h-4 w-4 mr-1" />
                          {insight.averageRating.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Published</p>
                        <p className="text-sm">{formatDate(insight.publishedAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {insights.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No insights published yet</h3>
                    <p className="text-gray-500 mb-4">Share your market analysis to build your reputation</p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Insight
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Newsletters Tab */}
          <TabsContent value="newsletters" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Newsletters</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Start Newsletter
              </Button>
            </div>

            <div className="grid gap-6">
              {newsletters.map((newsletter) => (
                <Card key={newsletter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{newsletter.title}</CardTitle>
                        <CardDescription>
                          {newsletter.frequency} • {newsletter.subscriberCount} subscribers
                        </CardDescription>
                      </div>
                      <Badge variant={newsletter.isActive ? "default" : "secondary"}>
                        {newsletter.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Subscribers</p>
                        <p className="text-lg font-semibold">{newsletter.subscriberCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Frequency</p>
                        <p className="text-sm">{newsletter.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="text-sm">{formatDate(newsletter.createdAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {newsletters.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters yet</h3>
                    <p className="text-gray-500 mb-4">Start a newsletter to regularly engage with your audience</p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Start Newsletter
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics & Performance</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                  <CardDescription>Your revenue sources this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Portfolio Template Copies</span>
                      <span className="font-semibold">{formatCurrency(15000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expert Insight Sales</span>
                      <span className="font-semibold">{formatCurrency(8500)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Newsletter Subscriptions</span>
                      <span className="font-semibold">{formatCurrency(3200)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Earnings</span>
                      <span>{formatCurrency(26700)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Conversion Rate</span>
                      <span className="font-semibold">12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Retention</span>
                      <span className="font-semibold">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Growth</span>
                      <span className="font-semibold text-green-600">+23%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}