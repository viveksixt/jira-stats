'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { JiraProject } from '@/types/jira';

interface ProjectFilterProps {
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onSelect: (project: JiraProject) => void;
}

export function ProjectFilter({ projects, selectedProject, onSelect }: ProjectFilterProps) {
  const [inputValue, setInputValue] = useState(selectedProject?.key || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<JiraProject[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(selectedProject?.key || '');
  }, [selectedProject]);

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
      const filtered = projects.filter(p =>
        p.key.toLowerCase().includes(value.toLowerCase()) ||
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProjects(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProjects([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (project: JiraProject) => {
    setInputValue(project.key);
    setShowDropdown(false);
    onSelect(project);
  };

  const handleInputBlur = () => {
    // If user typed a project key directly, try to find and select it
    if (inputValue && !selectedProject) {
      const matchingProject = projects.find(
        p => p.key.toLowerCase() === inputValue.toLowerCase()
      );
      if (matchingProject) {
        onSelect(matchingProject);
      } else {
        // Create a temporary project object for custom input
        const customProject: JiraProject = {
          id: inputValue,
          key: inputValue.toUpperCase(),
          name: inputValue.toUpperCase(),
          projectTypeKey: 'unknown',
        };
        onSelect(customProject);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          id="project-input"
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputValue) {
              handleInputChange(inputValue);
            }
          }}
          onBlur={handleInputBlur}
          placeholder="Type or select project key..."
          className="w-full"
        />
        
        {showDropdown && filteredProjects.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] overflow-auto">
            {filteredProjects.slice(0, 10).map((project) => (
              <div
                key={project.id}
                className="px-3 py-2 cursor-pointer hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(project);
                }}
              >
                <div className="font-medium">{project.key}</div>
                <div className="text-sm text-muted-foreground">{project.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
