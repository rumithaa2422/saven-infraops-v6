import { useEffect, useState } from 'react';
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
  createdAt: string;
  createdBy?: string;
  action?: string;
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await api.get('/dashboard/recent-activity-timeline');
        setActivityData(response.data);
      } catch {
        // Fallback to fetching from generic module
        try {
          const [incidentsRes, changesRes, accessRes, complianceRes, ticketsRes] = await Promise.all([
            api.get('/generic/incidents', { params: { limit: 3, sort: 'createdAt:desc' } }),
            api.get('/generic/changes', { params: { limit: 3, sort: 'createdAt:desc' } }),
            api.get('/generic/access-management', { params: { limit: 3, sort: 'createdAt:desc' } }),
            api.get('/compliance', { params: { limit: 3 } }),
            api.get('/generic/service-requests', { params: { limit: 3, sort: 'createdAt:desc' } })
          ]);

          const mapToActivity = (data: unknown[], type: ActivityItem['type'], titleKey: string, refKey: string) => {
            return (data as Array<Record<string, unknown>>).map((item) => ({
              id: String(item.id),
              type,
              title: String(item[titleKey] || ''),
              reference: String(item[refKey] || item.id),
              status: item.status ? String(item.status) : undefined,
              createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
              createdBy: item.createdBy ? String(item.createdBy) : undefined
            }));
          };

          setActivityData({
            incidents: mapToActivity(incidentsRes.data.records || [], 'incident', 'title', 'incidentNo'),
            problems: [],
            changes: mapToActivity(changesRes.data.records || [], 'change', 'title', 'changeNo'),
            complianceDocuments: mapToActivity(complianceRes.data.records || [], 'compliance', 'fileName', 'id'),
            accessRequests: mapToActivity(accessRes.data.records || [], 'access', 'systemName', 'requestNo'),
            serviceRequests: mapToActivity(ticketsRes.data.records || [], 'ticket', 'title', 'requestNo')
          });
        } catch {
          setActivityData(defaultActivity);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getActivityIcon = (type: ActivityItem['type'], status?: string) => {
    // Special icons for specific statuses
    if (type === 'incident' && status === 'CLOSED') return '✅';
    if (type === 'change' && status === 'APPROVED') return '👍';
    
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
        return 'pill high';
      case 'CLOSED':
      case 'RESOLVED':
      case 'APPROVED':
      case 'COMPLETED':
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

  if (loading) {
    return (
      <div className={`recent-activity-widget ${className}`}>
        <div className="widget-header">
          <h2 className="widget-title">Recent Activity</h2>
        </div>
        <div className="activity-loading">Loading timeline...</div>
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
            >
              <div className="timeline-dot">
                <span className="dot-icon">{getActivityIcon(activity.type, activity.status)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-main">
                  <span className="timeline-title">{activity.title}</span>
                  {activity.status && (
                    <span className={getStatusClass(activity.status)}>{activity.status}</span>
                  )}
                </div>
                <div className="timeline-meta">
                  <span className="timeline-type">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                  <span className="timeline-separator">•</span>
                  <span className="timeline-time">{formatTimeAgo(activity.createdAt)}</span>
                  {activity.createdBy && (
                    <>
                      <span className="timeline-separator">•</span>
                      <span className="timeline-user">{activity.createdBy}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
