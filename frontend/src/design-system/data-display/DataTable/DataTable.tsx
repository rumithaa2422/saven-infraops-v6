/**
 * DataTable Component
 * Enterprise Design System V2
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, FileQuestion } from 'lucide-react';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../navigation/Pagination';
import type { DataTableProps, ColumnDef, SortDirection } from './types';
import styles from './DataTable.module.css';

/**
 * DataTable component - enterprise data table with sorting, selection, and pagination
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  selectable = false,
  sortable = false,
  pagination,
  loading = false,
  empty,
  onRowClick,
  onSelectionChange,
  onSort,
  variant = 'default',
  className = '',
}: DataTableProps<T>): React.ReactElement {
  const [selectedRows, setSelectedRows] = useState<Set<unknown>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allKeys = new Set(data.map((row) => row[keyField]));
    const newSelected = selectedRows.size === allKeys.size ? new Set() : allKeys;
    setSelectedRows(newSelected);
    onSelectionChange?.(data.filter((row) => newSelected.has(row[keyField])));
  }, [data, keyField, selectedRows, onSelectionChange]);

  // Handle row selection
  const handleSelectRow = useCallback(
    (key: unknown) => {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedRows(newSelected);
      onSelectionChange?.(data.filter((row) => newSelected.has(row[keyField])));
    },
    [selectedRows, keyField, onSelectionChange, data]
  );

  // Handle sort
  const handleSort = useCallback(
    (columnId: string) => {
      if (!sortable) return;

      let newDirection: SortDirection = 'asc';
      if (sortColumn === columnId) {
        if (sortDirection === 'asc') {
          newDirection = 'desc';
        } else if (sortDirection === 'desc') {
          newDirection = null;
        }
      }

      setSortColumn(newDirection ? columnId : undefined);
      setSortDirection(newDirection);
      onSort?.(columnId, newDirection);
    },
    [sortable, sortColumn, sortDirection, onSort]
  );

  // Get sorted data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortColumn);
      if (!column) return 0;

      const aVal = typeof column.accessor === 'function' 
        ? column.accessor(a) 
        : a[column.accessor];
      const bVal = typeof column.accessor === 'function' 
        ? column.accessor(b) 
        : b[column.accessor];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const classNames = useMemo(() => {
    const classes = [styles.dataTable];
    if (variant === 'compact') {
      classes.push(styles['dataTable--compact']);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [variant, className]);

  const renderSortIcon = (columnId: string, isSortable?: boolean) => {
    if (!isSortable) return null;

    const isActive = sortColumn === columnId;
    if (isActive && sortDirection === 'asc') {
      return <ChevronUp size={14} className={`${styles.dataTable__sortIcon} ${styles['dataTable__sortIcon--active']}`} />;
    }
    if (isActive && sortDirection === 'desc') {
      return <ChevronDown size={14} className={`${styles.dataTable__sortIcon} ${styles['dataTable__sortIcon--active']}`} />;
    }
    return <ChevronsUpDown size={14} className={styles.dataTable__sortIcon} />;
  };

  return (
    <div className={styles.dataTable__wrapper}>
      <table className={classNames} role="grid">
        <thead className={styles.dataTable__header}>
          <tr className={styles.dataTable__headerRow}>
            {selectable && (
              <th className={styles.dataTable__checkbox}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className={`${styles.dataTable__headerCell} ${
                  column.sortable && sortable ? styles['dataTable__headerCell--sortable'] : ''
                } ${column.align === 'center' ? styles['dataTable__headerCell--center'] : ''} ${
                  column.align === 'right' ? styles['dataTable__headerCell--right'] : ''
                }`}
                style={{ width: column.width, minWidth: column.minWidth }}
                onClick={() => column.sortable && sortable && handleSort(column.id)}
                aria-sort={
                  sortColumn === column.id
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div className={styles.dataTable__headerContent}>
                  <span>{column.header}</span>
                  {renderSortIcon(column.id, column.sortable)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.dataTable__body}>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <div className={styles.dataTable__loading}>
                  <Loading text="Loading data..." />
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState
                  icon={FileQuestion}
                  title={empty?.title || 'No data found'}
                  description={empty?.description}
                  action={empty?.action}
                />
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const rowKey = row[keyField];
              const isSelected = selectedRows.has(rowKey);

              return (
                <tr
                  key={String(rowKey)}
                  className={`${styles.dataTable__row} ${
                    onRowClick ? styles['dataTable__row--clickable'] : ''
                  } ${isSelected ? styles['dataTable__row--selected'] : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className={styles.dataTable__checkbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(rowKey);
                        }}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : row[column.accessor];

                    return (
                      <td
                        key={column.id}
                        className={`${styles.dataTable__cell} ${
                          column.align === 'center' ? styles['dataTable__cell--center'] : ''
                        } ${column.align === 'right' ? styles['dataTable__cell--right'] : ''}`}
                      >
                        {column.render ? column.render(value, row, index) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && !loading && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          pageSizes={pagination.pageSizes}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}

export default DataTable;
