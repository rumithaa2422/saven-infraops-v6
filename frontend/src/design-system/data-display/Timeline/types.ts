/**
 * Timeline Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  children?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  showDate?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export default TimelineProps;
