import type { JiraIssue } from '@/types/jira';

// Default tech debt labels
export const DEFAULT_TECH_LABELS = ['tech', 'tech-debt', 'tech_debt'];

// Check if an issue is a tech issue based on labels or tech epic
export function isTechIssue(
  issue: JiraIssue,
  techLabels: string[] = DEFAULT_TECH_LABELS,
  techEpicKeys: string[] = []
): boolean {
  // Check labels (existing logic)
  const labels = issue.fields.labels || [];
  const techLabelsLower = techLabels.map(l => l.toLowerCase());
  const hasLabel = labels.some(label =>
    techLabelsLower.includes(label.toLowerCase())
  );

  // Check if issue belongs to a tech epic
  const parentKey = issue.fields.parent?.key;
  const belongsToTechEpic = parentKey && techEpicKeys.includes(parentKey);

  return hasLabel || belongsToTechEpic;
}

// Calculate KPI (Product issues = issues WITHOUT tech labels or tech epics)
export function calculateKPI(issues: JiraIssue[], techLabels?: string[], techEpicKeys: string[] = []): {
  productIssues: number;
  techIssues: number;
  totalIssues: number;
} {
  const techIssues = issues.filter(issue => isTechIssue(issue, techLabels, techEpicKeys));
  const productIssues = issues.filter(issue => !isTechIssue(issue, techLabels, techEpicKeys));

  return {
    productIssues: productIssues.length,
    techIssues: techIssues.length,
    totalIssues: issues.length,
  };
}
