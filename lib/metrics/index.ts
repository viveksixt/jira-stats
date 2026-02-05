import type { JiraIssue, SprintMetrics } from '@/types/jira';
import { calculateKPI } from './kpi';
import { calculateTechDebtRatio } from './tech-debt';
import { calculateCycleTimeMetrics } from './cycle-time';
import { calculateVelocity } from './velocity';

// Calculate all metrics for a sprint
export function calculateSprintMetrics(
  sprintId: string,
  sprintName: string,
  issues: JiraIssue[],
  component?: string,
  techLabels?: string[]
): SprintMetrics {
  const kpi = calculateKPI(issues, techLabels);
  const techDebtRatio = calculateTechDebtRatio(issues, techLabels);
  const cycleTime = calculateCycleTimeMetrics(issues);
  const velocity = calculateVelocity(issues);

  return {
    sprintId,
    sprintName,
    totalIssues: kpi.totalIssues,
    productIssues: kpi.productIssues,
    techDebtIssues: kpi.techIssues,
    techDebtRatio,
    cycleTime,
    velocity,
    component,
  };
}

export * from './kpi';
export * from './tech-debt';
export * from './cycle-time';
export * from './velocity';
export * from './charts';
