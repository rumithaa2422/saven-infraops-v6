/**
 * EmptyState Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from '../Button';
import type { EmptyStateProps } from './types';
import styles from './EmptyState.module.css';

/**
 * EmptyState component - shown when no data is available
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.emptyState];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  return (
    <div className={classNames}>
      <div className={styles.emptyState__icon}>
        <Icon size={32} />
      </div>
      <h3 className={styles.emptyState__title}>{title}</h3>
      {description && (
        <p className={styles.emptyState__description}>{description}</p>
      )}
      {action && (
        <div className={styles.emptyState__action}>
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
