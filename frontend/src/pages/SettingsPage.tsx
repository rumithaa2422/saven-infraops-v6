import { useAuth } from '../auth/AuthContext';
import { SuperAdminSettings } from '../components/settings/SuperAdminSettings';
import { ManagerSettings } from '../components/settings/ManagerSettings';
import { EmployeeSettings } from '../components/settings/EmployeeSettings';

export function SettingsPage() {
  const { user, hasPermission } = useAuth();
  
  // Determine user role level
  const isSuperAdmin = hasPermission('sys:admin') || hasPermission('set:manage');
  const isManager = hasPermission('usr:view') && hasPermission('rol:view');
  const isEmployee = !isSuperAdmin && !isManager;
  
  // Render appropriate settings based on role
  if (isSuperAdmin) {
    return <SuperAdminSettings />;
  }
  
  if (isManager) {
    return <ManagerSettings />;
  }
  
  return <EmployeeSettings />;
}
