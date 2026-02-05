'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEFAULT_TECH_LABELS } from '@/lib/metrics/kpi';

// Simple Settings icon component
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface TechDebtSettingsProps {
  techLabels: string[];
  onSave: (labels: string[]) => void;
}

export function TechDebtSettings({ techLabels, onSave }: TechDebtSettingsProps) {
  const [open, setOpen] = useState(false);
  const [labelsInput, setLabelsInput] = useState(techLabels.join(', '));

  const handleSave = () => {
    const labels = labelsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    if (labels.length === 0) {
      // Reset to defaults if empty
      onSave(DEFAULT_TECH_LABELS);
      setLabelsInput(DEFAULT_TECH_LABELS.join(', '));
    } else {
      onSave(labels);
    }
    setOpen(false);
  };

  const handleReset = () => {
    setLabelsInput(DEFAULT_TECH_LABELS.join(', '));
    onSave(DEFAULT_TECH_LABELS);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tech Debt Label Configuration</DialogTitle>
          <DialogDescription>
            Configure which labels should be considered as tech debt. Issues with these labels will be counted as technical work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tech-labels">Tech Debt Labels</Label>
            <Input
              id="tech-labels"
              placeholder="tech, tech-debt, tech_debt"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Enter comma-separated label names (case-insensitive)
            </p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-1">Current labels:</p>
            <div className="flex flex-wrap gap-1">
              {labelsInput.split(',').map((label, i) => {
                const trimmed = label.trim();
                if (!trimmed) return null;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    {trimmed}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
