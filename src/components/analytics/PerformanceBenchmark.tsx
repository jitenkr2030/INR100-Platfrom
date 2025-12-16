'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  BarChart3,
  Calendar
} from 'lucide-react';

interface PerformanceBenchmarkProps {
  data?: {
    annualizedReturn?: number;
    volatility?: number;
    sharpeRatio?: number;
    beta?: number;
    alpha?: number;
    maxDrawdown?: number;
  };
}

export const PerformanceBenchmark: React.FC<PerformanceBenchmarkProps> = ({ data }) => {
  // Mock benchmark data
  const benchmarkData = [
    { period: '1M', portfolio: 6.4, nifty: 5.2, sensex: 4.8, bank: 3.1 },
    { period: '3M', portfolio: 12.8, nifty: 10.1, sensex: 9.5, bank: 7.8 },
    { period: '6M', portfolio: 18.5, nifty: 14.2, sensex: 13.1, bank: 11.5 },
    { period: '1Y', portfolio: 20.0, nifty: 15.5, sensex: 14.8, bank: 12.3 },
    { period: '3Y', portfolio: 16.8, nifty: 12.3, sensex: 11.8, bank: 9.5 },
    { period: '5Y', portfolio: 14.2, nifty: 10.8, sensex: 10.2, bank: 8.1 }
  ];

  const riskReturnData = [
    { name: 'Your Portfolio', return: data?.annualizedReturn || 20.0, risk: data?.volatility || 16.2, color: '#3b82f6' },
    { name: 'NIFTY 50', return: 15.5, risk: 18.5, color: '#10b981' },
    { name: 'SENSEX', return: 14.8, risk: 17.2, color: '#f59e0b' },
    { name: 'BANK NIFTY', return: 12.3, risk: 22.1, color: '#ef4444' },
    { name: 'Risk-free Rate', return: 6.0, risk: 0, color: '#6b7280' }
  ];

  const formatTooltip = (value: number, name: string) => {
    return [`${value.toFixed(1)}%`, name];
  };

  const getPerformanceBadge = (portfolioReturn: number, benchmarkReturn: number) => {
    const difference = portfolioReturn - benchmarkReturn;
    if (difference > 2) {
      return { text: 'Outperforming', variant: 'default' as const, color: 'text-green-600' };
    } else if (difference < -2) {
      return { text: 'Underperforming', variant: 'destructive' as const, color: 'text-red-600' };
    } else {
      return { text: 'In-line', variant: 'secondary' as const, color: 'text-yellow-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Return</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.annualizedReturn || 20.0).toFixed(1)}%
            </div>
            <Badge variant="outline" className="mt-1">
              vs NIFTY: +4.5%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Volatility</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.volatility || 16.2).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Lower is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Sharpe Ratio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.sharpeRatio || 1.14).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Risk-adjusted return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Alpha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.alpha || 2.3).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Excess return</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Performance vs Benchmarks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#666" />
                <YAxis 
                  stroke="#666" 
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="portfolio" fill="#3b82f6" name="Your Portfolio" />
                <Bar dataKey="nifty" fill="#10b981" name="NIFTY 50" />
                <Bar dataKey="sensex" fill="#f59e0b" name="SENSEX" />
                <Bar dataKey="bank" fill="#ef4444" name="BANK NIFTY" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk-Return Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Risk-Return Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskReturnData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  domain={[0, 25]} 
                  stroke="#666"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#666"
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'return') return [`${value.toFixed(1)}%`, 'Return'];
                    if (name === 'risk') return [`${value.toFixed(1)}%`, 'Risk'];
                    return [value, name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="return" fill="#3b82f6" name="return" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Your portfolio shows strong risk-adjusted returns</p>
            <p>• Efficient frontier analysis indicates optimal risk-return balance</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rolling Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarkData.map((item) => {
                const portfolioBadge = getPerformanceBadge(item.portfolio, item.nifty);
                return (
                  <div key={item.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{item.period}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold">{item.portfolio.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Portfolio</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.nifty.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">NIFTY</div>
                      </div>
                      <Badge variant={portfolioBadge.variant} className={portfolioBadge.color}>
                        {portfolioBadge.text}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Beta</span>
                <div className="text-right">
                  <div className="font-bold">{(data?.beta || 1.08).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Market sensitivity</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Max Drawdown</span>
                <div className="text-right">
                  <div className="font-bold text-red-600">-{(data?.maxDrawdown || 8.5).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Worst decline</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Information Ratio</span>
                <div className="text-right">
                  <div className="font-bold">0.85</div>
                  <div className="text-sm text-gray-600">Active return</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Tracking Error</span>
                <div className="text-right">
                  <div className="font-bold">3.2%</div>
                  <div className="text-sm text-gray-600">Deviation from benchmark</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">75th</div>
              <p className="text-sm text-gray-600">Percentile Ranking</p>
              <p className="text-xs text-gray-500 mt-1">Among similar portfolios</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+4.5%</div>
              <p className="text-sm text-gray-600">Outperformance</p>
              <p className="text-xs text-gray-500 mt-1">vs NIFTY 50 (1Y)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1.14</div>
              <p className="text-sm text-gray-600">Sharpe Ratio</p>
              <p className="text-xs text-gray-500 mt-1">Risk-adjusted performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceBenchmark;