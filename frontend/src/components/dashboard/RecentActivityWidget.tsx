import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface RecentActivityWidgetProps {
  className?: string;
  maxItems?: number;
}

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

interface RecentActivityData {
  incidents: ActivityItem[];
  problems: ActivityItem[];
  changes: ActivityItem[];
  complianceDocuments: ActivityItem[];
  accessRequests: ActivityItem[];
  serviceRequests: ActivityItem[];
}

const defaultActivity: RecentActivityData = {
  incidents: [],
  problems: [],
  changes: [],
  complianceDocuments: [],
  accessRequests: [],
  serviceRequests: []
};

export function RecentActivityWidget({ className = '', maxItems = 8 }: RecentActivityWidgetProps) {
  const [activityData, setActivityData] = useState<RecentActivityData>(defaultActivity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecentActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/recent-activity');
      setActivityData(response.data);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setError('Unable to load activity');
      setActivityData(defaultActivity);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const getActivityIcon = (type: ActivityItem['type'], status?: string) => {
    // Special icons for specific statuses
    if (type === 'incident' && status === 'CLOSED') return '✅';
    if (type === 'change' && status === 'APPROVED') return '👍';
    if (type === 'change' && status === 'REJECTED') return '❌';
    
    switch (type) {
      case 'incident':
        return '🚨';
      case 'problem':
        return '⚠️';
      case 'change':
        return '🔄';
      case 'compliance':
        return '📋';
      case 'access':
        return '🔐';
      case 'ticket':
        return '🎫';
      default:
        return '📌';
    }
  };

  const getActivityPath = (type: ActivityItem['type']) => {
    switch (type) {
      case 'incident':
        return '/incidents';
      case 'problem':
        return '/problems';
      case 'change':
        return '/changes';
      case 'compliance':
        return '/compliance';
      case 'access':
        return '/access-management';
      case 'ticket':
        return '/service-requests';
      default:
        return '/';
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

  const getStatusClass = (status?: string) => {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'OPEN':
      case 'NEW':
      case 'REQUESTED':
        return 'pill medium';
      case 'IN_PROGRESS':
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return 'pill high';
      case 'ASSIGNED':
        return 'pill info';
      case 'CLOSED':
      case 'RESOLVED':
      case 'APPROVED':
      case 'COMPLETED':
      case 'PROVISIONED':
        return 'pill low';
      case 'REJECTED':
      case 'FAILED':
        return 'pill critical';
      default:
        return 'pill medium';
    }
  };

  // Combine all activities into timeline
  const allActivities: (ActivityItem & { sortDate: Date })[] = [
    ...activityData.incidents.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.problems.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.changes.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.complianceDocuments.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.accessRequests.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.serviceRequests.map(item => ({ ...item, sortDate: new Date(item.createdAt) }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()).slice(0, maxItems);

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={`recent-activity-widget ${className}`}>
        <div className="widget-header">
          <h2 className="widget-title">Recent Activity</h2>
        </div>
        <div className="timeline-container">
          <div className="timeline-line"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="timeline-item timeline-item--skeleton">
              <div className="timeline-dot">
                <div className="skeleton-dot"></div>
              </div>
              <div className="timeline-content">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-meta"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <div className={`recent-activity-widget ${className}`}>
        <div className="widget-header">
          <h2 className="widget-title">Recent Activity</h2>
        </div>
        <div className="activity-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button onClick={fetchRecentActivity} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`recent-activity-widget ${className}`}>
      <div className="widget-header">
        <h2 className="widget-title">Recent Activity</h2>
        <span className="timeline-badge">Live</span>
      </div>
      {allActivities.length === 0 ? (
        <div className="activity-empty">
          <div className="empty-icon">📭</div>
          <p>No recent activity to display.</p>
          <span className="empty-hint">Activity will appear here as events occur.</span>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line"></div>
          {allActivities.map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              className="timeline-item"
              onClick={() => navigate(getActivityPath(activity.type))}
              title={`${activity.type}: ${activity.title} (${activity.reference})`}
            >
              <div className="timeline-dot">
                <span className="dot-icon">{getActivityIcon(activity.type, activity.status)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-main">
                  <span className="timeline-title" title={activity.title}>{activity.title}</span>
                  {activity.status && (
                    <span className={getStatusClass(activity.status)}>{activity.status.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <div className="timeline-meta">
                  <span className="timeline-type">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                  <span className="timeline-separator">•</span>
                  <span className="timeline-reference">{activity.reference}</span>
                  <span className="timeline-separator">•</span>
                  <span className="timeline-time">{formatTimeAgo(activity.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
