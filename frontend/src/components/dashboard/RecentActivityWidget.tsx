import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export type ActivityItem = {
  id: string;
  type: 'incident' | 'compliance';
  title: string;
  reference: string;
  status: string;
  createdAt: string;
  icon: string;
};

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        const [incidentsRes, complianceRes] = await Promise.all([
          api.get('/incidents').catch(() => ({ data: { items: [] } })),
          api.get('/compliance').catch(() => ({ data: { items: [] } }))
        ]);

        const recentIncidents: ActivityItem[] = (incidentsRes.data.items || [])
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            type: 'incident' as const,
            title: item.title,
            reference: item.incidentNo,
            status: item.status,
            createdAt: item.createdAt,
            icon: 'IN'
          }));

        const recentCompliance: ActivityItem[] = (complianceRes.data.items || [])
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            type: 'compliance' as const,
            title: item.title,
            reference: item.controlNo,
            status: item.status,
            createdAt: item.createdAt,
            icon: 'CO'
          }));

        // Combine and sort by createdAt
        const combined = [...recentIncidents, ...recentCompliance]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);

        setActivities(combined);
      } catch {
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentActivity();
  }, []);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'RESOLVED':
      case 'CLOSED':
        return 'status-resolved';
      case 'PENDING_APPROVAL':
        return 'status-pending';
      default:
        return 'status-default';
    }
  }

  function handleActivityClick(activity: ActivityItem) {
    navigate(activity.type === 'incident' ? '/incidents' : '/compliance');
  }

  if (isLoading) {
    return (
      <section className="activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-loading">Loading recent activity...</div>
      </section>
    );
  }

  return (
    <section className="activity-section">
      <h3 className="section-title">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="activity-empty">No recent activity to display.</div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <div
              key={`${activity.type}-${activity.id}`}
              className="activity-item"
              onClick={() => handleActivityClick(activity)}
            >
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-content">
                <span className="activity-title">{activity.title}</span>
                <span className="activity-meta">
                  <span className="activity-ref">{activity.reference}</span>
                  <span className="activity-date">{formatDate(activity.createdAt)}</span>
                </span>
              </div>
              <span className={`activity-status ${getStatusClass(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
