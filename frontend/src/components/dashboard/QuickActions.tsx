import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  Ticket,
  AlertTriangle,
  Key,
  BookOpen,
  Upload,
  UserPlus,
  Building2,
  GitBranch,
  AlertCircle,
  Settings,
  Shield,
  Plus,
  ArrowRight
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  permission: string;
  description: string;
  color: string;
  bgColor: string;
  hoverBgColor: string;
}

const allQuickActions: QuickAction[] = [
  {
    id: 'create-ticket',
    label: 'Create Ticket',
    icon: Ticket,
    path: '/service-requests',
    permission: 'tickets:create',
    description: 'Submit a new service request',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100'
  },
  {
    id: 'report-incident',
    label: 'Report Incident',
    icon: AlertTriangle,
    path: '/incidents',
    permission: 'incidents:create',
    description: 'Log a new incident',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100'
  },
  {
    id: 'request-access',
    label: 'Request Access',
    icon: Key,
    path: '/access-management',
    permission: 'access:request',
    description: 'Request system access',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBgColor: 'hover:bg-purple-100'
  },
  {
    id: 'browse-kb',
    label: 'Knowledge Base',
    icon: BookOpen,
    path: '/knowledge-base',
    permission: 'kb:view',
    description: 'Browse articles',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    hoverBgColor: 'hover:bg-emerald-100'
  },
  {
    id: 'upload-compliance',
    label: 'Upload Document',
    icon: Upload,
    path: '/compliance',
    permission: 'compliance:create',
    description: 'Upload compliance document',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    hoverBgColor: 'hover:bg-amber-100'
  },
  {
    id: 'add-user',
    label: 'Add User',
    icon: UserPlus,
    path: '/users-teams',
    permission: 'users:create',
    description: 'Add a new team member',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    hoverBgColor: 'hover:bg-indigo-100'
  },
  {
    id: 'add-vendor',
    label: 'Add Vendor',
    icon: Building2,
    path: '/vendors-licenses',
    permission: 'vendors:create',
    description: 'Add a new vendor',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    hoverBgColor: 'hover:bg-cyan-100'
  },
  {
    id: 'create-change',
    label: 'Create Change',
    icon: GitBranch,
    path: '/changes',
    permission: 'changes:create',
    description: 'Submit a change request',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBgColor: 'hover:bg-orange-100'
  },
  {
    id: 'open-problem',
    label: 'Open Problem',
    icon: AlertCircle,
    path: '/problems',
    permission: 'problems:create',
    description: 'Log a new problem',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    hoverBgColor: 'hover:bg-pink-100'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: 'settings:view',
    description: 'System settings',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    hoverBgColor: 'hover:bg-slate-200'
  },
  {
    id: 'roles',
    label: 'Manage Roles',
    icon: Shield,
    path: '/roles-permissions',
    permission: 'roles:view',
    description: 'Manage roles & permissions',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    hoverBgColor: 'hover:bg-violet-100'
  },
  {
    id: 'create-inventory',
    label: 'Add Asset',
    icon: Plus,
    path: '/inventory',
    permission: 'inventory:create',
    description: 'Add new inventory item',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    hoverBgColor: 'hover:bg-teal-100'
  },
  {
    id: 'create-project',
    label: 'Add Project',
    icon: Plus,
    path: '/projects-environments',
    permission: 'projects:create',
    description: 'Create new project',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    hoverBgColor: 'hover:bg-rose-100'
  }
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = '' }: QuickActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const visibleActions = useMemo(() => {
    return allQuickActions.filter(action => hasPermission(action.permission));
  }, [hasPermission]);

  const handleAction = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Common tasks and shortcuts</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {visibleActions.slice(0, 8).map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.path)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 ${action.bgColor} ${action.hoverBgColor} transition-all duration-300 group hover:shadow-md hover:shadow-purple-200/50 hover:-translate-y-1`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-2.5 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center leading-tight group-hover:text-slate-900 transition-colors">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
