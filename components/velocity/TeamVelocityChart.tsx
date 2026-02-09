'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { VelocitySprintData, JiraIssue } from '@/types/jira';

interface TeamVelocityChartProps {
  data: VelocitySprintData[];
  onSprintClick?: (issues: JiraIssue[], sprintName: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{data.sprintName}</p>
        <p className="text-sm text-muted-foreground">
          Date: <span className="font-medium text-foreground">
            {new Date(data.completeDate).toLocaleDateString()}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Velocity: <span className="font-medium text-foreground">{data.velocity} pts</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Completed: <span className="font-medium text-foreground">{data.completedIssueCount} issues</span>
        </p>
      </div>
    );
  }
  return null;
};

export function TeamVelocityChart({ data, onSprintClick }: TeamVelocityChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const handleDataClick = (dataPoint: any) => {
    if (onSprintClick && dataPoint.issues) {
      onSprintClick(dataPoint.issues, dataPoint.sprintName);
    }
  };

  // Calculate average velocity for reference line
  const avgVelocity = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.velocity, 0) / data.length) : 0;

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </Button>
        <Button
          variant={chartType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('line')}
        >
          Line Chart
        </Button>
        {avgVelocity > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            Avg: {avgVelocity} pts
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="sprintName"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="velocity"
                name="Velocity"
                fill="hsl(var(--chart-1))"
                onClick={handleDataClick}
                style={{ cursor: onSprintClick ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.velocity > avgVelocity ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="sprintName"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="velocity"
                name="Velocity"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                activeDot={{ r: 6 }}
                onClick={handleDataClick}
                style={{ cursor: onSprintClick ? 'pointer' : 'default' }}
              />
              {avgVelocity > 0 && (
                <Line
                  type="monotone"
                  dataKey={() => avgVelocity}
                  name="Average"
                  stroke="hsl(var(--chart-4))"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="p-2 border rounded bg-muted/50">
            <div className="text-muted-foreground text-xs">Avg Velocity</div>
            <div className="font-semibold">{avgVelocity} pts</div>
          </div>
          <div className="p-2 border rounded bg-muted/50">
            <div className="text-muted-foreground text-xs">Max Velocity</div>
            <div className="font-semibold">
              {Math.max(...data.map(d => d.velocity))} pts
            </div>
          </div>
          <div className="p-2 border rounded bg-muted/50">
            <div className="text-muted-foreground text-xs">Min Velocity</div>
            <div className="font-semibold">
              {Math.min(...data.map(d => d.velocity))} pts
            </div>
          </div>
          <div className="p-2 border rounded bg-muted/50">
            <div className="text-muted-foreground text-xs">Total Sprints</div>
            <div className="font-semibold">{data.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
