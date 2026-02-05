'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QueryModeToggle } from './QueryModeToggle';
import { ProjectFilter } from './ProjectFilter';
import { SprintSelector } from './SprintSelector';
import { BoardSelector } from './BoardSelector';
import { TechEpicsSelector } from './TechEpicsSelector';
import { JQLQueryPanel } from './JQLQueryPanel';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode } from '@/types/jira';

interface FilterPanelProps {
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
  selectedSprint: JiraSprint | null;
  onSprintSelect: (sprint: JiraSprint) => void;

  // Tech Epics
  techEpicKeys: string[];
  onTechEpicKeysChange: (keys: string[]) => void;

  // Clear Filters
  onClearFilters: () => void;

  // JQL Mode
  onJQLExecute: (jql: string) => Promise<void>;
  jqlLoading?: boolean;
}

export function FilterPanel({
  queryMode,
  onQueryModeChange,
  projects,
  selectedProject,
  onProjectSelect,
  boards,
  selectedBoard,
  onBoardSelect,
  sprints,
  selectedSprint,
  onSprintSelect,
  techEpicKeys,
  onTechEpicKeysChange,
  onClearFilters,
  onJQLExecute,
  jqlLoading = false,
}: FilterPanelProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Board Mode Filters */}
          {queryMode === 'board' && (
            <div className="flex flex-wrap items-center gap-4">
              <QueryModeToggle value={queryMode} onChange={onQueryModeChange} />
              
              <ProjectFilter
                projects={projects}
                selectedProject={selectedProject}
                onSelect={onProjectSelect}
              />

              <BoardSelector
                boards={boards}
                selectedBoard={selectedBoard}
                onSelect={onBoardSelect}
              />

              {selectedBoard && sprints.length > 0 && (
                <SprintSelector
                  sprints={sprints}
                  selectedSprint={selectedSprint}
                  onSelect={onSprintSelect}
                />
              )}

              {selectedBoard && (
                <TechEpicsSelector
                  projectKey={selectedProject?.key || null}
                  boardId={selectedBoard.id}
                  selectedEpicKeys={techEpicKeys}
                  onSelectionChange={onTechEpicKeysChange}
                />
              )}

              {(selectedProject || selectedBoard || selectedSprint || techEpicKeys.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  title="Clear all filters"
                >
                  🗑️
                </Button>
              )}
            </div>
          )}

          {/* JQL Mode */}
          {queryMode === 'jql' && (
            <div className="flex flex-wrap items-center gap-4">
              <QueryModeToggle value={queryMode} onChange={onQueryModeChange} />
              <div className="w-full">
                <JQLQueryPanel onExecute={onJQLExecute} isLoading={jqlLoading} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
