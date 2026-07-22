/**
 * Dialog Component
 * Enterprise Design System V2
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../../components/Button';
import type { DialogProps, ConfirmDialogProps, DialogSize } from './types';
import styles from './Dialog.module.css';

// Size mapping
const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: styles['dialog--sm'],
  md: styles['dialog--md'],
  lg: styles['dialog--lg'],
  xl: styles['dialog--xl'],
  full: styles['dialog--full'],
};

/**
 * Dialog component - modal dialog
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  className = '',
}: DialogProps): React.ReactElement | null {
  const dialogClassNames = useMemo(() => {
    const classes = [styles.dialog, SIZE_CLASSES[size]];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [size, className]);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const content = (
    <div
      className={styles.dialogOverlay}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="presentation"
    >
      <div
        className={dialogClassNames}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        {(title || showCloseButton) && (
          <div className={styles.dialog__header}>
            <div className={styles.dialog__headerContent}>
              {title && (
                <h2 id="dialog-title" className={styles.dialog__title}>
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-description" className={styles.dialog__description}>
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className={styles.dialog__close}
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {children && <div className={styles.dialog__content}>{children}</div>}

        {footer && <div className={styles.dialog__footer}>{footer}</div>}
      </div>
    </div>
  );

  // Portal to body
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
}

/**
 * ConfirmDialog component - confirmation dialog
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  icon,
}: ConfirmDialogProps): React.ReactElement {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div style={{ textAlign: 'center' }}>
        {icon && <div className={styles.confirmDialog__icon}>{icon}</div>}
        <h3 className={styles.dialog__title}>{title}</h3>
        <p className={styles.confirmDialog__message}>{message}</p>
      </div>
      <div className={styles.dialog__footer} style={{ paddingTop: 'var(--space-6)' }}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export default Dialog;
