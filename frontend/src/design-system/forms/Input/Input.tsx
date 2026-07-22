/**
 * Input Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useId } from 'react';
import type { InputProps, InputWrapperProps } from './types';
import styles from './Input.module.css';

/**
 * Input wrapper - provides label, hint, error, and success states
 */
export function InputWrapper({
  children,
  label,
  hint,
  error,
  success,
  required = false,
  disabled = false,
  className = '',
}: InputWrapperProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.field];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  return (
    <div className={classNames}>
      {label && (
        <label className={styles.field__label}>
          {label}
          {required && <span className={styles.field__required}>*</span>}
        </label>
      )}
      <div>{children}</div>
      {hint && !error && !success && <p className={styles.field__hint}>{hint}</p>}
      {error && <p className={styles.field__error}>{error}</p>}
      {success && <p className={styles.field__success}>{success}</p>}
    </div>
  );
}

/**
 * Input component - text input field
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      success,
      size = 'md',
      prefix,
      suffix,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      required,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = useId();

    const wrapperClassNames = useMemo(() => {
      const classes = [styles.inputWrapper];
      if (fullWidth) {
        classes.push(styles['inputWrapper--fullWidth']);
      }
      return classes.join(' ');
    }, [fullWidth]);

    const inputClassNames = useMemo(() => {
      const classes = [styles.input, styles[`input--${size}`]];
      
      if (error) {
        classes.push(styles['input--error']);
      } else if (success) {
        classes.push(styles['input--success']);
      }
      
      if (Icon && iconPosition === 'left') {
        classes.push(styles['input--withIcon']);
      } else if (Icon && iconPosition === 'right') {
        classes.push(styles['input--withIconRight']);
      }
      
      if (prefix) {
        classes.push(styles['input--withPrefix']);
      }
      
      if (suffix) {
        classes.push(styles['input--withSuffix']);
      }
      
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [size, error, success, Icon, iconPosition, prefix, suffix, className]);

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

    const input = (
      <div className={wrapperClassNames}>
        {Icon && iconPosition === 'left' && (
          <Icon size={iconSize} className={`${styles.input__icon} ${styles['input__icon--left']}`} />
        )}
        {prefix && <span className={styles.input__prefix}>{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className={inputClassNames}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {suffix && <span className={styles.input__suffix}>{suffix}</span>}
        {Icon && iconPosition === 'right' && (
          <Icon size={iconSize} className={`${styles.input__icon} ${styles['input__icon--right']}`} />
        )}
      </div>
    );

    if (label || hint || error || success) {
      return (
        <InputWrapper
          label={label}
          hint={hint}
          error={error}
          success={success}
          required={required}
          disabled={disabled}
        >
          {input}
        </InputWrapper>
      );
    }

    return input;
  }
);

Input.displayName = 'Input';

export default Input;
