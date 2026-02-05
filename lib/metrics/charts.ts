import type { JiraIssue } from '@/types/jira';
import { getStoryPoints } from './velocity';

// Story points per assignee
export interface AssigneeStoryPoints {
  assignee: string;
  storyPoints: number;
  issueCount: number;
}

export function calculateStoryPointsByAssignee(issues: JiraIssue[]): AssigneeStoryPoints[] {
  const assigneeMap = new Map<string, { storyPoints: number; issueCount: number }>();

  issues.forEach(issue => {
    // Skip unassigned issues
    if (!issue.fields.assignee?.displayName) {
      return;
    }

    const assigneeName = issue.fields.assignee.displayName;
    const storyPoints = getStoryPoints(issue);

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

  // Filter out TODO status items
  const filteredIssues = issues.filter(issue => {
    const statusCategory = issue.fields.status.statusCategory.key;
    return statusCategory !== 'new'; // 'new' is the status category for TODO
  });

  filteredIssues.forEach(issue => {
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

  // Remove assignees who only have TODO items (which should be 0 now after filtering) and filter out Unassigned
  const result = Array.from(workloadMap.values())
    .filter(data => data.total > 0 && data.assignee !== 'Unassigned')
    .sort((a, b) => b.total - a.total);

  return result;
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

  const openIssues = issues.filter(issue => {
    const statusCategory = issue.fields.status?.statusCategory?.key;
    // Consider open if statusCategory is missing or not 'done'
    return !statusCategory || statusCategory !== 'done';
  });

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

  return ranges;
}

// Issue type breakdown by category
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

// Production Bugs Trend
export interface ProductionBugsTrendDataPoint {
  date: string;
  created: number;
  resolved: number;
}

export function calculateProductionBugsTrend(
  issues: JiraIssue[],
  groupBy: 'day' | 'week' = 'day'
): ProductionBugsTrendDataPoint[] {
  const trendMap = new Map<string, ProductionBugsTrendDataPoint>();

  const getDateKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (groupBy === 'week') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
    }
    return date.toISOString().split('T')[0];
  };

  const initPoint = (date: string): ProductionBugsTrendDataPoint => ({
    date,
    created: 0,
    resolved: 0,
  });

  issues.forEach(issue => {
    const createdDate = getDateKey(issue.fields.created);
    
    // Track created
    if (!trendMap.has(createdDate)) {
      trendMap.set(createdDate, initPoint(createdDate));
    }
    const createdPoint = trendMap.get(createdDate)!;
    createdPoint.created++;

    // Track resolved
    if (issue.fields.resolutiondate) {
      const resolvedDate = getDateKey(issue.fields.resolutiondate);
      if (!trendMap.has(resolvedDate)) {
        trendMap.set(resolvedDate, initPoint(resolvedDate));
      }
      const resolvedPoint = trendMap.get(resolvedDate)!;
      resolvedPoint.resolved++;
    }
  });

  return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Tech Debt Ratio Trend (Week-on-Week)
export interface TechDebtTrendDataPoint {
  week: string;
  techCount: number;
  productCount: number;
  ratio: number;
}

export function calculateTechDebtTrend(
  issues: JiraIssue[],
  techLabels?: string[]
): TechDebtTrendDataPoint[] {
  const trendMap = new Map<string, { tech: number; product: number }>();

  const getWeekKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  };

  // Helper to check if issue is tech
  const isTech = (issue: JiraIssue): boolean => {
    if (!techLabels || techLabels.length === 0) {
      // Default tech labels
      const defaultTechLabels = ['tech', 'tech-debt', 'tech_debt', 'technical'];
      return issue.fields.labels?.some(label => 
        defaultTechLabels.some(tech => label.toLowerCase().includes(tech.toLowerCase()))
      ) || false;
    }
    
    return issue.fields.labels?.some(label => 
      techLabels.some(tech => label.toLowerCase().includes(tech.toLowerCase()))
    ) || false;
  };

  // Group issues by week created
  issues.forEach(issue => {
    const weekKey = getWeekKey(issue.fields.created);
    if (!trendMap.has(weekKey)) {
      trendMap.set(weekKey, { tech: 0, product: 0 });
    }
    
    const data = trendMap.get(weekKey)!;
    if (isTech(issue)) {
      data.tech++;
    } else {
      data.product++;
    }
  });

  // Convert to trend data points with ratio
  const trendData = Array.from(trendMap.entries()).map(([week, data]) => {
    const total = data.tech + data.product;
    const ratio = total > 0 ? Math.round((data.tech / total) * 100 * 10) / 10 : 0;
    return {
      week,
      techCount: data.tech,
      productCount: data.product,
      ratio,
    };
  });

  return trendData.sort((a, b) => a.week.localeCompare(b.week));
}
