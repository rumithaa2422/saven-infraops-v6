import { useEffect, useState, useCallback } from 'react';
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
  assignedTickets: number;
  requestedTickets: number;
  userName?: string;
}

const defaultTasks: MyTasksData = {
  openIncidents: 0,
  pendingChanges: 0,
  pendingAccessRequests: 0,
  openProblems: 0,
  assignedTickets: 0,
  requestedTickets: 0
};

interface TaskItem {
  label: string;
  value: number;
  icon: string;
  color: string;
  permission?: string;
  show?: boolean;
}

export function MyTasksWidget({ className = '' }: MyTasksWidgetProps) {
  const { hasPermission, user } = useAuth();
  const [tasksData, setTasksData] = useState<MyTasksData>(defaultTasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/my-tasks');
      setTasksData(response.data);
    } catch (err) {
      console.error('Failed to fetch my tasks:', err);
      setError('Unable to load your tasks');
      setTasksData(defaultTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const taskItems: TaskItem[] = [
    {
      label: 'Assigned Tickets',
      value: tasksData.assignedTickets,
      icon: '🎫',
      color: 'info',
      permission: 'tickets:view',
      show: true
    },
    {
      label: 'Open Incidents',
      value: tasksData.openIncidents,
      icon: '🚨',
      color: 'danger',
      permission: 'incidents:view',
      show: true
    },
    {
      label: 'Pending Changes',
      value: tasksData.pendingChanges,
      icon: '🔄',
      color: 'warning',
      permission: 'changes:view',
      show: true
    },
    {
      label: 'Access Requests',
      value: tasksData.pendingAccessRequests,
      icon: '🔐',
      color: 'info',
      permission: 'access:view',
      show: true
    },
    {
      label: 'Open Problems',
      value: tasksData.openProblems,
      icon: '⚠️',
      color: 'success',
      permission: 'problems:view',
      show: true
    }
  ];

  // Filter visible items based on permissions
  const visibleTasks = taskItems.filter(task => 
    task.show && (!task.permission || hasPermission(task.permission))
  );

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={`my-tasks-widget ${className}`}>
        <h2 className="widget-title">My Tasks</h2>
        <div className="tasks-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="task-item task-item--skeleton">
              <div className="task-icon skeleton-icon"></div>
              <div className="task-content">
                <div className="skeleton-value"></div>
                <div className="skeleton-label"></div>
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
      <div className={`my-tasks-widget ${className}`}>
        <h2 className="widget-title">My Tasks</h2>
        <div className="tasks-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button onClick={fetchMyTasks} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no tasks
  if (visibleTasks.length === 0) {
    return (
      <div className={`my-tasks-widget ${className}`}>
        <h2 className="widget-title">My Tasks</h2>
        <div className="tasks-empty">
          <div className="empty-icon">✅</div>
          <p>No pending tasks</p>
          <span className="empty-hint">You're all caught up!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-tasks-widget ${className}`}>
      <h2 className="widget-title">
        My Tasks
        {tasksData.userName && (
          <span className="widget-subtitle">for {tasksData.userName}</span>
        )}
      </h2>
      <div className="tasks-list">
        {visibleTasks.map((task, index) => (
          <div key={index} className={`task-item task-item--${task.color}`}>
            <div className="task-icon">{task.icon}</div>
            <div className="task-content">
              <span className="task-value">{task.value}</span>
              <span className="task-label">{task.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
