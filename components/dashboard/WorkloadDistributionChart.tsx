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
  Legend,
} from 'recharts';

interface WorkloadData {
  assignee: string;
  inProgress: number;
  todo: number;
  done: number;
  total: number;
}

interface WorkloadDistributionChartProps {
  data: WorkloadData[];
  issues?: import('@/types/jira').JiraIssue[];
  onIssueClick?: (issues: import('@/types/jira').JiraIssue[]) => void;
}

const COLORS = {
  done: '#22c55e',
  inProgress: '#f59e0b',
  todo: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);
    const donePercent = total > 0 ? ((payload.find((p: any) => p.dataKey === 'done')?.value || 0) / total * 100).toFixed(0) : 0;
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
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
        <div className="mt-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate:</span>
            <span className="font-medium text-green-600">{donePercent}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function WorkloadDistributionChart({ data, issues, onIssueClick }: WorkloadDistributionChartProps) {
  const [hiddenAssignees, setHiddenAssignees] = useState<Set<string>>(new Set());

  const handleBarClick = (data: any, statusCategory: 'done' | 'inProgress' | 'todo') => {
    if (issues && onIssueClick && data && data.assignee) {
      const assigneeName = data.assignee;
      const filteredIssues = issues.filter(issue => {
        const issueAssignee = issue.fields.assignee?.displayName || 'Unassigned';
        const issueStatusCategory = issue.fields.status.statusCategory.key;
        
        // Match assignee
        if (issueAssignee !== assigneeName) return false;
        
        // Match status category
        if (statusCategory === 'done' && issueStatusCategory === 'done') return true;
        if (statusCategory === 'inProgress' && issueStatusCategory === 'indeterminate') return true;
        if (statusCategory === 'todo' && issueStatusCategory === 'new') return true;
        
        return false;
      });
      onIssueClick(filteredIssues);
    }
  };

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

  const summary = useMemo(() => {
    const totals = filteredData.reduce(
      (acc, d) => ({
        done: acc.done + d.done,
        inProgress: acc.inProgress + d.inProgress,
        todo: acc.todo + d.todo,
        total: acc.total + d.total,
      }),
      { done: 0, inProgress: 0, todo: 0, total: 0 }
    );
    return totals;
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.done }} />
          <span className="text-muted-foreground">Done:</span>
          <span className="font-medium">{summary.done}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.inProgress }} />
          <span className="text-muted-foreground">In Progress:</span>
          <span className="font-medium">{summary.inProgress}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.todo }} />
          <span className="text-muted-foreground">To Do:</span>
          <span className="font-medium">{summary.todo}</span>
        </div>
      </div>

      {/* Legend with Toggleable Labels */}
      <div className="flex flex-wrap gap-2">
        {data.map((item) => (
          <button
            key={item.assignee}
            onClick={() => toggleAssignee(item.assignee)}
            className={`px-2 py-1 text-xs rounded-md border transition-all ${
              hiddenAssignees.has(item.assignee)
                ? 'bg-muted text-muted-foreground line-through opacity-50 border-transparent'
                : 'bg-background hover:bg-accent border-border'
            }`}
          >
            {item.assignee}: {item.total}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
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
            <Legend />
            <Bar 
              dataKey="done" 
              name="Done" 
              stackId="a" 
              fill={COLORS.done}
              onClick={(data) => handleBarClick(data, 'done')}
              style={{ cursor: 'pointer' }}
            />
            <Bar 
              dataKey="inProgress" 
              name="In Progress" 
              stackId="a" 
              fill={COLORS.inProgress}
              onClick={(data) => handleBarClick(data, 'inProgress')}
              style={{ cursor: 'pointer' }}
            />
            <Bar 
              dataKey="todo" 
              name="To Do" 
              stackId="a" 
              fill={COLORS.todo}
              onClick={(data) => handleBarClick(data, 'todo')}
              style={{ cursor: 'pointer' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
