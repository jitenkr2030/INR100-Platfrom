'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AssetAllocationChartProps {
  data?: any[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280'  // gray
];

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ data }) => {
  // Mock data for demonstration if no data provided
  const chartData = data && data.length > 0 ? data.slice(0, 8).map((asset, index) => ({
    name: asset.symbol,
    value: asset.allocation,
    amount: asset.value
  })) : [
    { name: 'RELIANCE', value: 25.5, amount: 31875 },
    { name: 'TCS', value: 22.3, amount: 27875 },
    { name: 'HDFCBANK', value: 20.1, amount: 25125 },
    { name: 'INFY', value: 15.2, amount: 19000 },
    { name: 'ICICIBANK', value: 12.8, amount: 16000 },
    { name: 'Others', value: 4.1, amount: 5125 }
  ];

  const formatTooltip = (value: number, name: string, props: any) => {
    const amount = props.payload.amount;
    return [
      `₹${amount.toLocaleString()} (${value.toFixed(1)}%)`,
      name
    ];
  };

  const formatLegend = (value: string, entry: any) => {
    return `${value} (${entry.payload.value.toFixed(1)}%)`;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e5e5', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            formatter={formatLegend}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetAllocationChart;