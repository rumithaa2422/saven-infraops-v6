/**
 * SummaryGrid Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { SummaryCard } from '../../components/Card';
import styles from './SummaryGrid.module.css';

export interface SummaryGridItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  onClick?: () => void;
}

export interface SummaryGridProps {
  items: SummaryGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * SummaryGrid component - grid of summary cards for metrics
 */
export function SummaryGrid({
  items,
  columns = 4,
  className = '',
}: SummaryGridProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.summaryGrid];
    classes.push(styles[`summaryGrid--cols-${columns}`]);
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [columns, className]);

  return (
    <div className={classNames}>
      {items.map((item) => (
        <SummaryCard
          key={item.id}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon as any}
          iconColor={item.iconColor}
          trend={item.trend}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
}

export default SummaryGrid;
