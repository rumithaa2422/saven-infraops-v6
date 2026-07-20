import React from 'react';
import { LucideIcon } from 'lucide-react';

// Section Card Component
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
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  action,
  children,
  className = '',
  noPadding = false
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-xl ${iconBg}`}>
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

// Info Card Component
interface InfoCardProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function InfoCard({ label, value, icon: Icon, className = '' }: InfoCardProps) {
  return (
    <div className={`p-4 rounded-xl bg-slate-50 border border-slate-100 ${className}`}>
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
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
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
