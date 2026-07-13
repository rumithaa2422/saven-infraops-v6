import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

interface MyTasksWidgetProps {
  className?: string;
}

interface MyTasksData {
  openIncidents: number;
  pendingChanges: number;
  pendingAccessRequests: number;
  complianceReviews: number;
}

const defaultTasks: MyTasksData = {
  openIncidents: 0,
  pendingChanges: 0,
  pendingAccessRequests: 0,
  complianceReviews: 0
};

export function MyTasksWidget({ className = '' }: MyTasksWidgetProps) {
  const { user, hasPermission } = useAuth();
  const [tasksData, setTasksData] = useState<MyTasksData>(defaultTasks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const response = await api.get('/dashboard/my-tasks');
        setTasksData(response.data);
      } catch {
        // Fallback: try to fetch from summary and combine with user-specific queries
        try {
          const [incidentsRes, changesRes, accessRes] = await Promise.all([
            hasPermission('incidents:view') ? api.get('/generic/incidents', { params: { ownerName: user?.name, status: 'OPEN', limit: 100 } }) : Promise.resolve({ data: { total: 0 } }),
            hasPermission('changes:view') ? api.get('/generic/changes', { params: { ownerName: user?.name, limit: 100 } }) : Promise.resolve({ data: { total: 0 } }),
            hasPermission('access:view') ? api.get('/generic/access-management', { params: { requesterName: user?.name, status: 'REQUESTED', limit: 100 } }) : Promise.resolve({ data: { total: 0 } })
          ]);

          setTasksData({
            openIncidents: incidentsRes.data.total || 0,
            pendingChanges: changesRes.data.total || 0,
            pendingAccessRequests: accessRes.data.total || 0,
            complianceReviews: 0 // Would need specific API for compliance reviews
          });
        } catch {
          setTasksData(defaultTasks);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user?.name, hasPermission]);

  const taskItems = [
    {
      label: 'Open Incidents',
      value: tasksData.openIncidents,
      icon: '🚨',
      color: 'danger',
      permission: 'incidents:view'
    },
    {
      label: 'Pending Changes',
      value: tasksData.pendingChanges,
      icon: '🔄',
      color: 'warning',
      permission: 'changes:view'
    },
    {
      label: 'Pending Access Requests',
      value: tasksData.pendingAccessRequests,
      icon: '🔐',
      color: 'info',
      permission: 'access:view'
    },
    {
      label: 'Compliance Reviews',
      value: tasksData.complianceReviews,
      icon: '📋',
      color: 'success',
      permission: 'compliance:view'
    }
  ];

  if (loading) {
    return (
      <div className={`my-tasks-widget ${className}`}>
        <h2 className="widget-title">My Tasks</h2>
        <div className="tasks-loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className={`my-tasks-widget ${className}`}>
      <h2 className="widget-title">My Tasks</h2>
      <div className="tasks-list">
        {taskItems.map((task, index) => {
          // Skip items user doesn't have permission to view
          if (task.permission && !hasPermission(task.permission)) {
            return null;
          }
          return (
            <div key={index} className={`task-item task-item--${task.color}`}>
              <div className="task-icon">{task.icon}</div>
              <div className="task-content">
                <span className="task-value">{task.value}</span>
                <span className="task-label">{task.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
