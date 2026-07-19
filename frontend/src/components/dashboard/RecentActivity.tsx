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
  Clock
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

const typeColors: Record<string, string> = {
  incident: 'bg-red-100 text-red-600',
  ticket: 'bg-blue-100 text-blue-600',
  change: 'bg-amber-100 text-amber-600',
  access: 'bg-purple-100 text-purple-600',
  compliance: 'bg-emerald-100 text-emerald-600',
  problem: 'bg-orange-100 text-orange-600'
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
      OPEN: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      ASSIGNED: 'bg-purple-100 text-purple-700',
      RESOLVED: 'bg-emerald-100 text-emerald-700',
      CLOSED: 'bg-slate-100 text-slate-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
      SEV1: 'bg-red-100 text-red-700',
      SEV2: 'bg-orange-100 text-orange-700'
    };
    const colorClass = statusColors[status.toUpperCase()] || 'bg-slate-100 text-slate-600';
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colorClass}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
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
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchActivity}
            className="mt-2 text-sm text-brand-600 hover:text-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // PART 1: Filter activities based on user permissions
  // Only show activities that user has permission to view
  const filteredActivities = useMemo(() => {
    const activities: ActivityItem[] = [];
    
    // Add activities only if user has permission
    if (hasPermission('incidents:view')) {
      activities.push(...(activityData?.incidents || []));
    }
    if (hasPermission('problems:view')) {
      activities.push(...(activityData?.problems || []));
    }
    if (hasPermission('changes:view')) {
      activities.push(...(activityData?.changes || []));
    }
    if (hasPermission('compliance:view')) {
      activities.push(...(activityData?.complianceDocuments || []));
    }
    if (hasPermission('access:view')) {
      activities.push(...(activityData?.accessRequests || []));
    }
    if (hasPermission('tickets:view')) {
      activities.push(...(activityData?.serviceRequests || []));
    }
    
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [activityData, hasPermission]);

  // Combine all activities and sort by date
  const allActivities: ActivityItem[] = filteredActivities;

  if (allActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No recent activity</p>
          <p className="text-xs text-slate-400 mt-1">Activity will appear here as events occur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
        <span className="text-xs text-slate-400">Live</span>
      </div>
      <div className="space-y-1">
        {allActivities.map((activity, index) => {
          const Icon = typeIcons[activity.type] || Ticket;
          const colorClass = typeColors[activity.type] || 'bg-slate-100 text-slate-600';
          return (
            <button
              key={`${activity.type}-${activity.id}-${index}`}
              onClick={() => navigate(getActivityPath(activity.type))}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className={`p-1.5 rounded-full ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {activity.title || activity.reference}
                  </span>
                  {getStatusBadge(activity.status)}
                  {activity.severity && getStatusBadge(activity.severity)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="uppercase">{activity.type}</span>
                  <span>•</span>
                  <span>{activity.reference}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(activity.createdAt)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
