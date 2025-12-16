"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AIChat } from "@/components/ai/ai-chat";
import { AIInsights } from "@/components/ai/ai-insights";
import { AITools } from "@/components/ai/ai-tools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Sparkles, 
  Brain, 
  Target, 
  TrendingUp, 
  Shield, 
  BarChart3,
  Lightbulb,
  Zap,
  Users,
  Award
} from "lucide-react";

export default function AIPage() {
  const [selectedTab, setSelectedTab] = useState("chat");

  // Mock user data and portfolio context
  const mockUserContext = {
    portfolio: {
      totalValue: 125000,
      totalInvested: 100000,
      returns: 25000,
      returnsPercentage: 25,
      assetAllocation: [
        { name: "Stocks", percentage: 40 },
        { name: "Mutual Funds", percentage: 30 },
        { name: "Gold", percentage: 20 },
        { name: "Global", percentage: 10 }
      ]
    },
    riskProfile: "moderate",
    investmentGoals: ["Wealth Creation", "Retirement Planning", "Child Education"],
    riskTolerance: "medium"
  };

  const aiFeatures = [
    {
      icon: Brain,
      title: "Portfolio Analysis",
      description: "Comprehensive portfolio health check with AI-powered insights, diversification analysis, and performance benchmarking",
      color: "bg-blue-100 text-blue-600",
      capabilities: ["Health Score", "Performance Analysis", "Diversification", "Benchmarking"]
    },
    {
      icon: TrendingUp,
      title: "Market Sentiment",
      description: "Real-time market sentiment analysis with sector insights and trend predictions for informed decisions",
      color: "bg-green-100 text-green-600",
      capabilities: ["Sentiment Score", "Sector Analysis", "News Impact", "Trend Prediction"]
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Advanced risk analysis with stress testing, correlation analysis, and personalized mitigation strategies",
      color: "bg-red-100 text-red-600",
      capabilities: ["Risk Scoring", "Stress Testing", "Correlation Analysis", "Mitigation"]
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "AI-powered forecasting with scenario analysis, goal projections, and confidence intervals",
      color: "bg-purple-100 text-purple-600",
      capabilities: ["Return Forecasting", "Scenario Analysis", "Goal Projection", "Confidence Intervals"]
    },
    {
      icon: Target,
      title: "Smart Recommendations",
      description: "Personalized investment recommendations with asset allocation guidance and implementation strategies",
      color: "bg-orange-100 text-orange-600",
      capabilities: ["Asset Allocation", "Investment Ideas", "Timing Advice", "Implementation"]
    },
    {
      icon: Sparkles,
      title: "Natural Language AI",
      description: "Chat with AI assistant for instant answers to investment questions and personalized guidance",
      color: "bg-yellow-100 text-yellow-600",
      capabilities: ["Real-time Chat", "Investment Education", "Strategy Planning", "Market Q&A"]
    }
  ];

  const aiStats = [
    { label: "AI Analyses Run", value: "2,847", icon: Brain },
    { label: "Portfolio Optimized", value: "15.2K", icon: Target },
    { label: "Risk Alerts Sent", value: "8,634", icon: Shield },
    { label: "Predictions Accuracy", value: "89%", icon: TrendingUp },
    { label: "Users Assisted", value: "125K+", icon: Users },
    { label: "Avg Response Time", value: "< 1.5s", icon: Zap }
  ];

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
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Bot className="h-8 w-8 text-blue-600" />
                <span>AI Financial Assistant</span>
                <Badge className="bg-blue-100 text-blue-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Powered by AI
                </Badge>
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">AI Systems Active</span>
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Get personalized investment advice, portfolio analysis, and market insights powered by advanced AI
            </p>
          </div>
        </div>

        {/* AI Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {feature.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {aiStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main AI Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat */}
          <div className="lg:col-span-2">
            <AIChat 
              userId="user-123"
              context={mockUserContext}
            />
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-1">
            <AIInsights 
              userId="user-123"
              portfolioData={mockUserContext.portfolio}
              userPreferences={mockUserContext}
            />
          </div>
        </div>

        {/* AI Tools Section */}
        <AITools 
          userId="user-123"
          portfolioData={mockUserContext.portfolio}
          userPreferences={mockUserContext}
        />

        {/* Additional AI Tools */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <span>Advanced AI Tools</span>
            </CardTitle>
            <CardDescription>
              Explore more AI-powered features to enhance your investment journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="portfolio" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="portfolio">Portfolio AI</TabsTrigger>
                <TabsTrigger value="market">Market AI</TabsTrigger>
                <TabsTrigger value="goals">Goal Planner</TabsTrigger>
                <TabsTrigger value="education">Learn AI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Portfolio Health Check</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Get a comprehensive health score for your portfolio with actionable recommendations
                      </p>
                      <Button size="sm" className="w-full">
                        Analyze Portfolio
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Rebalancing Assistant</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        AI-powered portfolio rebalancing to maintain optimal asset allocation
                      </p>
                      <Button size="sm" className="w-full">
                        Rebalance Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="market" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Market Sentiment Analysis</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Real-time analysis of market sentiment and trends across sectors
                      </p>
                      <Button size="sm" className="w-full">
                        Analyze Sentiment
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Sector Opportunities</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Discover emerging opportunities in different market sectors
                      </p>
                      <Button size="sm" className="w-full">
                        Find Opportunities
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="goals" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Goal Planning</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Create personalized investment plans for your financial goals
                      </p>
                      <Button size="sm" className="w-full">
                        Plan Goals
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Retirement Calculator</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Calculate how much you need to save for a comfortable retirement
                      </p>
                      <Button size="sm" className="w-full">
                        Calculate
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="education" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">AI Tutor</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Learn about investing with personalized AI-powered lessons
                      </p>
                      <Button size="sm" className="w-full">
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Financial Glossary</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Get instant explanations for financial terms and concepts
                      </p>
                      <Button size="sm" className="w-full">
                        Explore Glossary
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}