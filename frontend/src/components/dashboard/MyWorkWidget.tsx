import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket, AlertTriangle, GitBranch, Key, AlertCircle, Briefcase, ArrowRight } from 'lucide-react';

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
  bgColor: string;
  iconBg: string;
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100'
    },
    {
      id: 'open-incidents',
      label: 'Open Incidents',
      value: tasksData?.openIncidents || 0,
      icon: AlertTriangle,
      path: '/incidents?filter=open',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100'
    },
    {
      id: 'pending-changes',
      label: 'Pending Changes',
      value: tasksData?.pendingChanges || 0,
      icon: GitBranch,
      path: '/changes?filter=pending',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100'
    },
    {
      id: 'access-requests',
      label: 'Access Requests',
      value: tasksData?.pendingAccessRequests || 0,
      icon: Key,
      path: '/access-management?filter=pending',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100'
    },
    {
      id: 'open-problems',
      label: 'Open Problems',
      value: tasksData?.openProblems || 0,
      icon: AlertCircle,
      path: '/problems?filter=open',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">My Work</h2>
              <p className="text-sm text-slate-500">Your assigned tasks and items</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 shadow-sm">
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchMyTasks}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm shadow-purple-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Work</h2>
            <p className="text-sm text-slate-500">Your assigned tasks and items</p>
          </div>
        </div>
        {tasksData?.userName && (
          <span className="text-xs font-medium text-slate-500 px-3 py-1.5 bg-slate-100 rounded-full">
            {tasksData.userName}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {taskItems.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              onClick={() => navigate(task.path)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/60
                ${task.bgColor} hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-1
                transition-all duration-300 group
                ${task.value === 0 ? 'opacity-60' : ''}
              `}
            >
              <div className={`p-2.5 rounded-xl ${task.iconBg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${task.color}`} />
              </div>
              <span className="text-3xl font-bold text-slate-900">{task.value}</span>
              <span className="text-xs font-medium text-slate-500 mt-1 text-center leading-tight">
                {task.label}
              </span>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className={`w-4 h-4 ${task.color}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
