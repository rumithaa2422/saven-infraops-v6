/**
 * Dashboard KPI Card Component
 * Enterprise Design System V2
 * Reusable component for executive-level KPI displays
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  
  /** Additional CSS classes */
  className?: string;
}

// Status color mappings
const statusColors: Record<KPIStatus, { bg: string; text: string; badge: string }> = {
  default: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-600'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-600'
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-600'
  },
  orange: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-600'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-600'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-600'
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
  className = ''
}: DashboardKPICardProps) {
  const colors = statusColors[status];
  
  // Trend icon based on direction
  const TrendIcon = () => {
    if (trendDirection === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (trendDirection === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };
  
  // Determine if trend should be shown (only if trend prop is provided)
  const showTrend = trend !== undefined && trend !== null && trend !== '';
  
  return (
    <div
      className={`
        group bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm
        hover:shadow-lg hover:-translate-y-1 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Top Row: Icon and Trend */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon Container */}
        <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        
        {/* Trend Indicator (optional) */}
        {showTrend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            <TrendIcon />
            <span>{trend}</span>
          </div>
        )}
      </div>
      
      {/* Value, Title, and Description */}
      <div className="space-y-1">
        {/* Large KPI Value */}
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        
        {/* Title */}
        <p className="text-sm font-medium text-slate-500">{title}</p>
        
        {/* Description (optional) */}
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
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
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100" />
        <div className="w-16 h-5 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-20 bg-slate-100 rounded-lg" />
        <div className="h-4 w-24 bg-slate-50 rounded" />
      </div>
    </div>
  );
}

/**
 * Grid container for DashboardKPICard components
 */
export interface DashboardKPIGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardKPIGrid({ children, className = '' }: DashboardKPIGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default DashboardKPICard;
