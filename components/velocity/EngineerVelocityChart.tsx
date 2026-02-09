'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import type { EngineerVelocityData, JiraIssue } from '@/types/jira';

interface EngineerVelocityChartProps {
  data: EngineerVelocityData[];
  onEngineerDataClick?: (issues: JiraIssue[], engineerName: string, sprintName: string) => void;
}

const FALLBACK_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const sprint = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{sprint.sprintName}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(sprint.completeDate).toLocaleDateString()}
        </p>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value} pts</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function EngineerVelocityChart({ data, onEngineerDataClick }: EngineerVelocityChartProps) {
  const [hiddenEngineers, setHiddenEngineers] = useState<Set<string>>(new Set());

  // Extract unique engineers
  const engineers = useMemo(() => {
    const engineerSet = new Set<string>();
    data.forEach(sprint => {
      sprint.assignees.forEach(assignee => {
        engineerSet.add(assignee.displayName);
      });
    });
    return Array.from(engineerSet);
  }, [data]);

  // Transform data for chart (add velocity fields for each engineer)
  const chartData = useMemo(() => {
    return data.map(sprint => {
      const row: any = {
        sprintName: sprint.sprintName,
        completeDate: sprint.completeDate,
      };

      sprint.assignees.forEach(assignee => {
        row[assignee.displayName] = assignee.velocity;
      });

      return row;
    });
  }, [data]);

  const issueMap = useMemo(() => {
    const map = new Map<string, JiraIssue[]>();
    data.forEach(sprint => {
      sprint.assignees.forEach(assignee => {
        map.set(`${sprint.sprintName}::${assignee.displayName}`, assignee.issues || []);
      });
    });
    return map;
  }, [data]);

  const toggleEngineer = (displayName: string) => {
    const newHidden = new Set(hiddenEngineers);
    if (newHidden.has(displayName)) {
      newHidden.delete(displayName);
    } else {
      newHidden.add(displayName);
    }
    setHiddenEngineers(newHidden);
  };

  const visibleEngineers = engineers.filter(e => !hiddenEngineers.has(e));

  // Calculate totals per engineer
  const engineerTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    data.forEach(sprint => {
      sprint.assignees.forEach(assignee => {
        totals[assignee.displayName] = (totals[assignee.displayName] || 0) + assignee.velocity;
      });
    });
    return totals;
  }, [data]);

  const renderDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (cx == null || cy == null) return null;
    const engineerName = String(dataKey);
    const sprintName = payload?.sprintName;
    const issues = sprintName ? issueMap.get(`${sprintName}::${engineerName}`) || [] : [];
    const canClick = onEngineerDataClick && issues.length > 0;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={props.stroke}
        stroke="none"
        style={{ cursor: canClick ? 'pointer' : 'default' }}
        onClick={() => {
          if (canClick) {
            onEngineerDataClick(issues, engineerName, sprintName);
          }
        }}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Engineer Legend with Toggleable Labels */}
      <div className="flex flex-wrap gap-2">
        {engineers.map((engineer, index) => (
          <button
            key={engineer}
            onClick={() => toggleEngineer(engineer)}
            className={`px-2 py-1 text-xs rounded-md border transition-all ${
              hiddenEngineers.has(engineer)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent'
            }`}
            style={{
              borderColor: hiddenEngineers.has(engineer)
                ? 'transparent'
                : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
            />
            {engineer}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
            <Legend />
            {visibleEngineers.map((engineer, index) => (
              <Line
                key={engineer}
                type="monotone"
                dataKey={engineer}
                name={engineer}
                stroke={FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={renderDot}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Engineer Stats */}
      {engineers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          {engineers.map((engineer, idx) => (
            <div
              key={engineer}
              className="p-2 border rounded bg-muted/50"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
              }}
            >
              <div className="text-muted-foreground text-xs truncate">{engineer}</div>
              <div className="font-semibold text-base">
                {engineerTotals[engineer]} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
