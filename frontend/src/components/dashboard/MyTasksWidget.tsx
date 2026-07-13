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
  openProblems: number;
}

const defaultTasks: MyTasksData = {
  openIncidents: 0,
  pendingChanges: 0,
  pendingAccessRequests: 0,
  openProblems: 0
};

export function MyTasksWidget({ className = '' }: MyTasksWidgetProps) {
  const { hasPermission } = useAuth();
  const [tasksData, setTasksData] = useState<MyTasksData>(defaultTasks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const response = await api.get('/dashboard/my-tasks');
        setTasksData(response.data);
      } catch {
        // Use default values if API fails
        setTasksData(defaultTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

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
      label: 'Access Requests',
      value: tasksData.pendingAccessRequests,
      icon: '🔐',
      color: 'info',
      permission: 'access:view'
    },
    {
      label: 'Open Problems',
      value: tasksData.openProblems,
      icon: '⚠️',
      color: 'success',
      permission: 'problems:view'
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
