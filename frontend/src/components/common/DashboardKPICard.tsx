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
  gradient: string;
  glow: string;
}> = {
  default: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    badge: 'bg-slate-200 text-slate-700',
    gradient: 'from-slate-50 to-slate-100',
    glow: 'shadow-slate-200'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-50 to-indigo-50',
    glow: 'shadow-blue-200/50'
  },
  green: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    gradient: 'from-emerald-50 to-teal-50',
    glow: 'shadow-emerald-200/50'
  },
  orange: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-50 to-orange-50',
    glow: 'shadow-amber-200/50'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    gradient: 'from-red-50 to-rose-50',
    glow: 'shadow-red-200/50'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-50 to-violet-50',
    glow: 'shadow-purple-200/50'
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
        bg-gradient-to-br ${colors.gradient}
        rounded-2xl border border-slate-200/80 
        p-5 shadow-sm
        hover:shadow-xl ${colors.glow}
        hover:-translate-y-1 transition-all duration-300 ease-out
        flex flex-col h-full min-w-[200px]
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Decorative top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-80 rounded-t-2xl`} />
      
      {/* Animated background circle decoration */}
      <div className={`
        absolute -right-6 -top-6 w-24 h-24 
        rounded-full ${colors.bg} opacity-50
        group-hover:scale-150 group-hover:opacity-70
        transition-all duration-500 ease-out
      `} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Row: Icon and Trend */}
        <div className="flex items-center justify-between mb-4">
          {/* Icon Container - vibrant and eye-catching */}
          <div className={`
            p-3 rounded-xl ${colors.bg} 
            group-hover:scale-110 group-hover:rotate-3
            transition-all duration-300 ease-out
            shadow-sm
          `}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          
          {/* Trend Indicator (optional) */}
          {showTrend && (
            <div className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full 
              text-xs font-bold ${colors.badge}
              group-hover:scale-105 transition-transform duration-200
              shadow-sm
            `}>
              <TrendIcon />
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        {/* Value, Title, and Description */}
        <div className="flex flex-col flex-1">
          {/* Large KPI Value - primary focus with gradient text */}
          <h3 className={`
            text-3xl font-black ${colors.text} 
            tracking-tight leading-none
            group-hover:scale-105 transition-transform duration-200
          `}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          
          {/* Title */}
          <p className="text-sm font-bold text-slate-800 mt-3 leading-tight">{title}</p>
          
          {/* Description (optional) */}
          {description && (
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>
        
        {/* View details link (if clickable) */}
        {viewPath && onClick && (
          <div className={`
            mt-4 pt-3 border-t border-slate-200/50
            flex items-center gap-1
            text-xs font-semibold ${colors.text}
            opacity-0 group-hover:opacity-100
            transform translate-y-1 group-hover:translate-y-0
            transition-all duration-200
          `}>
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
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
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse flex flex-col h-full">
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 rounded-t-2xl" />
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-200" />
        <div className="w-16 h-6 rounded-full bg-slate-200" />
      </div>
      <div className="flex flex-col flex-1">
        <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        <div className="h-4 w-28 bg-slate-200 rounded mt-4" />
        <div className="h-3 w-36 bg-slate-100 rounded mt-2" />
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
    <div className={`grid ${getGridClass()} gap-5 ${className}`}>
      {children}
    </div>
  );
}

export default DashboardKPICard;
