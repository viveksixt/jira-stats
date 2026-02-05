'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface AgingData {
  range: string;
  count: number;
  issues: string[];
}

interface IssueAgingChartProps {
  data: AgingData[];
  issues?: import('@/types/jira').JiraIssue[];
  onIssueClick?: (issues: import('@/types/jira').JiraIssue[]) => void;
}

const COLORS = [
  '#22c55e', // Green - fresh
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red - stale
];

const RANGE_LABELS: Record<string, string> = {
  '< 1 week': 'Fresh (< 1 week)',
  '1-2 weeks': 'Active (1-2 weeks)',
  '2-4 weeks': 'Aging (2-4 weeks)',
  '1-2 months': 'Stale (1-2 months)',
  '> 2 months': 'Critical (> 2 months)',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayRange = RANGE_LABELS[data.range] || data.range;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-[300px]">
        <p className="font-semibold text-foreground">{displayRange}</p>
        <p className="text-sm text-muted-foreground mb-2">
          Count: <span className="font-medium text-foreground">{data.count}</span>
        </p>
        {data.issues.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Issues:</p>
            <div className="flex flex-wrap gap-1 max-h-[100px] overflow-auto">
              {data.issues.slice(0, 10).map((key: string) => (
                <a
                  key={key}
                  href={`https://sixt-cloud.atlassian.net/browse/${key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted px-1 rounded text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {key}
                </a>
              ))}
              {data.issues.length > 10 && (
                <span className="text-muted-foreground">
                  +{data.issues.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function IssueAgingChart({ data, issues, onIssueClick }: IssueAgingChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [hiddenRanges, setHiddenRanges] = useState<Set<string>>(new Set());

  const handleBarClick = (data: any) => {
    if (issues && onIssueClick && data && data.issues) {
      // Filter issues by the issue keys in this age range
      const issueKeys = data.issues;
      const filteredIssues = issues.filter(issue => issueKeys.includes(issue.key));
      onIssueClick(filteredIssues);
    }
  };

  const toggleRange = (range: string) => {
    const newHidden = new Set(hiddenRanges);
    if (newHidden.has(range)) {
      newHidden.delete(range);
    } else {
      newHidden.add(range);
    }
    setHiddenRanges(newHidden);
  };

  const filteredData = useMemo(() => {
    return data.filter(d => !hiddenRanges.has(d.range) && d.count > 0);
  }, [data, hiddenRanges]);

  const totalOpen = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.count, 0);
  }, [filteredData]);

  const healthScore = useMemo(() => {
    // Calculate health based on aging distribution
    // More fresh issues = better health
    const weights = { '< 1 week': 1, '1-2 weeks': 0.8, '2-4 weeks': 0.5, '1-2 months': 0.2, '> 2 months': 0 };
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) return 100;

    const weightedSum = data.reduce((sum, d) => {
      const weight = weights[d.range as keyof typeof weights] || 0;
      return sum + (d.count * weight);
    }, 0);

    return Math.round((weightedSum / total) * 100);
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </Button>
        <Button
          variant={chartType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('pie')}
        >
          Pie Chart
        </Button>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Open: <span className="font-medium text-foreground">{totalOpen}</span>
          </span>
          <span className={`font-medium ${
            healthScore >= 70 ? 'text-green-600' :
            healthScore >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}>
            Health: {healthScore}%
          </span>
        </div>
      </div>

      {/* Legend with Toggleable Labels */}
      <div className="flex flex-wrap gap-2">
        {data.map((item, index) => (
          <button
            key={item.range}
            onClick={() => toggleRange(item.range)}
            className={`px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1 ${
              hiddenRanges.has(item.range)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent'
            }`}
            style={{
              borderColor: hiddenRanges.has(item.range) ? 'transparent' : COLORS[index],
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            {RANGE_LABELS[item.range] || item.range}: {item.count}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {totalOpen === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No open issues found. All issues in this sprint are closed.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tickFormatter={(value) => RANGE_LABELS[value] || value} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Issues"
                  onClick={handleBarClick}
                  style={{ cursor: issues && onIssueClick ? 'pointer' : 'default' }}
                >
                  {filteredData.map((entry, index) => {
                    const originalIndex = data.findIndex(d => d.range === entry.range);
                    return (
                      <Cell key={`cell-${index}`} fill={COLORS[originalIndex]} />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={filteredData.map(item => ({
                    ...item,
                    displayRange: RANGE_LABELS[item.range] || item.range
                  }))}
                  dataKey="count"
                  nameKey="displayRange"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  onClick={handleBarClick}
                  style={{ cursor: issues && onIssueClick ? 'pointer' : 'default' }}
                >
                  {filteredData.map((entry, index) => {
                    const originalIndex = data.findIndex(d => d.range === entry.range);
                    return (
                      <Cell key={`cell-${index}`} fill={COLORS[originalIndex]} />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
