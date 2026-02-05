'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { clearAllToasts } from '@/lib/toast';

interface ClearAllToastsProps {
  className?: string;
}

export function ClearAllToasts({ className = '' }: ClearAllToastsProps) {
  const [hasToasts, setHasToasts] = useState(false);

  useEffect(() => {
    // Check for sonner toasts in the DOM
    const checkToasts = () => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      const toasts = toastContainer?.querySelectorAll('[data-sonner-toast]');
      setHasToasts((toasts?.length || 0) > 0);
    };

    // Initial check
    checkToasts();

    // Set up MutationObserver to watch for toast changes
    const toastContainer = document.querySelector('[data-sonner-toaster]');
    if (toastContainer) {
      const observer = new MutationObserver(checkToasts);
      observer.observe(toastContainer, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }

    // Fallback: check periodically if container doesn't exist yet
    const interval = setInterval(checkToasts, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    clearAllToasts();
  };

  if (!hasToasts) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClearAll}
        className="shadow-lg"
        title="Clear all notifications"
      >
        Clear All
      </Button>
    </div>
  );
}
