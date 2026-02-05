'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { QueryModeToggle } from './QueryModeToggle';
import { ProjectFilter } from './ProjectFilter';
import { SprintSelector } from './SprintSelector';
import { BoardSelector } from './BoardSelector';
import { TechEpicsSelector } from './TechEpicsSelector';
import { JQLQueryPanel } from './JQLQueryPanel';
import { getPresets, deletePreset, savePreset, updatePreset, type FilterPreset } from '@/lib/filter-presets';
import { showSuccess } from '@/lib/toast';
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
  onLoadPreset?: (preset: FilterPreset) => void;
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
  onLoadPreset,
}: FilterModalProps) {
  const hasActiveFilters = selectedProject || selectedBoard || selectedSprints.length > 0 || techEpicKeys.length > 0;
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    setPresets(getPresets());
  }, []);

  const generatePresetName = () => {
    const existingNumbers = presets
      .map(p => p.name.match(/^Preset #(\d+)$/))
      .filter(Boolean)
      .map(m => parseInt(m![1]));
    const nextNum = existingNumbers.length > 0 
      ? Math.max(...existingNumbers) + 1 
      : 1;
    return `Preset #${nextNum}`;
  };

  const handleSavePreset = () => {
    if (!hasActiveFilters) {
      showSuccess('Please select at least one filter before saving');
      return;
    }

    try {
      const preset = savePreset({
        name: generatePresetName(),
        queryMode,
        projectKey: selectedProject?.key || null,
        boardId: selectedBoard?.id || null,
        sprintIds: selectedSprints.map(s => s.id),
        techEpicKeys,
      });
      setPresets(getPresets()); // Refresh table
      showSuccess(`Preset "${preset.name}" saved`);
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const getProjectName = (key: string | null) => {
    if (!key) return '-';
    return projects.find(p => p.key === key)?.name || key;
  };

  const getBoardName = (id: number | null) => {
    if (!id) return '-';
    return boards.find(b => b.id === id)?.name || String(id);
  };

  const getSprintNames = (ids: number[]) => {
    if (ids.length === 0) return '-';
    const names = ids.map(id => sprints.find(s => s.id === id)?.name || String(id));
    return names.length <= 2 ? names.join(', ') : `${names.length} sprints`;
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    if (onLoadPreset) {
      onLoadPreset(preset);
    }
  };

  const handleDeletePreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation(); // Prevent row click from loading preset
    if (confirm('Are you sure you want to delete this preset?')) {
      deletePreset(presetId);
      setPresets(getPresets()); // Refresh presets list
    }
  };

  const handleSavePresetName = (presetId: string) => {
    if (editingName.trim()) {
      updatePreset(presetId, { name: editingName });
      setPresets(getPresets());
      setEditingPresetId(null);
      showSuccess('Preset name updated');
    }
  };

  const handleCancelEdit = () => {
    setEditingPresetId(null);
    setEditingName('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
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

      {/* Presets Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-2">
          <Label className="text-sm font-medium">Available Presets</Label>
        </div>
        {presets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No presets saved yet. Click the 💾 button to create one.
          </div>
        ) : (
          <div className="border rounded-lg flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Project</th>
                    <th className="text-left p-3 text-sm font-medium">Board</th>
                    <th className="text-left p-3 text-sm font-medium">Sprints</th>
                    <th className="text-left p-3 text-sm font-medium">Created</th>
                    <th className="text-right p-3 text-sm font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {presets.map((preset) => (
                    <tr
                      key={preset.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      <td className="p-3 text-sm font-medium">
                        {editingPresetId === preset.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 w-32 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  handleSavePresetName(preset.id);
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSavePresetName(preset.id);
                              }}
                              title="Save name"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              title="Cancel"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>{preset.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPresetId(preset.id);
                                setEditingName(preset.name);
                              }}
                              title="Edit name"
                            >
                              ✏️
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">{getProjectName(preset.projectKey)}</td>
                      <td className="p-3 text-sm">{getBoardName(preset.boardId)}</td>
                      <td className="p-3 text-sm">{getSprintNames(preset.sprintIds)}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeletePreset(e, preset.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          title="Delete preset"
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Footer with Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
        <Button
          variant="outline"
          onClick={handleSavePreset}
          className="h-10 w-10 p-0"
          title="Save current filters as preset"
          disabled={!hasActiveFilters}
        >
          💾
        </Button>
        <Button
          variant="default"
          onClick={onClose}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
