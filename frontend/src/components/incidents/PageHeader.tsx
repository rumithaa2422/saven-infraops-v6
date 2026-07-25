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
        text-sm font-medium text-white/80 hover:text-white
        hover:bg-white/10 transition-all duration-200
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
  iconColor = '',
  actions,
  breadcrumbs,
  className = '',
  showBackButton = false,
  onBackClick
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-left">
        {/* Back Button */}
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="btn-back mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Icon */}
        {Icon && (
          <div className="page-header-icon">
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Title and Breadcrumbs */}
        <div>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm mb-1">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-slate-400">/</span>}
                  {crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-slate-500 hover:text-slate-700 transition-colors"
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
          <h1 className="page-header-title">{title}</h1>
          {subtitle && (
            <p className="page-header-subtitle">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// Incident Detail Header Component - Specialized for incident detail pages
interface IncidentDetailHeaderProps {
  incidentNo: string;
  title: string;
  statusBadge: React.ReactNode;
  severityBadge?: React.ReactNode;
  priorityBadge?: React.ReactNode;
  ownerName?: string;
  createdAt: string;
  actions?: React.ReactNode;
  onBackClick: () => void;
  className?: string;
}

export function IncidentDetailHeader({
  incidentNo,
  title,
  statusBadge,
  severityBadge,
  priorityBadge,
  ownerName,
  createdAt,
  actions,
  onBackClick,
  className = ''
}: IncidentDetailHeaderProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Incident Number and Badges */}
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                {incidentNo}
              </span>
              {statusBadge}
              {severityBadge}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {ownerName && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{ownerName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {formatDate(createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      {actions && (
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Header Component
interface StatItem {
  label: string;
  value: number | string;
  color?: string;
  icon?: LucideIcon;
}

interface StatsHeaderProps {
  stats: StatItem[];
  className?: string;
}

export function StatsHeader({ stats, className = '' }: StatsHeaderProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 rounded-lg ${stat.color || 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${stat.color ? 'text-white' : 'text-slate-600'}`} />
                </div>
              )}
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className={`text-sm font-medium ${stat.color ? 'text-white/80' : 'text-slate-500'}`}>
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
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
                ? 'bg-white text-slate-900 shadow-sm hover:-translate-y-0.5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 hover:-translate-y-0.5'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                px-1.5 py-0.5 rounded-md text-xs font-semibold
                ${isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}
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
