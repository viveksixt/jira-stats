'use client';

import { Card, CardContent } from '@/components/ui/card';

interface TeamMetrics {
  name: string;
  velocity: number;
  cycleTime: number;
  techDebtRatio: number;
}

interface TeamComparisonProps {
  teams: TeamMetrics[];
  isLoading?: boolean;
}

export function TeamComparison({ teams, isLoading }: TeamComparisonProps) {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isLoading ? 'Loading team data...' : 'No team data available'}
      </div>
    );
  }

  const maxVelocity = Math.max(...teams.map(t => t.velocity), 1);

  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const velocityPercent = (team.velocity / maxVelocity) * 100;

        return (
          <Card key={team.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{team.name}</span>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{team.velocity} pts</span>
                  <span>{team.cycleTime.toFixed(1)}d</span>
                  <span className={team.techDebtRatio > 30 ? 'text-orange-600 font-semibold' : ''}>
                    {team.techDebtRatio.toFixed(0)}% debt
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${velocityPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
