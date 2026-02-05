'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import type { JiraIssue } from '@/types/jira';

interface TechDebtChartProps {
  data: Array<{
    sprint: string;
    techDebt: number;
    product: number;
  }>;
  techIssues?: JiraIssue[];
  productIssues?: JiraIssue[];
  onTechClick?: (issues: JiraIssue[]) => void;
  onProductClick?: (issues: JiraIssue[]) => void;
}

const COLORS = {
  techDebt: '#ef4444',  // Red
  product: '#3b82f6',   // Blue
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.fill }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TechDebtChart({ data, techIssues, productIssues, onTechClick, onProductClick }: TechDebtChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleTechDebtClick = (data: any) => {
    if (techIssues && onTechClick) {
      onTechClick(techIssues);
    }
  };

  const handleProductClick = (data: any) => {
    if (productIssues && onProductClick) {
      onProductClick(productIssues);
    }
  };

  const toggleSeries = (seriesKey: string) => {
    const newHidden = new Set(hiddenSeries);
    if (newHidden.has(seriesKey)) {
      newHidden.delete(seriesKey);
    } else {
      newHidden.add(seriesKey);
    }
    setHiddenSeries(newHidden);
  };

  const seriesOptions = [
    { key: 'techDebt', name: 'Tech Debt', color: COLORS.techDebt },
    { key: 'product', name: 'Product Work', color: COLORS.product },
  ];

  return (
    <div className="space-y-4">
      {/* Legend with Toggleable Buttons */}
      <div className="flex flex-wrap gap-2">
        {seriesOptions.map((series) => (
          <button
            key={series.key}
            onClick={() => toggleSeries(series.key)}
            className={`px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1 ${
              hiddenSeries.has(series.key)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent cursor-pointer'
            }`}
            style={{
              borderColor: hiddenSeries.has(series.key) ? 'transparent' : series.color,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.name}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis label={{ value: 'Issues', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {!hiddenSeries.has('techDebt') && (
              <Bar 
                dataKey="techDebt" 
                fill={COLORS.techDebt} 
                name="Tech Debt"
                onClick={handleTechDebtClick}
                style={{ cursor: 'pointer' }}
              />
            )}
            {!hiddenSeries.has('product') && (
              <Bar 
                dataKey="product" 
                fill={COLORS.product} 
                name="Product Work"
                onClick={handleProductClick}
                style={{ cursor: 'pointer' }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
