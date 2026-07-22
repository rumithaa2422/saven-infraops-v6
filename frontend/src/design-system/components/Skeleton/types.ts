/**
 * Skeleton Component Types
 * Enterprise Design System V2
 */

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';
export type SkeletonSize = 'sm' | 'md' | 'lg';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  lastLineWidth?: string | number;
  className?: string;
}

export interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export default SkeletonProps;
