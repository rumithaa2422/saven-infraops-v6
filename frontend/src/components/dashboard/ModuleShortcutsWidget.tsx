import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface ModuleShortcutsWidgetProps {
  className?: string;
}

interface ModuleShortcut {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission: string;
  color: string;
  description: string;
}

const allModules: ModuleShortcut[] = [
  { 
    id: 'tickets', 
    label: 'Tickets', 
    icon: '🎫', 
    path: '/service-requests', 
    permission: 'tickets:view',
    color: '#5468ff',
    description: 'Service requests'
  },
  { 
    id: 'incidents', 
    label: 'Incidents', 
    icon: '🚨', 
    path: '/incidents', 
    permission: 'incidents:view',
    color: '#c0392b',
    description: 'Incident management'
  },
  { 
    id: 'problems', 
    label: 'Problems', 
    icon: '⚠️', 
    path: '/problems', 
    permission: 'problems:view',
    color: '#aa6b00',
    description: 'Problem tracking'
  },
  { 
    id: 'changes', 
    label: 'Changes', 
    icon: '🔄', 
    path: '/changes', 
    permission: 'changes:view',
    color: '#8b5cf6',
    description: 'Change management'
  },
  { 
    id: 'inventory', 
    label: 'Inventory', 
    icon: '📦', 
    path: '/inventory', 
    permission: 'inventory:view',
    color: '#0891b2',
    description: 'Asset management'
  },
  { 
    id: 'access', 
    label: 'Access', 
    icon: '🔐', 
    path: '/access-management', 
    permission: 'access:view',
    color: '#059669',
    description: 'Access control'
  },
  { 
    id: 'compliance', 
    label: 'Compliance', 
    icon: '📋', 
    path: '/compliance', 
    permission: 'compliance:view',
    color: '#dc2626',
    description: 'Document repository'
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: '📊', 
    path: '/reports-analytics', 
    permission: 'reports:view',
    color: '#7c3aed',
    description: 'Analytics & reports'
  }
];

export function ModuleShortcutsWidget({ className = '' }: ModuleShortcutsWidgetProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Filter modules based on RBAC permissions
  const visibleModules = useMemo(() => {
    return allModules.filter(module => hasPermission(module.permission));
  }, [hasPermission]);

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`module-shortcuts-widget ${className}`}>
      <h2 className="widget-title">Module Shortcuts</h2>
      <div className="module-grid">
        {visibleModules.map((module) => (
          <button
            key={module.id}
            className="module-card"
            onClick={() => handleModuleClick(module.path)}
            title={module.description}
          >
            <div 
              className="module-icon-wrapper"
              style={{ backgroundColor: `${module.color}15` }}
            >
              <span className="module-icon">{module.icon}</span>
            </div>
            <span className="module-label">{module.label}</span>
            <span className="module-description">{module.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
