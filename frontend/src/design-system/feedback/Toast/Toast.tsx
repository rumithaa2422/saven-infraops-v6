/**
 * Toast Component
 * Enterprise Design System V2
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastProviderProps, ToastContextValue, ToastProps, ToastData, ToastType } from './types';
import styles from './Toast.module.css';

// Toast icons
const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * ToastProvider - provides toast functionality to the app
 */
export function ToastProvider({
  children,
  maxToasts = 5,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = { ...toast, id };
    
    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * useToast hook
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * ToastContainer - renders all toasts
 */
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}): React.ReactElement | null {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * ToastItem component
 */
function ToastItem({
  type,
  title,
  description,
  action,
  onClose,
}: ToastProps): React.ReactElement {
  const Icon = TOAST_ICONS[type];

  return (
    <div
      className={`${styles.toast} ${styles[`toast--${type}`]}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`${styles.toast__icon} ${styles[`toast__icon--${type}`]}`} />
      <div className={styles.toast__content}>
        <h3 className={styles.toast__title}>{title}</h3>
        {description && <p className={styles.toast__description}>{description}</p>}
        {action && (
          <div className={styles.toast__action}>
            <button
              type="button"
              className={styles.toast__actionButton}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.toast__close}
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Alias for backward compatibility
const Toast = ToastItem;
export { Toast, ToastItem };

export default Toast;
