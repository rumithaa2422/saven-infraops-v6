/**
 * PageHeader Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}

export interface PageHeaderProps {
  // Title
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  
  // Navigation
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  backLabel?: string;
  
  // Actions
  actions?: React.ReactNode;
  actionButtons?: PageHeaderAction[];
  
  // Tabs
  tabs?: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  
  // Tags/Metadata
  tags?: Array<{
    label: string;
    color?: string;
  }>;
  
  // Variants
  variant?: 'default' | 'minimal' | 'hero';
  
  // Styling
  className?: string;
}

export default PageHeaderProps;
