import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'current-user';
    const chartType = searchParams.get('type') || 'portfolio_performance';
    const period = searchParams.get('period') || '1y';
    const includeBenchmark = searchParams.get('benchmark') === 'true';

    switch (chartType) {
      case 'portfolio_performance':
        return await getPortfolioPerformanceChart(userId, period, includeBenchmark);
      
      case 'asset_allocation':
        return await getAssetAllocationChart(userId);
      
      case 'sector_allocation':
        return await getSectorAllocationChart(userId);
      
      case 'risk_metrics':
        return await getRiskMetricsChart(userId, period);
      
      case 'benchmark_comparison':
        return await getBenchmarkComparisonChart(userId, period);
      
      case 'goal_progress':
        return await getGoalProgressChart(userId);
      
      case 'correlation_matrix':
        return await getCorrelationMatrixChart(userId);
      
      case 'performance_attribution':
        return await getPerformanceAttributionChart(userId, period);
      
      default:
        return NextResponse.json(
          { error: 'Invalid chart type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, userId, data } = body;

    switch (action) {
      case 'export_chart':
        return await exportChartData(userId, data);
      
      case 'save_chart_config':
        return await saveChartConfiguration(userId, data);
      
      case 'get_chart_config':
        return await getChartConfiguration(userId, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chart action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute chart action' },
      { status: 500 }
    );
  }
}

// Portfolio performance chart
async function getPortfolioPerformanceChart(userId: string, period: string, includeBenchmark: boolean) {
  const days = getPeriodDays(period);
  const data = [];
  
  // Generate performance data
  let portfolioValue = 100000; // Starting value
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate portfolio performance with market-like volatility
    const dailyReturn = (Math.random() - 0.48) * 0.02; // Slight upward bias
    portfolioValue *= (1 + dailyReturn);
    
    data.push({
      date: date.toISOString().split('T')[0],
      portfolioValue: Math.round(portfolioValue),
      portfolioReturn: ((portfolioValue - 100000) / 100000) * 100
    });
  }

  const chartData = {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Portfolio Value',
          data: data.map(d => d.portfolioValue),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Portfolio Performance'
        },
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      }
    }
  };

  // Add benchmark if requested
  if (includeBenchmark) {
    const benchmarkData = data.map((d, index) => ({
      date: d.date,
      niftyValue: 100000 * Math.pow(1.0008, index) // Mock NIFTY performance
    }));

    chartData.data.datasets.push({
      label: 'NIFTY 50',
      data: benchmarkData.map(d => d.niftyValue),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: false,
      tension: 0.4
    });
  }

  return NextResponse.json({
    success: true,
    chart: chartData,
    summary: {
      totalReturn: ((data[data.length - 1].portfolioValue - 100000) / 100000) * 100,
      annualizedReturn: ((data[data.length - 1].portfolioValue / 100000) ** (365 / days) - 1) * 100,
      maxValue: Math.max(...data.map(d => d.portfolioValue)),
      minValue: Math.min(...data.map(d => d.portfolioValue)),
      volatility: calculateVolatility(data.map(d => d.portfolioReturn))
    }
  });
}

// Asset allocation pie chart
async function getAssetAllocationChart(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          type: true,
          name: true
        }
      }
    }
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  
  const allocation = {};
  holdings.forEach(holding => {
    const assetType = holding.asset.type || 'Other';
    if (!allocation[assetType]) {
      allocation[assetType] = 0;
    }
    allocation[assetType] += holding.totalInvested;
  });

  const chartData = {
    type: 'doughnut',
    data: {
      labels: Object.keys(allocation),
      datasets: [
        {
          data: Object.values(allocation),
          backgroundColor: [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Yellow
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#F97316'  // Orange
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Asset Allocation'
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = ((context.parsed / totalValue) * 100).toFixed(1);
              return context.label + ': ₹' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    allocation: Object.keys(allocation).map(key => ({
      name: key,
      value: allocation[key],
      percentage: ((allocation[key] / totalValue) * 100).toFixed(1)
    }))
  });
}

// Sector allocation chart
async function getSectorAllocationChart(userId: string) {
  // Mock sector allocation data (in production, get from actual holdings)
  const sectorAllocation = [
    { name: 'Banking & Financial', value: 35000, percentage: 35 },
    { name: 'Technology', value: 25000, percentage: 25 },
    { name: 'Energy', value: 20000, percentage: 20 },
    { name: 'Healthcare', value: 10000, percentage: 10 },
    { name: 'Consumer Goods', value: 8000, percentage: 8 },
    { name: 'Others', value: 2000, percentage: 2 }
  ];

  const chartData = {
    type: 'bar',
    data: {
      labels: sectorAllocation.map(s => s.name),
      datasets: [
        {
          label: 'Allocation (₹)',
          data: sectorAllocation.map(s => s.value),
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#F97316'
          ],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Sector Allocation'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    allocation: sectorAllocation
  });
}

// Risk metrics chart
async function getRiskMetricsChart(userId: string, period: string) {
  // Mock risk metrics over time
  const days = getPeriodDays(period);
  const data = [];
  let currentVolatility = 15;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate volatility changes
    currentVolatility += (Math.random() - 0.5) * 2;
    currentVolatility = Math.max(5, Math.min(30, currentVolatility));
    
    data.push({
      date: date.toISOString().split('T')[0],
      volatility: Math.round(currentVolatility * 100) / 100,
      var95: Math.round(currentVolatility * 1.65 * 100) / 100,
      sharpeRatio: Math.round((12 - 6) / currentVolatility * 100) / 100
    });
  }

  const chartData = {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Volatility (%)',
          data: data.map(d => d.volatility),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'VaR 95 (%)',
          data: data.map(d => d.var95),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Risk Metrics Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    currentMetrics: data[data.length - 1],
    riskLevel: data[data.length - 1].volatility > 20 ? 'High' : 
               data[data.length - 1].volatility > 15 ? 'Moderate' : 'Low'
  });
}

// Benchmark comparison chart
async function getBenchmarkComparisonChart(userId: string, period: string) {
  const days = getPeriodDays(period);
  
  // Generate comparison data
  const portfolioData = [];
  const niftyData = [];
  const sensexData = [];
  
  let portfolioValue = 100000;
  let niftyValue = 100000;
  let sensexValue = 100000;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate different performance
    portfolioValue *= (1 + (Math.random() - 0.45) * 0.025);
    niftyValue *= (1 + (Math.random() - 0.48) * 0.02);
    sensexValue *= (1 + (Math.random() - 0.47) * 0.022);
    
    const dateStr = date.toISOString().split('T')[0];
    
    portfolioData.push({
      date: dateStr,
      value: Math.round(portfolioValue),
      return: ((portfolioValue - 100000) / 100000) * 100
    });
    
    niftyData.push({
      date: dateStr,
      value: Math.round(niftyValue),
      return: ((niftyValue - 100000) / 100000) * 100
    });
    
    sensexData.push({
      date: dateStr,
      value: Math.round(sensexValue),
      return: ((sensexValue - 100000) / 100000) * 100
    });
  }

  const chartData = {
    type: 'line',
    data: {
      labels: portfolioData.map(d => d.date),
      datasets: [
        {
          label: 'Portfolio',
          data: portfolioData.map(d => d.return),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'NIFTY 50',
          data: niftyData.map(d => d.return),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'SENSEX',
          data: sensexData.map(d => d.return),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Performance vs Benchmarks'
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    performance: {
      portfolio: portfolioData[portfolioData.length - 1].return,
      nifty: niftyData[niftyData.length - 1].return,
      sensex: sensexData[sensexData.length - 1].return,
      outperformance: {
        nifty: portfolioData[portfolioData.length - 1].return - niftyData[niftyData.length - 1].return,
        sensex: portfolioData[portfolioData.length - 1].return - sensexData[sensexData.length - 1].return
      }
    }
  });
}

// Goal progress chart
async function getGoalProgressChart(userId: string) {
  const goals = await prisma.portfolioTarget.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' }
  });

  const currentPortfolioValue = 125000; // Mock current value

  const goalProgress = goals.map(goal => {
    const progress = Math.min((currentPortfolioValue / goal.targetAmount) * 100, 100);
    const monthsRemaining = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    
    return {
      name: `Goal ${goals.indexOf(goal) + 1}`,
      target: goal.targetAmount,
      current: Math.min(currentPortfolioValue, goal.targetAmount),
      progress: Math.round(progress),
      targetDate: goal.targetDate.toISOString().split('T')[0],
      monthsRemaining: Math.max(0, monthsRemaining)
    };
  });

  const chartData = {
    type: 'bar',
    data: {
      labels: goalProgress.map(g => g.name),
      datasets: [
        {
          label: 'Current Progress',
          data: goalProgress.map(g => g.current),
          backgroundColor: '#3B82F6',
          borderWidth: 0
        },
        {
          label: 'Target Amount',
          data: goalProgress.map(g => g.target),
          backgroundColor: '#E5E7EB',
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Goal Progress'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    goals: goalProgress
  });
}

// Correlation matrix heatmap
async function getCorrelationMatrixChart(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          symbol: true,
          name: true
        }
      }
    },
    take: 10 // Limit to top 10 holdings
  });

  const symbols = holdings.map(h => h.asset.symbol);
  const n = symbols.length;
  
  // Generate correlation matrix (mock data)
  const correlationMatrix = [];
  for (let i = 0; i < n; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1.0;
      } else {
        correlationMatrix[i][j] = Math.random() * 0.8 + 0.1; // Random correlation 0.1 to 0.9
      }
    }
  }

  const chartData = {
    type: 'heatmap',
    data: {
      labels: symbols,
      datasets: [{
        label: 'Correlation',
        data: correlationMatrix.flat(),
        backgroundColor: correlationMatrix.flat().map(value => {
          const intensity = Math.abs(value);
          return `rgba(59, 130, 246, ${intensity})`;
        }),
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Asset Correlation Matrix'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          type: 'category',
          labels: symbols
        },
        y: {
          type: 'category',
          labels: symbols
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    matrix: correlationMatrix,
    symbols
  });
}

// Performance attribution chart
async function getPerformanceAttributionChart(userId: string, period: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          name: true,
          symbol: true
        }
      }
    }
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  
  const attribution = holdings.map(holding => {
    const weight = holding.totalInvested / totalValue;
    const mockReturn = (Math.random() - 0.3) * 20; // Random return between -6% and 14%
    const contribution = weight * mockReturn;
    
    return {
      asset: holding.asset.name,
      symbol: holding.asset.symbol,
      weight: Math.round(weight * 100 * 100) / 100,
      return: Math.round(mockReturn * 100) / 100,
      contribution: Math.round(contribution * 100) / 100
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const chartData = {
    type: 'bar',
    data: {
      labels: attribution.map(a => a.symbol),
      datasets: [
        {
          label: 'Performance Contribution (%)',
          data: attribution.map(a => a.contribution),
          backgroundColor: attribution.map(a => a.contribution >= 0 ? '#10B981' : '#EF4444'),
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Performance Attribution'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  };

  return NextResponse.json({
    success: true,
    chart: chartData,
    attribution,
    totalReturn: attribution.reduce((sum, a) => sum + a.contribution, 0)
  });
}

// Helper functions
function getPeriodDays(period: string): number {
  switch (period) {
    case '1d': return 1;
    case '1w': return 7;
    case '1m': return 30;
    case '3m': return 90;
    case '6m': return 180;
    case '1y': return 365;
    case '2y': return 730;
    case '5y': return 1825;
    default: return 365;
  }
}

function calculateVolatility(returns: number[]): number {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDifferences = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / returns.length;
  return Math.sqrt(variance);
}

async function exportChartData(userId: string, data: any) {
  // Export chart data logic
  return NextResponse.json({
    success: true,
    message: 'Chart data exported',
    downloadUrl: '/api/dashboard/charts/export/download-id'
  });
}

async function saveChartConfiguration(userId: string, config: any) {
  // Save chart configuration logic
  return NextResponse.json({
    success: true,
    message: 'Chart configuration saved'
  });
}

async function getChartConfiguration(userId: string, data: any) {
  // Get chart configuration logic
  return NextResponse.json({
    success: true,
    configuration: {
      defaultPeriod: '1y',
      showBenchmark: true,
      chartTypes: ['portfolio_performance', 'asset_allocation', 'risk_metrics']
    }
  });
}