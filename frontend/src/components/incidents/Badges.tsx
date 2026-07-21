import React from 'react';

// Incident Status Badge Component
interface IncidentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const incidentStatusConfig: Record<string, { label: string; bg: string; text: string; ring: string; dot: string }> = {
  OPEN: { label: 'Open', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-1 ring-blue-200', dot: 'bg-blue-500' },
  NEW: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-1 ring-blue-200', dot: 'bg-blue-500' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-1 ring-purple-200', dot: 'bg-purple-500' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-1 ring-amber-200', dot: 'bg-amber-500' },
  WAITING_FOR_USER: { label: 'Waiting', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-1 ring-orange-200', dot: 'bg-orange-500' },
  PENDING: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-1 ring-slate-200', dot: 'bg-slate-400' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-1 ring-slate-200', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-1 ring-red-200', dot: 'bg-red-500' },
};

export function IncidentStatusBadge({ status, size = 'md', variant = 'default' }: IncidentStatusBadgeProps & { variant?: 'default' | 'light' }) {
  const baseConfig = incidentStatusConfig[status.toUpperCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-1 ring-slate-200',
    dot: 'bg-slate-400'
  };
  
  // Light variant for use on dark backgrounds
  const lightConfig = {
    OPEN: { label: 'Open', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    NEW: { label: 'New', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    WAITING_FOR_USER: { label: 'Waiting', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    PENDING: { label: 'Pending', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    RESOLVED: { label: 'Resolved', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    CLOSED: { label: 'Closed', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' },
  };
  
  const config = variant === 'light' 
    ? (lightConfig[status.toUpperCase() as keyof typeof lightConfig] || { label: status.replace(/_/g, ' '), bg: 'bg-white/20', text: 'text-white', ring: 'ring-1 ring-white/30', dot: 'bg-white' })
    : baseConfig;

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
    <span className={`inline-flex items-center font-semibold rounded-full ${config.bg} ${config.text} ${config.ring} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm animate-fade-in`}>
      <span className={`${dotSizes[size]} rounded-full ${config.dot} opacity-80`} />
      {config.label}
    </span>
  );
}

// Severity Badge Component (Incident-specific)
interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const severityConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string; gradient: string }> = {
  CRITICAL: { 
    label: 'Critical', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200', 
    icon: '🔴',
    gradient: 'from-red-500 to-red-600'
  },
  SEV1: { 
    label: 'SEV1', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200', 
    icon: '🔴',
    gradient: 'from-red-500 to-red-600'
  },
  HIGH: { 
    label: 'High', 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200', 
    icon: '🟠',
    gradient: 'from-orange-500 to-orange-600'
  },
  SEV2: { 
    label: 'SEV2', 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200', 
    icon: '🟠',
    gradient: 'from-orange-500 to-orange-600'
  },
  MEDIUM: { 
    label: 'Medium', 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200', 
    icon: '🟡',
    gradient: 'from-amber-500 to-amber-600'
  },
  SEV3: { 
    label: 'SEV3', 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200', 
    icon: '🟡',
    gradient: 'from-amber-500 to-amber-600'
  },
  LOW: { 
    label: 'Low', 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200', 
    icon: '⚪',
    gradient: 'from-slate-400 to-slate-500'
  },
  SEV4: { 
    label: 'SEV4', 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200', 
    icon: '⚪',
    gradient: 'from-slate-400 to-slate-500'
  },
  URGENT: { 
    label: 'Urgent', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200', 
    icon: '🔴',
    gradient: 'from-red-500 to-red-600'
  },
};

export function SeverityBadge({ severity, size = 'md', showIcon = false, variant = 'default' }: SeverityBadgeProps & { variant?: 'default' | 'light' }) {
  const baseConfig = severityConfig[severity.toUpperCase()] || {
    label: severity,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: '⚪',
    gradient: 'from-slate-400 to-slate-500'
  };

  // Light variant for use on dark backgrounds
  const lightConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string; gradient: string }> = {
    CRITICAL: { label: 'Critical', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🔴', gradient: 'from-white/40 to-white/30' },
    SEV1: { label: 'SEV1', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🔴', gradient: 'from-white/40 to-white/30' },
    HIGH: { label: 'High', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🟠', gradient: 'from-white/40 to-white/30' },
    SEV2: { label: 'SEV2', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🟠', gradient: 'from-white/40 to-white/30' },
    MEDIUM: { label: 'Medium', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🟡', gradient: 'from-white/40 to-white/30' },
    SEV3: { label: 'SEV3', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🟡', gradient: 'from-white/40 to-white/30' },
    LOW: { label: 'Low', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '⚪', gradient: 'from-white/40 to-white/30' },
    SEV4: { label: 'SEV4', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '⚪', gradient: 'from-white/40 to-white/30' },
    URGENT: { label: 'Urgent', bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '🔴', gradient: 'from-white/40 to-white/30' },
  };

  const config = variant === 'light'
    ? (lightConfig[severity.toUpperCase() as keyof typeof lightConfig] || { label: severity, bg: 'bg-white/20', text: 'text-white', border: 'border-white/30', icon: '⚪', gradient: 'from-white/40 to-white/30' })
    : baseConfig;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 animate-fade-in`}>
      {showIcon && <span className="text-base leading-none filter drop-shadow-sm">{config.icon}</span>}
      <span className="relative">
        <span className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-20 rounded-md blur-sm`} />
        <span className="relative">{config.label}</span>
      </span>
    </span>
  );
}

// Priority Badge Component (Incident-specific)
interface IncidentPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '⬆️' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '↑' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '→' },
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '↓' },
  URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '⬆️' },
};

export function IncidentPriorityBadge({ priority, size = 'md', showIcon = false }: IncidentPriorityBadgeProps) {
  const config = priorityConfig[priority.toUpperCase()] || {
    label: priority,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: '•'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 hover:shadow-sm animate-fade-in`}>
      {showIcon && <span className="text-base leading-none">{config.icon}</span>}
      {config.label}
    </span>
  );
}

// Impact Badge Component
interface ImpactBadgeProps {
  impact: string;
  size?: 'sm' | 'md' | 'lg';
}

const impactConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export function ImpactBadge({ impact, size = 'md' }: ImpactBadgeProps) {
  const config = impactConfig[impact.toUpperCase()] || {
    label: impact,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200`}>
      {config.label}
    </span>
  );
}
