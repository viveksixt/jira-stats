'use client';

import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { JiraIssue } from '@/types/jira';

interface IssueTypeBreakdown {
  bugs: number;
  stories: number;
  tasks: number;
  other: number;
  total: number;
}

interface BugsVsStoriesChartProps {
  data: IssueTypeBreakdown;
  issues?: {
    bugs: JiraIssue[];
    stories: JiraIssue[];
    tasks: JiraIssue[];
    other: JiraIssue[];
  };
  onIssueTypeClick?: (issues: JiraIssue[], type: string) => void;
}

const COLORS = {
  bugs: '#ef4444',      // Red
  stories: '#3b82f6',   // Blue
  tasks: '#22c55e',     // Green
  other: '#a855f7',     // Purple
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = ((data.value / total) * 100).toFixed(1);
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-medium text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentage: <span className="font-medium text-foreground">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function BugsVsStoriesChart({ data, issues, onIssueTypeClick }: BugsVsStoriesChartProps) {
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const toggleType = (type: string) => {
    const newHidden = new Set(hiddenTypes);
    if (newHidden.has(type)) {
      newHidden.delete(type);
    } else {
      newHidden.add(type);
    }
    setHiddenTypes(newHidden);
  };

  const handleTypeClick = (type: string) => {
    if (!issues || !onIssueTypeClick) return;
    const typeIssues = issues[type as keyof typeof issues];
    if (typeIssues && typeIssues.length > 0) {
      onIssueTypeClick(typeIssues, type.charAt(0).toUpperCase() + type.slice(1));
    }
  };

  const chartData = useMemo(() => {
    const items = [
      { name: 'Bugs', value: data.bugs, key: 'bugs', color: COLORS.bugs },
      { name: 'Stories', value: data.stories, key: 'stories', color: COLORS.stories },
      { name: 'Tasks', value: data.tasks, key: 'tasks', color: COLORS.tasks },
      { name: 'Other', value: data.other, key: 'other', color: COLORS.other },
    ];
    return items.filter(item => !hiddenTypes.has(item.key) && item.value > 0);
  }, [data, hiddenTypes]);

  const visibleTotal = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const allTypes = [
    { key: 'bugs', name: 'Bugs', value: data.bugs, color: COLORS.bugs },
    { key: 'stories', name: 'Stories', value: data.stories, color: COLORS.stories },
    { key: 'tasks', name: 'Tasks', value: data.tasks, color: COLORS.tasks },
    { key: 'other', name: 'Other', value: data.other, color: COLORS.other },
  ];

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('pie')}
        >
          Pie Chart
        </Button>
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Total: {data.total} issues
        </span>
      </div>

      {/* Legend with Toggleable Labels */}
      <div className="flex flex-wrap gap-2">
        {allTypes.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              toggleType(item.key);
              handleTypeClick(item.key);
            }}
            className={`px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1 ${
              hiddenTypes.has(item.key)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent cursor-pointer'
            }`}
            style={{
              borderColor: hiddenTypes.has(item.key) ? 'transparent' : item.color,
            }}
            title={issues && onIssueTypeClick ? 'Click to view issues' : undefined}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}: {item.value}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={visibleTotal} />} />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip total={visibleTotal} />} />
              <Bar dataKey="value" name="Count">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
