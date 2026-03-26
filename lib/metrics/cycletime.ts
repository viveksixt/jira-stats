import type { JiraIssue } from '@/types/jira';

const IN_PROGRESS_STATUSES = ['in progress'];
const DONE_STATUSES = ['done', 'closed', 'resolved'];

// "Cold" states: returning to these means the story was deprioritised or its first
// attempt was abandoned. The cycle time clock resets so that only the most recent
// committed work period is measured. Intermediate pipeline states (code review,
// QA, PO review, etc.) do NOT reset the clock — they are part of delivery.
const RESET_STATUSES = ['backlog', 'to do', "won't fix", 'wont fix', 'cancelled'];

// Returns calendar days from the most recent "committed" In Progress start to the
// last "Done" transition. If a story is returned to Backlog/To Do/Won't fix after
// being In Progress, the clock resets to the next In Progress entry, giving a more
// accurate measure of the team's committed work period.
// Returns null if the issue has no complete cycle in its changelog.
export function calculateCycleTime(issue: JiraIssue): number | null {
  const histories = issue.changelog?.histories;
  if (!histories || histories.length === 0) return null;

  const sorted = [...histories].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  let startMs: number | null = null;
  let endMs: number | null = null;

  for (const history of sorted) {
    for (const item of history.items) {
      if (item.field !== 'status') continue;
      const to = item.toString.toLowerCase();

      if (RESET_STATUSES.some((s) => to === s)) {
        // Story returned to a cold state — reset the clock
        startMs = null;
        endMs = null;
      } else if (IN_PROGRESS_STATUSES.some((s) => to === s)) {
        if (startMs === null) startMs = new Date(history.created).getTime();
      } else if (startMs !== null && DONE_STATUSES.includes(to)) {
        endMs = new Date(history.created).getTime();
      }
    }
  }

  if (startMs === null || endMs === null || endMs <= startMs) return null;
  return (endMs - startMs) / 86_400_000;
}

export function computeCycleTimeStats(times: number[]): {
  median: number;
  average: number;
  p85: number;
  min: number;
  max: number;
} {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const average = times.reduce((s, v) => s + v, 0) / n;
  const p85 = sorted[Math.min(Math.floor(0.85 * n), n - 1)];

  return { median, average, p85, min: sorted[0], max: sorted[n - 1] };
}
