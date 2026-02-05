import { toast } from 'sonner';

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showInfo = (message: string) => toast.info(message);
export const showLoading = (message: string) => toast.loading(message);

export const updateToast = (id: string, options: any) => {
  toast(id, options);
};

export const clearAllToasts = () => {
  toast.dismiss();
};
