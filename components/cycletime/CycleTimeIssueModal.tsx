'use client';

import { useEffect, useState } from 'react';
import type { CycleTimeIssueData } from '@/types/jira';

interface CycleTimeIssueModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  issues: CycleTimeIssueData[];
  onClose: () => void;
}

type SortField = 'key' | 'summary' | 'cycleTime' | 'assignee' | 'type';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

function isTechIssueType(issuetype: string): boolean {
  return issuetype.toLowerCase().includes('tech');
}

function SortIndicator({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (field !== active) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '▲' : '▼'}</span>;
}

export function CycleTimeIssueModal({ isOpen, title, subtitle, issues, onClose }: CycleTimeIssueModalProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('cycleTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Reset page when search/sort changes
  useEffect(() => { setPage(1); }, [search, sortField, sortDir]);

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filtered = issues.filter(
    (i) =>
      i.key.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      (i.assignee?.displayName || '').toLowerCase().includes(q) ||
      i.issuetype.toLowerCase().includes(q)
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'key':       cmp = a.key.localeCompare(b.key); break;
      case 'summary':   cmp = a.summary.localeCompare(b.summary); break;
      case 'cycleTime': cmp = a.cycleTimeDays - b.cycleTimeDays; break;
      case 'assignee':  cmp = (a.assignee?.displayName || '').localeCompare(b.assignee?.displayName || ''); break;
      case 'type':      cmp = a.issuetype.localeCompare(b.issuetype); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'cycleTime' ? 'desc' : 'asc');
    }
  };

  const thClass = 'p-3 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-background border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-muted-foreground hover:text-foreground text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0">
          <input
            type="search"
            placeholder="Search by key, summary, assignee, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr>
                <th className={thClass} onClick={() => handleSort('key')}>
                  Key <SortIndicator field="key" active={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => handleSort('summary')}>
                  Summary <SortIndicator field="summary" active={sortField} dir={sortDir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('cycleTime')}>
                  Cycle Time <SortIndicator field="cycleTime" active={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => handleSort('assignee')}>
                  Assignee <SortIndicator field="assignee" active={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => handleSort('type')}>
                  Type <SortIndicator field="type" active={sortField} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No issues match your search.
                  </td>
                </tr>
              ) : (
                paginated.map((issue) => (
                  <tr
                    key={issue.key}
                    className={`hover:bg-accent/50 transition-colors ${isTechIssueType(issue.issuetype) ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <a
                        href={`https://sixt-cloud.atlassian.net/browse/${issue.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-bold text-blue-600 hover:underline"
                      >
                        {issue.key}
                      </a>
                    </td>
                    <td className="p-3 max-w-[320px]">
                      <span className="line-clamp-2" title={issue.summary}>{issue.summary}</span>
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium whitespace-nowrap">
                      {issue.cycleTimeDays.toFixed(1)} days
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {issue.assignee?.displayName || '—'}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {issue.issuetype}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t shrink-0 text-sm text-muted-foreground">
          <span>
            {sorted.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, sorted.length)} of ${sorted.length}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md enabled:hover:bg-muted disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <span className="px-2 py-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded-md enabled:hover:bg-muted disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
