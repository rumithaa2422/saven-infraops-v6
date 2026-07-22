/**
 * Badge Component Types
 * Enterprise Design System V2
 */

// Badge variants
export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'new'
  | 'assigned'
  | 'inProgress'
  | 'waiting'
  | 'resolved'
  | 'closed'
  | 'blocked'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type BadgeSize = 'sm' | 'md';

// Status badge props
export interface StatusBadgeProps {
  status: 'new' | 'assigned' | 'inProgress' | 'waiting' | 'resolved' | 'closed' | 'blocked';
  label?: string;
  showDot?: boolean;
  size?: BadgeSize;
  className?: string;
}

// Priority badge props
export interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  label?: string;
  size?: BadgeSize;
  className?: string;
}

// Badge props
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pill?: boolean;
  children?: React.ReactNode;
}

// Category badge props
export interface CategoryBadgeProps {
  category: string;
  color?: string;
  size?: BadgeSize;
  className?: string;
}

export default BadgeProps;
