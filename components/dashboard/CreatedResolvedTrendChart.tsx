'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface TrendDataPoint {
  date: string;
  created: number;
  resolved: number;
  bugsCreated: number;
  bugsResolved: number;
  storiesCreated: number;
  storiesResolved: number;
}

interface CreatedResolvedTrendChartProps {
  data: TrendDataPoint[];
  issues?: import('@/types/jira').JiraIssue[];
  onIssueClick?: (issues: import('@/types/jira').JiraIssue[]) => void;
}

const SERIES_CONFIG = [
  { key: 'created', name: 'Total Created', color: '#3b82f6', type: 'total' },
  { key: 'resolved', name: 'Total Resolved', color: '#22c55e', type: 'total' },
  { key: 'bugsCreated', name: 'Bugs Created', color: '#f87171', type: 'bugs' },
  { key: 'bugsResolved', name: 'Bugs Resolved', color: '#4ade80', type: 'bugs' },
  { key: 'storiesCreated', name: 'Stories Created', color: '#60a5fa', type: 'stories' },
  { key: 'storiesResolved', name: 'Stories Resolved', color: '#a78bfa', type: 'stories' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}:</span>
              </span>
              <span className="text-sm font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Change:</span>
              <span className={`font-medium ${
                (payload.find((p: any) => p.dataKey === 'resolved')?.value || 0) -
                (payload.find((p: any) => p.dataKey === 'created')?.value || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {(payload.find((p: any) => p.dataKey === 'resolved')?.value || 0) -
                  (payload.find((p: any) => p.dataKey === 'created')?.value || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function CreatedResolvedTrendChart({ data, issues, onIssueClick }: CreatedResolvedTrendChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'total' | 'bugs' | 'stories'>('total');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  const handlePointClick = (dataPoint: any) => {
    if (issues && onIssueClick && dataPoint && dataPoint.payload) {
      // Show all issues for the clicked date
      const clickedDate = dataPoint.payload.date;
      const dateIssues = issues.filter(issue => {
        const createdDate = new Date(issue.fields.created).toISOString().split('T')[0];
        const resolvedDate = issue.fields.resolutiondate 
          ? new Date(issue.fields.resolutiondate).toISOString().split('T')[0]
          : null;
        return createdDate === clickedDate || resolvedDate === clickedDate;
      });
      onIssueClick(dateIssues);
    }
  };

  const toggleSeries = (key: string) => {
    const newHidden = new Set(hiddenSeries);
    if (newHidden.has(key)) {
      newHidden.delete(key);
    } else {
      newHidden.add(key);
    }
    setHiddenSeries(newHidden);
  };

  const visibleSeries = useMemo(() => {
    return SERIES_CONFIG.filter(s => s.type === viewMode && !hiddenSeries.has(s.key));
  }, [viewMode, hiddenSeries]);

  const relevantSeries = useMemo(() => {
    return SERIES_CONFIG.filter(s => s.type === viewMode);
  }, [viewMode]);

  const summary = useMemo(() => {
    const prefix = viewMode === 'total' ? '' : viewMode === 'bugs' ? 'bugs' : 'stories';
    const createdKey = viewMode === 'total' ? 'created' : `${prefix}Created`;
    const resolvedKey = viewMode === 'total' ? 'resolved' : `${prefix}Resolved`;

    const totalCreated = data.reduce((sum, d) => sum + (d[createdKey as keyof TrendDataPoint] as number || 0), 0);
    const totalResolved = data.reduce((sum, d) => sum + (d[resolvedKey as keyof TrendDataPoint] as number || 0), 0);

    return {
      totalCreated,
      totalResolved,
      netChange: totalResolved - totalCreated,
    };
  }, [data, viewMode]);

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'total' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('total')}
          >
            All Issues
          </Button>
          <Button
            variant={viewMode === 'bugs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('bugs')}
          >
            Bugs Only
          </Button>
          <Button
            variant={viewMode === 'stories' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('stories')}
          >
            Stories Only
          </Button>
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant={chartType === 'area' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('area')}
          >
            Area
          </Button>
          <Button
            variant={chartType === 'line' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium">{summary.totalCreated}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Resolved:</span>
          <span className="font-medium">{summary.totalResolved}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Net:</span>
          <span className={`font-medium ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.netChange >= 0 ? '+' : ''}{summary.netChange}
          </span>
        </div>
      </div>

      {/* Legend with Toggleable Series */}
      <div className="flex flex-wrap gap-2">
        {relevantSeries.map((series) => (
          <button
            key={series.key}
            onClick={() => toggleSeries(series.key)}
            className={`px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1 ${
              hiddenSeries.has(series.key)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent'
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
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              {visibleSeries.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.3}
                  activeDot={{
                    r: 6,
                    onClick: handlePointClick,
                    style: { cursor: 'pointer' }
                  }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              {visibleSeries.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ fill: series.color, r: 3 }}
                  activeDot={{
                    r: 6,
                    onClick: handlePointClick,
                    style: { cursor: 'pointer' }
                  }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
