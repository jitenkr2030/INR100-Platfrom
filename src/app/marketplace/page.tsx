"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BookOpen,
  Mail,
  PieChart,
  Eye,
  ShoppingCart,
  Heart,
  AlertTriangle,
  BarChart3
} from "lucide-react";

interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  riskLevel: number;
  expectedReturn?: number;
  minInvestment: number;
  maxInvestment?: number;
  copies: number;
  rating: number;
  expert: {
    id: string;
    name: string;
    avatar?: string;
  };
  categories?: string;
  tags?: string;
  isPublic: boolean;
}

interface ExpertInsight {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  confidence: number;
  targetPrice?: number;
  timeHorizon?: string;
  isPremium: boolean;
  price?: number;
  purchases: number;
  averageRating: number;
  expert: {
    id: string;
    name: string;
    avatar?: string;
  };
  asset?: {
    symbol: string;
    name: string;
  };
  isPurchased: boolean;
}

interface Newsletter {
  id: string;
  title: string;
  description: string;
  frequency: string;
  category: string;
  subscriberCount: number;
  expert: {
    id: string;
    name: string;
    avatar?: string;
  };
  isSubscribed: boolean;
}

export default function ExpertMarketplace() {
  const [activeTab, setActiveTab] = useState("portfolios");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [portfolios, setPortfolios] = useState<PortfolioTemplate[]>([]);
  const [insights, setInsights] = useState<ExpertInsight[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplaceData();
  }, [activeTab, searchQuery, selectedCategory, selectedRiskLevel]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedRiskLevel !== "all") params.append("riskLevel", selectedRiskLevel);

      if (activeTab === "portfolios") {
        const response = await fetch(`/api/portfolio-templates?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPortfolios(data.templates || []);
        }
      } else if (activeTab === "insights") {
        const response = await fetch(`/api/expert-insights?${params}`);
        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        }
      } else if (activeTab === "newsletters") {
        const response = await fetch(`/api/newsletters?${params}`);
        if (response.ok) {
          const data = await response.json();
          setNewsletters(data.newsletters || []);
        }
      }
    } catch (error) {
      console.error("Failed to load marketplace data:", error);
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

  const handlePurchase = async (itemId: string, type: string) => {
    try {
      let response;
      let amount = 0;

      if (type === "portfolio") {
        const initialInvestment = prompt("Enter initial investment amount (minimum ₹10,000):");
        if (!initialInvestment) return;
        
        amount = parseFloat(initialInvestment);
        if (amount < 10000) {
          alert("Minimum investment is ₹10,000");
          return;
        }

        // Use the new marketplace payment API
        response = await fetch("/api/marketplace/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "user-123", // Replace with actual auth
          },
          body: JSON.stringify({
            itemType: "portfolio_copy",
            itemId: itemId,
            amount: amount,
            paymentMethod: "wallet"
          }),
        });
      } else if (type === "insight") {
        // Get insight price first
        const insight = insights.find(i => i.id === itemId);
        if (!insight || !insight.isPremium) {
          alert("Insight not available for purchase");
          return;
        }

        amount = insight.price || 0;

        response = await fetch("/api/marketplace/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "user-123", // Replace with actual auth
          },
          body: JSON.stringify({
            itemType: "insight",
            itemId: itemId,
            amount: amount,
            paymentMethod: "wallet"
          }),
        });
      }

      if (response && response.ok) {
        const result = await response.json();
        
        if (result.status === 'COMPLETED') {
          alert("Purchase successful!");
          loadMarketplaceData(); // Refresh data
        } else {
          alert("Payment initiated. Please complete the payment process.");
        }
      } else {
        const error = await response?.json();
        alert(error?.error || "Purchase failed");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase failed");
    }
  };

  const handleCopyPortfolio = async (portfolioId: string) => {
    const initialInvestment = prompt("Enter initial investment amount (minimum ₹10,000):");
    if (!initialInvestment) return;
    
    const amount = parseFloat(initialInvestment);
    if (amount < 10000) {
      alert("Minimum investment is ₹10,000");
      return;
    }

    try {
      const response = await fetch("/api/marketplace/portfolio-templates/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-123", // Replace with actual auth
        },
        body: JSON.stringify({
          templateId: portfolioId,
          initialInvestment: amount
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Portfolio copied successfully! Copy ID: ${result.portfolioCopy.id}`);
        loadMarketplaceData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error?.error || "Failed to copy portfolio");
      }
    } catch (error) {
      console.error("Copy portfolio error:", error);
      alert("Failed to copy portfolio");
    }
  };

  const handleSubscribe = async (newsletterId: string) => {
    try {
      const response = await fetch("/api/newsletters/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-id-here", // Replace with actual auth
        },
        body: JSON.stringify({
          newsletterId,
        }),
      });

      if (response.ok) {
        alert("Subscribed successfully!");
        loadMarketplaceData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error?.error || "Subscription failed");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Subscription failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Marketplace</h1>
          <p className="text-gray-600">Discover premium portfolios, insights, and newsletters from financial experts</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search portfolios, insights, newsletters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="equity">Equity</option>
                <option value="mutual-funds">Mutual Funds</option>
                <option value="commodities">Commodities</option>
                <option value="crypto">Crypto</option>
                <option value="real-estate">Real Estate</option>
              </select>
              
              {activeTab === "portfolios" && (
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="1">Conservative (1-2)</option>
                  <option value="3">Moderate (3)</option>
                  <option value="4">Aggressive (4-5)</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolios">Portfolio Templates</TabsTrigger>
            <TabsTrigger value="insights">Expert Insights</TabsTrigger>
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* Portfolio Templates Tab */}
          <TabsContent value="portfolios" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {portfolios.map((portfolio) => (
                  <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                          <CardDescription className="mt-2">
                            by {portfolio.expert.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={portfolio.isPublic ? "default" : "secondary"}>
                            {portfolio.isPublic ? "Public" : "Private"}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${getRiskColor(portfolio.riskLevel)}`} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{portfolio.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500">Risk Level</p>
                          <p className="font-semibold">{portfolio.riskLevel}/5</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Min Investment</p>
                          <p className="font-semibold">{formatCurrency(portfolio.minInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Copies</p>
                          <p className="font-semibold flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {portfolio.copies}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-semibold flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {portfolio.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {portfolio.expectedReturn && (
                        <div className="bg-green-50 p-3 rounded-md mb-4">
                          <p className="text-sm text-green-800">
                            Expected Annual Return: <span className="font-semibold">{portfolio.expectedReturn}%</span>
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1"
                          onClick={() => handleCopyPortfolio(portfolio.id)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Copy Portfolio
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {portfolios.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio templates found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Expert Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {insights.map((insight) => (
                  <Card key={insight.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{insight.title}</CardTitle>
                          <CardDescription className="mt-2">
                            by {insight.expert.name} • {insight.category}
                          </CardDescription>
                          {insight.asset && (
                            <p className="text-sm text-gray-500 mt-1">
                              Related to: {insight.asset.symbol} - {insight.asset.name}
                            </p>
                          )}
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
                      <p className="text-gray-600 mb-4 line-clamp-3">{insight.content}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500">Confidence</p>
                          <p className="font-semibold">{(insight.confidence * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Purchases</p>
                          <p className="font-semibold">{insight.purchases}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-semibold flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {insight.averageRating.toFixed(1)}
                          </p>
                        </div>
                        {insight.targetPrice && (
                          <div>
                            <p className="text-sm text-gray-500">Target Price</p>
                            <p className="font-semibold">{formatCurrency(insight.targetPrice)}</p>
                          </div>
                        )}
                      </div>

                      {insight.timeHorizon && (
                        <div className="bg-blue-50 p-3 rounded-md mb-4">
                          <p className="text-sm text-blue-800">
                            Time Horizon: <span className="font-semibold">{insight.timeHorizon}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {insight.isPurchased ? (
                          <Button className="flex-1" variant="secondary">
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Insight
                          </Button>
                        ) : insight.isPremium ? (
                          <Button 
                            className="flex-1"
                            onClick={() => handlePurchase(insight.id, "insight")}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Buy for {formatCurrency(insight.price || 0)}
                          </Button>
                        ) : (
                          <Button className="flex-1">
                            <Eye className="mr-2 h-4 w-4" />
                            Read Free
                          </Button>
                        )}
                        <Button variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {insights.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Newsletters Tab */}
          <TabsContent value="newsletters" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {newsletters.map((newsletter) => (
                  <Card key={newsletter.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{newsletter.title}</CardTitle>
                          <CardDescription className="mt-2">
                            by {newsletter.expert.name} • {newsletter.category}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {newsletter.frequency}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{newsletter.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500">Frequency</p>
                          <p className="font-semibold">{newsletter.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Subscribers</p>
                          <p className="font-semibold flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {newsletter.subscriberCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-semibold">{newsletter.category}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {newsletter.isSubscribed ? (
                          <Button className="flex-1" variant="secondary">
                            <Mail className="mr-2 h-4 w-4" />
                            Subscribed
                          </Button>
                        ) : (
                          <Button 
                            className="flex-1"
                            onClick={() => handleSubscribe(newsletter.id)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Subscribe Free
                          </Button>
                        )}
                        <Button variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {newsletters.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Performance Tracking Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Portfolio Performance Tracking</h3>
              <p className="text-gray-500 mb-4">Track the performance of your copied portfolios in real-time</p>
              <Button onClick={() => handlePerformanceTracking()}>
                View Performance Dashboard
              </Button>
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Commission Tracking & Payouts</h3>
              <p className="text-gray-500 mb-4">Track your earnings and manage payouts from the marketplace</p>
              <div className="space-x-2">
                <Button onClick={() => handleCommissionTracking()}>
                  View Commissions
                </Button>
                <Button variant="outline" onClick={() => handlePayoutRequest()}>
                  Request Payout
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dispute Resolution</h3>
              <p className="text-gray-500 mb-4">Manage disputes and track resolution status</p>
              <div className="space-x-2">
                <Button onClick={() => handleDisputeManagement()}>
                  Manage Disputes
                </Button>
                <Button variant="outline" onClick={() => handleCreateDispute()}>
                  Create Dispute
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  // Helper functions for new tabs
  async function handlePerformanceTracking() {
    try {
      const response = await fetch('/api/marketplace/performance-tracking', {
        headers: { 'x-user-id': 'user-123' }
      });
      if (response.ok) {
        alert('Opening performance dashboard...');
        // Navigate to performance dashboard
        window.location.href = '/portfolio?tab=performance';
      }
    } catch (error) {
      console.error('Performance tracking error:', error);
    }
  }

  async function handleCommissionTracking() {
    try {
      const response = await fetch('/api/marketplace/commissions', {
        headers: { 'x-user-id': 'user-123' }
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Total Commissions: ₹${data.summary.totalCommissions.toLocaleString()}`);
        // Navigate to commission dashboard
        window.location.href = '/expert-dashboard?tab=commissions';
      }
    } catch (error) {
      console.error('Commission tracking error:', error);
    }
  }

  async function handlePayoutRequest() {
    const amount = prompt('Enter payout amount:');
    if (!amount) return;

    try {
      const response = await fetch('/api/marketplace/commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123'
        },
        body: JSON.stringify({
          action: 'payout',
          expertId: 'expert-123',
          payoutAmount: parseFloat(amount),
          payoutMethod: 'bank_transfer'
        })
      });

      if (response.ok) {
        alert('Payout request submitted successfully!');
      } else {
        const error = await response.json();
        alert(error?.error || 'Payout request failed');
      }
    } catch (error) {
      console.error('Payout request error:', error);
    }
  }

  async function handleDisputeManagement() {
    try {
      const response = await fetch('/api/marketplace/disputes', {
        headers: { 'x-user-id': 'user-123' }
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Total Disputes: ${data.summary.total}`);
        // Navigate to dispute dashboard
        window.location.href = '/support/disputes';
      }
    } catch (error) {
      console.error('Dispute management error:', error);
    }
  }

  async function handleCreateDispute() {
    const type = prompt('Dispute type (payment/content/performance/service):');
    const subject = prompt('Dispute subject:');
    const description = prompt('Dispute description:');

    if (!type || !subject || !description) return;

    try {
      const response = await fetch('/api/marketplace/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123'
        },
        body: JSON.stringify({
          action: 'create',
          type,
          itemType: 'insight',
          itemId: 'sample-insight-id',
          subject,
          description,
          priority: 'medium'
        })
      });

      if (response.ok) {
        alert('Dispute created successfully!');
      } else {
        const error = await response.json();
        alert(error?.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Create dispute error:', error);
    }
  }
}