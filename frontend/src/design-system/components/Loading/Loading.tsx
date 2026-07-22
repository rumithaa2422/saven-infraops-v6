/**
 * Loading Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import type { SpinnerProps, LoadingProps, ProgressProps, PageLoadingProps } from './types';
import styles from './Loading.module.css';

/**
 * Spinner component - rotating loading indicator
 */
export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
}: SpinnerProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.spinner, styles[`spinner--${size}`], styles[`spinner--${color}`]];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [size, color, className]);

  return <div className={classNames} role="status" aria-label="Loading" />;
}

/**
 * Loading component - spinner with optional text
 */
export function Loading({
  size = 'md',
  color = 'primary',
  text,
  className = '',
}: LoadingProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.loading];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  return (
    <div className={classNames}>
      <Spinner size={size} color={color} />
      {text && <span className={styles.loading__text}>{text}</span>}
    </div>
  );
}

/**
 * Progress component - horizontal progress bar
 */
export function Progress({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  variant = 'default',
  className = '',
}: ProgressProps): React.ReactElement {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / max) * 100));
  }, [value, max]);

  const barClassNames = useMemo(() => {
    return [
      styles.progress__bar,
      styles[`progress__bar--${variant}`],
    ].join(' ');
  }, [variant]);

  return (
    <div className={className}>
      <div className={`${styles.progress} ${styles[`progress--${size}`]}`}>
        <div
          className={barClassNames}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <span className={styles.progress__label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

/**
 * PageLoading component - full page loading state
 */
export function PageLoading({
  text = 'Loading...',
  className = '',
}: PageLoadingProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.pageLoading];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  return (
    <div className={classNames} role="status" aria-live="polite">
      <Spinner size="lg" color="primary" />
      <span className={styles.pageLoading__text}>{text}</span>
    </div>
  );
}

// Named exports
export const SpinnerSizes: SpinnerProps['size'][] = ['sm', 'md', 'lg'];
export const SpinnerColors: SpinnerProps['color'][] = ['primary', 'white', 'muted'];

export default Loading;
