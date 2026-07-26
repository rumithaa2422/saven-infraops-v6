import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { Ticket, AlertOctagon, HardDrive, UserCheck, FileClock, CalendarClock } from 'lucide-react';
import { DashboardKPICard, DashboardKPICardSkeleton, DashboardKPIGrid } from '../common/DashboardKPICard';
import type { KPIStatus } from '../common/DashboardKPICard';

interface SummaryData {
  openTickets?: number;
  criticalIncidents?: number;
  totalAssets?: number;
  totalUsers?: number;
  pendingChanges?: number;
  expiringLicenses?: number;
  highPriorityTickets?: number;
  openIncidents?: number;
  // Trend data from API (if available)
  trends?: {
    openTickets?: string;
    totalAssets?: string;
    totalUsers?: string;
  };
}

interface StatItem {
  id: string;
  label: string;
  value: number | null;
  icon: typeof Ticket;
  permission?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status: KPIStatus;
  description: string;
  viewPath?: string;
}

// Safe number formatter - returns "—" for null/undefined
const formatValue = (val: number | null | undefined): number | string => {
  if (val === null || val === undefined) return '—';
  return val;
};

// Helper to get safe number value
const getValue = (data: SummaryData, key: keyof SummaryData): number | null => {
  const val = data[key];
  return typeof val === 'number' ? val : null;
};

// Helper to get trend value from API
const getTrendValue = (data: SummaryData, key: keyof SummaryData): string | undefined => {
  if (data.trends && typeof data.trends === 'object') {
    const trendKey = key.replace(/([A-Z])/g, (m) => m.toLowerCase()) as keyof typeof data.trends;
    const trend = data.trends[trendKey];
    if (typeof trend === 'string' && trend) return trend;
  }
  return undefined;
};

// All KPI card definitions with permissions
const allStatItems: StatItem[] = [
  {
    id: 'openTickets',
    label: 'Open Tickets',
    value: null,
    icon: Ticket,
    permission: 'tickets:view',
    trend: 'up',
    trendValue: '+12%',
    status: 'purple',
    description: 'Tickets awaiting action',
    viewPath: '/service-requests'
  },
  {
    id: 'criticalIncidents',
    label: 'Critical Incidents',
    value: null,
    icon: AlertOctagon,
    permission: 'incidents:view',
    trend: 'down',
    trendValue: 'Clear',
    status: 'green',
    description: 'No critical incidents',
    viewPath: '/incidents'
  },
  {
    id: 'totalAssets',
    label: 'Total Assets',
    value: null,
    icon: HardDrive,
    permission: 'access:view',
    trend: 'up',
    trendValue: '+5%',
    status: 'blue',
    description: 'Assets currently managed',
    viewPath: '/access-management'
  },
  {
    id: 'totalUsers',
    label: 'Active Users',
    value: null,
    icon: UserCheck,
    permission: 'users:view',
    trend: 'up',
    trendValue: '+3%',
    status: 'purple',
    description: 'Users with system access',
    viewPath: '/users-teams'
  },
  {
    id: 'pendingChanges',
    label: 'Pending Changes',
    value: null,
    icon: FileClock,
    permission: 'changes:view',
    trend: 'down',
    trendValue: 'Normal',
    status: 'default',
    description: 'Awaiting approval',
    viewPath: '/changes'
  },
  {
    id: 'expiringLicenses',
    label: 'Expiring Licenses',
    value: null,
    icon: CalendarClock,
    permission: 'vendors:view',
    trend: 'down',
    trendValue: '0',
    status: 'default',
    description: 'Renewal required soon',
    viewPath: '/vendors-licenses'
  }
];

export function SummaryCards() {
  const navigate = useNavigate();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number | null>>({});
  const { hasPermission } = useAuth();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/summary');
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError('Unable to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Filter cards based on permissions
  const visibleCards = useMemo(() => {
    return allStatItems.filter(card => {
      // If no permission required, always show
      if (!card.permission) return true;
      // Check if user has the required permission
      return hasPermission(card.permission);
    });
  }, [hasPermission]);

  // Animate numbers on data change
  useEffect(() => {
    if (!data) return;

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    const animateValue = (key: string, target: number | null) => {
      let current = 0;
      const endValue = target ?? 0;
      const increment = endValue / steps;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= endValue) {
          current = endValue;
          clearInterval(timer);
        }
        setAnimatedValues(prev => ({ ...prev, [key]: Math.round(current) }));
      }, interval);
    };

    visibleCards.forEach(item => {
      const value = getValue(data, item.id as keyof SummaryData);
      animateValue(item.id, value);
    });
  }, [data, visibleCards]);

  // Build stat items with live data
  const statItems: StatItem[] = data ? visibleCards.map(stat => {
    const liveValue = getValue(data, stat.id as keyof SummaryData);
    return {
      ...stat,
      value: liveValue,
      trend: stat.id === 'criticalIncidents' 
        ? ((liveValue ?? 0) > 0 ? 'up' : 'down')
        : stat.id === 'pendingChanges'
          ? ((liveValue ?? 0) > 5 ? 'up' : 'down')
          : stat.id === 'expiringLicenses'
            ? ((liveValue ?? 0) > 3 ? 'up' : 'down')
            : stat.trend,
      trendValue: stat.id === 'criticalIncidents'
        ? ((liveValue ?? 0) > 0 ? `${liveValue}` : 'Clear')
        : stat.id === 'pendingChanges'
          ? ((liveValue ?? 0) > 5 ? 'High' : 'Normal')
          : stat.id === 'expiringLicenses'
            ? ((liveValue ?? 0) > 0 ? `${liveValue}` : '0')
            : getTrendValue(data, stat.id as keyof SummaryData) || stat.trendValue,
      status: stat.id === 'criticalIncidents'
        ? ((liveValue ?? 0) > 0 ? 'red' : 'green')
        : stat.id === 'pendingChanges'
          ? ((liveValue ?? 0) > 5 ? 'orange' : 'default')
          : stat.id === 'expiringLicenses'
            ? ((liveValue ?? 0) > 3 ? 'orange' : 'default')
            : stat.status,
      description: stat.id === 'criticalIncidents'
        ? ((liveValue ?? 0) > 0 ? 'Immediate attention required' : 'No critical incidents')
        : stat.description
    };
  }) : [];

  if (loading) {
    return (
      <DashboardKPIGrid>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <DashboardKPICardSkeleton key={i} />
        ))}
      </DashboardKPIGrid>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 text-center">
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={fetchSummary} className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <DashboardKPIGrid>
      {statItems.map((stat) => {
        const displayValue = animatedValues[stat.id] ?? stat.value;
        
        return (
          <DashboardKPICard
            key={stat.id}
            icon={stat.icon}
            title={stat.label}
            value={formatValue(displayValue)}
            description={stat.description}
            trend={stat.trendValue}
            trendDirection={stat.trend}
            status={stat.status}
            viewPath={stat.viewPath}
            onClick={() => stat.viewPath && navigate(stat.viewPath)}
            className="hover:shadow-purple-200/50"
          />
        );
      })}
    </DashboardKPIGrid>
  );
}

// Skeleton loader
export function SummaryCardsSkeleton() {
  return (
    <DashboardKPIGrid>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <DashboardKPICardSkeleton key={i} />
      ))}
    </DashboardKPIGrid>
  );
}
