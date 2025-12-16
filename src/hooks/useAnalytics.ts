'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Target,
  AlertTriangle,
  DollarSign,
  Percent
} from 'lucide-react';

interface PortfolioAnalytics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
}

interface AssetPerformance {
  symbol: string;
  name: string;
  allocation: number;
  value: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  volatility: number;
  beta: number;
}

interface RiskMetrics {
  portfolioRisk: number;
  diversificationScore: number;
  concentrationRisk: number;
  sectorExposure: Record<string, number>;
  geographicExposure: Record<string, number>;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  recommendations: string[];
}

interface UseAnalyticsReturn {
  portfolioAnalytics: PortfolioAnalytics | null;
  assetPerformance: AssetPerformance[];
  riskMetrics: RiskMetrics | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  exportReport: (format: 'pdf' | 'excel' | 'csv') => Promise<void>;
  generateCustomReport: (config: any) => Promise<any>;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [assetPerformance, setAssetPerformance] = useState<AssetPerformance[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioAnalytics = useCallback(async () => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/analytics/portfolio');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setPortfolioAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchAssetPerformance = useCallback(async () => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/analytics/assets');
      if (!response.ok) throw new Error('Failed to fetch asset performance');
      
      const data = await response.json();
      setAssetPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchRiskMetrics = useCallback(async () => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/analytics/risk');
      if (!response.ok) throw new Error('Failed to fetch risk metrics');
      
      const data = await response.json();
      setRiskMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchPortfolioAnalytics(),
        fetchAssetPerformance(),
        fetchRiskMetrics()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPortfolioAnalytics, fetchAssetPerformance, fetchRiskMetrics]);

  const exportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data: { portfolioAnalytics, assetPerformance, riskMetrics } })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [portfolioAnalytics, assetPerformance, riskMetrics]);

  const generateCustomReport = useCallback(async (config: any) => {
    try {
      const response = await fetch('/api/analytics/custom-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Report generation failed');

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
      return null;
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    portfolioAnalytics,
    assetPerformance,
    riskMetrics,
    isLoading,
    error,
    refreshData,
    exportReport,
    generateCustomReport
  };
};