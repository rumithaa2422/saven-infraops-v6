/**
 * Tabs Component
 * Enterprise Design System V2
 */

import React, { useState, useCallback, useId } from 'react';
import type { TabsProps, TabItem } from './types';
import styles from './Tabs.module.css';

/**
 * Tabs component - tabbed navigation
 */
export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabListId = useId();
  const tabPanelId = useId();

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      onChange?.(tabId);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const enabledTabs = tabs.filter((tab) => !tab.disabled);
      const currentEnabledIndex = enabledTabs.findIndex((tab) => tab.id === tabs[currentIndex].id);
      
      let newIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        newIndex = (currentEnabledIndex + 1) % enabledTabs.length;
      } else if (e.key === 'ArrowLeft') {
        newIndex = (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else if (e.key === 'Home') {
        newIndex = 0;
      } else if (e.key === 'End') {
        newIndex = enabledTabs.length - 1;
      }

      if (newIndex !== null) {
        e.preventDefault();
        const newTab = enabledTabs[newIndex];
        handleTabClick(newTab.id);
        
        // Focus the new tab button
        const tabButton = document.getElementById(`${tabListId}-${newTab.id}`);
        tabButton?.focus();
      }
    },
    [tabs, handleTabClick, tabListId]
  );

  const classNames = [
    styles.tabs,
    styles[`tabs--${variant}`],
    styles[`tabs--${size}`],
    className,
  ].filter(Boolean).join(' ');

  const listClassNames = [
    styles.tabs__list,
    styles[`tabs__list--${size}`],
  ].join(' ');

  return (
    <div className={classNames}>
      <div
        className={listClassNames}
        role="tablist"
        aria-labelledby={`${tabListId}-${activeTab}`}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              id={`${tabListId}-${tab.id}`}
              role="tab"
              type="button"
              className={`${styles.tabs__tab} ${isActive ? styles['tabs__tab--active'] : ''} ${
                fullWidth ? styles.tabs__tab__fullWidth : ''
              }`}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={tab.disabled}
              aria-selected={isActive}
              aria-controls={`${tabPanelId}-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={styles.tabs__badge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        return (
          <div
            key={tab.id}
            id={`${tabPanelId}-${tab.id}`}
            role="tabpanel"
            className={`${styles.tabs__panel} ${!isActive ? styles['tabs__panel--hidden'] : ''}`}
            aria-labelledby={`${tabListId}-${tab.id}`}
            tabIndex={0}
          >
            {isActive && tab.content}
          </div>
        );
      })}
    </div>
  );
}

export default Tabs;
