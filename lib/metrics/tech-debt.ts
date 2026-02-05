import type { JiraIssue } from '@/types/jira';
import { isTechIssue } from './kpi';

// Calculate tech debt ratio
export function calculateTechDebtRatio(issues: JiraIssue[], techLabels?: string[]): number {
  if (issues.length === 0) return 0;

  const techIssues = issues.filter(issue => isTechIssue(issue, techLabels));
  const ratio = (techIssues.length / issues.length) * 100;

  return Math.round(ratio * 10) / 10; // Round to 1 decimal place
}

// Calculate tech debt ratio with breakdown
export function calculateTechDebtBreakdown(issues: JiraIssue[], techLabels?: string[]): {
  techDebtRatio: number;
  techDebtCount: number;
  productWorkCount: number;
  totalCount: number;
} {
  const techIssues = issues.filter(issue => isTechIssue(issue, techLabels));
  const productIssues = issues.filter(issue => !isTechIssue(issue, techLabels));

  return {
    techDebtRatio: calculateTechDebtRatio(issues, techLabels),
    techDebtCount: techIssues.length,
    productWorkCount: productIssues.length,
    totalCount: issues.length,
  };
}
