import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket, AlertTriangle, GitBranch, Key, AlertCircle } from 'lucide-react';

interface MyTasksData {
  openIncidents: number;
  pendingChanges: number;
  pendingAccessRequests: number;
  openProblems: number;
  assignedTickets: number;
  requestedTickets: number;
  userName?: string;
}

interface TaskItem {
  id: string;
  label: string;
  value: number;
  icon: typeof Ticket;
  path: string;
  color: string;
  hoverColor: string;
}

export function MyWorkWidget() {
  const navigate = useNavigate();
  const [tasksData, setTasksData] = useState<MyTasksData | null>(null);
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
      setError('Unable to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const taskItems: TaskItem[] = [
    {
      id: 'assigned-tickets',
      label: 'Assigned Tickets',
      value: tasksData?.assignedTickets || 0,
      icon: Ticket,
      path: '/service-requests?filter=assigned',
      color: 'bg-blue-50 border-blue-200',
      hoverColor: 'hover:border-blue-400 hover:bg-blue-50'
    },
    {
      id: 'open-incidents',
      label: 'Open Incidents',
      value: tasksData?.openIncidents || 0,
      icon: AlertTriangle,
      path: '/incidents?filter=open',
      color: 'bg-red-50 border-red-200',
      hoverColor: 'hover:border-red-400 hover:bg-red-50'
    },
    {
      id: 'pending-changes',
      label: 'Pending Changes',
      value: tasksData?.pendingChanges || 0,
      icon: GitBranch,
      path: '/changes?filter=pending',
      color: 'bg-amber-50 border-amber-200',
      hoverColor: 'hover:border-amber-400 hover:bg-amber-50'
    },
    {
      id: 'access-requests',
      label: 'Access Requests',
      value: tasksData?.pendingAccessRequests || 0,
      icon: Key,
      path: '/access-management?filter=pending',
      color: 'bg-purple-50 border-purple-200',
      hoverColor: 'hover:border-purple-400 hover:bg-purple-50'
    },
    {
      id: 'open-problems',
      label: 'Open Problems',
      value: tasksData?.openProblems || 0,
      icon: AlertCircle,
      path: '/problems?filter=open',
      color: 'bg-orange-50 border-orange-200',
      hoverColor: 'hover:border-orange-400 hover:bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">My Work</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">My Work</h2>
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchMyTasks}
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">My Work</h2>
        {tasksData?.userName && (
          <span className="text-xs text-slate-500">{tasksData.userName}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {taskItems.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              onClick={() => navigate(task.path)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border
                ${task.color} ${task.hoverColor} transition-all duration-200
                ${task.value === 0 ? 'opacity-60' : ''}
              `}
            >
              <Icon className="w-5 h-5 text-slate-600 mb-2" />
              <span className="text-2xl font-semibold text-slate-900">{task.value}</span>
              <span className="text-xs text-slate-500 mt-1 text-center">{task.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
