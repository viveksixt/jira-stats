'use client';

import * as React from 'react';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Dialog */}
      <div className={`relative bg-background rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 ${className}`}>
        {children}
      </div>
    </div>
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
