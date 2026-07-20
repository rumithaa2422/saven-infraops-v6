import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api';
import {
  Ticket,
  AlertTriangle,
  Package,
  Building2,
  BookOpen,
  Shield,
  FolderKanban,
  Users,
  FileText,
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SummaryData {
  openTickets: number;
  unassignedTickets: number;
  highPriorityTickets: number;
  totalIncidents: number;
  criticalIncidents: number;
  sev2Incidents: number;
  openIncidents: number;
  totalAssets: number;
  availableAssets: number;
  totalVendors: number;
  expiringLicenses: number;
  totalKnowledgeBase: number;
  totalProjects: number;
  complianceDocuments: number;
  totalUsers: number;
  pendingChanges: number;
}

interface ModuleCard {
  id: string;
  title: string;
  icon: LucideIcon;
  permission: string;
  path: string;
  color: string;
  bgColor: string;
  stats: {
    label: string;
    value: number;
    variant?: 'default' | 'warning' | 'danger' | 'success';
  }[];
}

export function ModuleOverview() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/summary');
      setSummaryData(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError('Unable to load module data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const moduleCards: ModuleCard[] = [
    {
      id: 'tickets',
      title: 'Service Requests',
      icon: Ticket,
      permission: 'tickets:view',
      path: '/service-requests',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: [
        { label: 'Open', value: summaryData?.openTickets || 0 },
        { label: 'High Priority', value: summaryData?.highPriorityTickets || 0, variant: 'warning' },
        { label: 'Unassigned', value: summaryData?.unassignedTickets || 0 }
      ]
    },
    {
      id: 'incidents',
      title: 'Incidents',
      icon: AlertTriangle,
      permission: 'incidents:view',
      path: '/incidents',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      stats: [
        { label: 'Open', value: summaryData?.openIncidents || 0 },
        { label: 'Critical', value: summaryData?.criticalIncidents || 0, variant: 'danger' },
        { label: 'SEV2', value: summaryData?.sev2Incidents || 0, variant: 'warning' }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: Package,
      permission: 'inventory:view',
      path: '/inventory',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      stats: [
        { label: 'Total', value: summaryData?.totalAssets || 0 },
        { label: 'Available', value: summaryData?.availableAssets || 0, variant: 'success' }
      ]
    },
    {
      id: 'knowledge-base',
      title: 'Knowledge Base',
      icon: BookOpen,
      permission: 'kb:view',
      path: '/knowledge-base',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      stats: [
        { label: 'Articles', value: summaryData?.totalKnowledgeBase || 0 }
      ]
    },
    {
      id: 'vendors',
      title: 'Vendors',
      icon: Building2,
      permission: 'vendors:view',
      path: '/vendors-licenses',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      stats: [
        { label: 'Vendors', value: summaryData?.totalVendors || 0 },
        { label: 'Expiring', value: summaryData?.expiringLicenses || 0, variant: 'warning' }
      ]
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: FolderKanban,
      permission: 'projects:view',
      path: '/projects-environments',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      stats: [
        { label: 'Projects', value: summaryData?.totalProjects || 0 }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance',
      icon: Shield,
      permission: 'compliance:view',
      path: '/compliance',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      stats: [
        { label: 'Documents', value: summaryData?.complianceDocuments || 0 }
      ]
    },
    {
      id: 'users',
      title: 'Users',
      icon: Users,
      permission: 'users:view',
      path: '/users-teams',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      stats: [
        { label: 'Users', value: summaryData?.totalUsers || 0 }
      ]
    },
    {
      id: 'changes',
      title: 'Changes',
      icon: Clock,
      permission: 'changes:view',
      path: '/changes',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      stats: [
        { label: 'Pending', value: summaryData?.pendingChanges || 0 }
      ]
    }
  ];

  const visibleModules = moduleCards.filter(card => hasPermission(card.permission));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50">
              <BarChart3 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Module Overview</h2>
              <p className="text-sm text-slate-500">Performance metrics across all modules</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-36 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchSummary}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm shadow-brand-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Module Overview</h2>
            <p className="text-sm text-slate-500">Performance metrics across all modules</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-sm font-semibold transition-all duration-200"
        >
          <FileText className="w-4 h-4" />
          View Reports
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModules.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="text-left rounded-2xl border border-slate-200/60 p-5 hover:border-brand-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {card.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              
              <div className="flex items-end gap-4">
                {card.stats.map((stat, idx) => {
                  const variantStyles = {
                    default: 'text-slate-700',
                    warning: 'text-amber-600',
                    danger: 'text-red-600',
                    success: 'text-emerald-600'
                  };
                  const subVariantStyles = {
                    default: 'text-slate-500',
                    warning: 'text-amber-500',
                    danger: 'text-red-500',
                    success: 'text-emerald-500'
                  };
                  return (
                    <div key={idx} className="flex-1">
                      <div className={`text-2xl font-bold ${variantStyles[stat.variant || 'default']}`}>
                        {stat.value}
                      </div>
                      <div className={`text-xs font-medium ${subVariantStyles[stat.variant || 'default']} mt-0.5`}>
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
