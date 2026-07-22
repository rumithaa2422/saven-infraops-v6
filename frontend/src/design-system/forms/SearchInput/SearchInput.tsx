/**
 * SearchInput Component
 * Enterprise Design System V2
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  debounceMs?: number;
  clearable?: boolean;
  fullWidth?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * SearchInput component - search input with debounce and clear
 */
export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  clearable = true,
  fullWidth = true,
  className = '',
  inputClassName = '',
}: SearchInputProps): React.ReactElement {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceMs > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      } else {
        onChange(newValue);
      }
    },
    [onChange, debounceMs]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch();
      }
      if (e.key === 'Escape' && clearable) {
        handleClear();
      }
    },
    [onSearch, clearable, handleClear]
  );

  return (
    <div className={`${styles.searchInput}${fullWidth ? ` ${styles['searchInput--fullWidth']}` : ''} ${className || ''}`}>
      <Search size={16} className={styles.searchInput__icon} />
      <input
        type="text"
        className={`${styles.searchInput__input} ${inputClassName || ''}`}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
      />
      {clearable && localValue && (
        <button
          type="button"
          className={styles.searchInput__clear}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
