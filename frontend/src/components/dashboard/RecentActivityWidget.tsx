import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface RecentActivityWidgetProps {
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'incident' | 'problem' | 'change' | 'compliance';
  title: string;
  reference: string;
  status?: string;
  createdAt: string;
  createdBy?: string;
}

interface RecentActivityData {
  incidents: ActivityItem[];
  complianceDocuments: ActivityItem[];
}

const defaultActivity: RecentActivityData = {
  incidents: [],
  complianceDocuments: []
};

export function RecentActivityWidget({ className = '' }: RecentActivityWidgetProps) {
  const [activityData, setActivityData] = useState<RecentActivityData>(defaultActivity);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await api.get('/dashboard/recent-activity');
        setActivityData(response.data);
      } catch {
        // Fallback to fetching recent incidents
        try {
          const incidentsResponse = await api.get('/generic/incidents?limit=5&sort=createdAt:desc');
          const complianceResponse = await api.get('/compliance?limit=5');
          
          const incidents: ActivityItem[] = (incidentsResponse.data.records || []).map((item: { id: string; incidentNo: string; title: string; status: string; createdAt: string; createdBy?: string }) => ({
            id: item.id,
            type: 'incident' as const,
            title: item.title,
            reference: item.incidentNo,
            status: item.status,
            createdAt: item.createdAt,
            createdBy: item.createdBy
          }));

          const complianceDocuments: ActivityItem[] = (complianceResponse.data.records || []).map((item: { id: string; fileName: string; createdAt: string; uploadedBy?: string }) => ({
            id: item.id,
            type: 'compliance' as const,
            title: item.fileName,
            reference: item.id,
            createdAt: item.createdAt,
            createdBy: item.uploadedBy
          }));

          setActivityData({ incidents, complianceDocuments });
        } catch {
          // Keep empty state if all APIs fail
          setActivityData(defaultActivity);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'incident':
        return '🚨';
      case 'problem':
        return '⚠️';
      case 'change':
        return '🔄';
      case 'compliance':
        return '📋';
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
      default:
        return '/';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status?: string) => {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'OPEN':
      case 'NEW':
        return 'pill medium';
      case 'IN_PROGRESS':
        return 'pill high';
      case 'CLOSED':
      case 'RESOLVED':
        return 'pill low';
      default:
        return 'pill medium';
    }
  };

  // Combine and sort activities by date
  const allActivities = [
    ...activityData.incidents.map(item => ({ ...item, sortDate: new Date(item.createdAt) })),
    ...activityData.complianceDocuments.map(item => ({ ...item, sortDate: new Date(item.createdAt) }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()).slice(0, 6);

  if (loading) {
    return (
      <div className={`recent-activity-widget ${className}`}>
        <h2 className="widget-title">Recent Activity</h2>
        <div className="activity-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`recent-activity-widget ${className}`}>
      <div className="widget-header">
        <h2 className="widget-title">Recent Activity</h2>
      </div>
      {allActivities.length === 0 ? (
        <div className="activity-empty">
          <p>No recent activity to display.</p>
        </div>
      ) : (
        <div className="activity-list">
          {allActivities.map((activity) => (
            <div
              key={activity.id}
              className="activity-item"
              onClick={() => navigate(getActivityPath(activity.type))}
            >
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-content">
                <div className="activity-main">
                  <span className="activity-title">{activity.title}</span>
                  {activity.status && (
                    <span className={getStatusClass(activity.status)}>{activity.status}</span>
                  )}
                </div>
                <div className="activity-meta">
                  <span className="activity-type">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                  <span className="activity-date">{formatDate(activity.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
