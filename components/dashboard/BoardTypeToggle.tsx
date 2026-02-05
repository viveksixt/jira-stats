'use client';

import { Button } from '@/components/ui/button';

type BoardType = 'all' | 'scrum' | 'kanban';

interface BoardTypeToggleProps {
  value: BoardType;
  onChange: (type: BoardType) => void;
}

export function BoardTypeToggle({ value, onChange }: BoardTypeToggleProps) {
  const options: { value: BoardType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'scrum', label: 'Scrum' },
    { value: 'kanban', label: 'Kanban' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Board Type:</label>
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {options.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={value === option.value ? 'default' : 'ghost'}
            onClick={() => onChange(option.value)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
