/**
 * Select Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useId } from 'react';
import type { SelectProps } from './types';
import styles from './Select.module.css';

/**
 * Select component - dropdown selection
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      hint,
      error,
      placeholder = 'Select an option',
      fullWidth = false,
      size = 'md',
      disabled,
      required,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = useId();

    const wrapperClassNames = useMemo(() => {
      const classes = [styles.selectWrapper];
      if (fullWidth) {
        classes.push(styles['selectWrapper--fullWidth']);
      }
      return classes.join(' ');
    }, [fullWidth]);

    const selectClassNames = useMemo(() => {
      const classes = [styles.select, styles[`select--${size}`]];
      
      if (error) {
        classes.push(styles['select--error']);
      }
      
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [size, error, className]);

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className={styles.select__label}>
            {label}
            {required && <span className={styles.select__required}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={selectClassNames}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        >
          <option value="" disabled className={styles.select__placeholder}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && <p id={`${inputId}-hint`} className={styles.select__hint}>{hint}</p>}
        {error && <p id={`${inputId}-error`} className={styles.select__error}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
