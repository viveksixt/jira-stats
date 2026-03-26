'use client';

import { useState } from 'react';
import type { CycleTimeSprintData } from '@/types/jira';

const PAGE_SIZE = 5;

function isTechIssueType(issuetype: string): boolean {
  return issuetype.toLowerCase().includes('tech');
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface SprintIssuesTableProps {
  sprintId: number;
  issues: CycleTimeSprintData['issues'];
}

function SprintIssuesTable({ sprintId, issues }: SprintIssuesTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(issues.length / PAGE_SIZE);
  const pageIssues = issues.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="px-4 pb-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground text-left">
              <th className="py-1.5 pr-3 font-medium">Key</th>
              <th className="py-1.5 pr-3 font-medium">Summary</th>
              <th className="py-1.5 pr-3 font-medium text-right">Cycle Time</th>
              <th className="py-1.5 pr-3 font-medium">Assignee</th>
              <th className="py-1.5 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {pageIssues.map((issue) => (
              <tr key={issue.key} className={`border-b last:border-0 hover:bg-accent/50 transition-colors ${isTechIssueType(issue.issuetype) ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  <a
                    href={`https://sixt-cloud.atlassian.net/browse/${issue.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-blue-600 hover:underline"
                  >
                    {issue.key}
                  </a>
                </td>
                <td className="py-1.5 pr-3 max-w-[280px] truncate" title={issue.summary}>
                  {issue.summary}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums font-medium">
                  {issue.cycleTimeDays.toFixed(1)}d
                </td>
                <td className="py-1.5 pr-3 max-w-[140px] truncate text-muted-foreground" title={issue.assignee?.displayName}>
                  {issue.assignee?.displayName || '—'}
                </td>
                <td className="py-1.5 text-muted-foreground whitespace-nowrap">{issue.issuetype}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, issues.length)} of {issues.length} issues
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 rounded border enabled:hover:bg-muted disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded border enabled:hover:bg-muted disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CycleTimeTopIssuesProps {
  data: CycleTimeSprintData[];
}

export function CycleTimeTopIssues({ data }: CycleTimeTopIssuesProps) {
  const [open, setOpen] = useState(false);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  const sprintsWithIssues = data.filter((s) => s.issues.length > 0);
  if (sprintsWithIssues.length === 0) return null;

  const toggleSprint = (sprintId: number) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      if (next.has(sprintId)) {
        next.delete(sprintId);
      } else {
        next.add(sprintId);
      }
      return next;
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Cycle Time Spikes — Issues per Sprint</span>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="divide-y">
          {sprintsWithIssues.map((sprint) => {
            const isExpanded = expandedSprints.has(sprint.sprintId);
            const worstTime = sprint.issues[0]?.cycleTimeDays;

            return (
              <div key={sprint.sprintId}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSprint(sprint.sprintId)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    }
                    <span className="truncate font-medium">{sprint.sprintName}</span>
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-4">
                    {sprint.issues.length} {sprint.issues.length === 1 ? 'issue' : 'issues'} · top: {worstTime != null ? `${worstTime.toFixed(1)}d` : '—'}
                  </span>
                </button>

                {isExpanded && (
                  <SprintIssuesTable sprintId={sprint.sprintId} issues={sprint.issues} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
