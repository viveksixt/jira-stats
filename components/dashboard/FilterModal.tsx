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
import { DEFAULT_TECH_LABELS } from '@/lib/metrics/kpi';
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

  // Tech Debt Configuration
  techLabels: string[];
  onTechLabelsChange: (labels: string[]) => void;
  ignoreIssueKeys: string[];
  onIgnoreIssueKeysChange: (keys: string[]) => void;

  // Clear Filters
  onClearFilters: () => void;

  // JQL Mode
  onJQLExecute: (jql: string) => Promise<void>;
  jqlLoading?: boolean;

  // Modal control
  onClose?: () => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  presetLoading?: boolean;
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
  techLabels,
  onTechLabelsChange,
  ignoreIssueKeys,
  onIgnoreIssueKeysChange,
  onClearFilters,
  onJQLExecute,
  jqlLoading = false,
  onClose,
  onLoadPreset,
  presetLoading = false,
}: FilterModalProps) {
  const hasActiveFilters = selectedProject || selectedBoard || selectedSprints.length > 0 || techEpicKeys.length > 0;
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [configExpanded, setConfigExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof FilterPreset | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Ensure tech labels and ignore keys are arrays
  const safeTechLabels = Array.isArray(techLabels) ? techLabels : DEFAULT_TECH_LABELS;
  const safeIgnoreKeys = Array.isArray(ignoreIssueKeys) ? ignoreIssueKeys : [];
  const [labelsInput, setLabelsInput] = useState(safeTechLabels.join(', '));
  const [ignoreKeysInput, setIgnoreKeysInput] = useState(safeIgnoreKeys.join(', '));

  // Update local inputs when props change
  useEffect(() => {
    setLabelsInput(safeTechLabels.join(', '));
  }, [safeTechLabels]);

  useEffect(() => {
    setIgnoreKeysInput(safeIgnoreKeys.join(', '));
  }, [safeIgnoreKeys]);

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
        techLabels: safeTechLabels,
        ignoreIssueKeys: safeIgnoreKeys,
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

  const handleDeleteAllPresets = () => {
    if (confirm('Are you sure you want to delete all presets? This cannot be undone.')) {
      presets.forEach(preset => deletePreset(preset.id));
      setPresets([]);
      showSuccess('All presets deleted');
    }
  };

  const handleSort = (column: keyof FilterPreset) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: keyof FilterPreset) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Filter and sort presets
  const filteredAndSortedPresets = presets
    .filter((preset) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        preset.name.toLowerCase().includes(query) ||
        getProjectName(preset.projectKey).toLowerCase().includes(query) ||
        getBoardName(preset.boardId).toLowerCase().includes(query) ||
        getSprintNames(preset.sprintIds).toLowerCase().includes(query) ||
        (preset.techEpicKeys && preset.techEpicKeys.join(', ').toLowerCase().includes(query)) ||
        (preset.techLabels && preset.techLabels.join(', ').toLowerCase().includes(query)) ||
        (preset.ignoreIssueKeys && preset.ignoreIssueKeys.join(', ').toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];
      
      // Handle different data types
      if (sortColumn === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortColumn === 'sprintIds' || sortColumn === 'techEpicKeys' || sortColumn === 'techLabels' || sortColumn === 'ignoreIssueKeys') {
        aValue = Array.isArray(aValue) ? aValue.length : 0;
        bValue = Array.isArray(bValue) ? bValue.length : 0;
      } else if (sortColumn === 'projectKey') {
        aValue = getProjectName(aValue);
        bValue = getProjectName(bValue);
      } else if (sortColumn === 'boardId') {
        aValue = getBoardName(aValue);
        bValue = getBoardName(bValue);
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleLabelsInputChange = (value: string) => {
    setLabelsInput(value);
  };

  const handleLabelsInputBlur = () => {
    const labels = labelsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    if (labels.length === 0) {
      onTechLabelsChange(DEFAULT_TECH_LABELS);
      setLabelsInput(DEFAULT_TECH_LABELS.join(', '));
    } else {
      onTechLabelsChange(labels);
    }
  };

  const handleIgnoreKeysInputChange = (value: string) => {
    setIgnoreKeysInput(value);
  };

  const handleIgnoreKeysInputBlur = () => {
    const keys = ignoreKeysInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    onIgnoreIssueKeysChange(keys);
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

      {/* Configuration Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setConfigExpanded(!configExpanded)}>
          <h3 className="font-semibold text-sm">Additional Filters</h3>
          <span className={`transition-transform ${configExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>

        {configExpanded && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="tech-labels" className="text-sm">Tech Debt Labels</Label>
              <Input
                id="tech-labels"
                placeholder="tech, tech-debt, tech_debt"
                value={labelsInput}
                onChange={(e) => handleLabelsInputChange(e.target.value)}
                onBlur={handleLabelsInputBlur}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated label names (case-insensitive)
              </p>
              <div className="rounded-md bg-muted p-2 mt-2">
                <p className="text-xs font-medium mb-1">Current labels:</p>
                <div className="flex flex-wrap gap-1">
                  {safeTechLabels.map((label, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="ignore-keys" className="text-sm">Ignore Issue Keys</Label>
              <Input
                id="ignore-keys"
                placeholder="PROJ-123, PROJ-456"
                value={ignoreKeysInput}
                onChange={(e) => handleIgnoreKeysInputChange(e.target.value)}
                onBlur={handleIgnoreKeysInputBlur}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated issue keys to exclude from all metrics
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Presets Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Available Presets</Label>
          {presets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllPresets}
              className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
              title="Delete all presets"
            >
              ⊘
            </Button>
          )}
        </div>
        {presets.length > 0 && (
          <div className="mb-2">
            <Input
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
          </div>
        )}
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
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('projectKey')}
                    >
                      <div className="flex items-center gap-1">
                        Project {getSortIcon('projectKey')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('boardId')}
                    >
                      <div className="flex items-center gap-1">
                        Board {getSortIcon('boardId')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('sprintIds')}
                    >
                      <div className="flex items-center gap-1">
                        Sprints {getSortIcon('sprintIds')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('techEpicKeys')}
                    >
                      <div className="flex items-center gap-1">
                        Tech Epics {getSortIcon('techEpicKeys')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('techLabels')}
                    >
                      <div className="flex items-center gap-1">
                        Tech Labels {getSortIcon('techLabels')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('ignoreIssueKeys')}
                    >
                      <div className="flex items-center gap-1">
                        Ignore Keys {getSortIcon('ignoreIssueKeys')}
                      </div>
                    </th>
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted/80 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Created {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="text-right p-3 text-sm font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAndSortedPresets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No presets match your search' : 'No presets found'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedPresets.map((preset) => (
                    <tr
                      key={preset.id}
                      className={`transition-colors ${presetLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                      onClick={() => !presetLoading && handleLoadPreset(preset)}
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
                              disabled={presetLoading}
                            >
                              ✏️
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">{getProjectName(preset.projectKey)}</td>
                      <td className="p-3 text-sm">{getBoardName(preset.boardId)}</td>
                      <td className="p-3 text-sm">{getSprintNames(preset.sprintIds)}</td>
                      <td className="p-3 text-sm">
                        {preset.techEpicKeys && preset.techEpicKeys.length > 0 
                          ? preset.techEpicKeys.join(', ') 
                          : '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {preset.techLabels && preset.techLabels.length > 0 
                          ? preset.techLabels.join(', ') 
                          : '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {preset.ignoreIssueKeys && preset.ignoreIssueKeys.length > 0 
                          ? preset.ignoreIssueKeys.join(', ') 
                          : '-'}
                      </td>
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
                          disabled={presetLoading}
                        >
                          ⊘
                        </Button>
                      </td>
                    </tr>
                    ))
                  )}
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
