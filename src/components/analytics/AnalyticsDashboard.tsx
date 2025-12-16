'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Target,
  AlertTriangle,
  DollarSign,
  Percent,
  FileText,
  Settings,
  Eye
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PortfolioChart } from './PortfolioChart';
import { AssetAllocationChart } from './AssetAllocationChart';
import { RiskMetricsCard } from './RiskMetricsCard';
import { PerformanceBenchmark } from './PerformanceBenchmark';
import { CustomReportBuilder } from './CustomReportBuilder';
import { TaxReportSection } from './TaxReportSection';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('1Y');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const {
    portfolioAnalytics,
    assetPerformance,
    riskMetrics,
    isLoading,
    error,
    refreshData,
    exportReport,
    generateCustomReport
  } = useAnalytics();

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    await exportReport(format);
  };

  const handleCustomReport = async (config: any) => {
    const report = await generateCustomReport(config);
    console.log('Custom report generated:', report);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading analytics: {error}</p>
        <Button onClick={refreshData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive portfolio analysis and insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="ALL">All Time</option>
          </select>
          
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <div className="relative">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden group-hover:block">
              <button 
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Export as PDF
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Export as Excel
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Export as CSV
              </button>
            </div>
          </div>
          
          <Button onClick={() => setShowCustomBuilder(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="assets">Asset Analysis</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(portfolioAnalytics?.totalValue || 0).toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(portfolioAnalytics?.dayChangePercent || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span className={`${(portfolioAnalytics?.dayChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(portfolioAnalytics?.dayChangePercent || 0) >= 0 ? '+' : ''}{(portfolioAnalytics?.dayChangePercent || 0).toFixed(2)}%
                  </span>
                  <span className="ml-1">today</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(portfolioAnalytics?.totalReturnPercent || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{(portfolioAnalytics?.totalReturn || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annualized Return</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(portfolioAnalytics?.annualizedReturn || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(portfolioAnalytics?.sharpeRatio || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted return metric
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart data={portfolioAnalytics} dateRange={dateRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <AssetAllocationChart data={assetPerformance} />
              </CardContent>
            </Card>
          </div>

          {/* Risk Overview */}
          {riskMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskMetricsCard data={riskMetrics} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceBenchmark data={portfolioAnalytics} />
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-6">
          {riskMetrics && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskMetricsCard data={riskMetrics} detailed />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Asset Analysis Tab */}
        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-right p-2">Allocation</th>
                      <th className="text-right p-2">Value</th>
                      <th className="text-right p-2">Day Change</th>
                      <th className="text-right p-2">Total Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetPerformance?.map((asset, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{asset.symbol}</td>
                        <td className="p-2">{asset.name}</td>
                        <td className="p-2 text-right">{asset.allocation.toFixed(1)}%</td>
                        <td className="p-2 text-right">₹{asset.value.toLocaleString()}</td>
                        <td className={`p-2 text-right ${asset.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.dayChange >= 0 ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%
                        </td>
                        <td className={`p-2 text-right ${asset.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.totalReturn >= 0 ? '+' : ''}{asset.totalReturnPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Reports Tab */}
        <TabsContent value="tax" className="space-y-6">
          <TaxReportSection />
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="space-y-6">
          <CustomReportBuilder onGenerate={handleCustomReport} />
        </TabsContent>
      </Tabs>

      {/* Custom Report Builder Modal */}
      {showCustomBuilder && (
        <CustomReportBuilder
          onGenerate={(config) => {
            handleCustomReport(config);
            setShowCustomBuilder(false);
          }}
          onClose={() => setShowCustomBuilder(false)}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;