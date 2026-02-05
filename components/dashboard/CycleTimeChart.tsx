'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { JiraIssue } from '@/types/jira';

interface CycleTimeChartProps {
  data: Array<{
    sprint: string;
    cycleTime: number;
  }>;
  issues?: JiraIssue[];
  onIssueClick?: (issues: JiraIssue[]) => void;
}

export function CycleTimeChart({ data, issues, onIssueClick }: CycleTimeChartProps) {
  const handleDotClick = (data: any) => {
    if (issues && onIssueClick) {
      // Filter issues that are done (completed)
      const completedIssues = issues.filter(issue => 
        issue.fields.status?.name?.toLowerCase() === 'done'
      );
      onIssueClick(completedIssues);
    }
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="sprint" />
          <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="cycleTime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{
              r: 6,
              onClick: handleDotClick,
              style: { cursor: 'pointer' }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
