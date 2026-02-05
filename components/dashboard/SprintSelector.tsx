'use client';

import { AutocompleteDropdown } from '@/components/ui/autocomplete-dropdown';
import type { JiraSprint } from '@/types/jira';

interface SprintSelectorProps {
  sprints: JiraSprint[];
  selectedSprint: JiraSprint | null;
  onSelect: (sprint: JiraSprint) => void;
}

export function SprintSelector({ sprints, selectedSprint, onSelect }: SprintSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium min-w-fit">
        Sprint:
      </label>
      <div className="flex-1 min-w-0">
        <AutocompleteDropdown<JiraSprint>
          items={sprints}
          selectedItem={selectedSprint}
          onSelect={onSelect}
          getItemLabel={(sprint) => sprint.name}
          getItemValue={(sprint) => sprint.id}
          placeholder="Search or select sprint..."
        />
      </div>
    </div>
  );
}
