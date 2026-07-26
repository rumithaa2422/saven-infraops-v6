/**
 * Analytics Card Component
 * Enterprise Design System V2
 * Reusable component for analytics chart containers
 */

import React from 'react';
import { LucideIcon, BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

// Props interface
export interface AnalyticsCardProps {
  /** Card title */
  title: string;
  
  /** Short description */
  description?: string;
  
  /** Optional icon */
  icon?: LucideIcon;
  
  /** Click handler (optional) */
  onClick?: () => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Card variant for styling */
  variant?: 'default' | 'blue' | 'green' | 'purple' | 'red' | 'orange';
  
  /** Chart content (optional - if provided, replaces placeholder) */
  children?: React.ReactNode;
}

// Default icon
const DefaultIcon = BarChart3;

// Variant color mappings
const variantColors: Record<string, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-500',
    border: 'border-blue-200'
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-500',
    border: 'border-emerald-200'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-500',
    border: 'border-purple-200'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-500',
    border: 'border-red-200'
  },
  orange: {
    bg: 'bg-amber-50',
    text: 'text-amber-500',
    border: 'border-amber-200'
  }
};

/**
 * Analytics Card Component
 * Reusable container for analytics charts
 */
export function AnalyticsCard({
  title,
  description,
  icon: Icon = DefaultIcon,
  onClick,
  className = '',
  variant = 'default',
  children
}: AnalyticsCardProps) {
  const colors = variantColors[variant];
  
  return (
    <div
      className={`
        group relative
        bg-white rounded-2xl border ${colors.border}
        shadow-sm hover:shadow-md
        hover:border-slate-300 transition-all duration-200
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-100">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      
      {/* Content Area - Chart or Placeholder */}
      {children ? (
        <div className="p-4">
          {children}
        </div>
      ) : (
        <div className={`min-h-[280px] ${colors.bg} flex items-center justify-center p-6`}>
          {/* Placeholder content */}
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-2xl ${colors.bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-8 h-8 ${colors.text} opacity-50`} />
            </div>
            <p className={`text-sm font-medium ${colors.text} opacity-70`}>
              Chart placeholder
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Analytics widget coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for AnalyticsCard
 */
export function AnalyticsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 p-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-3 w-48 bg-slate-50 rounded mt-2" />
        </div>
      </div>
      <div className="min-h-[280px] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 mb-3" />
          <div className="h-4 w-24 mx-auto bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Analytics Grid Container
 * Responsive grid for analytics cards
 */
export interface AnalyticsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsGrid({ children, className = '' }: AnalyticsGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Analytics Section Container
 * Section wrapper for the analytics area
 */
export interface AnalyticsSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsSection({ children, className = '' }: AnalyticsSectionProps) {
  return (
    <section className={`${className}`}>
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Visual insights into your organization's operational data.
        </p>
      </div>
      
      {/* Content */}
      {children}
    </section>
  );
}

export default AnalyticsCard;
