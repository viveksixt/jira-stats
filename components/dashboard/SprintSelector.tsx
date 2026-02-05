'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { JiraSprint } from '@/types/jira';

interface SprintSelectorProps {
  sprints: JiraSprint[];
  selectedSprints: JiraSprint[];
  onSelect: (sprints: JiraSprint[]) => void;
}

export function SprintSelector({ sprints, selectedSprints, onSelect }: SprintSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (sprint: JiraSprint) => {
    const isSelected = selectedSprints.some(s => s.id === sprint.id);
    if (isSelected) {
      onSelect(selectedSprints.filter(s => s.id !== sprint.id));
    } else {
      onSelect([...selectedSprints, sprint]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSprints.length === sprints.length) {
      onSelect([]);
    } else {
      onSelect([...sprints]);
    }
  };

  // Filter sprints based on search term
  const filteredSprints = sprints.filter(sprint => {
    if (!searchTerm.trim()) return true;
    return sprint.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort filtered sprints to show selected items at the top
  const sortedSprints = [...filteredSprints].sort((a, b) => {
    const aSelected = selectedSprints.some(s => s.id === a.id);
    const bSelected = selectedSprints.some(s => s.id === b.id);
    
    // Selected items come first
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    
    // If both selected or both unselected, maintain original order
    return 0;
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <span className="truncate">
            Sprints
            {selectedSprints.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                {selectedSprints.length}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Select Sprints</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {sprints.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">No sprints available</div>
        ) : (
          <>
            {/* Search Input */}
            <div className="p-2">
              <Input
                placeholder="Search sprints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            {/* Select All Checkbox */}
            <div className="p-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-sprints"
                  checked={selectedSprints.length === sprints.length && sprints.length > 0}
                  indeterminate={selectedSprints.length > 0 && selectedSprints.length < sprints.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label
                  htmlFor="select-all-sprints"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </Label>
              </div>
            </div>

            {/* Sprint List */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 p-2">
                {sortedSprints.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No sprints match your search
                  </div>
                ) : (
                  sortedSprints.map(sprint => (
                    <div key={sprint.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`sprint-${sprint.id}`}
                        checked={selectedSprints.some(s => s.id === sprint.id)}
                        onCheckedChange={() => handleToggle(sprint)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={`sprint-${sprint.id}`}
                        className="cursor-pointer flex flex-col space-y-1 flex-1"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {sprint.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sprint.state}
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
