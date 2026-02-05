'use client';

import { Button } from './button';
import { clearAllToasts } from '@/lib/toast';

interface ClearAllToastsProps {
  className?: string;
}

export function ClearAllToasts({ className = '' }: ClearAllToastsProps) {
  const handleClearAll = () => {
    clearAllToasts();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClearAll}
      className={`text-xs ${className}`}
      title="Clear all notifications"
    >
      Clear All
    </Button>
  );
}
