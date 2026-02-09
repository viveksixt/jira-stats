'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BoardSelector } from '@/components/dashboard/BoardSelector';
import type { JiraBoard, VelocityEngineer, VelocityTimelineConfig } from '@/types/jira';

interface VelocityFiltersProps {
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onBoardSelect: (board: JiraBoard) => void;
  selectedEngineers: VelocityEngineer[];
  onEngineersSelect: (engineers: VelocityEngineer[]) => void;
  timelineConfig: VelocityTimelineConfig;
  onTimelineConfigChange: (config: VelocityTimelineConfig) => void;
  onApply: () => void;
  loading?: boolean;
  boardDisabled?: boolean;
  boardDisabledMessage?: string;
}

export function VelocityFilters({
  boards,
  selectedBoard,
  onBoardSelect,
  selectedEngineers,
  onEngineersSelect,
  timelineConfig,
  onTimelineConfigChange,
  onApply,
  loading = false,
  boardDisabled = false,
  boardDisabledMessage,
}: VelocityFiltersProps) {
  const [availableEngineers, setAvailableEngineers] = useState<VelocityEngineer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingEngineers, setFetchingEngineers] = useState(false);

  // Fetch engineers when board changes
  useEffect(() => {
    if (!selectedBoard || boardDisabled) {
      setAvailableEngineers([]);
      return;
    }

    const fetchEngineers = async () => {
      setFetchingEngineers(true);
      try {
        const res = await fetch(`/api/velocity/assignees?boardId=${selectedBoard.id}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableEngineers(data.assignees || []);
        }
      } catch (error) {
        console.error('Failed to fetch engineers:', error);
        setAvailableEngineers([]);
      } finally {
        setFetchingEngineers(false);
      }
    };

    fetchEngineers();
  }, [selectedBoard, boardDisabled]);

  const filteredEngineers = availableEngineers.filter(eng =>
    eng.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eng.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEngineerToggle = (engineer: VelocityEngineer) => {
    const isSelected = selectedEngineers.some(e => e.accountId === engineer.accountId);
    if (isSelected) {
      onEngineersSelect(selectedEngineers.filter(e => e.accountId !== engineer.accountId));
    } else {
      onEngineersSelect([...selectedEngineers, engineer]);
    }
  };

  const handleSelectAll = () => {
    onEngineersSelect(filteredEngineers);
  };

  const handleClearAll = () => {
    onEngineersSelect([]);
  };

  // Calculate date range presets
  const getDatePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  return (
    <div className="space-y-6">
      {/* Board Selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Board</Label>
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          onSelect={onBoardSelect}
          disabled={boardDisabled}
        />
        {boardDisabled && boardDisabledMessage && (
          <p className="text-xs text-muted-foreground">{boardDisabledMessage}</p>
        )}
      </div>

      {/* Engineer Selection */}
      {selectedBoard && !boardDisabled && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Engineers</Label>
            {fetchingEngineers && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>

          <Input
            placeholder="Search engineers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={fetchingEngineers}
            className="text-sm"
          />

          {availableEngineers.length > 0 && (
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={fetchingEngineers}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={fetchingEngineers}
              >
                Clear All
              </Button>
            </div>
          )}

          <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
            {filteredEngineers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {searchTerm ? 'No engineers match your search' : 'No engineers found'}
              </div>
            ) : (
              filteredEngineers.map((engineer) => {
                const isSelected = selectedEngineers.some(e => e.accountId === engineer.accountId);
                return (
                  <div
                    key={engineer.accountId}
                    className="flex items-start gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => handleEngineerToggle(engineer)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleEngineerToggle(engineer)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{engineer.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {engineer.emailAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {engineer.totalIssueCount} issues
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Timeline Configuration */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Timeline Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={timelineConfig.mode === 'sprint-count' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimelineConfigChange({ ...timelineConfig, mode: 'sprint-count' })}
          >
            Last N Sprints
          </Button>
          <Button
            variant={timelineConfig.mode === 'date-range' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimelineConfigChange({ ...timelineConfig, mode: 'date-range' })}
          >
            Date Range
          </Button>
        </div>
      </div>

      {/* Sprint Count Configuration */}
      {timelineConfig.mode === 'sprint-count' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="sprint-limit" className="text-sm">
            Number of Sprints (max 50)
          </Label>
          <Input
            id="sprint-limit"
            type="number"
            min="1"
            max="50"
            value={timelineConfig.sprintLimit || 20}
            onChange={(e) =>
              onTimelineConfigChange({
                ...timelineConfig,
                sprintLimit: Math.min(Math.max(1, parseInt(e.target.value) || 20), 50),
              })
            }
            className="text-sm"
          />
        </div>
      )}

      {/* Date Range Configuration */}
      {timelineConfig.mode === 'date-range' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              variant={
                timelineConfig.startDate && new Date(timelineConfig.startDate) >= new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() => {
                const dates = getDatePreset(1);
                onTimelineConfigChange({
                  ...timelineConfig,
                  startDate: dates.start,
                  endDate: dates.end,
                });
              }}
            >
              Last 1 Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dates = getDatePreset(3);
                onTimelineConfigChange({
                  ...timelineConfig,
                  startDate: dates.start,
                  endDate: dates.end,
                });
              }}
            >
              Last 3 Months
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dates = getDatePreset(6);
                onTimelineConfigChange({
                  ...timelineConfig,
                  startDate: dates.start,
                  endDate: dates.end,
                });
              }}
            >
              Last 6 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dates = getDatePreset(12);
                onTimelineConfigChange({
                  ...timelineConfig,
                  startDate: dates.start,
                  endDate: dates.end,
                });
              }}
            >
              Last 12 Months
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <Label htmlFor="start-date" className="text-sm">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={timelineConfig.startDate || ''}
                onChange={(e) =>
                  onTimelineConfigChange({
                    ...timelineConfig,
                    startDate: e.target.value,
                  })
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={timelineConfig.endDate || ''}
                onChange={(e) =>
                  onTimelineConfigChange({
                    ...timelineConfig,
                    endDate: e.target.value,
                  })
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <Button
        className="w-full"
        onClick={onApply}
        disabled={!selectedBoard || loading}
      >
        {loading ? 'Loading...' : 'Apply'}
      </Button>
    </div>
  );
}
