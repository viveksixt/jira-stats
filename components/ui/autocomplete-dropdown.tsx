'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from './input';
import { Label } from './label';

export interface AutocompleteDropdownProps<T> {
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  getItemLabel: (item: T) => string;
  getItemValue: (item: T) => string | number;
  getItemDescription?: (item: T) => string;
  placeholder?: string;
  label?: string;
  searchKeys?: (item: T) => string[];
  className?: string;
  maxResults?: number;
  disabled?: boolean;
}

export function AutocompleteDropdown<T>({
  items,
  selectedItem,
  onSelect,
  getItemLabel,
  getItemValue,
  getItemDescription,
  placeholder = 'Search...',
  label,
  searchKeys,
  className = '',
  maxResults = 10,
  disabled = false,
}: AutocompleteDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search term
  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    
    if (searchKeys) {
      const keys = searchKeys(item);
      return keys.some(key => key.toLowerCase().includes(searchLower));
    }

    const label = getItemLabel(item).toLowerCase();
    const description = getItemDescription?.(item)?.toLowerCase() || '';
    
    return label.includes(searchLower) || description.includes(searchLower);
  }).slice(0, maxResults);

  // Get display value for input
  const displayValue = isOpen ? searchTerm : (selectedItem ? getItemLabel(selectedItem) : '');

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
    setHighlightedIndex(-1);
  };
  
  // Handle input focus
  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm('');
  };

  // Handle item selection
  const handleSelect = useCallback((item: T) => {
    if (disabled) return;
    onSelect(item);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onSelect, disabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex]);
        } else if (filteredItems.length === 1) {
          handleSelect(filteredItems[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const itemElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 ${className}`}>
      {label && (
        <Label htmlFor="autocomplete-input" className="text-sm font-medium whitespace-nowrap">
          {label}
        </Label>
      )}
      <div className="relative flex-1">
        <Input
          id="autocomplete-input"
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {isOpen && filteredItems.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
            aria-label="Search results"
          >
            {filteredItems.map((item, index) => {
              const itemLabel = getItemLabel(item);
              const itemDescription = getItemDescription?.(item);
              const isHighlighted = index === highlightedIndex;
              const isSelected = selectedItem && getItemValue(selectedItem) === getItemValue(item);

              return (
                <div
                  key={getItemValue(item)}
                  onClick={() => handleSelect(item)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors
                    ${isHighlighted ? 'bg-accent text-accent-foreground' : ''}
                    ${isSelected ? 'bg-primary/10' : ''}
                    hover:bg-accent hover:text-accent-foreground
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="font-medium">{itemLabel}</div>
                  {itemDescription && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {itemDescription}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {isOpen && filteredItems.length === 0 && searchTerm.trim() && (
          <div
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground"
            role="listbox"
          >
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
