'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MetricInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: 'kpi' | 'techDebtRatio' | 'cycleTime' | 'velocity' | null;
}

const metricExplanations = {
  kpi: {
    title: 'KPI (Product Topics)',
    description: 'Product work that is not classified as technical debt',
    formula: 'Count of issues without tech labels',
    details: [
      'Issues are classified as product if they do NOT have any of the configured tech labels.',
      'Default tech labels: "tech", "tech-debt", "tech_debt"',
      'Tech labels can be customized via the settings (gear icon) in the header.',
      'Cancelled issues and Tasks are excluded from the count.',
      'Issues in the ignore list (if configured) are excluded.',
    ],
  },
  techDebtRatio: {
    title: 'Tech Debt Ratio',
    description: 'Percentage of technical work vs total work',
    formula: '(Tech Issues / Total Issues) × 100',
    details: [
      'Issues are classified as tech if they have any of the configured tech labels.',
      'Ratio is calculated as: (number of tech issues / total issues) × 100',
      'Result is rounded to 1 decimal place.',
      'Default tech labels: "tech", "tech-debt", "tech_debt"',
      'Tech labels can be customized via the settings (gear icon) in the header.',
      'Cancelled issues and Tasks are excluded from the calculation.',
      'Issues in the ignore list (if configured) are excluded.',
    ],
  },
  cycleTime: {
    title: 'Cycle Time',
    description: 'Average time for issues to move from In Progress to Done',
    formula: 'Average (Completed Date - In Progress Date) in days',
    details: [
      'Cycle time = time from "In Progress" status to "Done"/"Closed"/"Resolved" status.',
      'Only issues that have transitioned through both statuses are counted.',
      'Time is measured in days and includes fractional days.',
      'The displayed value is the average cycle time across all completed issues.',
      'Calculated from issue changelog history.',
      'Only issues with "Done" status are included in the calculation.',
    ],
  },
  velocity: {
    title: 'Velocity',
    description: 'Total story points of completed work',
    formula: 'Sum of story points for completed issues',
    details: [
      'Only issues with "Done", "Closed", or "Resolved" status are counted.',
      'Story points are extracted from custom fields (priority: customfield_10039 → customfield_10016 → others).',
      'If an issue has no story points, it defaults to 3 story points.',
      'Velocity represents the amount of work completed in the current sprint/selection.',
      'Cancelled issues and Tasks are excluded from the velocity calculation.',
      'Issues in the ignore list (if configured) are excluded.',
    ],
  },
};

export function MetricInfoModal({ open, onOpenChange, metricType }: MetricInfoModalProps) {
  if (!metricType || !metricExplanations[metricType]) {
    return null;
  }

  const explanation = metricExplanations[metricType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{explanation.title}</DialogTitle>
          <DialogDescription>{explanation.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">Formula</h3>
            <p className="text-sm bg-muted p-3 rounded font-mono">{explanation.formula}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Calculation Details</h3>
            <ul className="text-sm space-y-2">
              {explanation.details.map((detail, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
