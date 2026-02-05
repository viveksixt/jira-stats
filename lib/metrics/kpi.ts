import type { JiraIssue } from '@/types/jira';

// Default tech debt labels
export const DEFAULT_TECH_LABELS = ['tech', 'tech-debt', 'tech_debt'];

// Check if an issue is a tech issue based on labels
export function isTechIssue(issue: JiraIssue, techLabels: string[] = DEFAULT_TECH_LABELS): boolean {
  const labels = issue.fields.labels || [];
  const techLabelsLower = techLabels.map(l => l.toLowerCase());
  return labels.some(label => 
    techLabelsLower.includes(label.toLowerCase())
  );
}

// Calculate KPI (Product issues = issues WITHOUT tech labels)
export function calculateKPI(issues: JiraIssue[], techLabels?: string[]): {
  productIssues: number;
  techIssues: number;
  totalIssues: number;
} {
  const techIssues = issues.filter(issue => isTechIssue(issue, techLabels));
  const productIssues = issues.filter(issue => !isTechIssue(issue, techLabels));

  return {
    productIssues: productIssues.length,
    techIssues: techIssues.length,
    totalIssues: issues.length,
  };
}
