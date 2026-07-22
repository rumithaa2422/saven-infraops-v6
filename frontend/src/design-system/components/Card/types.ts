/**
 * Card Component Types
 * Enterprise Design System V2
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

// Card variants
export type CardVariant = 'default' | 'compact' | 'bordered' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// Base props
export interface CardBaseProps {
  /** Card content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Card variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Clickable card */
  interactive?: boolean;
  /** Hover elevation effect */
  hoverable?: boolean;
  /** Card header */
  header?: React.ReactNode;
  /** Card footer */
  footer?: React.ReactNode;
}

// Card component props
export interface CardProps extends CardBaseProps, React.HTMLAttributes<HTMLDivElement> {}

// Card section props
export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

// Card header props
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Card footer props
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

// Summary card props
export interface SummaryCardProps extends CardBaseProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  onClick?: () => void;
}

export default CardProps;
