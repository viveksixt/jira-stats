'use client';

import * as React from 'react';

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  align?: 'start' | 'end' | 'center';
  className?: string;
  children: React.ReactNode;
}

const DropdownMenu = ({ open, onOpenChange, children }: DropdownMenuProps) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, onOpenChange });
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({ asChild, children, open, onOpenChange }: DropdownMenuTriggerProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange?.(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return <button onClick={handleClick}>{children}</button>;
};

const DropdownMenuContent = ({ align = 'start', className = '', children, open, onOpenChange }: DropdownMenuContentProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    };

    // Use setTimeout to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);

  // Handle Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${alignClasses[align]} ${className}`}
    >
      {children}
    </div>
  );
};

const DropdownMenuLabel = ({ className = '', children }: { className?: string; children: React.ReactNode }) => {
  return <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>{children}</div>;
};

const DropdownMenuSeparator = ({ className = '' }: { className?: string }) => {
  return <div className={`my-1 h-px bg-border ${className}`} />;
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator };
