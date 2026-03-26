'use client';

import type { EngineerVelocityData, CycleTimeEngineerData } from '@/types/jira';

interface DeveloperSummaryCardProps {
  engineerName: string;
  velocityData: EngineerVelocityData[];
  cycleTimeData: CycleTimeEngineerData[];
}

export function DeveloperSummaryCard({
  engineerName,
  velocityData,
  cycleTimeData,
}: DeveloperSummaryCardProps) {
  // Total issues completed across all sprints for this engineer
  const totalIssues = velocityData.reduce((sum, sprint) => {
    const assignee = sprint.assignees.find((a) => a.displayName === engineerName);
    return sum + (assignee?.issueCount || 0);
  }, 0);

  // Average velocity per sprint (only sprints where engineer contributed)
  const sprintsWithWork = velocityData.filter((sprint) =>
    sprint.assignees.some((a) => a.displayName === engineerName && a.issueCount > 0)
  );
  const avgVelocity =
    sprintsWithWork.length > 0
      ? sprintsWithWork.reduce((sum, sprint) => {
          const assignee = sprint.assignees.find((a) => a.displayName === engineerName);
          return sum + (assignee?.velocity || 0);
        }, 0) / sprintsWithWork.length
      : 0;

  // Overall median cycle time (median of sprint medians)
  const cycleMedians = cycleTimeData
    .map((sprint) => {
      const assignee = sprint.assignees.find((a) => a.displayName === engineerName);
      return assignee && assignee.issueCount > 0 ? assignee.median : null;
    })
    .filter((v): v is number => v !== null);

  const overallMedianCT =
    cycleMedians.length > 0
      ? (() => {
          const sorted = [...cycleMedians].sort((a, b) => a - b);
          const n = sorted.length;
          return n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];
        })()
      : null;

  const stats = [
    { label: 'Total issues completed', value: totalIssues > 0 ? String(totalIssues) : '—' },
    { label: 'Avg velocity / sprint', value: avgVelocity > 0 ? `${avgVelocity.toFixed(1)} pts` : '—' },
    {
      label: 'Median cycle time',
      value: overallMedianCT !== null ? `${overallMedianCT.toFixed(1)} days` : '—',
    },
    { label: 'Sprints active', value: sprintsWithWork.length > 0 ? String(sprintsWithWork.length) : '—' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
          <div className="text-2xl font-semibold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
