import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Modal Layout Component - Modern Design
interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  icon?: string;
}

export function ModalLayout({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  showCloseButton = true,
  icon = '🎫'
}: ModalLayoutProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[calc(100vw-4rem)]'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Modern Design */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl
          animate-modal-in max-h-[calc(100vh-4rem)]
          flex flex-col overflow-hidden
        `}
      >
        {/* Modern Header with Gradient */}
        <div className="flex-shrink-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
            {icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl text-white flex items-center justify-center transition-all hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-100 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmation Dialog Component
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
  confirmInput?: boolean;
  confirmInputValue?: string;
  onConfirmInputChange?: (value: string) => void;
  confirmInputPlaceholder?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  isLoading = false,
  confirmInput = false,
  confirmInputValue = '',
  onConfirmInputChange,
  confirmInputPlaceholder = ''
}: ConfirmationDialogProps) {
  const variantConfig = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmDisabled: confirmInput && confirmInputValue !== 'DELETE'
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBg: 'bg-amber-600 hover:bg-amber-700',
      confirmDisabled: confirmInput && confirmInputValue !== 'DELETE'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      confirmDisabled: false
    }
  };

  const config = variantConfig[variant];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-modal-in">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
              {icon || (
                <svg className={`w-8 h-8 ${config.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600">{message}</p>
          </div>

          {/* Confirm Input */}
          {confirmInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInputValue}
                onChange={(e) => onConfirmInputChange?.(e.target.value)}
                placeholder={confirmInputPlaceholder || 'DELETE'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all outline-none text-center font-mono"
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || config.confirmDisabled}
              className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg}`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide-over Panel (Drawer)
interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md'
}: SlideOverPanelProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${widthClasses[width]} bg-white shadow-2xl animate-slide-in-right flex flex-col max-h-full`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
