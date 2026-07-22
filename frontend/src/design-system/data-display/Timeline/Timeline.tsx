/**
 * Timeline Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import type { TimelineProps, TimelineItem } from './types';
import styles from './Timeline.module.css';

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Timeline component - chronological list of events
 */
export function Timeline({
  items,
  showDate = false,
  variant = 'default',
  className = '',
}: TimelineProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.timeline];
    if (variant === 'compact') {
      classes.push(styles['timeline--compact']);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [variant, className]);

  const renderItem = (item: TimelineItem, index: number) => {
    const Icon = item.icon;
    const dotClass = `${styles.timeline__dot} ${styles[`timeline__dot--${item.iconColor || 'muted'}`]}`;

    return (
      <div key={item.id} className={styles.timeline__item}>
        <div className={dotClass}>
          {Icon && <Icon size={variant === 'compact' ? 10 : 12} />}
        </div>
        <div className={styles.timeline__connector} />
        <div className={styles.timeline__content}>
          <div className={styles.timeline__header}>
            <h4 className={styles.timeline__title}>{item.title}</h4>
            <span className={styles.timeline__timestamp}>
              {formatTimestamp(item.timestamp)}
            </span>
          </div>
          {item.description && (
            <p className={styles.timeline__description}>{item.description}</p>
          )}
          {item.children && (
            <div className={styles.timeline__children}>{item.children}</div>
          )}
        </div>
      </div>
    );
  };

  // Group items by date if showDate is true
  if (showDate) {
    const groupedItems = items.reduce((groups, item) => {
      const date = new Date(item.timestamp);
      const dateKey = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
      return groups;
    }, {} as Record<string, TimelineItem[]>);

    return (
      <div className={classNames}>
        {Object.entries(groupedItems).map(([dateKey, dateItems]) => (
          <div key={dateKey}>
            <div className={styles.timeline__date}>
              <span className={styles.timeline__dateText}>{dateKey}</span>
            </div>
            {dateItems.map((item, index) => renderItem(item, index))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={classNames}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}

export default Timeline;
