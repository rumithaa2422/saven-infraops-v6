/**
 * PageToolbar Component
 * Enterprise Design System V2
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import type { PageToolbarProps, ToolbarFilter, ToolbarAction } from './types';
import styles from './PageToolbar.module.css';

/**
 * PageToolbar component - consistent toolbar for search, filters, and actions
 */
export function PageToolbar({
  search,
  filters,
  bulkActions,
  selectedCount = 0,
  onClearSelection,
  actions,
  sticky = false,
  className = '',
}: PageToolbarProps): React.ReactElement {
  const [localSearchValue, setLocalSearchValue] = useState(search?.value || '');
  const debounceRef = useRef<number | undefined>(undefined);

  // Sync local search value with prop
  useEffect(() => {
    setLocalSearchValue(search?.value || '');
  }, [search?.value]);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearchValue(value);
      
      if (search?.debounceMs && search.debounceMs > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
          search?.onChange(value);
        }, search.debounceMs);
      } else {
        search?.onChange(value);
      }
    },
    [search]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && search?.onSearch) {
        search.onSearch();
      }
    },
    [search]
  );

  const classNames = useMemo(() => {
    const classes = [styles.pageToolbar];
    if (sticky) {
      classes.push(styles['pageToolbar--sticky']);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [sticky, className]);

  const showBulkActions = bulkActions && bulkActions.length > 0 && selectedCount > 0;

  return (
    <div className={classNames}>
      {showBulkActions && (
        <div className={styles.pageToolbar__bulkActions}>
          <div className={styles.pageToolbar__bulkInfo}>
            <Check size={16} />
            <span>{selectedCount} selected</span>
          </div>
          <div className={styles.pageToolbar__bulkButtons}>
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant || 'secondary'}
                icon={action.icon}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
            {onClearSelection && (
              <button
                type="button"
                className={styles.pageToolbar__clearButton}
                onClick={onClearSelection}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.pageToolbar__main}>
        {search && (
          <div className={styles.pageToolbar__search}>
            <div className={styles.pageToolbar__searchWrapper}>
              <Search size={16} className={styles.pageToolbar__searchIcon} />
              <input
                type="text"
                className={styles.pageToolbar__searchInput}
                placeholder={search.placeholder || 'Search...'}
                value={localSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label={search.placeholder || 'Search'}
              />
            </div>
          </div>
        )}

        {filters && (
          <div className={styles.pageToolbar__filters}>
            {filters}
          </div>
        )}

        {actions && (
          <div className={styles.pageToolbar__actions}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FilterDropdown component - dropdown filter for toolbar
 */
export function FilterDropdown({
  filter,
}: {
  filter: ToolbarFilter;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = filter.icon;
  const selectedOption = filter.options.find((opt) => opt.value === filter.value);

  return (
    <div className={styles.pageToolbar__filter} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.pageToolbar__filterButton} ${
          filter.value ? styles['pageToolbar__filterButton--active'] : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {Icon && <Icon size={14} />}
        <span>{selectedOption?.label || filter.label}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className={styles.pageToolbar__filterDropdown} role="listbox">
          {filter.options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.pageToolbar__filterOption} ${
                option.value === filter.value ? styles['pageToolbar__filterOption--selected'] : ''
              }`}
              onClick={() => {
                filter.onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={option.value === filter.value}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className={styles.pageToolbar__filterCount}>{option.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PageToolbar;
