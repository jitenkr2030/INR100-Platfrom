"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Download,
  Share,
  Clock,
  CheckCircle,
  Activity,
  PieChart,
  LineChart,
  Calculator,
  Lightbulb,
  Zap,
  Eye,
  Star
} from "lucide-react";

interface AIToolsProps {
  userId?: string;
  portfolioData?: any;
  userPreferences?: any;
}

interface AnalysisResult {
  type: 'portfolio' | 'sentiment' | 'risk' | 'predictions' | 'recommendations';
  data: any;
  timestamp: Date;
  status: 'completed' | 'processing' | 'failed';
}

export function AITools({ userId, portfolioData, userPreferences }: AIToolsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const aiTools = [
    {
      id: 'portfolio-analysis',
      title: 'Portfolio Analysis',
      description: 'Comprehensive portfolio health check with AI-powered insights',
      icon: Brain,
      color: 'bg-blue-100 text-blue-600',
      endpoint: '/api/ai/portfolio-analysis',
      features: ['Health Score', 'Performance Analysis', 'Diversification', 'Benchmarking']
    },
    {
      id: 'market-sentiment',
      title: 'Market Sentiment',
      description: 'Real-time market sentiment analysis and opportunities',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      endpoint: '/api/ai/market-sentiment',
      features: ['Sentiment Score', 'Sector Analysis', 'News Impact', 'Trend Prediction']
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Advanced risk analysis with mitigation strategies',
      icon: Shield,
      color: 'bg-red-100 text-red-600',
      endpoint: '/api/ai/risk-assessment',
      features: ['Risk Scoring', 'Stress Testing', 'Correlation Analysis', 'Mitigation']
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics',
      description: 'AI-powered forecasting and scenario analysis',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600',
      endpoint: '/api/ai/predictive-analytics',
      features: ['Return Forecasting', 'Scenario Analysis', 'Goal Projection', 'Confidence Intervals']
    },
    {
      id: 'recommendations',
      title: 'Smart Recommendations',
      description: 'Personalized investment recommendations',
      icon: Target,
      color: 'bg-orange-100 text-orange-600',
      endpoint: '/api/ai/recommendations',
      features: ['Asset Allocation', 'Investment Ideas', 'Timing Advice', 'Implementation']
    }
  ];

  const runAIAnalysis = async (toolId: string) => {
    const tool = aiTools.find(t => t.id === toolId);
    if (!tool || isAnalyzing) return;

    setIsAnalyzing(true);
    
    try {
      const response = await fetch(tool.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portfolioData,
          userPreferences,
          marketData: {}, // Would include real market data
          includeAnalysis: ['portfolio', 'sentiment', 'risk', 'predictions']
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const newResult: AnalysisResult = {
          type: toolId as any,
          data: data.data,
          timestamp: new Date(),
          status: 'completed'
        };

        setAnalysisResults(prev => [newResult, ...prev]);
        
        toast({
          title: "Analysis Complete",
          description: `${tool.title} analysis has been completed successfully.`,
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast({
        title: "Analysis Failed",
        description: `Failed to complete ${tool.title}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runComprehensiveAnalysis = async () => {
    setIsAnalyzing(true);
    toast({
      title: "Comprehensive Analysis Started",
      description: "Running all AI analyses. This may take a few minutes...",
    });

    for (const tool of aiTools) {
      try {
        await runAIAnalysis(tool.id);
        // Add delay between calls to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to run ${tool.id}:`, error);
      }
    }

    setIsAnalyzing(false);
    toast({
      title: "Comprehensive Analysis Complete",
      description: "All AI analyses have been completed.",
    });
  };

  const getAnalysisIcon = (type: string) => {
    const tool = aiTools.find(t => t.id === type);
    return tool ? tool.icon : Brain;
  };

  const getAnalysisColor = (type: string) => {
    const tool = aiTools.find(t => t.id === type);
    return tool ? tool.color : 'bg-gray-100 text-gray-600';
  };

  const renderAnalysisResult = (result: AnalysisResult) => {
    const Icon = getAnalysisIcon(result.type);
    
    switch (result.type) {
      case 'portfolio':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <h4 className="font-semibold">Portfolio Analysis</h4>
              <Badge variant="outline">{result.data?.overallScore || 0}/100</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.data?.performance?.score || 0}</div>
                <div className="text-sm text-gray-600">Performance Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.data?.diversification?.diversificationScore || 0}</div>
                <div className="text-sm text-gray-600">Diversification</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{result.data?.summary}</p>
          </div>
        );
      
      case 'market-sentiment':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <h4 className="font-semibold">Market Sentiment</h4>
              <Badge variant={result.data?.overallSentiment?.label === 'bullish' ? 'default' : 'secondary'}>
                {result.data?.overallSentiment?.label || 'neutral'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Sentiment Score</span>
                  <span>{result.data?.overallSentiment?.score || 0}/100</span>
                </div>
                <Progress value={result.data?.overallSentiment?.score || 0} className="h-2" />
              </div>
            </div>
            <p className="text-sm text-gray-600">{result.data?.overallSentiment?.summary}</p>
          </div>
        );
      
      case 'risk':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <h4 className="font-semibold">Risk Assessment</h4>
              <Badge variant={result.data?.overallRisk?.level === 'high' ? 'destructive' : 'secondary'}>
                {result.data?.overallRisk?.level || 'medium'} Risk
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-bold text-red-600">{result.data?.riskCategories?.concentration?.score || 0}</div>
                <div className="text-xs text-gray-600">Concentration</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-bold text-orange-600">{result.data?.riskCategories?.market?.score || 0}</div>
                <div className="text-xs text-gray-600">Market</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-bold text-yellow-600">{result.data?.riskCategories?.liquidity?.score || 0}</div>
                <div className="text-xs text-gray-600">Liquidity</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{result.data?.overallRisk?.summary}</p>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <h4 className="font-semibold">{result.type} Analysis</h4>
            </div>
            <p className="text-sm text-gray-600">Analysis completed successfully.</p>
          </div>
        );
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>AI Analysis Tools</span>
            </CardTitle>
            <CardDescription>
              Comprehensive AI-powered analysis and insights for your investments
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={runComprehensiveAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Run All Analysis
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
            <TabsTrigger value="results">Results ({analysisResults.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiTools.map((tool) => (
                <Card key={tool.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${tool.color}`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{tool.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tool.features.slice(0, 2).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAIAnalysis(tool.id)}
                          disabled={isAnalyzing}
                          className="w-full"
                        >
                          {isAnalyzing ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiTools.map((tool) => (
                <Card key={tool.id} className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${tool.color}`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <span>{tool.title}</span>
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {tool.features.map((feature) => (
                            <div key={feature} className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => runAIAnalysis(tool.id)}
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Run Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {analysisResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No analysis results yet. Run an analysis to see insights here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysisResults.map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {result.timestamp.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {result.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {renderAnalysisResult(result)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}