import React from 'react';

// Stock Status Badge Component
interface StockStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const stockStatusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  IN_STOCK: { 
    label: 'In Stock', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  LOW_STOCK: { 
    label: 'Low Stock', 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  OUT_OF_STOCK: { 
    label: 'Out of Stock', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200',
    dot: 'bg-red-500'
  },
  RESERVED: { 
    label: 'Reserved', 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    dot: 'bg-purple-500'
  },
  DAMAGED: { 
    label: 'Damaged', 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200',
    dot: 'bg-orange-500'
  },
  DISCONTINUED: { 
    label: 'Discontinued', 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  ACTIVE: { 
    label: 'Active', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  INACTIVE: { 
    label: 'Inactive', 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
};

export function StockStatusBadge({ status, size = 'md', showIcon = false }: StockStatusBadgeProps) {
  const config = stockStatusConfig[status.toUpperCase().replace(/ /g, '_')] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm animate-fade-in`}>
      {showIcon && <span className={`${dotSizes[size]} rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}

// Category Badge Component
interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Electronics: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Hardware: { bg: 'bg-purple-50', text: 'text-purple-600' },
  Software: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Network: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  Furniture: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Office: { bg: 'bg-teal-50', text: 'text-teal-600' },
  IT: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  Safety: { bg: 'bg-red-50', text: 'text-red-600' },
  General: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const config = categoryColors[category] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md ${config.bg} ${config.text} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm`}>
      {category}
    </span>
  );
}

// Location Badge Component
interface LocationBadgeProps {
  location: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LocationBadge({ location, size = 'md' }: LocationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-600 ${sizeClasses[size]} transition-all duration-200`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {location}
    </span>
  );
}
