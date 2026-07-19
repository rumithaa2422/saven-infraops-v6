import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  variant = 'default',
  onClick,
  className = ''
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-white border-slate-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
    success: 'bg-emerald-50 border-emerald-200'
  };

  const iconStyles = {
    default: 'text-slate-500 bg-slate-100',
    warning: 'text-amber-600 bg-amber-100',
    danger: 'text-red-600 bg-red-100',
    success: 'text-emerald-600 bg-emerald-100'
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200' : ''}
        rounded-xl border p-4 ${variantStyles[variant]} ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            trend === 'up' ? 'text-emerald-600 bg-emerald-100' :
            trend === 'down' ? 'text-red-600 bg-red-100' :
            'text-slate-600 bg-slate-100'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Skeleton loader for stat card
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 animate-pulse ${className}`}>
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-3">
        <div className="h-7 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-100 rounded mt-2" />
      </div>
    </div>
  );
}
