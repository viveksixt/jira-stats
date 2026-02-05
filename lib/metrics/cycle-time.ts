import type { JiraIssue, CycleTimeMetrics } from '@/types/jira';

// Find when an issue transitioned to a specific status
function findStatusChange(issue: JiraIssue, targetStatus: string): Date | null {
  if (!issue.changelog?.histories) return null;

  for (const history of issue.changelog.histories) {
    for (const item of history.items) {
      if (item.field === 'status' && item.toString === targetStatus) {
        return new Date(history.created);
      }
    }
  }

  return null;
}

// Calculate cycle time for a single issue (in days)
export function calculateIssueCycleTime(issue: JiraIssue): number | null {
  // Cycle time = time from "In Progress" to "Done"
  const startTime = findStatusChange(issue, 'In Progress');
  const endTime = findStatusChange(issue, 'Done') || 
                  findStatusChange(issue, 'Closed') ||
                  findStatusChange(issue, 'Resolved');

  if (!startTime || !endTime) return null;

  const diffMs = endTime.getTime() - startTime.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays;
}

// Calculate statistics from an array of numbers
function calculateStats(values: number[]): {
  average: number;
  median: number;
  p85: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { average: 0, median: 0, p85: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;

  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const p85Index = Math.ceil(sorted.length * 0.85) - 1;
  const p85 = sorted[p85Index] || sorted[sorted.length - 1];

  return {
    average: Math.round(average * 10) / 10,
    median: Math.round(median * 10) / 10,
    p85: Math.round(p85 * 10) / 10,
    min: Math.round(sorted[0] * 10) / 10,
    max: Math.round(sorted[sorted.length - 1] * 10) / 10,
  };
}

// Calculate cycle time metrics for multiple issues
export function calculateCycleTimeMetrics(issues: JiraIssue[]): CycleTimeMetrics {
  const cycleTimes = issues
    .map(calculateIssueCycleTime)
    .filter((time): time is number => time !== null);

  return calculateStats(cycleTimes);
}

// Cycle time trend (week-on-week)
export interface CycleTimeTrendDataPoint {
  week: string;
  average: number;
  median: number;
  issueCount: number;
}

export function calculateCycleTimeTrend(issues: JiraIssue[]): CycleTimeTrendDataPoint[] {
  const trendMap = new Map<string, { cycleTimes: number[]; issueCount: number }>();

  const getWeekKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  };

  // Group issues by the week they were completed
  issues.forEach(issue => {
    const cycleTime = calculateIssueCycleTime(issue);
    if (cycleTime !== null) {
      const endTime = findStatusChange(issue, 'Done') || 
                      findStatusChange(issue, 'Closed') ||
                      findStatusChange(issue, 'Resolved');
      
      if (endTime) {
        const weekKey = getWeekKey(endTime.toISOString());
        if (!trendMap.has(weekKey)) {
          trendMap.set(weekKey, { cycleTimes: [], issueCount: 0 });
        }
        const data = trendMap.get(weekKey)!;
        data.cycleTimes.push(cycleTime);
        data.issueCount++;
      }
    }
  });

  // Convert to trend data points
  const trendData = Array.from(trendMap.entries()).map(([week, data]) => {
    const stats = calculateStats(data.cycleTimes);
    return {
      week,
      average: stats.average,
      median: stats.median,
      issueCount: data.issueCount,
    };
  });

  return trendData.sort((a, b) => a.week.localeCompare(b.week));
}
