/**
 * Breadcrumb Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { PageHeaderProps } from '../PageHeader/types';
import styles from './Breadcrumb.module.css';

export type { BreadcrumbItem } from '../PageHeader/types';

export interface BreadcrumbProps {
  items: PageHeaderProps['breadcrumbs'];
  separator?: '/' | '>' | '→' | React.ReactNode;
  maxItems?: number;
  showHomeIcon?: boolean;
  className?: string;
}

/**
 * Breadcrumb component - navigation path indicator
 */
export function Breadcrumb({
  items,
  separator = '/',
  maxItems,
  showHomeIcon = false,
  className = '',
}: BreadcrumbProps): React.ReactElement {
  const displayItems = useMemo(() => {
    if (!maxItems || !items || items.length <= maxItems) {
      return items || [];
    }

    const first = items.slice(0, 1);
    const last = items.slice(-(maxItems - 1));
    return [...first, { label: '...' }, ...last] as PageHeaderProps['breadcrumbs'];
  }, [items, maxItems]);

  const getSeparator = () => {
    if (typeof separator === 'string') {
      return <ChevronRight size={14} className={styles.breadcrumb__separator} />;
    }
    return separator;
  };

  const classNames = useMemo(() => {
    const classes = [styles.breadcrumb];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  if (!displayItems || displayItems.length === 0) {
    return <></>;
  }

  return (
    <nav className={classNames} aria-label="Breadcrumb">
      <ol className={styles.breadcrumb__list}>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item?.icon;

          return (
            <li key={index} className={styles.breadcrumb__item}>
              {index > 0 && getSeparator()}
              {isLast ? (
                <span className={styles.breadcrumb__current} aria-current="page">
                  {Icon && <Icon size={14} />}
                  {item?.label}
                </span>
              ) : (
                <a
                  href={item?.href || '#'}
                  className={styles.breadcrumb__link}
                  onClick={(e) => {
                    if (item?.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  {index === 0 && showHomeIcon && (
                    <Home size={14} className={styles.breadcrumb__homeIcon} />
                  )}
                  {Icon && !showHomeIcon && <Icon size={14} />}
                  {item?.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
