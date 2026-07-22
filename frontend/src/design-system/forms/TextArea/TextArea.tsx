/**
 * TextArea Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useState, useId } from 'react';
import type { TextAreaProps } from './types';
import styles from './TextArea.module.css';

/**
 * TextArea component - multi-line text input
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      hint,
      error,
      success,
      rows = 4,
      showCount = false,
      maxLength,
      fullWidth = false,
      value,
      disabled,
      required,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const [charCount, setCharCount] = useState(String(value || '').length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const wrapperClassNames = useMemo(() => {
      const classes = [styles.textareaWrapper];
      if (fullWidth) {
        classes.push(styles['textareaWrapper--fullWidth']);
      }
      return classes.join(' ');
    }, [fullWidth]);

    const textareaClassNames = useMemo(() => {
      const classes = [styles.textarea];
      
      if (error) {
        classes.push(styles['textarea--error']);
      } else if (success) {
        classes.push(styles['textarea--success']);
      }
      
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [error, success, className]);

    const content = (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className={styles.textarea__label}>
            {label}
            {required && <span className={styles.textarea__required}>*</span>}
          </label>
        )}
        <div className={styles.textarea__inputWrapper}>
          <textarea
            ref={ref}
            id={inputId}
            className={textareaClassNames}
            rows={rows}
            value={value}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {(showCount || maxLength) && (
          <div className={styles.textarea__footer}>
            <span className={styles.textarea__count}>
              {charCount}{maxLength ? ` / ${maxLength}` : ''}
            </span>
          </div>
        )}
        {hint && !error && !success && <p id={`${inputId}-hint`} className={styles.textarea__hint}>{hint}</p>}
        {error && <p id={`${inputId}-error`} className={styles.textarea__error}>{error}</p>}
        {success && <p className={styles.textarea__success}>{success}</p>}
      </div>
    );

    return content;
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
