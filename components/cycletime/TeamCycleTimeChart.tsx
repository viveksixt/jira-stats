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
import type { CycleTimeSprintData, CycleTimeIssueData } from '@/types/jira';

interface TeamCycleTimeChartProps {
  data: CycleTimeSprintData[];
  onPointClick?: (issues: CycleTimeIssueData[], label: string) => void;
}

const MEDIAN_COLOR = '#6366f1';
const P85_COLOR = '#ef4444';
const AVG_COLOR = '#f59e0b';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CycleTimeSprintData;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold">{d.sprintName}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {new Date(d.completeDate).toLocaleDateString()}
      </div>
      <div>Median: <span className="font-medium">{d.median.toFixed(1)} days</span></div>
      <div>Avg: <span className="font-medium">{d.average.toFixed(1)} days</span></div>
      <div>P85: <span className="font-medium">{d.p85.toFixed(1)} days</span></div>
      <div>Issues: <span className="font-medium">{d.issueCount}</span></div>
    </div>
  );
};

export function TeamCycleTimeChart({ data, onPointClick }: TeamCycleTimeChartProps) {
  const [showAvg, setShowAvg] = useState(false);
  const [showP85, setShowP85] = useState(true);

  const overallAvg = useMemo(() => {
    const withData = data.filter((d) => d.issueCount > 0);
    if (!withData.length) return 0;
    return withData.reduce((s, d) => s + d.average, 0) / withData.length;
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{data.length} sprints</div>
        <div className="flex gap-2">
          <Button variant={showP85 ? 'default' : 'outline'} size="sm" onClick={() => setShowP85(!showP85)}>
            P85: {showP85 ? 'on' : 'off'}
          </Button>
          <Button variant={showAvg ? 'default' : 'outline'} size="sm" onClick={() => setShowAvg(!showAvg)}>
            Avg: {showAvg ? 'on' : 'off'}
          </Button>
        </div>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprintName" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
            <YAxis unit=" d" />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="median"
              name="Median"
              fill={MEDIAN_COLOR}
              radius={[3, 3, 0, 0]}
              cursor={onPointClick ? 'pointer' : 'default'}
              onClick={(barData) => {
                const sprint = barData as CycleTimeSprintData;
                if (onPointClick && sprint.issues?.length > 0) {
                  onPointClick(sprint.issues, sprint.sprintName);
                }
              }}
            />
            {showP85 && (
              <Line
                type="monotone"
                dataKey="p85"
                name="P85"
                stroke={P85_COLOR}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
            )}
            {showAvg && overallAvg > 0 && (
              <ReferenceLine
                y={overallAvg}
                stroke={AVG_COLOR}
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: `Avg ${overallAvg.toFixed(1)}d`, position: 'insideTopRight', fontSize: 11, fill: AVG_COLOR }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {onPointClick && (
        <p className="text-xs text-muted-foreground">Click a bar to see the issues behind it.</p>
      )}
    </div>
  );
}
