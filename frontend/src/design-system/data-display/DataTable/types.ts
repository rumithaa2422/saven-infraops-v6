/**
 * DataTable Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string | number;
  minWidth?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  filterable?: boolean;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: keyof T;
  
  // Features
  selectable?: boolean;
  sortable?: boolean;
  pagination?: PaginationConfig;
  filterable?: boolean;
  
  // States
  loading?: boolean;
  empty?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  
  // Handlers
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSort?: (columnId: string, direction: SortDirection) => void;
  
  // Styling
  variant?: 'default' | 'compact' | 'bordered';
  className?: string;
}

export interface DataTableHeadProps {
  columns: ColumnDef<any>[];
  selectable: boolean;
  sortable: boolean;
  sortColumn?: string;
  sortDirection?: SortDirection;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  onSort: (columnId: string) => void;
}

export interface DataTableBodyProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: keyof T;
  selectable: boolean;
  selectedRows: Set<unknown>;
  onRowClick?: (row: T) => void;
  onSelectRow: (key: unknown) => void;
  loading?: boolean;
  empty?: DataTableProps<T>['empty'];
}

export default DataTableProps;
