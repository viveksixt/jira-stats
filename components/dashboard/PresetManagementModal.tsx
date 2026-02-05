'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getPresets, 
  savePreset, 
  deletePreset, 
  type FilterPreset 
} from '@/lib/filter-presets';
import { showSuccess, showError } from '@/lib/toast';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode } from '@/types/jira';

interface PresetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (preset: FilterPreset) => void;
  
  // Current filter state for saving
  queryMode: QueryMode;
  selectedProject: JiraProject | null;
  selectedBoard: JiraBoard | null;
  selectedSprints: JiraSprint[];
  techEpicKeys: string[];
  
  // For display purposes
  projects: JiraProject[];
  boards: JiraBoard[];
  sprints: JiraSprint[];
}

export function PresetManagementModal({
  isOpen,
  onClose,
  onLoadPreset,
  queryMode,
  selectedProject,
  selectedBoard,
  selectedSprints,
  techEpicKeys,
  projects,
  boards,
  sprints,
}: PresetManagementModalProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(getPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      showError('Please enter a preset name');
      return;
    }

    try {
      const preset = savePreset({
        name: newPresetName,
        queryMode,
        projectKey: selectedProject?.key || null,
        boardId: selectedBoard?.id || null,
        sprintIds: selectedSprints.map(s => s.id),
        techEpicKeys,
      });

      setPresets(getPresets());
      setNewPresetName('');
      setShowSaveForm(false);
      showSuccess(`Preset "${preset.name}" saved successfully`);
    } catch (error) {
      showError('Failed to save preset');
    }
  };

  const handleDeletePreset = (id: string) => {
    try {
      deletePreset(id);
      setPresets(getPresets());
      showSuccess('Preset deleted successfully');
    } catch (error) {
      showError('Failed to delete preset');
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset);
    showSuccess(`Loaded preset "${preset.name}"`);
    onClose();
  };

  const getProjectName = (key: string | null) => {
    if (!key) return '-';
    return projects.find(p => p.key === key)?.name || key;
  };

  const getBoardName = (id: number | null) => {
    if (!id) return '-';
    return boards.find(b => b.id === id)?.name || id;
  };

  const getSprintNames = (ids: number[]) => {
    if (ids.length === 0) return '-';
    const names = ids.map(id => sprints.find(s => s.id === id)?.name || id);
    return names.length <= 2 ? names.join(', ') : `${names.length} sprints`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Manage Filter Presets</DialogTitle>
          <DialogDescription>
            Save and load filter combinations for quick access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save New Preset Form */}
          {showSaveForm ? (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="e.g., Q1 Backend Team"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSavePreset}
                >
                  Save Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSaveForm(false);
                    setNewPresetName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveForm(true)}
              disabled={!selectedProject && !selectedBoard && selectedSprints.length === 0 && techEpicKeys.length === 0}
            >
              Save Current Filters as Preset
            </Button>
          )}

          {/* Presets Table */}
          {presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No presets saved yet. Create one to get started!
            </div>
          ) : (
            <div className="border rounded-lg">
              <ScrollArea className="h-[300px]">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Project</th>
                      <th className="text-left p-3 text-sm font-medium">Board</th>
                      <th className="text-left p-3 text-sm font-medium">Sprints</th>
                      <th className="text-left p-3 text-sm font-medium">Created</th>
                      <th className="text-left p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {presets.map((preset) => (
                      <tr
                        key={preset.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleLoadPreset(preset)}
                      >
                        <td className="p-3 text-sm font-medium">{preset.name}</td>
                        <td className="p-3 text-sm">{getProjectName(preset.projectKey)}</td>
                        <td className="p-3 text-sm">{getBoardName(preset.boardId)}</td>
                        <td className="p-3 text-sm">{getSprintNames(preset.sprintIds)}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(preset.id);
                            }}
                          >
                            Delete
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
