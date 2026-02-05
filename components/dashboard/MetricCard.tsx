'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: string;
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;

  return (
    <Card>
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
      </CardContent>
    </Card>
  );
}
