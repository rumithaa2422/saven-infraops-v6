import React from 'react';

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
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

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-1 ring-slate-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${config.bg} ${config.text} ${config.ring} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text-', 'bg-')} opacity-70`} />
      {config.label}
    </span>
  );
}

// Priority Badge Component
interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '⚪' },
  URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
};

export function PriorityBadge({ priority, size = 'md', showIcon = false }: PriorityBadgeProps) {
  const config = priorityConfig[priority.toUpperCase()] || {
    label: priority,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: '⚪'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm`}>
      {showIcon && <span className="text-base leading-none">{config.icon}</span>}
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

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const config = categoryColors[category] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md ${config.bg} ${config.text} ${sizeClasses[size]} transition-all duration-200`}>
      {category}
    </span>
  );
}
