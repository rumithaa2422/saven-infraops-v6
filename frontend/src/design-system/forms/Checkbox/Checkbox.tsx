/**
 * Checkbox Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useId, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import type { CheckboxProps, CheckboxGroupProps } from './types';
import styles from './Checkbox.module.css';

/**
 * Checkbox component
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      indeterminate = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const localRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (localRef.current) {
        localRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const classNames = useMemo(() => {
      const classes = [styles.checkbox];
      if (disabled) {
        classes.push(styles['checkbox--disabled']);
      }
      if (className) {
        classes.push(className);
      }
      return classes.join(' ');
    }, [disabled, className]);

    return (
      <label htmlFor={inputId} className={classNames}>
        <input
          ref={(input) => {
            localRef.current = input;
            if (typeof ref === 'function') {
              ref(input);
            } else if (ref) {
              ref.current = input;
            }
          }}
          id={inputId}
          type="checkbox"
          className={styles.checkbox__input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.checkbox__box}>
          {indeterminate ? (
            <Minus size={12} className={styles.checkbox__indeterminate} />
          ) : (
            <Check size={12} className={styles.checkbox__icon} style={{ opacity: 0 }} />
          )}
        </span>
        {(label || description) && (
          <span className={styles.checkbox__content}>
            {label && <span className={styles.checkbox__label}>{label}</span>}
            {description && <span className={styles.checkbox__description}>{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * CheckboxGroup component
 */
export function CheckboxGroup({
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className = '',
}: CheckboxGroupProps): React.ReactElement {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className={`${styles.checkboxGroup} ${className}`}>
      {label && <span className={styles.checkboxGroup__label}>{label}</span>}
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={value.includes(option.value)}
          onChange={(e) => handleChange(option.value, e.target.checked)}
          disabled={disabled || option.disabled}
        />
      ))}
      {error && <span className={styles.checkboxGroup__error}>{error}</span>}
    </div>
  );
}

export default Checkbox;
