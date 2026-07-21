import React from 'react';

// Status Badge Component - Modern Design
interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
}

// Status colors consistent across the application
// New: Blue, Assigned: Purple, In Progress: Orange, Pending: Yellow
// Waiting for User: Cyan, Waiting for Vendor: Indigo, Resolved: Green
// Closed: Gray, Cancelled: Red
const statusConfig: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  OPEN: { label: 'Open', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-1 ring-blue-200' },
  NEW: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-1 ring-blue-200' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-1 ring-purple-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-1 ring-orange-200' },
  PENDING: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-1 ring-yellow-200' },
  WAITING_FOR_USER: { label: 'Waiting for User', bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-1 ring-cyan-200' },
  WAITING_FOR_VENDOR: { label: 'Waiting for Vendor', bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-1 ring-indigo-200' },
  RESOLVED: { label: 'Resolved', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-1 ring-green-200' },
  COMPLETED: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-1 ring-green-200' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-1 ring-slate-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-1 ring-red-200' },
  APPROVED: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-1 ring-green-200' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-1 ring-red-200' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-1 ring-yellow-200' },
};

// Light variant config for dark backgrounds
const statusConfigLight: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  OPEN: { label: 'Open', bg: 'bg-blue-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  NEW: { label: 'New', bg: 'bg-blue-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-purple-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-orange-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  PENDING: { label: 'Pending', bg: 'bg-yellow-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  WAITING_FOR_USER: { label: 'Waiting for User', bg: 'bg-cyan-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  WAITING_FOR_VENDOR: { label: 'Waiting for Vendor', bg: 'bg-indigo-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  RESOLVED: { label: 'Resolved', bg: 'bg-green-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  COMPLETED: { label: 'Completed', bg: 'bg-green-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  CLOSED: { label: 'Closed', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  APPROVED: { label: 'Approved', bg: 'bg-green-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'bg-yellow-500/30', text: 'text-white', ring: 'ring-1 ring-white/30' },
};

export function StatusBadge({ status, size = 'md', variant = 'default' }: StatusBadgeProps) {
  const baseConfig = statusConfig[status.toUpperCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-1 ring-slate-200'
  };

  const lightConfig = statusConfigLight[status.toUpperCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-white/20',
    text: 'text-white',
    ring: 'ring-1 ring-white/30'
  };

  const config = variant === 'light' ? lightConfig : baseConfig;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-xl ${config.bg} ${config.text} ${config.ring} ${sizeClasses[size]} transition-all duration-200 hover:shadow-md hover:scale-105`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${variant === 'light' ? 'bg-white' : config.text.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
}

// Priority Badge Component - Modern Design
interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'light';
}

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '⚪' },
  URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
};

// Light variant config for dark backgrounds
const priorityConfigLight: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-500/30', text: 'text-white', border: 'border-red-400/40', icon: '🔴' },
  HIGH: { label: 'High', bg: 'bg-orange-500/30', text: 'text-white', border: 'border-orange-400/40', icon: '🟠' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-500/30', text: 'text-white', border: 'border-amber-400/40', icon: '🟡' },
  LOW: { label: 'Low', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '⚪' },
  URGENT: { label: 'Urgent', bg: 'bg-red-500/30', text: 'text-white', border: 'border-red-400/40', icon: '🔴' },
};

export function PriorityBadge({ priority, size = 'md', showIcon = false, variant = 'default' }: PriorityBadgeProps) {
  const baseConfig = priorityConfig[priority.toUpperCase()] || {
    label: priority,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: '⚪'
  };

  const lightConfig = priorityConfigLight[priority.toUpperCase()] || {
    label: priority,
    bg: 'bg-white/20',
    text: 'text-white',
    border: 'border-white/30',
    icon: '⚪'
  };

  const config = variant === 'light' ? lightConfig : baseConfig;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2'
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-xl border-2 ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 hover:shadow-md hover:scale-105`}>
      {showIcon && <span className="text-base leading-none">{config.icon}</span>}
      {config.label}
    </span>
  );
}

// Category Badge Component - Modern Design
interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Network: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Hardware: { bg: 'bg-purple-50', text: 'text-purple-600' },
  Software: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Security: { bg: 'bg-red-50', text: 'text-red-600' },
  Infrastructure: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Database: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  Cloud: { bg: 'bg-sky-50', text: 'text-sky-600' },
  Support: { bg: 'bg-teal-50', text: 'text-teal-600' },
  General: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

// Light variant config for dark backgrounds
const categoryColorsLight: Record<string, { bg: string; text: string }> = {
  Network: { bg: 'bg-blue-500/30', text: 'text-white' },
  Hardware: { bg: 'bg-purple-500/30', text: 'text-white' },
  Software: { bg: 'bg-emerald-500/30', text: 'text-white' },
  Security: { bg: 'bg-red-500/30', text: 'text-white' },
  Infrastructure: { bg: 'bg-amber-500/30', text: 'text-white' },
  Database: { bg: 'bg-cyan-500/30', text: 'text-white' },
  Cloud: { bg: 'bg-sky-500/30', text: 'text-white' },
  Support: { bg: 'bg-teal-500/30', text: 'text-white' },
  General: { bg: 'bg-white/20', text: 'text-white' },
};

export function CategoryBadge({ category, size = 'md', variant = 'default' }: CategoryBadgeProps) {
  const baseConfig = categoryColors[category] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  const lightConfig = categoryColorsLight[category] || { bg: 'bg-white/20', text: 'text-white' };
  const config = variant === 'light' ? lightConfig : baseConfig;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-xl ${config.bg} ${config.text} ${sizeClasses[size]} transition-all duration-200 hover:shadow-md`}>
      {category}
    </span>
  );
}
