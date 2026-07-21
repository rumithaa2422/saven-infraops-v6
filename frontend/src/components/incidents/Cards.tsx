import React from 'react';
import { LucideIcon } from 'lucide-react';

// Section Card Component - Same style as serviceRequests
interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  icon: Icon,
  iconColor = 'text-purple-600',
  iconBg = 'bg-purple-50',
  action,
  children,
  className = '',
  noPadding = false
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-105`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

// Info Card Component - For displaying key-value pairs
interface InfoCardProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function InfoCard({ label, value, icon: Icon, className = '' }: InfoCardProps) {
  return (
    <div className={`p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-200 hover:bg-slate-100/50 ${className}`}>
      {Icon && (
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
      )}
      {!Icon && (
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
      )}
      <div className="text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

// Grid Card for displaying multiple info items
interface InfoGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function InfoGrid({ children, columns = 3, className = '' }: InfoGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Empty State Card
interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyStateCard({ icon: Icon, title, description, action }: EmptyStateCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 transition-all duration-300 hover:scale-110 hover:bg-slate-200">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// Loading Card Skeleton
interface LoadingCardProps {
  lines?: number;
  className?: string;
}

export function LoadingCard({ lines = 3, className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 bg-slate-100 rounded-lg" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-50 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Incident Summary Card - For dashboard overview
interface IncidentSummaryCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'amber' | 'emerald' | 'red' | 'slate';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
}

const colorConfig = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
};

export function IncidentSummaryCard({ title, count, icon: Icon, color, trend, trendValue, onClick }: IncidentSummaryCardProps) {
  const config = colorConfig[color];
  const TrendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-purple-200 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${config.bg} ring-2 ${config.ring}`}>
          <Icon className={`w-5 h-5 ${config.text}`} />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <span>{TrendIcon}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900">{count}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

// Timeline Card Component
interface TimelineCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineCard({ children, className = '' }: TimelineCardProps) {
  return (
    <div className={`space-y-0 ${className}`}>
      {children}
    </div>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  isLast?: boolean;
}

export function TimelineItem({ icon: Icon, iconBg = 'bg-slate-100', iconColor = 'text-slate-500', title, description, timestamp, user, isLast = false }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center z-10`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-100 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">{timestamp}</span>
        </div>
        {user && (
          <p className="text-xs text-slate-400 mt-1">by {user}</p>
        )}
      </div>
    </div>
  );
}
