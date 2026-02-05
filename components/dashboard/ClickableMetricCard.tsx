'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InfoIcon } from '@/components/ui/info-icon';
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
  showInfoIcon?: boolean;
  onInfoClick?: () => void;
}

export function ClickableMetricCard({
  title,
  value,
  change,
  icon,
  issues = [],
  onIssuesClick,
  tooltipText,
  showInfoIcon = false,
  onInfoClick,
}: ClickableMetricCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;
  const isClickable = issues.length > 0 && onIssuesClick;

  const handleClick = () => {
    if (isClickable) {
      onIssuesClick(issues, title);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfoClick?.();
  };

  return (
    <Card
      className={isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
      onClick={handleClick}
      title={tooltipText || (isClickable ? 'Click to view issues' : '')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {showInfoIcon && (
            <button
              onClick={handleInfoClick}
              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground inline-flex items-center flex-shrink-0"
              title="View calculation details"
              type="button"
            >
              <InfoIcon />
            </button>
          )}
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {isClickable && issues.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">({issues.length} issues)</span>
          )}
        </div>
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
      </CardContent>
    </Card>
  );
}
