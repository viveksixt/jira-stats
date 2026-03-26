'use client';

import type { CycleTimeSprintData } from '@/types/jira';

interface CycleTimeStatsTableProps {
  data: CycleTimeSprintData[];
}

function fmt(val: number) {
  return val > 0 ? `${val.toFixed(1)}d` : '—';
}

export function CycleTimeStatsTable({ data }: CycleTimeStatsTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-left">
            <th className="py-2 pr-4 font-medium">Sprint</th>
            <th className="py-2 pr-4 font-medium text-right">Median</th>
            <th className="py-2 pr-4 font-medium text-right">Avg</th>
            <th className="py-2 pr-4 font-medium text-right">P85</th>
            <th className="py-2 pr-4 font-medium text-right">Min</th>
            <th className="py-2 pr-4 font-medium text-right">Max</th>
            <th className="py-2 font-medium text-right">Issues</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.sprintId} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 pr-4 max-w-[200px] truncate" title={row.sprintName}>
                {row.sprintName}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums font-medium">{fmt(row.median)}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{fmt(row.average)}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{fmt(row.p85)}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{fmt(row.min)}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{fmt(row.max)}</td>
              <td className="py-2 text-right tabular-nums">{row.issueCount > 0 ? row.issueCount : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
