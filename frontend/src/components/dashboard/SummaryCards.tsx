import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { Ticket, AlertTriangle, Package, Users, Clock } from 'lucide-react';
import { DashboardKPICard, DashboardKPICardSkeleton, DashboardKPIGrid } from '../common/DashboardKPICard';
import type { KPIStatus } from '../common/DashboardKPICard';

interface SummaryData {
  openTickets: number;
  criticalIncidents: number;
  totalAssets: number;
  totalUsers: number;
  pendingChanges: number;
  expiringLicenses: number;
  highPriorityTickets: number;
  openIncidents: number;
}

interface StatItem {
  id: string;
  label: string;
  value: number;
  icon: typeof Ticket;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status: KPIStatus;
  description?: string;
}

export function SummaryCards() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

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

    const animateValue = (key: string, target: number) => {
      let current = 0;
      const increment = target / steps;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedValues(prev => ({ ...prev, [key]: Math.round(current) }));
      }, interval);
    };

    statItems.forEach(item => {
      const value = (data as any)[item.id] || 0;
      animateValue(item.id, value);
    });
  }, [data]);

  const statItems: StatItem[] = data ? [
    {
      id: 'openTickets',
      label: 'Open Tickets',
      value: data.openTickets,
      icon: Ticket,
      trend: data.openTickets > 10 ? 'up' : 'neutral',
      trendValue: '+12%',
      status: 'purple'
    },
    {
      id: 'criticalIncidents',
      label: 'Critical Incidents',
      value: data.criticalIncidents,
      icon: AlertTriangle,
      trend: data.criticalIncidents > 0 ? 'up' : 'neutral',
      trendValue: data.criticalIncidents > 0 ? 'Active' : 'Clear',
      status: data.criticalIncidents > 0 ? 'red' : 'green'
    },
    {
      id: 'totalAssets',
      label: 'Total Assets',
      value: data.totalAssets,
      icon: Package,
      trend: 'up',
      trendValue: '+5%',
      status: 'blue'
    },
    {
      id: 'totalUsers',
      label: 'Active Users',
      value: data.totalUsers,
      icon: Users,
      trend: 'up',
      trendValue: '+3%',
      status: 'purple'
    },
    {
      id: 'pendingChanges',
      label: 'Pending Changes',
      value: data.pendingChanges,
      icon: Clock,
      trend: data.pendingChanges > 5 ? 'up' : 'neutral',
      trendValue: data.pendingChanges > 5 ? 'High' : 'Normal',
      status: data.pendingChanges > 5 ? 'orange' : 'default'
    },
    {
      id: 'expiringLicenses',
      label: 'Expiring Licenses',
      value: data.expiringLicenses,
      icon: Package,
      trend: data.expiringLicenses > 3 ? 'up' : 'neutral',
      trendValue: data.expiringLicenses > 0 ? `${data.expiringLicenses} soon` : 'All good',
      status: data.expiringLicenses > 3 ? 'orange' : 'default'
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
      {statItems.map((stat, index) => {
        const displayValue = animatedValues[stat.id] ?? stat.value;
        
        return (
          <DashboardKPICard
            key={stat.id}
            icon={stat.icon}
            title={stat.label}
            value={displayValue}
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
