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
  CheckCircle,
  TrendingUp,
  Eye
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SummaryData {
  // Tickets
  openTickets: number;
  unassignedTickets: number;
  highPriorityTickets: number;
  // Incidents
  totalIncidents: number;
  criticalIncidents: number;
  sev2Incidents: number;
  openIncidents: number;
  // Inventory
  totalAssets: number;
  availableAssets: number;
  // Vendors
  totalVendors: number;
  expiringLicenses: number;
  // Knowledge Base
  totalKnowledgeBase: number;
  // Projects
  totalProjects: number;
  // Compliance
  complianceDocuments: number;
  // Users
  totalUsers: number;
  // Changes
  pendingChanges: number;
}

interface ModuleCard {
  id: string;
  title: string;
  icon: LucideIcon;
  permission: string;
  path: string;
  stats: {
    label: string;
    value: number;
    icon?: LucideIcon;
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
      stats: [
        { label: 'Open', value: summaryData?.openTickets || 0 },
        { label: 'High Priority', value: summaryData?.highPriorityTickets || 0, variant: 'warning' },
        { label: 'Unassigned', value: summaryData?.unassignedTickets || 0, variant: 'default' }
      ]
    },
    {
      id: 'incidents',
      title: 'Incidents',
      icon: AlertTriangle,
      permission: 'incidents:view',
      path: '/incidents',
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
      stats: [
        { label: 'Pending', value: summaryData?.pendingChanges || 0 }
      ]
    }
  ];

  const visibleModules = moduleCards.filter(card => hasPermission(card.permission));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Module Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Module Overview</h2>
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchSummary}
            className="mt-2 text-sm text-brand-600 hover:text-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Module Overview</h2>
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          View Reports
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModules.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="text-left rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-brand-100 transition-colors">
                  <Icon className="w-5 h-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </div>
                <h3 className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                  {card.title}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {card.stats.map((stat, idx) => {
                  const StatIcon = stat.icon;
                  const variantStyles = {
                    default: 'text-slate-600',
                    warning: 'text-amber-600',
                    danger: 'text-red-600',
                    success: 'text-emerald-600'
                  };
                  return (
                    <div key={idx} className="text-center p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        {StatIcon && <StatIcon className="w-3 h-3 text-slate-400" />}
                        <span className={`text-lg font-semibold ${variantStyles[stat.variant || 'default']}`}>
                          {stat.value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
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
