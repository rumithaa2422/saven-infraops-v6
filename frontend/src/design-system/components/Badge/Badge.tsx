/**
 * Badge Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo } from 'react';
import type { BadgeProps, BadgeVariant, BadgeSize, StatusBadgeProps, PriorityBadgeProps } from './types';
import styles from './Badge.module.css';

// Status display names
const STATUS_LABELS: Record<StatusBadgeProps['status'], string> = {
  new: 'New',
  assigned: 'Assigned',
  inProgress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
  blocked: 'Blocked',
};

// Priority display names
const PRIORITY_LABELS: Record<PriorityBadgeProps['priority'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Badge component - label for status, priority, etc.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      pill = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = useMemo(() => {
      const classes = [styles.badge, styles[`badge--${variant}`], styles[`badge--${size}`]];
      
      if (pill) {
        classes.push(styles['badge--pill']);
      }
      
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [variant, size, pill, className]);

    return (
      <span ref={ref} className={classNames} {...props}>
        {dot && <span className={styles.badge__dot} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Status Badge component - standardized status indicator
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  size = 'md',
  className = '',
}) => {
  const displayLabel = label ?? STATUS_LABELS[status];
  
  return (
    <Badge
      variant={status}
      size={size}
      dot={showDot}
      className={className}
    >
      {displayLabel}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

/**
 * Priority Badge component - standardized priority indicator
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  label,
  size = 'md',
  className = '',
}) => {
  const displayLabel = label ?? PRIORITY_LABELS[priority];
  
  return (
    <Badge
      variant={priority}
      size={size}
      className={className}
    >
      {displayLabel}
    </Badge>
  );
};

PriorityBadge.displayName = 'PriorityBadge';

// Named exports
export const BadgeVariants: BadgeVariant[] = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'new',
  'assigned',
  'inProgress',
  'waiting',
  'resolved',
  'closed',
  'blocked',
  'critical',
  'high',
  'medium',
  'low',
];

export const BadgeSizes: BadgeSize[] = ['sm', 'md'];

export default Badge;
