/**
 * PageContainer Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import styles from './PageContainer.module.css';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className = '',
}: PageContainerProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.pageContainer];
    classes.push(styles[`pageContainer--${maxWidth}`]);
    if (padding !== 'md') {
      classes.push(styles[`pageContainer--padding-${padding}`]);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [maxWidth, padding, className]);

  return (
    <div className={classNames}>
      {children}
    </div>
  );
}

export default PageContainer;
