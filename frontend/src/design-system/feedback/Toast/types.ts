/**
 * Toast Component Types
 * Enterprise Design System V2
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export interface ToastProps extends ToastData {
  onClose: () => void;
}

export default ToastProps;
