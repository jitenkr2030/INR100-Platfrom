'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  FileText, 
  Calendar, 
  Download,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  DollarSign,
  Target
} from 'lucide-react';

interface CustomReportBuilderProps {
  onGenerate: (config: any) => void;
  onClose?: () => void;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  onGenerate,
  onClose
}) => {
  const [reportConfig, setReportConfig] = useState({
    title: 'Custom Portfolio Report',
    dateRange: {
      start: '',
      end: ''
    },
    includeSections: {
      portfolioSummary: true,
      assetPerformance: true,
      riskAnalysis: false,
      performanceComparison: false,
      taxReport: false,
      transactionHistory: false
    },
    format: 'pdf' as 'pdf' | 'excel' | 'json',
    customMetrics: [] as string[],
    frequency: 'one-time' as 'one-time' | 'daily' | 'weekly' | 'monthly',
    emailDelivery: false,
    scheduleReport: false
  });

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const availableMetrics = [
    { id: 'correlation', label: 'Correlation Analysis', icon: BarChart3 },
    { id: 'drawdown', label: 'Drawdown Analysis', icon: TrendingUp },
    { id: 'liquidity', label: 'Liquidity Metrics', icon: DollarSign },
    { id: 'sector_rotation', label: 'Sector Rotation', icon: PieChart },
    { id: 'factor_analysis', label: 'Factor Analysis', icon: Target },
    { id: 'stress_testing', label: 'Stress Testing', icon: Shield },
    { id: 'monte_carlo', label: 'Monte Carlo Simulation', icon: BarChart3 },
    { id: 'attribution', label: 'Performance Attribution', icon: TrendingUp }
  ];

  const handleSectionToggle = (section: string) => {
    setReportConfig(prev => ({
      ...prev,
      includeSections: {
        ...prev.includeSections,
        [section]: !prev.includeSections[section as keyof typeof prev.includeSections]
      }
    }));
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleGenerate = () => {
    const config = {
      ...reportConfig,
      customMetrics: selectedMetrics
    };
    onGenerate(config);
  };

  const isValidConfig = () => {
    return reportConfig.title.trim() && 
           reportConfig.dateRange.start && 
           reportConfig.dateRange.end &&
           Object.values(reportConfig.includeSections).some(Boolean);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Custom Report Builder</span>
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Report Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportConfig.title}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title"
                />
              </div>
              
              <div>
                <Label htmlFor="report-format">Output Format</Label>
                <Select 
                  value={reportConfig.format} 
                  onValueChange={(value: 'pdf' | 'excel' | 'json') => 
                    setReportConfig(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="json">JSON Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={reportConfig.dateRange.start}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={reportConfig.dateRange.end}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Report Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Report Sections</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="portfolio-summary"
                    checked={reportConfig.includeSections.portfolioSummary}
                    onCheckedChange={() => handleSectionToggle('portfolioSummary')}
                  />
                  <Label htmlFor="portfolio-summary" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Portfolio Summary</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="asset-performance"
                    checked={reportConfig.includeSections.assetPerformance}
                    onCheckedChange={() => handleSectionToggle('assetPerformance')}
                  />
                  <Label htmlFor="asset-performance" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Asset Performance</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="risk-analysis"
                    checked={reportConfig.includeSections.riskAnalysis}
                    onCheckedChange={() => handleSectionToggle('riskAnalysis')}
                  />
                  <Label htmlFor="risk-analysis" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Risk Analysis</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="performance-comparison"
                    checked={reportConfig.includeSections.performanceComparison}
                    onCheckedChange={() => handleSectionToggle('performanceComparison')}
                  />
                  <Label htmlFor="performance-comparison" className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Performance Comparison</span>
                  </Label>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax-report"
                    checked={reportConfig.includeSections.taxReport}
                    onCheckedChange={() => handleSectionToggle('taxReport')}
                  />
                  <Label htmlFor="tax-report" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Tax Report</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transaction-history"
                    checked={reportConfig.includeSections.transactionHistory}
                    onCheckedChange={() => handleSectionToggle('transactionHistory')}
                  />
                  <Label htmlFor="transaction-history" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Transaction History</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Custom Metrics</h3>
            <p className="text-sm text-gray-600">Select additional metrics to include in your report</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => handleMetricToggle(metric.id)}
                    />
                    <Label htmlFor={metric.id} className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{metric.label}</span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-delivery"
                  checked={reportConfig.emailDelivery}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, emailDelivery: !!checked }))
                  }
                />
                <Label htmlFor="email-delivery">Email delivery</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-report"
                  checked={reportConfig.scheduleReport}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, scheduleReport: !!checked }))
                  }
                />
                <Label htmlFor="schedule-report">Schedule recurring reports</Label>
              </div>
              
              {reportConfig.scheduleReport && (
                <div className="ml-6">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={reportConfig.frequency} 
                    onValueChange={(value: 'one-time' | 'daily' | 'weekly' | 'monthly') => 
                      setReportConfig(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-gray-600">
              {Object.values(reportConfig.includeSections).filter(Boolean).length} sections selected
              {selectedMetrics.length > 0 && ` • ${selectedMetrics.length} custom metrics`}
            </div>
            
            <div className="flex space-x-3">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleGenerate} 
                disabled={!isValidConfig()}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Generate Report</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomReportBuilder;