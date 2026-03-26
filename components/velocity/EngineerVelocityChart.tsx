'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { EngineerVelocityData, JiraIssue } from '@/types/jira';

interface EngineerVelocityChartProps {
  data: EngineerVelocityData[];
  onPointClick?: (issues: JiraIssue[], engineerName: string, label: string) => void;
}

const COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <div className="font-semibold">{p.sprintName}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {p.completeDate ? new Date(p.completeDate).toLocaleDateString() : ''}
      </div>
      <div className="space-y-1">
        {payload.map((entry: any) =>
          entry.value > 0 ? (
            <div key={entry.dataKey} className="text-sm" style={{ color: entry.fill }}>
              {entry.name}: <span className="font-medium">{entry.value} pts</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export function EngineerVelocityChart({ data, onPointClick }: EngineerVelocityChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const engineers = useMemo(() => {
    const set = new Set<string>();
    data.forEach((pt) => pt.assignees.forEach((a) => set.add(a.displayName)));
    return Array.from(set);
  }, [data]);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    engineers.forEach((name, idx) => map.set(name, COLORS[idx % COLORS.length]));
    return map;
  }, [engineers]);

  const chartData = useMemo(() => {
    return data.map((pt) => {
      const row: any = { sprintName: pt.sprintName, completeDate: pt.completeDate };
      engineers.forEach((name) => (row[name] = 0));
      pt.assignees.forEach((a) => { row[a.displayName] = a.velocity; });
      return row;
    });
  }, [data, engineers]);

  const issueMap = useMemo(() => {
    const map = new Map<string, JiraIssue[]>();
    data.forEach((pt) => {
      pt.assignees.forEach((a) => {
        map.set(`${pt.sprintName}::${a.displayName}`, a.issues || []);
      });
    });
    return map;
  }, [data]);

  const toggle = (name: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const visible = engineers.filter((e) => !hidden.has(e));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {engineers.map((name) => {
          const color = colorMap.get(name)!;
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                hidden.has(name)
                  ? 'bg-muted text-muted-foreground line-through opacity-60 border-transparent'
                  : 'bg-background hover:bg-accent'
              }`}
              style={{ borderColor: hidden.has(name) ? undefined : color }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: color }} />
              {name}
            </button>
          );
        })}
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprintName" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            {visible.map((name) => {
              const color = colorMap.get(name)!;
              return (
                <Bar
                  key={name}
                  dataKey={name}
                  name={name}
                  fill={color}
                  radius={[3, 3, 0, 0]}
                  cursor={onPointClick ? 'pointer' : 'default'}
                  onClick={(barData) => {
                    const issues = issueMap.get(`${barData.sprintName}::${name}`) || [];
                    if (onPointClick && issues.length > 0) {
                      onPointClick(issues, name, barData.sprintName);
                    }
                  }}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
