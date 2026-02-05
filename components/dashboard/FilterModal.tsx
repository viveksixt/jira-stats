'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { QueryModeToggle } from './QueryModeToggle';
import { ProjectFilter } from './ProjectFilter';
import { SprintSelector } from './SprintSelector';
import { BoardSelector } from './BoardSelector';
import { TechEpicsSelector } from './TechEpicsSelector';
import { JQLQueryPanel } from './JQLQueryPanel';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode } from '@/types/jira';

interface FilterModalProps {
  // Mode
  queryMode: QueryMode;
  onQueryModeChange: (mode: QueryMode) => void;

  // Board Mode Filters
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onProjectSelect: (project: JiraProject) => void;
  
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onBoardSelect: (board: JiraBoard) => void;
  
  sprints: JiraSprint[];
  selectedSprints: JiraSprint[];
  onSprintsSelect: (sprints: JiraSprint[]) => void;

  // Tech Epics
  techEpicKeys: string[];
  onTechEpicKeysChange: (keys: string[]) => void;

  // Clear Filters
  onClearFilters: () => void;

  // JQL Mode
  onJQLExecute: (jql: string) => Promise<void>;
  jqlLoading?: boolean;

  // Modal control
  onClose?: () => void;
  onPresetClick?: () => void;
}

export function FilterModal({
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
  onClearFilters,
  onJQLExecute,
  jqlLoading = false,
  onClose,
  onPresetClick,
}: FilterModalProps) {
  const hasActiveFilters = selectedProject || selectedBoard || selectedSprints.length > 0 || techEpicKeys.length > 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Toggle + Clear Button */}
      <div className="flex items-center justify-between gap-4">
        <QueryModeToggle value={queryMode} onChange={onQueryModeChange} />
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            title="Clear all filters"
          >
            🧹
          </Button>
        )}
      </div>

      {/* Board Mode Filters - Responsive Grid */}
      {queryMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Project</Label>
            <ProjectFilter
              projects={projects}
              selectedProject={selectedProject}
              onSelect={onProjectSelect}
            />
          </div>

          {/* Board */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Board</Label>
            <BoardSelector
              boards={boards}
              selectedBoard={selectedBoard}
              onSelect={onBoardSelect}
            />
          </div>

          {/* Sprint */}
          {selectedBoard && sprints.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Sprint</Label>
              <SprintSelector
                sprints={sprints}
                selectedSprints={selectedSprints}
                onSelect={onSprintsSelect}
              />
            </div>
          )}

          {/* Tech Epics */}
          {selectedBoard && (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Tech Epics</Label>
              <TechEpicsSelector
                projectKey={selectedProject?.key || null}
                boardId={selectedBoard.id}
                selectedEpicKeys={techEpicKeys}
                onSelectionChange={onTechEpicKeysChange}
              />
            </div>
          )}
        </div>
      )}

      {/* JQL Mode */}
      {queryMode === 'jql' && (
        <div className="space-y-4">
          {/* JQL Panel */}
          <div>
            <JQLQueryPanel onExecute={onJQLExecute} isLoading={jqlLoading} />
          </div>
        </div>
      )}

      {/* Footer with Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="default"
          onClick={onClose}
        >
          Apply Filters
        </Button>
        <Button
          variant="outline"
          onClick={onPresetClick}
        >
          Manage Presets
        </Button>
      </div>
    </div>
  );
}
