'use client';

import { useState, useEffect } from 'react';
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
import { showError } from '@/lib/toast';
import { cache, cacheKeys } from '@/lib/cache';

interface Epic {
  key: string;
  summary: string;
}

interface TechEpicsSelectorProps {
  projectKey: string | null;
  boardId: number | null;
  selectedEpicKeys: string[];
  onSelectionChange: (keys: string[]) => void;
}

export function TechEpicsSelector({
  projectKey,
  boardId,
  selectedEpicKeys,
  onSelectionChange,
}: TechEpicsSelectorProps) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch epics when board or project changes
  useEffect(() => {
    if (!boardId || !projectKey) return;

    const fetchEpics = async () => {
      setLoading(true);
      try {
        // Check cache first
        const cachedEpics = cache.get<Epic[]>(cacheKeys.epics(projectKey));
        if (cachedEpics) {
          setEpics(cachedEpics);
          setLoading(false);
          return;
        }

        // Fetch from API
        const res = await fetch(`/api/epics?projectKey=${projectKey}&boardId=${boardId}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to fetch epics');
        }

        const data = await res.json();
        setEpics(data.epics || []);
        cache.set(cacheKeys.epics(projectKey), data.epics || [], 3600000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch epics';
        showError(errorMessage);
        console.error('Error fetching epics:', error);
        setEpics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEpics();
  }, [boardId, projectKey]);

  const handleToggle = (epicKey: string) => {
    const newSelection = selectedEpicKeys.includes(epicKey)
      ? selectedEpicKeys.filter(key => key !== epicKey)
      : [...selectedEpicKeys, epicKey];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedEpicKeys.length === epics.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(epics.map(epic => epic.key));
    }
  };

  // Filter epics based on search term
  const filteredEpics = epics.filter(epic => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      epic.key.toLowerCase().includes(searchLower) ||
      epic.summary.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <span className="truncate">
            Tech Epics
            {selectedEpicKeys.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                {selectedEpicKeys.length}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Select Tech Epics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-2 text-sm text-muted-foreground">Loading epics...</div>
        ) : epics.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">No epics found</div>
        ) : (
          <>
            {/* Search Input */}
            <div className="p-2">
              <Input
                placeholder="Search epics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            {/* Select All Checkbox */}
            <div className="p-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-epics"
                  checked={selectedEpicKeys.length === epics.length && epics.length > 0}
                  indeterminate={selectedEpicKeys.length > 0 && selectedEpicKeys.length < epics.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label
                  htmlFor="select-all-epics"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </Label>
              </div>
            </div>

            {/* Epic List */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 p-2">
                {filteredEpics.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No epics match your search
                  </div>
                ) : (
                  filteredEpics.map(epic => (
                    <div key={epic.key} className="flex items-start space-x-2">
                      <Checkbox
                        id={`epic-${epic.key}`}
                        checked={selectedEpicKeys.includes(epic.key)}
                        onCheckedChange={() => handleToggle(epic.key)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={`epic-${epic.key}`}
                        className="cursor-pointer flex flex-col space-y-1 flex-1"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {epic.key}
                        </span>
                        <span className="text-sm leading-snug break-words">
                          {epic.summary}
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
