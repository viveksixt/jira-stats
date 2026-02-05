import { QueryMode } from '@/types/jira';

export interface FilterPreset {
  id: string;
  name: string;
  queryMode: QueryMode;
  projectKey: string | null;
  boardId: number | null;
  sprintIds: number[];
  techEpicKeys: string[];
  createdAt: string;
}

const PRESETS_KEY = 'jira-stats-filter-presets';

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all presets from localStorage
export function getPresets(): FilterPreset[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(PRESETS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed.presets) ? parsed.presets : [];
  } catch (error) {
    console.error('Error loading presets:', error);
    return [];
  }
}

// Save a new preset
export function savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): FilterPreset {
  if (typeof window === 'undefined') return preset as FilterPreset;
  
  const newPreset: FilterPreset = {
    ...preset,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  try {
    const presets = getPresets();
    presets.push(newPreset);
    localStorage.setItem(PRESETS_KEY, JSON.stringify({ presets }));
    return newPreset;
  } catch (error) {
    console.error('Error saving preset:', error);
    throw error;
  }
}

// Load a preset by ID
export function loadPreset(id: string): FilterPreset | null {
  const presets = getPresets();
  return presets.find(p => p.id === id) || null;
}

// Delete a preset by ID
export function deletePreset(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const presets = getPresets();
    const filtered = presets.filter(p => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify({ presets: filtered }));
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw error;
  }
}

// Update a preset
export function updatePreset(id: string, updates: Partial<FilterPreset>): FilterPreset | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const presets = getPresets();
    const index = presets.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    presets[index] = { ...presets[index], ...updates };
    localStorage.setItem(PRESETS_KEY, JSON.stringify({ presets }));
    return presets[index];
  } catch (error) {
    console.error('Error updating preset:', error);
    throw error;
  }
}
