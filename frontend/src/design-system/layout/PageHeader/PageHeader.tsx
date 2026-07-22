/**
 * PageHeader Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import type { PageHeaderProps } from './types';
import styles from './PageHeader.module.css';

/**
 * PageHeader component - consistent page-level header
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  showBackButton = false,
  onBackClick,
  backLabel = 'Back',
  actions,
  tabs,
  activeTab,
  onTabChange,
  tags,
  variant = 'default',
  className = '',
}: PageHeaderProps): React.ReactElement {
  const classNames = useMemo(() => {
    const classes = [styles.pageHeader];
    if (variant !== 'default') {
      classes.push(styles[`pageHeader--${variant}`]);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [variant, className]);

  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <nav className={styles.pageHeader__breadcrumbs} aria-label="Breadcrumb">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const IconComponent = item.icon;

          return (
            <div key={index} className={styles.pageHeader__breadcrumbItem}>
              {index > 0 && (
                <ChevronRight size={14} className={styles.pageHeader__breadcrumbSeparator} />
              )}
              {isLast ? (
                <span className={styles.pageHeader__breadcrumbCurrent}>
                  {IconComponent && <IconComponent size={14} />}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  className={styles.pageHeader__breadcrumbLink}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  {IconComponent && <IconComponent size={14} />}
                  {item.label}
                </a>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  const renderBackButton = () => {
    if (!showBackButton) return null;

    return (
      <button
        type="button"
        className={styles.pageHeader__backButton}
        onClick={onBackClick}
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </button>
    );
  };

  const renderTabs = () => {
    if (!tabs || tabs.length === 0) return null;

    return (
      <div className={styles.pageHeader__tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.pageHeader__tab} ${
              activeTab === tab.id ? styles['pageHeader__tab--active'] : ''
            }`}
            onClick={() => onTabChange?.(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={styles.pageHeader__tabCount}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className={classNames}>
      {renderBreadcrumbs()}
      {renderBackButton()}
      
      <div className={styles.pageHeader__topRow}>
        <div className={styles.pageHeader__titleSection}>
          <div className={styles.pageHeader__titleRow}>
            {Icon && (
              <div className={styles.pageHeader__icon}>
                <Icon size={20} />
              </div>
            )}
            <h1 className={styles.pageHeader__title}>{title}</h1>
          </div>
          {subtitle && <p className={styles.pageHeader__subtitle}>{subtitle}</p>}
          {tags && tags.length > 0 && (
            <div className={styles.pageHeader__tags}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={styles.pageHeader__tag}
                  style={tag.color ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {actions && (
          <div className={styles.pageHeader__actions}>
            {actions}
          </div>
        )}
      </div>

      {renderTabs()}
    </header>
  );
}

export default PageHeader;
