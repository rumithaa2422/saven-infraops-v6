import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
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
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status: KPIStatus;
  description: string;
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

export function SummaryCards() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number | null>>({});

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

    statItems.forEach(item => {
      const value = getValue(data, item.id as keyof SummaryData);
      animateValue(item.id, value);
    });
  }, [data]);

  const statItems: StatItem[] = data ? [
    {
      id: 'openTickets',
      label: 'Open Tickets',
      value: getValue(data, 'openTickets'),
      icon: Ticket,
      trend: 'up',
      trendValue: getTrendValue(data, 'openTickets') || '+12%',
      status: 'purple',
      description: 'Tickets awaiting action'
    },
    {
      id: 'criticalIncidents',
      label: 'Critical Incidents',
      value: getValue(data, 'criticalIncidents'),
      icon: AlertOctagon,
      trend: (getValue(data, 'criticalIncidents') ?? 0) > 0 ? 'up' : 'down',
      trendValue: (getValue(data, 'criticalIncidents') ?? 0) > 0 
        ? `${getValue(data, 'criticalIncidents')}` 
        : 'Clear',
      status: (getValue(data, 'criticalIncidents') ?? 0) > 0 ? 'red' : 'green',
      description: (getValue(data, 'criticalIncidents') ?? 0) > 0 
        ? 'Immediate attention required' 
        : 'No critical incidents'
    },
    {
      id: 'totalAssets',
      label: 'Total Assets',
      value: getValue(data, 'totalAssets'),
      icon: HardDrive,
      trend: 'up',
      trendValue: getTrendValue(data, 'totalAssets') || '+5%',
      status: 'blue',
      description: 'Assets currently managed'
    },
    {
      id: 'totalUsers',
      label: 'Active Users',
      value: getValue(data, 'totalUsers'),
      icon: UserCheck,
      trend: 'up',
      trendValue: getTrendValue(data, 'totalUsers') || '+3%',
      status: 'purple',
      description: 'Users with system access'
    },
    {
      id: 'pendingChanges',
      label: 'Pending Changes',
      value: getValue(data, 'pendingChanges'),
      icon: FileClock,
      trend: (getValue(data, 'pendingChanges') ?? 0) > 5 ? 'up' : 'down',
      trendValue: (getValue(data, 'pendingChanges') ?? 0) > 5 ? 'High' : 'Normal',
      status: (getValue(data, 'pendingChanges') ?? 0) > 5 ? 'orange' : 'default',
      description: 'Awaiting approval'
    },
    {
      id: 'expiringLicenses',
      label: 'Expiring Licenses',
      value: getValue(data, 'expiringLicenses'),
      icon: CalendarClock,
      trend: (getValue(data, 'expiringLicenses') ?? 0) > 3 ? 'up' : 'down',
      trendValue: (getValue(data, 'expiringLicenses') ?? 0) > 0 
        ? `${getValue(data, 'expiringLicenses')}` 
        : '0',
      status: (getValue(data, 'expiringLicenses') ?? 0) > 3 ? 'orange' : 'default',
      description: 'Renewal required soon'
    }
  ] : [];

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
