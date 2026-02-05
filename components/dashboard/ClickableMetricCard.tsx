'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { JiraIssue } from '@/types/jira';

interface ClickableMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: string;
  issues?: JiraIssue[];
  onIssuesClick?: (issues: JiraIssue[], title: string) => void;
  tooltipText?: string;
}

export function ClickableMetricCard({
  title,
  value,
  change,
  icon,
  issues = [],
  onIssuesClick,
  tooltipText,
}: ClickableMetricCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;
  const isClickable = issues.length > 0 && onIssuesClick;

  const handleClick = () => {
    if (isClickable) {
      onIssuesClick(issues, title);
    }
  };

  return (
    <Card
      className={isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
      onClick={handleClick}
      title={tooltipText || (isClickable ? 'Click to view issues' : '')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <span className="text-2xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            <span
              className={
                isPositive
                  ? 'text-green-600'
                  : isNegative
                  ? 'text-red-600'
                  : ''
              }
            >
              {isPositive ? '▲' : isNegative ? '▼' : ''}
              {Math.abs(change.value)}%
            </span>{' '}
            {change.label}
          </p>
        )}
        {isClickable && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="hover:underline cursor-pointer">
              {issues.length} issues
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
