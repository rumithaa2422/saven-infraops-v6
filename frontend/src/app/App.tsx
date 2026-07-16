import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ModulePage } from '../pages/ModulePage';
import { ReportsPage } from '../pages/ReportsPage';
import { ServiceRequestsPage } from '../pages/ServiceRequestsPage';
import { ServiceRequestDetailPage } from '../pages/ServiceRequestDetailPage';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { InventoryDetailPage } from '../pages/InventoryDetailPage';
import { InventoryMasterPage } from '../pages/InventoryMasterPage';
import { InventoryCategoryPage } from '../pages/InventoryCategoryPage';
import { InventoryAnalyticsPage } from '../pages/InventoryAnalyticsPage';
import { InventoryMasterDetailPage } from '../pages/InventoryMasterDetailPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ActivateAccountPage } from '../pages/ActivateAccountPage';
import { RolesPermissionsPage } from '../pages/RolesPermissionsPage';
import { useAuth } from '../auth/AuthContext';
import { UnauthorizedPage } from '../components/auth';

function Protected({ children }: { children: React.ReactNode }) {
  const { token, isBootstrapping } = useAuth();
  if (isBootstrapping) return <div className="boot">Loading workspace...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * PermissionRoute - Route wrapper that checks for required permissions
 * 
 * Usage:
 * <PermissionRoute permission="roles:view">
 *   <RolesPermissionsPage />
 * </PermissionRoute>
 * 
 * <PermissionRoute anyPermission={["admin", "sys:admin"]}>
 *   <AdminPanel />
 * </PermissionRoute>
 */
interface PermissionRouteProps {
  permission?: string | string[];
  anyPermission?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function PermissionRoute({ permission, anyPermission, children, fallback }: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission, isSuperAdmin } = useAuth();

  // Super Admin bypasses all permission checks
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    hasAccess = perms.every(p => hasPermission(p));
  } else if (anyPermission) {
    hasAccess = hasAnyPermission(anyPermission);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback || <UnauthorizedPage message="You do not have permission to access this page." />;
  }

  return <>{children}</>;
}

// Module to required permission mapping for route protection
const modulePermissions: Record<string, string> = {
  'service-requests': 'tickets:view',
  'incidents': 'incidents:view',
  'problems': 'problems:view',
  'changes': 'changes:view',
  'inventory': 'inventory:view',
  'access-management': 'access:view',
  'compliance': 'compliance:view',
  'projects-environments': 'projects:view',
  'vendors-licenses': 'vendors:view',
  'reports-analytics': 'reports:view',
  'knowledge-base': 'kb:view',
  'users-teams': 'users:view',
  'roles-permissions': 'roles:view',
};

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route 
          path="service-requests" 
          element={
            <PermissionRoute permission={modulePermissions['service-requests']}>
              <ServiceRequestsPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="service-requests/:id" 
          element={
            <PermissionRoute permission={modulePermissions['service-requests']}>
              <ServiceRequestDetailPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="incidents" 
          element={
            <PermissionRoute permission={modulePermissions['incidents']}>
              <ModulePage moduleKey="incidents" title="Incidents" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="incidents/:id" 
          element={
            <PermissionRoute permission={modulePermissions['incidents']}>
              <IncidentDetailPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="problems" 
          element={
            <PermissionRoute permission={modulePermissions['problems']}>
              <ModulePage moduleKey="problems" title="Problems" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="changes" 
          element={
            <PermissionRoute permission={modulePermissions['changes']}>
              <ModulePage moduleKey="changes" title="Change Management" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/analytics" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryAnalyticsPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <ModulePage moduleKey="inventory" title="Inventory" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/create" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryMasterPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/:categoryId" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryCategoryPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/master/:id" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryDetailPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/master/:id/edit" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryMasterPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="inventory/details/:id" 
          element={
            <PermissionRoute permission={modulePermissions['inventory']}>
              <InventoryDetailPage />
            </PermissionRoute>
          } 
        />
        <Route 
          path="access-management" 
          element={
            <PermissionRoute permission={modulePermissions['access-management']}>
              <ModulePage moduleKey="access-management" title="Access Management" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="compliance" 
          element={
            <PermissionRoute permission={modulePermissions['compliance']}>
              <ModulePage moduleKey="compliance" title="Compliance" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="projects-environments" 
          element={
            <PermissionRoute permission={modulePermissions['projects-environments']}>
              <ModulePage moduleKey="projects-environments" title="Projects & Environments" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="vendors-licenses" 
          element={
            <PermissionRoute permission={modulePermissions['vendors-licenses']}>
              <ModulePage moduleKey="vendors-licenses" title="Vendors & Licenses" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="reports-analytics" 
          element={
            <PermissionRoute permission={modulePermissions['reports-analytics']}>
              <ModulePage moduleKey="reports-analytics" title="Reports & Analytics" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="knowledge-base" 
          element={
            <PermissionRoute permission={modulePermissions['knowledge-base']}>
              <ModulePage moduleKey="knowledge-base" title="Knowledge Base" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="users-teams" 
          element={
            <PermissionRoute permission={modulePermissions['users-teams']}>
              <ModulePage moduleKey="users-teams" title="Users & Teams" />
            </PermissionRoute>
          } 
        />
        <Route 
          path="roles-permissions" 
          element={
            <PermissionRoute permission={modulePermissions['roles-permissions']}>
              <RolesPermissionsPage />
            </PermissionRoute>
          } 
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
