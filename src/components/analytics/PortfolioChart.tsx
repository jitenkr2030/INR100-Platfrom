'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioChartProps {
  data?: any;
  dateRange: string;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, dateRange }) => {
  // Mock data for demonstration - in reality, this would come from your data prop
  const generateMockData = () => {
    const points = dateRange === '1D' ? 24 : dateRange === '1W' ? 7 : dateRange === '1M' ? 30 : 365;
    const data = [];
    const baseValue = 100000;
    
    for (let i = 0; i < points; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (points - i - 1));
      
      const variance = (Math.random() - 0.5) * 0.02; // ±1% daily variance
      const value = baseValue * (1 + variance * (i / points)) * (1 + (data?.totalReturnPercent || 0) / 100 * (i / points));
      
      data.push({
        date: date.toLocaleDateString(),
        value: Math.round(value),
        change: Math.round(value - baseValue)
      });
    }
    
    return data;
  };

  const chartData = generateMockData();

  const formatTooltip = (value: number, name: string) => {
    if (name === 'value') {
      return [`₹${value.toLocaleString()}`, 'Portfolio Value'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (dateRange === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (dateRange === '1W' || dateRange === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxisLabel}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#333' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e5e5', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;