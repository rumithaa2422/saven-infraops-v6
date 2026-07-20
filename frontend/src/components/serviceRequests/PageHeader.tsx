import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';

// Back Button Component
interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = 'Back', className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-xl
        text-sm font-medium text-slate-600 hover:text-slate-900
        hover:bg-slate-100 transition-all duration-200
        group ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      {label}
    </button>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  className?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-600',
  actions,
  breadcrumbs,
  className = '',
  showBackButton = false,
  onBackClick
}: PageHeaderProps) {
  return (
    <div className={`bg-white border-b border-slate-200/60 px-6 py-5 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Back Button */}
          {showBackButton && onBackClick && (
            <BackButton onClick={onBackClick} />
          )}

          {/* Icon */}
          {Icon && (
            <div className="hidden sm:flex p-3 rounded-2xl bg-brand-50">
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          )}

          {/* Title and Breadcrumbs */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-sm mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-slate-300">/</span>}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="text-slate-500 hover:text-brand-600 transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-slate-500">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{title}</h1>
              {subtitle && (
                <span className="hidden md:inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Header Component
interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

interface StatsHeaderProps {
  stats: StatItem[];
  className?: string;
}

export function StatsHeader({ stats, className = '' }: StatsHeaderProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          <p className={`text-sm font-medium ${stat.color || 'text-slate-500'}`}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// Tab Navigation Component
interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-100 rounded-xl ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                px-1.5 py-0.5 rounded-md text-xs font-semibold
                ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
