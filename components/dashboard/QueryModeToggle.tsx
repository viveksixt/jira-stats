'use client';

import { Button } from '@/components/ui/button';

type QueryMode = 'board' | 'jql';

interface QueryModeToggleProps {
  value: QueryMode;
  onChange: (mode: QueryMode) => void;
}

export function QueryModeToggle({ value, onChange }: QueryModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Mode:</label>
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        <Button
          size="sm"
          variant={value === 'board' ? 'default' : 'ghost'}
          onClick={() => onChange('board')}
          className="text-xs"
        >
          Board
        </Button>
        <Button
          size="sm"
          variant={value === 'jql' ? 'default' : 'ghost'}
          onClick={() => onChange('jql')}
          className="text-xs"
        >
          JQL Query
        </Button>
      </div>
    </div>
  );
}
