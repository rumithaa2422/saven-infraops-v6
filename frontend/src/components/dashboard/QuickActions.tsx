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
  FileText,
  Plus
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  permission: string;
  description: string;
}

const allQuickActions: QuickAction[] = [
  {
    id: 'create-ticket',
    label: 'Create Ticket',
    icon: Ticket,
    path: '/service-requests',
    permission: 'tickets:create',
    description: 'Submit a new service request'
  },
  {
    id: 'report-incident',
    label: 'Report Incident',
    icon: AlertTriangle,
    path: '/incidents',
    permission: 'incidents:create',
    description: 'Log a new incident'
  },
  {
    id: 'request-access',
    label: 'Request Access',
    icon: Key,
    path: '/access-management',
    permission: 'access:request',
    description: 'Request system access'
  },
  {
    id: 'browse-kb',
    label: 'Knowledge Base',
    icon: BookOpen,
    path: '/knowledge-base',
    permission: 'kb:view',
    description: 'Browse articles'
  },
  {
    id: 'upload-compliance',
    label: 'Upload Document',
    icon: Upload,
    path: '/compliance',
    permission: 'compliance:create',
    description: 'Upload compliance document'
  },
  {
    id: 'add-user',
    label: 'Add User',
    icon: UserPlus,
    path: '/users-teams',
    permission: 'users:create',
    description: 'Add a new team member'
  },
  {
    id: 'add-vendor',
    label: 'Add Vendor',
    icon: Building2,
    path: '/vendors-licenses',
    permission: 'vendors:create',
    description: 'Add a new vendor'
  },
  {
    id: 'create-change',
    label: 'Create Change',
    icon: GitBranch,
    path: '/changes',
    permission: 'changes:create',
    description: 'Submit a change request'
  },
  {
    id: 'open-problem',
    label: 'Open Problem',
    icon: AlertCircle,
    path: '/problems',
    permission: 'problems:create',
    description: 'Log a new problem'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: 'settings:view',
    description: 'System settings'
  },
  {
    id: 'roles',
    label: 'Manage Roles',
    icon: Shield,
    path: '/roles-permissions',
    permission: 'roles:view',
    description: 'Manage roles & permissions'
  },

  {
    id: 'create-inventory',
    label: 'Add Asset',
    icon: Plus,
    path: '/inventory',
    permission: 'inventory:create',
    description: 'Add new inventory item'
  },
  {
    id: 'create-project',
    label: 'Add Project',
    icon: Plus,
    path: '/projects-environments',
    permission: 'projects:create',
    description: 'Create new project'
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
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {visibleActions.slice(0, 12).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all duration-200 group"
              title={action.description}
            >
              <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-brand-100 transition-colors">
                <Icon className="w-4 h-4 text-slate-600 group-hover:text-brand-600 transition-colors" />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-brand-600 text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
