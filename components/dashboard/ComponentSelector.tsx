'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { JiraComponent } from '@/types/jira';

interface ComponentSelectorProps {
  components: JiraComponent[];
  selectedComponent: JiraComponent | null;
  onSelect: (component: JiraComponent) => void;
  onClear: () => void;
}

export function ComponentSelector({ components, selectedComponent, onSelect, onClear }: ComponentSelectorProps) {
  const [inputValue, setInputValue] = useState(selectedComponent?.name || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredComponents, setFilteredComponents] = useState<JiraComponent[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(selectedComponent?.name || '');
  }, [selectedComponent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (value.trim()) {
      const filtered = components.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase()) ||
        (c.description?.toLowerCase() || '').includes(value.toLowerCase())
      );
      setFilteredComponents(filtered);
      setShowDropdown(true);
    } else {
      setFilteredComponents([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (component: JiraComponent) => {
    setInputValue(component.name);
    setShowDropdown(false);
    onSelect(component);
  };

  const handleClear = () => {
    setInputValue('');
    setShowDropdown(false);
    onClear();
  };

  const handleInputBlur = () => {
    // If user typed a component name directly, try to find and select it
    if (inputValue && !selectedComponent) {
      const matchingComponent = components.find(
        c => c.name.toLowerCase() === inputValue.toLowerCase()
      );
      if (matchingComponent) {
        onSelect(matchingComponent);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-2">
      <Label htmlFor="component-input" className="text-sm font-medium whitespace-nowrap">
        Component:
      </Label>
      <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
        <Input
          id="component-input"
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputValue) {
              handleInputChange(inputValue);
            }
          }}
          onBlur={handleInputBlur}
          placeholder="Type or select component..."
          className="flex-1"
        />
        {selectedComponent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="px-2 h-9"
            title="Clear component filter"
            type="button"
          >
            ✕
          </Button>
        )}
        
        {showDropdown && filteredComponents.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] overflow-auto top-full">
            {filteredComponents.slice(0, 10).map((component) => (
              <div
                key={component.id}
                className="px-3 py-2 cursor-pointer hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(component);
                }}
              >
                <div className="font-medium">{component.name}</div>
                {component.description && (
                  <div className="text-sm text-muted-foreground">{component.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
