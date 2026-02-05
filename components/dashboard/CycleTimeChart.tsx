'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CycleTimeChartProps {
  data: Array<{
    sprint: string;
    cycleTime: number;
  }>;
}

export function CycleTimeChart({ data }: CycleTimeChartProps) {
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
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
