/**
 * Section Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import styles from './Section.module.css';

export interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Section component - grouped content with optional header
 */
export function Section({
  children,
  title,
  description,
  icon,
  actions,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}: SectionProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.section];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <section className={classNames}>
      {(title || actions) && (
        <div className={styles.section__header}>
          <div className={styles.section__headerContent}>
            {title && (
              <div className={styles.section__titleRow}>
                {icon && <span className={styles.section__icon}>{icon}</span>}
                <h2 className={styles.section__title}>{title}</h2>
              </div>
            )}
            {description && (
              <p className={styles.section__description}>{description}</p>
            )}
          </div>
          <div className={styles.section__actions}>
            {actions}
          </div>
        </div>
      )}
      {collapsible ? (
        <div style={{ display: isExpanded ? 'block' : 'none' }}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export default Section;
