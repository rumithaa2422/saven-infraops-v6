import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Ticket,
  AlertTriangle,
  GitBranch,
  Key,
  Shield,
  Package,
  Clock,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'incident' | 'problem' | 'change' | 'compliance' | 'access' | 'ticket';
  title: string;
  reference: string;
  status?: string;
  severity?: string;
  riskLevel?: string;
  priority?: string;
  createdAt: string;
  createdBy?: string;
  assignedTo?: string;
}

interface ActivityData {
  incidents: ActivityItem[];
  problems: ActivityItem[];
  changes: ActivityItem[];
  complianceDocuments: ActivityItem[];
  accessRequests: ActivityItem[];
  serviceRequests: ActivityItem[];
}

const typeIcons: Record<string, typeof Ticket> = {
  incident: AlertTriangle,
  ticket: Ticket,
  change: GitBranch,
  access: Key,
  compliance: Shield,
  problem: Package
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  incident: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  ticket: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  change: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  access: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  compliance: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  problem: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }
};

// Permission requirements for each activity type
const activityTypePermissions: Record<string, string> = {
  incident: 'incidents:view',
  ticket: 'tickets:view',
  change: 'changes:view',
  access: 'access:view',
  compliance: 'compliance:view',
  problem: 'problems:view'
};

export function RecentActivity() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/recent-activity');
      setActivityData(response.data);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setError('Unable to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredActivities = useMemo(() => {
    if (!activityData) return [];
    
    const activities: ActivityItem[] = [];
    
    if (hasPermission('incidents:view')) {
      activities.push(...activityData.incidents);
    }
    if (hasPermission('problems:view')) {
      activities.push(...activityData.problems);
    }
    if (hasPermission('changes:view')) {
      activities.push(...activityData.changes);
    }
    if (hasPermission('compliance:view')) {
      activities.push(...activityData.complianceDocuments);
    }
    if (hasPermission('access:view')) {
      activities.push(...activityData.accessRequests);
    }
    if (hasPermission('tickets:view')) {
      activities.push(...activityData.serviceRequests);
    }
    
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [activityData, hasPermission]);

  const getActivityPath = (type: ActivityItem['type']) => {
    switch (type) {
      case 'incident': return '/incidents';
      case 'ticket': return '/service-requests';
      case 'change': return '/changes';
      case 'access': return '/access-management';
      case 'compliance': return '/compliance';
      case 'problem': return '/problems';
      default: return '/';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      ASSIGNED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      CLOSED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      SEV1: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      SEV2: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
    };
    const colorClass = statusColors[status.toUpperCase()] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50">
              <Activity className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">Latest updates across all modules</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50">
              <Activity className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">Latest updates across all modules</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchActivity}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50">
              <Activity className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">Latest updates across all modules</p>
            </div>
          </div>
        </div>
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-700">No recent activity</p>
          <p className="text-xs text-slate-400 mt-1">Activity will appear here as events occur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm shadow-brand-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <p className="text-sm text-slate-500">Latest updates across all modules</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-200 via-brand-300 to-slate-200" />

        <div className="space-y-4">
          {filteredActivities.map((activity, index) => {
            const Icon = typeIcons[activity.type] || Ticket;
            const colors = typeColors[activity.type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
            return (
              <button
                key={`${activity.type}-${activity.id}-${index}`}
                onClick={() => navigate(getActivityPath(activity.type))}
                className="relative flex items-start gap-4 w-full text-left group"
              >
                {/* Timeline dot */}
                <div className={`relative z-10 w-10 h-10 rounded-xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                      {activity.title || activity.reference}
                    </span>
                    {getStatusBadge(activity.status)}
                    {activity.severity && getStatusBadge(activity.severity)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="uppercase font-medium">{activity.type}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{activity.reference}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                  <ArrowRight className="w-4 h-4 text-brand-500" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
