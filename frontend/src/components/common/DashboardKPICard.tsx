/**
 * Dashboard KPI Card Component
 * Enterprise Design System V2
 * Reusable component for executive-level KPI displays
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

// Status color variants
export type KPIStatus = 'default' | 'blue' | 'green' | 'orange' | 'red' | 'purple';

// Props interface
export interface DashboardKPICardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  
  /** KPI Title - the metric name (e.g., "Open Tickets") */
  title: string;
  
  /** KPI Value - the main metric value (e.g., "128") */
  value: number | string;
  
  /** Small description below the value (e.g., "Awaiting action") */
  description?: string;
  
  /** Optional trend value (e.g., "+12%", "-4%") */
  trend?: string;
  
  /** Optional trend direction for icon */
  trendDirection?: 'up' | 'down' | 'neutral';
  
  /** Status color for icon accent */
  status?: KPIStatus;
  
  /** Click handler (optional) */
  onClick?: () => void;
  
  /** Navigation path for "View details" link */
  viewPath?: string;
  
  /** Additional CSS classes */
  className?: string;
}

// Status color mappings with vibrant colors
const statusColors: Record<KPIStatus, { 
  bg: string; 
  text: string; 
  badge: string;
  ring: string;
}> = {
  default: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-600',
    ring: 'ring-slate-200'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-600',
    ring: 'ring-blue-100'
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-600',
    ring: 'ring-emerald-100'
  },
  orange: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-600',
    ring: 'ring-amber-100'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    badge: 'bg-red-50 text-red-600',
    ring: 'ring-red-100'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-600',
    ring: 'ring-purple-100'
  }
};

/**
 * Dashboard KPI Card Component
 * Reusable for any KPI metric display
 */
export function DashboardKPICard({
  icon: Icon,
  title,
  value,
  description,
  trend,
  trendDirection = 'neutral',
  status = 'default',
  onClick,
  viewPath,
  className = ''
}: DashboardKPICardProps) {
  const colors = statusColors[status];
  
  // Trend icon based on direction
  const TrendIcon = () => {
    if (trendDirection === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (trendDirection === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };
  
  // Determine if trend should be shown
  const showTrend = trend !== undefined && trend !== null && trend !== '';
  
  return (
    <div
      className={`
        group relative overflow-hidden
        bg-white
        rounded-xl border border-slate-200/80 
        p-3.5 shadow-sm
        hover:shadow-md
        hover:-translate-y-0.5 transition-all duration-200 ease-out
        flex flex-col
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Status accent bar */}
      <div className={`absolute top-0 left-0 h-0.5 w-full ${colors.ring} bg-gradient-to-r ${colors.bg} opacity-80`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* Top Row: Icon and Trend */}
        <div className="flex items-center justify-between">
          {/* Icon Chip */}
          <div className={`
            p-1.5 rounded-lg ${colors.bg} 
            group-hover:scale-105 transition-transform duration-200
          `}>
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>

          {/* Trend Indicator (optional) */}
          {showTrend && (
            <div className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full 
              text-[11px] font-semibold ${colors.badge}
            `}>
              <TrendIcon />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Value, Title, and Description */}
        <div className="flex flex-col">
          {/* Compact KPI Value */}
          <h3 className={`
            text-xl font-bold ${colors.text} 
            tracking-tight leading-none
          `}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>

          {/* Title */}
          <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{title}</p>

          {/* Description (optional) */}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-1">{description}</p>
          )}
        </div>

        {/* View details link (if clickable) */}
        {viewPath && onClick && (
          <div className={`
            mt-auto pt-2.5 border-t border-slate-100
            flex items-center gap-1
            text-xs font-semibold ${colors.text}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          `}>
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for DashboardKPICard
 */
export function DashboardKPICardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm animate-pulse flex flex-col">
      <div className="absolute top-0 left-0 h-0.5 w-full bg-slate-200" />
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg bg-slate-100" />
        <div className="w-14 h-5 rounded-full bg-slate-100" />
      </div>
      <div className="flex flex-col mt-2">
        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
        <div className="h-3.5 w-24 bg-slate-100 rounded mt-2" />
        <div className="h-3 w-28 bg-slate-50 rounded mt-1" />
      </div>
    </div>
  );
}

/**
 * Grid container for DashboardKPICard components
 * Automatically adjusts card sizes based on number of visible cards
 */
export interface DashboardKPIGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardKPIGrid({ children, className = '' }: DashboardKPIGridProps) {
  // Count the number of children (KPI cards)
  const childCount = Array.isArray(children) ? children.length : 1;
  
  // Determine grid columns based on number of cards
  // This ensures cards expand to fill available space
  const getGridClass = () => {
    if (childCount === 1) return 'grid-cols-1';
    if (childCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (childCount === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (childCount === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (childCount === 5) return 'grid-cols-2 sm:grid-cols-5';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
  };

  return (
    <div className={`grid ${getGridClass()} gap-2.5 ${className}`}>
      {children}
    </div>
  );
}

export default DashboardKPICard;
