import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Permission mapping for menu visibility
// Phase 3C: Migrated to new RBAC permission namespaces
const menuPermissionMap: Record<string, string> = {
  '/': 'dashboard:view',
  '/service-requests': 'tickets:view',
  '/incidents': 'incidents:view',
  '/problems': 'problems:view',         // NEW: Separated from incidents namespace
  '/changes': 'changes:view',
  '/inventory': 'inventory:view',
  '/access-management': 'access:view',
  '/compliance': 'compliance:view',
  '/projects-environments': 'projects:view',  // NEW: Separated from settings namespace
  '/vendors-licenses': 'vendors:view',       // NEW: Separated from settings namespace
  '/reports-analytics': 'reports:view',       // NEW: Separated from dashboard namespace
  '/knowledge-base': 'kb:view',               // NEW: Separated from dashboard namespace
  '/users-teams': 'users:view',
  '/roles-permissions': 'roles:view',           // NEW: Separated from users namespace
  '/settings': 'settings:view'
};

const allMenuItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Service Requests', path: '/service-requests', icon: 'SR' },
  { label: 'Incidents', path: '/incidents', icon: 'IN' },
  { label: 'Problems', path: '/problems', icon: 'PR' },
  { label: 'Changes', path: '/changes', icon: 'CH' },
  { label: 'Inventory', path: '/inventory', icon: 'AS' },
  { label: 'Access Management', path: '/access-management', icon: 'AC' },
  { label: 'Compliance', path: '/compliance', icon: 'CO' },
  { label: 'Projects & Environments', path: '/projects-environments', icon: 'PE' },
  { label: 'Vendors & Licenses', path: '/vendors-licenses', icon: 'VL' },
  { label: 'Reports & Analytics', path: '/reports-analytics', icon: 'RA' },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: 'KB' },
  { label: 'Users & Teams', path: '/users-teams', icon: 'UT' },
  { label: 'Roles & Permissions', path: '/roles-permissions', icon: 'RP' },
  { label: 'Settings', path: '/settings', icon: '⚙' }
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { hasPermission } = useAuth();

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    const requiredPermission = menuPermissionMap[item.path];
    // If no permission required, always show (shouldn't happen in this app)
    if (!requiredPermission) return true;
    // Check if user has the required permission
    return hasPermission(requiredPermission);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">S</div>
        {!collapsed && (
          <div>
            <strong>InfraOps</strong>
            <span>AI Command</span>
          </div>
        )}
      </div>
      <button className="sidebar-toggle" onClick={onToggle}>{collapsed ? 'Expand' : 'Collapse'}</button>
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
