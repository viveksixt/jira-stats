import type { JiraIssue } from '@/types/jira';

// Story points per assignee
export interface AssigneeStoryPoints {
  assignee: string;
  storyPoints: number;
  issueCount: number;
}

export function calculateStoryPointsByAssignee(issues: JiraIssue[]): AssigneeStoryPoints[] {
  const assigneeMap = new Map<string, { storyPoints: number; issueCount: number }>();

  issues.forEach(issue => {
    const assigneeName = issue.fields.assignee?.displayName || 'Unassigned';
    const storyPoints = issue.fields.customfield_10016 || 0;

    const current = assigneeMap.get(assigneeName) || { storyPoints: 0, issueCount: 0 };
    assigneeMap.set(assigneeName, {
      storyPoints: current.storyPoints + storyPoints,
      issueCount: current.issueCount + 1,
    });
  });

  return Array.from(assigneeMap.entries())
    .map(([assignee, data]) => ({
      assignee,
      storyPoints: data.storyPoints,
      issueCount: data.issueCount,
    }))
    .sort((a, b) => b.storyPoints - a.storyPoints);
}

// Bugs vs Stories breakdown
export interface IssueTypeBreakdown {
  bugs: number;
  stories: number;
  tasks: number;
  other: number;
  total: number;
}

export function calculateIssueTypeBreakdown(issues: JiraIssue[]): IssueTypeBreakdown {
  const breakdown: IssueTypeBreakdown = {
    bugs: 0,
    stories: 0,
    tasks: 0,
    other: 0,
    total: issues.length,
  };

  issues.forEach(issue => {
    const type = issue.fields.issuetype.name.toLowerCase();
    if (type.includes('bug')) {
      breakdown.bugs++;
    } else if (type.includes('story') || type.includes('user story')) {
      breakdown.stories++;
    } else if (type.includes('task') || type.includes('sub-task')) {
      breakdown.tasks++;
    } else {
      breakdown.other++;
    }
  });

  return breakdown;
}

// Created vs Resolved trend
export interface TrendDataPoint {
  date: string;
  created: number;
  resolved: number;
  bugsCreated: number;
  bugsResolved: number;
  storiesCreated: number;
  storiesResolved: number;
}

export function calculateCreatedResolvedTrend(
  issues: JiraIssue[],
  groupBy: 'day' | 'week' = 'day'
): TrendDataPoint[] {
  const trendMap = new Map<string, TrendDataPoint>();

  const getDateKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (groupBy === 'week') {
      // Get start of week (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
    }
    return date.toISOString().split('T')[0];
  };

  const initPoint = (date: string): TrendDataPoint => ({
    date,
    created: 0,
    resolved: 0,
    bugsCreated: 0,
    bugsResolved: 0,
    storiesCreated: 0,
    storiesResolved: 0,
  });

  issues.forEach(issue => {
    const createdDate = getDateKey(issue.fields.created);
    const isBug = issue.fields.issuetype.name.toLowerCase().includes('bug');
    const isStory = issue.fields.issuetype.name.toLowerCase().includes('story');

    // Track created
    if (!trendMap.has(createdDate)) {
      trendMap.set(createdDate, initPoint(createdDate));
    }
    const createdPoint = trendMap.get(createdDate)!;
    createdPoint.created++;
    if (isBug) createdPoint.bugsCreated++;
    if (isStory) createdPoint.storiesCreated++;

    // Track resolved
    if (issue.fields.resolutiondate) {
      const resolvedDate = getDateKey(issue.fields.resolutiondate);
      if (!trendMap.has(resolvedDate)) {
        trendMap.set(resolvedDate, initPoint(resolvedDate));
      }
      const resolvedPoint = trendMap.get(resolvedDate)!;
      resolvedPoint.resolved++;
      if (isBug) resolvedPoint.bugsResolved++;
      if (isStory) resolvedPoint.storiesResolved++;
    }
  });

  return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Workload distribution (issues per assignee)
export interface WorkloadData {
  assignee: string;
  inProgress: number;
  todo: number;
  done: number;
  total: number;
}

export function calculateWorkloadDistribution(issues: JiraIssue[]): WorkloadData[] {
  const workloadMap = new Map<string, WorkloadData>();

  issues.forEach(issue => {
    const assigneeName = issue.fields.assignee?.displayName || 'Unassigned';
    const statusCategory = issue.fields.status.statusCategory.key;

    if (!workloadMap.has(assigneeName)) {
      workloadMap.set(assigneeName, {
        assignee: assigneeName,
        inProgress: 0,
        todo: 0,
        done: 0,
        total: 0,
      });
    }

    const data = workloadMap.get(assigneeName)!;
    data.total++;

    if (statusCategory === 'done') {
      data.done++;
    } else if (statusCategory === 'indeterminate') {
      data.inProgress++;
    } else {
      data.todo++;
    }
  });

  return Array.from(workloadMap.values()).sort((a, b) => b.total - a.total);
}

// Issue aging (how long issues have been open)
export interface AgingData {
  range: string;
  count: number;
  issues: string[];
}

export function calculateIssueAging(issues: JiraIssue[]): AgingData[] {
  const now = new Date();
  const ranges = [
    { label: '< 1 week', maxDays: 7, count: 0, issues: [] as string[] },
    { label: '1-2 weeks', maxDays: 14, count: 0, issues: [] as string[] },
    { label: '2-4 weeks', maxDays: 28, count: 0, issues: [] as string[] },
    { label: '1-2 months', maxDays: 60, count: 0, issues: [] as string[] },
    { label: '> 2 months', maxDays: Infinity, count: 0, issues: [] as string[] },
  ];

  const openIssues = issues.filter(
    issue => issue.fields.status.statusCategory.key !== 'done'
  );

  openIssues.forEach(issue => {
    const createdDate = new Date(issue.fields.created);
    const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    for (const range of ranges) {
      if (ageInDays < range.maxDays) {
        range.count++;
        range.issues.push(issue.key);
        break;
      }
    }
  });

  return ranges.map(r => ({ range: r.label, count: r.count, issues: r.issues }));
}

// Get issues by type (for clickable charts)
export interface IssuesByType {
  bugs: JiraIssue[];
  stories: JiraIssue[];
  tasks: JiraIssue[];
  other: JiraIssue[];
}

export function getIssuesByType(issues: JiraIssue[]): IssuesByType {
  const result: IssuesByType = {
    bugs: [],
    stories: [],
    tasks: [],
    other: [],
  };

  issues.forEach(issue => {
    const type = issue.fields.issuetype.name.toLowerCase();
    if (type.includes('bug')) {
      result.bugs.push(issue);
    } else if (type.includes('story') || type.includes('user story')) {
      result.stories.push(issue);
    } else if (type.includes('task') || type.includes('sub-task')) {
      result.tasks.push(issue);
    } else {
      result.other.push(issue);
    }
  });

  return result;
}
