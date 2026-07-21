import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, FileWarning } from 'lucide-react';

// Modal Layout Component - Modern Design with Gradient Header
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
  icon = '📦'
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
  variant?: 'danger' | 'warning' | 'info' | 'success';
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
      confirmDisabled: confirmInput && confirmInputValue !== 'DELETE',
      icon: <AlertTriangle className="w-8 h-8" />
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBg: 'bg-amber-600 hover:bg-amber-700',
      confirmDisabled: confirmInput && confirmInputValue !== 'DELETE',
      icon: <FileWarning className="w-8 h-8" />
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      confirmDisabled: false,
      icon: <AlertTriangle className="w-8 h-8" />
    },
    success: {
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      confirmBg: 'bg-emerald-600 hover:bg-emerald-700',
      confirmDisabled: false,
      icon: <CheckCircle className="w-8 h-8" />
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
            <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center transition-transform duration-200 hover:scale-110`}>
              <div className={config.iconColor}>
                {config.icon}
              </div>
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
              className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Inventory Item Confirmation Dialog
interface DeleteInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemNo: string;
  itemName: string;
  isLoading?: boolean;
  confirmInput?: boolean;
  confirmInputValue?: string;
  onConfirmInputChange?: (value: string) => void;
}

export function DeleteInventoryDialog({
  isOpen,
  onClose,
  onConfirm,
  itemNo,
  itemName,
  isLoading = false,
  confirmInput = false,
  confirmInputValue = '',
  onConfirmInputChange
}: DeleteInventoryDialogProps) {
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
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center transition-transform duration-200 hover:scale-110">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Inventory Item</h3>
            <p className="text-sm text-slate-600 mb-3">
              Are you sure you want to delete item <span className="font-semibold">{itemNo}</span>?
            </p>
            {itemName && (
              <p className="text-sm text-slate-500 italic truncate">"{itemName}"</p>
            )}
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
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all outline-none text-center font-mono"
                autoFocus
              />
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">
              This action cannot be undone. The inventory item and all associated data will be permanently removed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || (confirmInput && confirmInputValue !== 'DELETE')}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stock Update Dialog
interface StockUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { newQuantity: number; adjustmentType: string; reason: string; notes: string }) => void;
  currentQuantity: number;
  itemName: string;
  isLoading?: boolean;
}

const adjustmentTypes = [
  { value: 'ADD', label: 'Add Stock' },
  { value: 'REMOVE', label: 'Remove Stock' },
  { value: 'ADJUST', label: 'Adjust Stock' },
  { value: 'RETURN', label: 'Return Stock' },
  { value: 'DAMAGED', label: 'Mark as Damaged' }
];

const commonReasons = [
  { value: 'PURCHASE', label: 'Purchase Order' },
  { value: 'RETURN', label: 'Customer Return' },
  { value: 'DAMAGE', label: 'Damaged/Lost' },
  { value: 'INVENTORY_COUNT', label: 'Inventory Count Correction' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'RESERVATION', label: 'Reservation Fulfillment' },
  { value: 'OTHER', label: 'Other' }
];

export function StockUpdateDialog({
  isOpen,
  onClose,
  onConfirm,
  currentQuantity,
  itemName,
  isLoading = false
}: StockUpdateDialogProps) {
  const [adjustmentType, setAdjustmentType] = React.useState('ADD');
  const [newQuantity, setNewQuantity] = React.useState(currentQuantity);
  const [adjustmentAmount, setAdjustmentAmount] = React.useState(1);
  const [reason, setReason] = React.useState('PURCHASE');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setNewQuantity(currentQuantity);
      setAdjustmentAmount(1);
      setNotes('');
    }
  }, [isOpen, currentQuantity]);

  const handleAdjustmentChange = (type: string, amount: number) => {
    setAdjustmentType(type);
    let calculated = currentQuantity;
    switch (type) {
      case 'ADD':
        calculated = currentQuantity + amount;
        break;
      case 'REMOVE':
        calculated = Math.max(0, currentQuantity - amount);
        break;
      case 'ADJUST':
        calculated = amount;
        break;
      case 'RETURN':
        calculated = currentQuantity + amount;
        break;
      case 'DAMAGED':
        calculated = Math.max(0, currentQuantity - amount);
        break;
    }
    setNewQuantity(calculated);
    setAdjustmentAmount(amount);
  };

  const handleConfirm = () => {
    onConfirm({
      newQuantity,
      adjustmentType,
      reason,
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-modal-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Update Stock</h3>
              <p className="text-sm text-slate-500 mt-1">{itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Quantity */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current Quantity</span>
              <span className="text-2xl font-bold text-slate-900">{currentQuantity}</span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => handleAdjustmentChange(e.target.value, adjustmentAmount)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
            >
              {adjustmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Amount (for ADD, REMOVE, RETURN, DAMAGED) */}
          {(adjustmentType === 'ADD' || adjustmentType === 'REMOVE' || adjustmentType === 'RETURN' || adjustmentType === 'DAMAGED') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {adjustmentType === 'ADD' || adjustmentType === 'RETURN' ? 'Quantity to Add' : 'Quantity to Remove'}
              </label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => handleAdjustmentChange(adjustmentType, parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
              />
            </div>
          )}

          {/* New Quantity Preview */}
          <div className="mb-4 p-4 rounded-xl bg-brand-50 border border-brand-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-700 font-medium">New Quantity</span>
              <span className="text-2xl font-bold text-brand-700">{newQuantity}</span>
            </div>
            {newQuantity !== currentQuantity && (
              <div className="mt-2 text-xs text-brand-600">
                {newQuantity > currentQuantity ? '+' : ''}{newQuantity - currentQuantity} change
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
            >
              {commonReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating...
                </span>
              ) : 'Update Stock'}
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
