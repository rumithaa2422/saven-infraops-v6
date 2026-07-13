import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface QuickActionsWidgetProps {
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: string;
  description?: string;
}

const allQuickActions: QuickAction[] = [
  { 
    id: 'create-ticket', 
    label: 'Create Ticket', 
    icon: '🎫', 
    path: '/service-requests', 
    permission: 'tickets:create',
    description: 'Submit a new service request'
  },
  { 
    id: 'report-incident', 
    label: 'Report Incident', 
    icon: '🚨', 
    path: '/incidents', 
    permission: 'incidents:create',
    description: 'Log a new incident'
  },
  { 
    id: 'upload-compliance', 
    label: 'Upload Compliance PDF', 
    icon: '📤', 
    path: '/compliance', 
    permission: 'compliance:create',
    description: 'Upload a compliance document'
  },
  { 
    id: 'request-access', 
    label: 'Request Access', 
    icon: '🔐', 
    path: '/access-management', 
    permission: 'access:request',
    description: 'Request system access'
  },
  { 
    id: 'add-user', 
    label: 'Add User', 
    icon: '👤', 
    path: '/users-teams', 
    permission: 'users:create',
    description: 'Add a new team member'
  },
  { 
    id: 'add-vendor', 
    label: 'Add Vendor', 
    icon: '🏢', 
    path: '/vendors-licenses', 
    permission: 'vendors:create',
    description: 'Add a new vendor'
  },
  { 
    id: 'create-change', 
    label: 'Create Change', 
    icon: '🔄', 
    path: '/changes', 
    permission: 'changes:create',
    description: 'Submit a change request'
  },
  { 
    id: 'open-problem', 
    label: 'Open Problem', 
    icon: '⚠️', 
    path: '/problems', 
    permission: 'problems:create',
    description: 'Log a new problem'
  }
];

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Filter actions based on RBAC permissions
  const visibleActions = useMemo(() => {
    return allQuickActions.filter(action => {
      // If no permission required, always show
      if (!action.permission) return true;
      // Check if user has the required permission
      return hasPermission(action.permission);
    });
  }, [hasPermission]);

  const handleAction = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`quick-actions-widget ${className}`}>
      <h2 className="widget-title">Quick Actions</h2>
      <div className="quick-actions-grid">
        {visibleActions.map((action) => (
          <button
            key={action.id}
            className="quick-action-button"
            onClick={() => handleAction(action.path)}
            title={action.description}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
