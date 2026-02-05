import { toast } from 'sonner';

// Track recently shown messages to prevent duplicates
const recentMessages = new Set<string>();
const MESSAGE_EXPIRY_MS = 5000; // Messages are considered "recent" for 5 seconds

const showWithDedup = (
  type: 'success' | 'error' | 'info',
  message: string
) => {
  // Skip if this message was recently shown
  if (recentMessages.has(message)) {
    return;
  }
  
  // Add to recent messages
  recentMessages.add(message);
  
  // Remove after expiry
  setTimeout(() => {
    recentMessages.delete(message);
  }, MESSAGE_EXPIRY_MS);
  
  // Show the toast
  return toast[type](message);
};

export const showSuccess = (message: string) => showWithDedup('success', message);
export const showError = (message: string) => showWithDedup('error', message);
export const showInfo = (message: string) => showWithDedup('info', message);
export const showLoading = (message: string) => toast.loading(message); // Loading toasts should not be deduped

export const updateToast = (id: string, options: any) => {
  toast(id, options);
};

export const clearAllToasts = () => {
  toast.dismiss();
  recentMessages.clear(); // Clear tracking when dismissing all
};
