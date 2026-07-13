import { useNavigate } from 'react-router-dom';

export type QuickAction = {
  label: string;
  icon: string;
  path: string;
  color: string;
};

const quickActions: QuickAction[] = [
  { label: 'Create Incident', icon: '+', path: '/incidents', color: 'var(--brand)' },
  { label: 'Upload Compliance Document', icon: '↑', path: '/compliance', color: '#197a4b' },
  { label: 'Add User', icon: '+', path: '/users-teams', color: '#5468ff' },
  { label: 'Add Vendor', icon: '+', path: '/vendors-licenses', color: '#aa6b00' }
];

export function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <section className="quick-actions-section">
      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-button"
            onClick={() => navigate(action.path)}
          >
            <span className="quick-action-icon" style={{ backgroundColor: action.color }}>
              {action.icon}
            </span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
