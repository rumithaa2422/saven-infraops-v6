/**
 * Loading Component Types
 * Enterprise Design System V2
 */

export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingColor = 'primary' | 'white' | 'muted';

export interface SpinnerProps {
  size?: LoadingSize;
  color?: LoadingColor;
  className?: string;
}

export interface LoadingProps {
  size?: LoadingSize;
  color?: LoadingColor;
  text?: string;
  className?: string;
}

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export interface PageLoadingProps {
  text?: string;
  className?: string;
}

export default SpinnerProps;
