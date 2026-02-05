'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BugsTrendDataPoint {
  date: string;
  created: number;
  resolved: number;
}

interface BugsTrendChartProps {
  data: BugsTrendDataPoint[];
  issues?: import('@/types/jira').JiraIssue[];
  onIssueClick?: (issues: import('@/types/jira').JiraIssue[]) => void;
}

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

export function BugsTrendChart({ data, issues, onIssueClick }: BugsTrendChartProps) {
  const handlePointClick = (event: any, data: any) => {
    if (issues && onIssueClick && data && data.payload) {
      // Show all bugs for the clicked date
      const clickedDate = data.payload.date;
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

  const summary = useMemo(() => {
    const totalCreated = data.reduce((sum, d) => sum + (d.created || 0), 0);
    const totalResolved = data.reduce((sum, d) => sum + (d.resolved || 0), 0);
    return {
      totalCreated,
      totalResolved,
      netChange: totalResolved - totalCreated,
    };
  }, [data]);

  return (
    <div className="space-y-4">
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

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
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
            <Area
              type="monotone"
              dataKey="created"
              name="Bugs Created"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              activeDot={{
                r: 6,
                onClick: handlePointClick,
                style: { cursor: 'pointer' }
              }}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Bugs Resolved"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.3}
              activeDot={{
                r: 6,
                onClick: handlePointClick,
                style: { cursor: 'pointer' }
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
