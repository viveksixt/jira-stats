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
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface AssigneeData {
  assignee: string;
  storyPoints: number;
  issueCount: number;
}

interface AssigneeStoryPointsChartProps {
  data: AssigneeData[];
  chartType?: 'bar' | 'pie';
  issues?: import('@/types/jira').JiraIssue[];
  onIssueClick?: (issues: import('@/types/jira').JiraIssue[]) => void;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
];

// Fallback colors if CSS variables aren't available
const FALLBACK_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#0088FE',
  '#00C49F',
  '#FF6B6B',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{data.assignee}</p>
        <p className="text-sm text-muted-foreground">
          Story Points: <span className="font-medium text-foreground">{data.storyPoints}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Issues: <span className="font-medium text-foreground">{data.issueCount}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Avg Points/Issue: <span className="font-medium text-foreground">
            {data.issueCount > 0 ? (data.storyPoints / data.issueCount).toFixed(1) : 0}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function AssigneeStoryPointsChart({ data, chartType = 'bar', issues, onIssueClick }: AssigneeStoryPointsChartProps) {
  const handleBarClick = (data: any) => {
    if (issues && onIssueClick && data && data.assignee) {
      const assigneeName = data.assignee;
      const filteredIssues = issues.filter(issue => {
        const issueAssignee = issue.fields.assignee?.displayName || 'Unassigned';
        return issueAssignee === assigneeName;
      });
      onIssueClick(filteredIssues);
    }
  };
  const [hiddenAssignees, setHiddenAssignees] = useState<Set<string>>(new Set());
  const [type, setType] = useState<'bar' | 'pie'>(chartType);

  const toggleAssignee = (assignee: string) => {
    const newHidden = new Set(hiddenAssignees);
    if (newHidden.has(assignee)) {
      newHidden.delete(assignee);
    } else {
      newHidden.add(assignee);
    }
    setHiddenAssignees(newHidden);
  };

  const filteredData = useMemo(() => {
    return data.filter(d => !hiddenAssignees.has(d.assignee));
  }, [data, hiddenAssignees]);

  const totalPoints = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.storyPoints, 0);
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={type === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setType('bar')}
        >
          Bar Chart
        </Button>
        <Button
          variant={type === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setType('pie')}
        >
          Pie Chart
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Total: {totalPoints} pts
        </span>
      </div>

      {/* Legend with Toggleable Labels */}
      <div className="flex flex-wrap gap-2">
        {data.map((item, index) => (
          <button
            key={item.assignee}
            onClick={() => toggleAssignee(item.assignee)}
            className={`px-2 py-1 text-xs rounded-md border transition-all ${
              hiddenAssignees.has(item.assignee)
                ? 'bg-muted text-muted-foreground line-through opacity-50'
                : 'bg-background hover:bg-accent'
            }`}
            style={{
              borderColor: hiddenAssignees.has(item.assignee)
                ? 'transparent'
                : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
            />
            {item.assignee}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={filteredData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="assignee"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="storyPoints" 
                name="Story Points"
                onClick={handleBarClick}
                style={{ cursor: issues && onIssueClick ? 'pointer' : 'default' }}
              >
                {filteredData.map((entry, index) => {
                  const originalIndex = data.findIndex(d => d.assignee === entry.assignee);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={FALLBACK_COLORS[originalIndex % FALLBACK_COLORS.length]}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={filteredData}
                dataKey="storyPoints"
                nameKey="assignee"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ assignee, percent }) =>
                  `${assignee}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                onClick={handleBarClick}
                style={{ cursor: issues && onIssueClick ? 'pointer' : 'default' }}
              >
                {filteredData.map((entry, index) => {
                  const originalIndex = data.findIndex(d => d.assignee === entry.assignee);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={FALLBACK_COLORS[originalIndex % FALLBACK_COLORS.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
