'use client';

import { Card, CardContent } from '@/components/ui/card';
import { QueryModeToggle } from './QueryModeToggle';
import { BoardTypeToggle } from './BoardTypeToggle';
import { ProjectFilter } from './ProjectFilter';
import { SprintSelector } from './SprintSelector';
import { BoardSelector } from './BoardSelector';
import { JQLQueryPanel } from './JQLQueryPanel';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode, BoardType } from '@/types/jira';

interface FilterPanelProps {
  // Mode
  queryMode: QueryMode;
  onQueryModeChange: (mode: QueryMode) => void;

  // Board Mode Filters
  boardType: BoardType;
  onBoardTypeChange: (type: BoardType) => void;
  
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onProjectSelect: (project: JiraProject) => void;
  
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onBoardSelect: (board: JiraBoard) => void;
  
  sprints: JiraSprint[];
  selectedSprint: JiraSprint | null;
  onSprintSelect: (sprint: JiraSprint) => void;

  // JQL Mode
  onJQLExecute: (jql: string) => Promise<void>;
  jqlLoading?: boolean;
}

export function FilterPanel({
  queryMode,
  onQueryModeChange,
  boardType,
  onBoardTypeChange,
  projects,
  selectedProject,
  onProjectSelect,
  boards,
  selectedBoard,
  onBoardSelect,
  sprints,
  selectedSprint,
  onSprintSelect,
  onJQLExecute,
  jqlLoading = false,
}: FilterPanelProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Row 1: Query Mode Toggle + Board Type Toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <QueryModeToggle value={queryMode} onChange={onQueryModeChange} />
            {queryMode === 'board' && (
              <BoardTypeToggle value={boardType} onChange={onBoardTypeChange} />
            )}
          </div>

          {/* Board Mode Filters */}
          {queryMode === 'board' && (
            <div className="space-y-4">
              {/* Row 2: Project + Board + Sprint on same line */}
              <div className="flex flex-wrap items-center gap-4">
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
              </div>
            </div>
          )}

          {/* JQL Mode */}
          {queryMode === 'jql' && (
            <JQLQueryPanel onExecute={onJQLExecute} isLoading={jqlLoading} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
