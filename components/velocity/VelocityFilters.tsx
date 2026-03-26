'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BoardSelector } from '@/components/dashboard/BoardSelector';
import type { JiraBoard, VelocityEngineer, VelocityTimelineConfig, VelocityGranularity } from '@/types/jira';

interface VelocityFiltersProps {
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onBoardSelect: (board: JiraBoard | null) => void;

  availableEngineers: VelocityEngineer[];
  selectedEngineers: VelocityEngineer[];
  onEngineersSelect: (engineers: VelocityEngineer[]) => void;

  timeline: VelocityTimelineConfig;
  onTimelineChange: (next: VelocityTimelineConfig) => void;

  sprintNameRegex: string;
  onSprintRegexChange: (val: string) => void;

  onApplyTeam: () => void;
  loadingTeam?: boolean;
}

export function VelocityFilters({
  boards,
  selectedBoard,
  onBoardSelect,
  availableEngineers,
  selectedEngineers,
  onEngineersSelect,
  timeline,
  onTimelineChange,
  sprintNameRegex,
  onSprintRegexChange,
  onApplyTeam,
  loadingTeam = false,
}: VelocityFiltersProps) {
  const [engineerSearch, setEngineerSearch] = useState('');
  const [regexError, setRegexError] = useState('');

  const filteredEngineers = useMemo(() => {
    const q = engineerSearch.trim().toLowerCase();
    if (!q) return availableEngineers;
    return availableEngineers.filter((e) => {
      return (
        e.displayName.toLowerCase().includes(q) ||
        (e.emailAddress || '').toLowerCase().includes(q)
      );
    });
  }, [availableEngineers, engineerSearch]);

  const isSelected = (accountId: string) =>
    selectedEngineers.some((e) => e.accountId === accountId);

  const toggleEngineer = (eng: VelocityEngineer) => {
    if (isSelected(eng.accountId)) {
      onEngineersSelect(selectedEngineers.filter((e) => e.accountId !== eng.accountId));
    } else {
      onEngineersSelect([...selectedEngineers, eng]);
    }
  };

  const selectAllFiltered = () => onEngineersSelect(filteredEngineers);
  const clearAll = () => onEngineersSelect([]);

  const handleRegexChange = (val: string) => {
    if (val) {
      try {
        new RegExp(val, 'i');
        setRegexError('');
      } catch {
        setRegexError('Invalid regex pattern');
      }
    } else {
      setRegexError('');
    }
    onSprintRegexChange(val);
  };

  const setGranularity = (g: VelocityGranularity) =>
    onTimelineChange({ ...timeline, granularity: g });

  const getDatePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  // Ensure defaults
  useEffect(() => {
    if (!timeline.granularity) {
      onTimelineChange({ ...timeline, granularity: 'sprint' });
    }
  }, [timeline, onTimelineChange]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Board</Label>
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          onSelect={(b) => onBoardSelect(b)}
        />
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBoardSelect(null)}
            disabled={!selectedBoard}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Engineer Trend Granularity</Label>
        <div className="flex gap-2">
          <Button
            variant={(timeline.granularity || 'sprint') === 'sprint' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGranularity('sprint')}
          >
            Sprint-on-sprint
          </Button>
          <Button
            variant={timeline.granularity === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGranularity('week')}
          >
            Week-on-week
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Timeline Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={timeline.mode === 'sprint-count' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimelineChange({ ...timeline, mode: 'sprint-count' })}
          >
            Last N sprints
          </Button>
          <Button
            variant={timeline.mode === 'date-range' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimelineChange({ ...timeline, mode: 'date-range' })}
          >
            Date range
          </Button>
        </div>
      </div>

      {timeline.mode === 'sprint-count' && (
        <div className="space-y-2">
          <Label htmlFor="velocity-sprint-limit" className="text-sm">
            Number of sprints (max 50)
          </Label>
          <Input
            id="velocity-sprint-limit"
            type="number"
            min={1}
            max={50}
            value={timeline.sprintLimit || 20}
            onChange={(e) =>
              onTimelineChange({
                ...timeline,
                sprintLimit: Math.min(Math.max(1, parseInt(e.target.value || '20', 10) || 20), 50),
              })
            }
          />
        </div>
      )}

      {timeline.mode === 'date-range' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[1, 3, 6, 12].map((m) => (
              <Button
                key={m}
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = getDatePreset(m);
                  onTimelineChange({ ...timeline, startDate: d.start, endDate: d.end });
                }}
              >
                Last {m} mo
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <div>
              <Label htmlFor="velocity-start" className="text-sm">Start date</Label>
              <Input
                id="velocity-start"
                type="date"
                value={timeline.startDate || ''}
                onChange={(e) => onTimelineChange({ ...timeline, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="velocity-end" className="text-sm">End date</Label>
              <Input
                id="velocity-end"
                type="date"
                value={timeline.endDate || ''}
                onChange={(e) => onTimelineChange({ ...timeline, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="velocity-regex" className="text-sm font-medium">
          Sprint name pattern
        </Label>
        <div className="relative">
          <Input
            id="velocity-regex"
            placeholder="e.g. ^Cart or ^sort"
            value={sprintNameRegex}
            onChange={(e) => handleRegexChange(e.target.value)}
            className={`${regexError ? 'border-destructive' : ''} ${sprintNameRegex ? 'pr-7' : ''}`}
          />
          {sprintNameRegex && (
            <button
              type="button"
              onClick={() => handleRegexChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-base leading-none"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
        {regexError ? (
          <p className="text-xs text-destructive">{regexError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Filter sprints by name. Leave blank to show all.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Engineers</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllFiltered} disabled={filteredEngineers.length === 0}>
              Select all
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={selectedEngineers.length === 0}>
              Clear
            </Button>
          </div>
        </div>
        <div className="relative">
          <Input
            placeholder="Search engineers..."
            value={engineerSearch}
            onChange={(e) => setEngineerSearch(e.target.value)}
            className={engineerSearch ? 'pr-7' : ''}
          />
          {engineerSearch && (
            <button
              type="button"
              onClick={() => setEngineerSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-base leading-none"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
        <div className="border rounded-lg p-2 max-h-64 overflow-auto">
          {filteredEngineers.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">No engineers found.</div>
          ) : (
            filteredEngineers.map((eng) => (
              <button
                type="button"
                key={eng.accountId}
                onClick={() => toggleEngineer(eng)}
                className="w-full flex items-start gap-2 p-2 rounded hover:bg-accent text-left"
              >
                <input
                  type="checkbox"
                  checked={isSelected(eng.accountId)}
                  readOnly
                  className="mt-1"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{eng.displayName}</div>
                  {eng.emailAddress && (
                    <div className="text-xs text-muted-foreground truncate">{eng.emailAddress}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{eng.totalIssueCount} issues</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Button className="w-full" onClick={onApplyTeam} disabled={!selectedBoard || loadingTeam || !!regexError}>
        {loadingTeam ? 'Loading…' : 'Apply (team trend)'}
      </Button>
    </div>
  );
}

