'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { VelocitySprintData, JiraIssue } from '@/types/jira';

interface TeamVelocityChartProps {
  data: VelocitySprintData[];
  onPointClick?: (issues: JiraIssue[], label: string) => void;
}

const BAR_COLOR = '#6366f1';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <div className="font-semibold">{d.sprintName}</div>
      <div className="text-xs text-muted-foreground">
        {new Date(d.completeDate).toLocaleDateString()}
      </div>
      <div className="text-sm mt-1">Velocity: <span className="font-medium">{d.velocity} pts</span></div>
      <div className="text-sm">Done: <span className="font-medium">{d.completedIssueCount} issues</span></div>
    </div>
  );
};

export function TeamVelocityChart({ data, onPointClick }: TeamVelocityChartProps) {
  const [showAvg, setShowAvg] = useState(true);

  const avg = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((s, d) => s + d.velocity, 0) / data.length;
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{data.length} sprints</div>
        <Button variant={showAvg ? 'default' : 'outline'} size="sm" onClick={() => setShowAvg(!showAvg)}>
          {showAvg ? 'Avg: on' : 'Avg: off'}
        </Button>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprintName" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="velocity"
              name="Velocity"
              fill={BAR_COLOR}
              radius={[3, 3, 0, 0]}
              cursor={onPointClick ? 'pointer' : 'default'}
              onClick={(barData) => {
                if (onPointClick && barData?.issues?.length > 0) {
                  onPointClick(barData.issues, barData.sprintName);
                }
              }}
            />
            {showAvg && avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: `Avg ${avg.toFixed(0)}`, position: 'insideTopRight', fontSize: 11, fill: '#f59e0b' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
