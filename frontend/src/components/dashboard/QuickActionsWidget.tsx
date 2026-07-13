import { useNavigate } from 'react-router-dom';

interface QuickActionsWidgetProps {
  className?: string;
}

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  permission?: string;
}

const defaultQuickActions: QuickAction[] = [
  { label: 'Create Incident', icon: '🚨', path: '/incidents' },
  { label: 'Upload Compliance Document', icon: '📤', path: '/compliance' },
  { label: 'Add User', icon: '👤', path: '/users-teams' },
  { label: 'Add Vendor', icon: '🏢', path: '/vendors-licenses' }
];

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`quick-actions-widget ${className}`}>
      <h2 className="widget-title">Quick Actions</h2>
      <div className="quick-actions-grid">
        {defaultQuickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-button"
            onClick={() => handleAction(action.path)}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
