/**
 * PageToolbar Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';

export interface SearchConfig {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  debounceMs?: number;
}

export interface ToolbarFilter {
  id: string;
  label: string;
  icon?: LucideIcon;
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
  value?: string;
  onChange: (value: string) => void;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'secondary' | 'danger';
}

export interface PageToolbarProps {
  // Search
  search?: SearchConfig;
  
  // Filters
  filters?: React.ReactNode;
  
  // Bulk Actions (shown when items are selected)
  bulkActions?: BulkAction[];
  selectedCount?: number;
  onClearSelection?: () => void;
  
  // Actions
  actions?: React.ReactNode;
  
  // Layout
  sticky?: boolean;
  className?: string;
}

export default PageToolbarProps;
