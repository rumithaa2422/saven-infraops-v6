import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Bell,
  Ticket,
  AlertTriangle,
  GitBranch,
  Package,
  Shield,
  FileCheck,
  FolderKanban,
  Building2,
  BarChart3,
  BookOpen,
  Users,
  UserCog,
  Settings
} from 'lucide-react';

// Permission mapping for menu visibility
// Phase 3C: Migrated to new RBAC permission namespaces
const menuPermissionMap: Record<string, string> = {
  '/': 'dashboard:view',
  '/notifications': 'dashboard:view',
  '/service-requests': 'tickets:view',
  '/incidents': 'incidents:view',
  '/problems': 'problems:view',
  '/changes': 'changes:view',
  '/inventory': 'inventory:view',
  '/access-management': 'access:view',
  '/compliance': 'compliance:view',
  '/projects-environments': 'projects:view',
  '/vendors-licenses': 'vendors:view',
  '/reports-analytics': 'reports:view',
  '/knowledge-base': 'kb:view',
  '/users-teams': 'users:view',
  '/roles-permissions': 'roles:view',
  '/settings': 'settings:view'
};

const allMenuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Service Requests', path: '/service-requests', icon: Ticket },
  { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { label: 'Problems', path: '/problems', icon: AlertTriangle },
  { label: 'Changes', path: '/changes', icon: GitBranch },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Asset Management', path: '/access-management', icon: Shield },
  { label: 'Compliance', path: '/compliance', icon: FileCheck },
  { label: 'Projects', path: '/projects-environments', icon: FolderKanban },
  { label: 'Vendors', path: '/vendors-licenses', icon: Building2 },
  { label: 'Reports & Analytics', path: '/reports-analytics', icon: BarChart3 },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  { label: 'Users', path: '/users-teams', icon: Users },
  { label: 'Roles & Permissions', path: '/roles-permissions', icon: UserCog },
  { label: 'Settings', path: '/settings', icon: Settings }
];

export function Sidebar() {
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
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <strong>InfraOps</strong>
          <span>AI Command</span>
        </div>
      </div>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={1.75} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
