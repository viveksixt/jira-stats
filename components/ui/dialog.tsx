'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, onOpenChange });
        }
        return child;
      })}
    </div>
  );
};

const DialogTrigger = ({ asChild, children, open, onOpenChange }: any) => {
  const handleClick = () => {
    onOpenChange?.(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return <button onClick={handleClick}>{children}</button>;
};

const DialogContent = ({ className = '', children, open, onOpenChange }: DialogContentProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);

  // Ensure component is mounted to prevent SSR hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize dialog to be vertically centered when opened
  React.useEffect(() => {
    if (open && !isInitialized) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const dialogHeight = dialogRef.current.offsetHeight;
          const windowHeight = window.innerHeight;
          const centerY = Math.max(0, (windowHeight - dialogHeight) / 2);
          setPosition({ x: 0, y: centerY });
          setIsInitialized(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    } else if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

  // Add Escape key handler
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

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Dialog */}
      <div 
        ref={dialogRef}
        className={`fixed bg-background rounded-lg shadow-lg p-6 z-[100] left-1/2 -translate-x-1/2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseDown={handleMouseDown}
      >
        <div ref={headerRef} className="cursor-grab active:cursor-grabbing mb-2">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const DialogHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => {
  return <div className={`space-y-1.5 mb-4 ${className}`}>{children}</div>;
};

const DialogTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
};

const DialogDescription = ({ className = '', children }: { className?: string; children: React.ReactNode }) => {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
};

const DialogFooter = ({ className = '', children }: { className?: string; children: React.ReactNode }) => {
  return <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>;
};

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
