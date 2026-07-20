import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { LucideIcon, Ticket, AlertTriangle, Package, Users, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant: 'default' | 'warning' | 'danger' | 'success';
  color: string;
  bgColor: string;
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
      variant: 'default',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'criticalIncidents',
      label: 'Critical Incidents',
      value: data.criticalIncidents,
      icon: AlertTriangle,
      trend: data.criticalIncidents > 0 ? 'up' : 'neutral',
      trendValue: data.criticalIncidents > 0 ? 'Active' : 'Clear',
      variant: data.criticalIncidents > 0 ? 'danger' : 'success',
      color: data.criticalIncidents > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: data.criticalIncidents > 0 ? 'bg-red-50' : 'bg-emerald-50'
    },
    {
      id: 'totalAssets',
      label: 'Total Assets',
      value: data.totalAssets,
      icon: Package,
      trend: 'up',
      trendValue: '+5%',
      variant: 'success',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'totalUsers',
      label: 'Active Users',
      value: data.totalUsers,
      icon: Users,
      trend: 'up',
      trendValue: '+3%',
      variant: 'success',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'pendingChanges',
      label: 'Pending Changes',
      value: data.pendingChanges,
      icon: Clock,
      trend: data.pendingChanges > 5 ? 'up' : 'neutral',
      trendValue: data.pendingChanges > 5 ? 'High' : 'Normal',
      variant: data.pendingChanges > 5 ? 'warning' : 'default',
      color: data.pendingChanges > 5 ? 'text-amber-600' : 'text-slate-600',
      bgColor: data.pendingChanges > 5 ? 'bg-amber-50' : 'bg-slate-50'
    },
    {
      id: 'expiringLicenses',
      label: 'Expiring Licenses',
      value: data.expiringLicenses,
      icon: Package,
      trend: data.expiringLicenses > 3 ? 'up' : 'neutral',
      trendValue: data.expiringLicenses > 0 ? `${data.expiringLicenses} soon` : 'All good',
      variant: data.expiringLicenses > 3 ? 'warning' : 'default',
      color: data.expiringLicenses > 3 ? 'text-amber-600' : 'text-slate-600',
      bgColor: data.expiringLicenses > 3 ? 'bg-amber-50' : 'bg-slate-50'
    }
  ] : [];

  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100" />
              <div className="w-16 h-5 rounded-full bg-slate-100" />
            </div>
            <div className="h-8 w-20 bg-slate-100 rounded-lg mb-2" />
            <div className="h-4 w-24 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 text-center">
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={fetchSummary} className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        const displayValue = animatedValues[stat.id] ?? stat.value;
        
        return (
          <div
            key={stat.id}
            className="group bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.trendValue && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.variant === 'danger' ? 'bg-red-50 text-red-600' :
                  stat.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  stat.variant === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  <TrendIcon trend={stat.trend} />
                  <span>{stat.trendValue}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                {displayValue.toLocaleString()}
              </h3>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Skeleton loader
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100" />
            <div className="w-16 h-5 rounded-full bg-slate-100" />
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded-lg mb-2" />
          <div className="h-4 w-24 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  );
}
