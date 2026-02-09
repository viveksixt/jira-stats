'use client';

import { AutocompleteDropdown } from '@/components/ui/autocomplete-dropdown';
import type { JiraBoard } from '@/types/jira';

interface BoardSelectorProps {
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onSelect: (board: JiraBoard) => void;
  disabled?: boolean;
}

export function BoardSelector({ boards, selectedBoard, onSelect, disabled = false }: BoardSelectorProps) {
  const getBoardLabel = (board: JiraBoard): string => {
    return board.name;
  };

  const getBoardDescription = (board: JiraBoard): string => {
    return `Type: ${board.type}`;
  };

  const getBoardSearchKeys = (board: JiraBoard): string[] => {
    return [board.name, board.type];
  };

  return (
    <AutocompleteDropdown<JiraBoard>
      items={boards}
      selectedItem={selectedBoard}
      onSelect={onSelect}
      getItemLabel={getBoardLabel}
      getItemValue={(board) => board.id}
      getItemDescription={getBoardDescription}
      searchKeys={getBoardSearchKeys}
      placeholder="Search boards..."
      className="w-full"
      maxResults={10}
      disabled={disabled}
    />
  );
}
