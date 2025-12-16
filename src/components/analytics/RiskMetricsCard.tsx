'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Target, 
  TrendingDown,
  BarChart3,
  PieChart,
  Globe
} from 'lucide-react';

interface RiskMetricsCardProps {
  data: {
    portfolioRisk: number;
    diversificationScore: number;
    concentrationRisk: number;
    sectorExposure: Record<string, number>;
    geographicExposure: Record<string, number>;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    recommendations: string[];
    topHoldings?: Array<{
      symbol: string;
      allocation: number;
    }>;
    var95?: number;
    expectedShortfall?: number;
  };
  detailed?: boolean;
}

export const RiskMetricsCard: React.FC<RiskMetricsCardProps> = ({ data, detailed = false }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return Shield;
      case 'MODERATE': return Target;
      case 'HIGH': return AlertTriangle;
      default: return BarChart3;
    }
  };

  const RiskIcon = getRiskIcon(data.riskLevel);

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Risk Level Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RiskIcon className="h-5 w-5" />
              <span>Risk Assessment</span>
              <Badge className={getRiskColor(data.riskLevel)}>
                {data.riskLevel} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.portfolioRisk.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Portfolio Risk</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.diversificationScore}/100
                </div>
                <p className="text-sm text-gray-600">Diversification Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.concentrationRisk.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Concentration Risk</p>
              </div>
            </div>

            {/* Risk Metrics Progress */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Diversification</span>
                  <span>{data.diversificationScore}%</span>
                </div>
                <Progress value={data.diversificationScore} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Risk Level</span>
                  <span>{data.portfolioRisk.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(data.portfolioRisk, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value at Risk */}
        {(data.var95 || data.expectedShortfall) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span>Value at Risk</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    ₹{Math.abs(data.var95 || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-red-700">VaR (95% confidence)</p>
                  <p className="text-xs text-gray-600">Maximum expected loss in worst 5% scenarios</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    ₹{Math.abs(data.expectedShortfall || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-orange-700">Expected Shortfall</p>
                  <p className="text-xs text-gray-600">Average loss when VaR is exceeded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sector Exposure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Sector Exposure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.sectorExposure)
                .sort(([,a], [,b]) => b - a)
                .map(([sector, exposure]) => (
                  <div key={sector} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{sector}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={exposure} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {exposure.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Exposure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Geographic Exposure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.geographicExposure)
                .sort(([,a], [,b]) => b - a)
                .map(([geo, exposure]) => (
                  <div key={geo} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{geo}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={exposure} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {exposure.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Holdings */}
        {data.topHoldings && data.topHoldings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Holdings Concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topHoldings.map((holding, index) => (
                  <div key={holding.symbol} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{holding.symbol}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={holding.allocation} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {holding.allocation.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Risk Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compact view for overview
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <RiskIcon className="h-4 w-4" />
            <span>Risk Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={getRiskColor(data.riskLevel)}>
              {data.riskLevel}
            </Badge>
            <span className="text-lg font-bold">{data.portfolioRisk.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Diversification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-lg font-bold">{data.diversificationScore}/100</div>
            <Progress value={data.diversificationScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Concentration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-lg font-bold">{data.concentrationRisk.toFixed(1)}%</div>
            <Progress value={data.concentrationRisk} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMetricsCard;