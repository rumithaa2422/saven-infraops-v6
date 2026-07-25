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
    <div className={`page-header ${className}`}>
      <div className="page-header-left">
        {/* Back Button */}
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="btn-secondary mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Icon */}
        {Icon && (
          <div className="page-header-icon">
            <Icon className={`w-5 h-5 ${iconColor}`} />
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

// Inventory Detail Header Component - Specialized for inventory detail pages
interface InventoryDetailHeaderProps {
  itemNo: string;
  itemName: string;
  statusBadge: React.ReactNode;
  categoryBadge?: React.ReactNode;
  locationBadge?: React.ReactNode;
  quantity?: number;
  minStock?: number;
  lastUpdated?: string;
  actions?: React.ReactNode;
  onBackClick: () => void;
  className?: string;
}

export function InventoryDetailHeader({
  itemNo,
  itemName,
  statusBadge,
  categoryBadge,
  locationBadge,
  quantity,
  minStock,
  lastUpdated,
  actions,
  onBackClick,
  className = ''
}: InventoryDetailHeaderProps) {
  const formatDate = (dateString?: string) => {
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

  const getStockIndicator = () => {
    if (quantity === undefined) return null;
    const isLow = minStock !== undefined && quantity <= minStock;
    const isOut = quantity === 0;
    
    if (isOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Out of Stock
        </span>
      );
    }
    if (isLow) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Adequate Stock
      </span>
    );
  };

  return (
    <div className={`bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 ${className}`}>
      <div className="px-6 py-5">
        {/* Top Row - Back Button and Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackClick}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Inventory
          </button>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Item Number */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono font-semibold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded">
                {itemNo}
              </span>
              <div className="flex items-center gap-2">
                {statusBadge}
                {categoryBadge}
                {locationBadge}
              </div>
            </div>

            {/* Item Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              {itemName}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
              {quantity !== undefined && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Qty: <span className="font-semibold text-white">{quantity}</span></span>
                  {getStockIndicator()}
                </div>
              )}
              {minStock !== undefined && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Min: <span className="font-medium text-white">{minStock}</span></span>
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Updated {formatDate(lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
