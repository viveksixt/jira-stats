'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterModal } from './FilterModal';
import { getPresets, type FilterPreset } from '@/lib/filter-presets';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode } from '@/types/jira';

interface FilterIconProps {
  queryMode: QueryMode;
  onQueryModeChange: (mode: QueryMode) => void;
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onProjectSelect: (project: JiraProject) => void;
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onBoardSelect: (board: JiraBoard) => void;
  sprints: JiraSprint[];
  selectedSprints: JiraSprint[];
  onSprintsSelect: (sprints: JiraSprint[]) => void;
  techEpicKeys: string[];
  onTechEpicKeysChange: (keys: string[]) => void;
  techLabels: string[];
  onTechLabelsChange: (labels: string[]) => void;
  ignoreIssueKeys: string[];
  onIgnoreIssueKeysChange: (keys: string[]) => void;
  onClearFilters: () => void;
  onJQLExecute: (jql: string) => Promise<void>;
  jqlLoading?: boolean;
  onLoadPreset?: (preset: FilterPreset) => void;
}

export function FilterIcon({
  queryMode,
  onQueryModeChange,
  projects,
  selectedProject,
  onProjectSelect,
  boards,
  selectedBoard,
  onBoardSelect,
  sprints,
  selectedSprints,
  onSprintsSelect,
  techEpicKeys,
  onTechEpicKeysChange,
  techLabels,
  onTechLabelsChange,
  ignoreIssueKeys,
  onIgnoreIssueKeysChange,
  onClearFilters,
  onJQLExecute,
  jqlLoading = false,
  onLoadPreset,
}: FilterIconProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = selectedProject || selectedBoard || selectedSprints.length > 0 || techEpicKeys.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 hover:bg-accent rounded-md transition-colors"
        title="Open filters"
      >
        ☰
        {hasActiveFilters && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
            {(selectedProject ? 1 : 0) + (selectedBoard ? 1 : 0) + selectedSprints.length + (techEpicKeys.length > 0 ? 1 : 0)}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Filter Options</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              ✕
            </Button>
          </DialogHeader>
          <FilterModal
            queryMode={queryMode}
            onQueryModeChange={onQueryModeChange}
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={onProjectSelect}
            boards={boards}
            selectedBoard={selectedBoard}
            onBoardSelect={onBoardSelect}
            sprints={sprints}
            selectedSprints={selectedSprints}
            onSprintsSelect={onSprintsSelect}
            techEpicKeys={techEpicKeys}
            onTechEpicKeysChange={onTechEpicKeysChange}
            techLabels={techLabels}
            onTechLabelsChange={onTechLabelsChange}
            ignoreIssueKeys={ignoreIssueKeys}
            onIgnoreIssueKeysChange={onIgnoreIssueKeysChange}
            onClearFilters={onClearFilters}
            onJQLExecute={onJQLExecute}
            jqlLoading={jqlLoading}
            onClose={() => setOpen(false)}
            onLoadPreset={onLoadPreset}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
