/**
 * Skeleton Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import type { 
  SkeletonProps, 
  SkeletonTextProps, 
  SkeletonAvatarProps, 
  SkeletonCardProps,
  SkeletonTableProps 
} from './types';
import styles from './Skeleton.module.css';

/**
 * Skeleton component - placeholder loading state
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.skeleton, styles[`skeleton--${variant}`]];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [variant, className]);

  const style = useMemo(() => {
    const s: React.CSSProperties = {};
    if (width) s.width = typeof width === 'number' ? `${width}px` : width;
    if (height) s.height = typeof height === 'number' ? `${height}px` : height;
    return s;
  }, [width, height]);

  return <div className={classNames} style={style} aria-hidden="true" />;
}

/**
 * SkeletonText component - multiple lines of text
 */
export function SkeletonText({
  lines = 3,
  width = '100%',
  lastLineWidth = '80%',
  className = '',
}: SkeletonTextProps): React.ReactElement {
  return (
    <div className={`${styles.skeletonText} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={styles.skeletonText__line}
          style={{ 
            width: i === lines - 1 ? lastLineWidth : width 
          }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar component - avatar placeholder
 */
export function SkeletonAvatar({
  size = 'md',
  className = '',
}: SkeletonAvatarProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.skeletonAvatar, styles[`skeletonAvatar--${size}`]];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [size, className]);

  return <div className={classNames} aria-hidden="true" />;
}

/**
 * SkeletonCard component - card placeholder
 */
export function SkeletonCard({
  lines = 3,
  className = '',
}: SkeletonCardProps): React.ReactElement {
  return (
    <div className={`${styles.skeletonCard} ${className}`} aria-hidden="true">
      <div className={styles.skeletonCard__header}>
        <SkeletonAvatar size="sm" />
        <div className={styles.skeletonCard__title} />
      </div>
      <div className={styles.skeletonCard__body}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={styles.skeletonCard__line}
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTable component - table placeholder
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps): React.ReactElement {
  return (
    <div className={`${styles.skeletonTable} ${className}`} aria-hidden="true">
      <div className={styles.skeletonTable__header}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={styles.skeletonTable__headerCell} />
        ))}
      </div>
      <div className={styles.skeletonTable__body}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.skeletonTable__row}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={styles.skeletonTable__cell}
                style={{ width: colIndex === 0 ? '40%' : 'auto' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Named exports
export const SkeletonVariants: SkeletonProps['variant'][] = ['text', 'circular', 'rectangular'];

export default Skeleton;
