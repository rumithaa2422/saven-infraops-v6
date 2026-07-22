/**
 * Radio Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useId } from 'react';
import type { RadioProps, RadioGroupProps } from './types';
import styles from './Radio.module.css';

/**
 * Radio component
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = useId();

    const classNames = useMemo(() => {
      const classes = [styles.radio];
      if (disabled) {
        classes.push(styles['radio--disabled']);
      }
      if (className) {
        classes.push(className);
      }
      return classes.join(' ');
    }, [disabled, className]);

    return (
      <label htmlFor={inputId} className={classNames}>
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className={styles.radio__input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.radio__circle} />
        {(label || description) && (
          <span className={styles.radio__content}>
            {label && <span className={styles.radio__label}>{label}</span>}
            {description && <span className={styles.radio__description}>{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * RadioGroup component
 */
export function RadioGroup({
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className = '',
}: RadioGroupProps): React.ReactElement {
  return (
    <div className={`${styles.radioGroup} ${className}`}>
      {label && <span className={styles.radioGroup__label}>{label}</span>}
      {options.map((option) => (
        <Radio
          key={option.value}
          name={label} // Group name
          value={option.value}
          label={option.label}
          description={option.description}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={disabled || option.disabled}
        />
      ))}
      {error && <span className={styles.radioGroup__error}>{error}</span>}
    </div>
  );
}

export default Radio;
