'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      theme="light"
      expand={true}
      visibleToasts={5}
      toastOptions={{
        style: {
          marginBottom: '8px',
        },
      }}
    />
  );
}
