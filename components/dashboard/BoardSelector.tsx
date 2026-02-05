'use client';

import { AutocompleteDropdown } from '@/components/ui/autocomplete-dropdown';
import type { JiraBoard } from '@/types/jira';

interface BoardSelectorProps {
  boards: JiraBoard[];
  selectedBoard: JiraBoard | null;
  onSelect: (board: JiraBoard) => void;
}

export function BoardSelector({ boards, selectedBoard, onSelect }: BoardSelectorProps) {
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
      label="Board:"
      className="min-w-[250px]"
      maxResults={10}
    />
  );
}
