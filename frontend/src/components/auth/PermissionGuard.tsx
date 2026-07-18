import { ReactNode } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface PermissionGuardProps {
  /**
   * Required permission(s) - user must have ALL of these
   */
  permission?: string | string[];
  /**
   * Required permission(s) - user must have AT LEAST ONE of these
   */
  anyPermission?: string[];
  /**
   * Action and optional module to check: can("manage", "inventory")
   */
  can?: [action: string, module?: string];
  /**
   * If true, children are rendered when user does NOT have permission
   */
  invert?: boolean;
  /**
   * Content to render when access is denied (optional)
   */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PermissionGuard - Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGuard permission="incidents:create">
 *   <CreateButton />
 * </PermissionGuard>
 * 
 * <PermissionGuard anyPermission={["incidents:manage", "incidents:write", "incidents:delete"]}>
 *   <ActionColumn />
 * </PermissionGuard>
 * 
 * <PermissionGuard can={["manage", "inventory"]}>
 *   <EditButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermission,
  can,
  invert = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, can: canCheck } = useAuth();

  let hasAccess = false;

  if (permission) {
    // Check single permission or array of permissions (ALL must match)
    const perms = Array.isArray(permission) ? permission : [permission];
    hasAccess = perms.every(p => hasPermission(p));
  } else if (anyPermission) {
    // Check if user has ANY of the permissions
    hasAccess = hasAnyPermission(anyPermission);
  } else if (can) {
    // Check using can("action", "module") format
    hasAccess = canCheck(can[0], can[1]);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  // Apply inversion if specified
  const shouldRender = invert ? !hasAccess : hasAccess;

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionButtonProps {
  /**
   * Permission(s) required to show and enable the button
   */
  permission?: string | string[];
  /**
   * Alternative: anyPermission={["perm1", "perm2"]}
   */
  anyPermission?: string[];
  /**
   * Alternative: can={["action", "module"]}
   */
  can?: [action: string, module?: string];
  /**
   * Button variant: primary, secondary, danger, link, delete
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | 'delete';
  /**
   * Disable state (in addition to permission check)
   */
  disabled?: boolean;
  /**
   * Button class name
   */
  className?: string;
  /**
   * onClick handler
   */
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * PermissionButton - A button that only renders when user has permission
 * 
 * Usage:
 * <PermissionButton 
 *   permission="incidents:create"
 *   onClick={handleCreate}
 * >
 *   Create Incident
 * </PermissionButton>
 * 
 * <PermissionButton
 *   anyPermission={["incidents:manage", "incidents:delete"]}
 *   variant="danger"
 *   onClick={handleDelete}
 * >
 *   Delete
 * </PermissionButton>
 */
export function PermissionButton({
  permission,
  anyPermission,
  can,
  variant = 'primary',
  disabled = false,
  className = '',
  onClick,
  children,
  type = 'button'
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, can: canCheck } = useAuth();

  let hasAccess = false;

  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    hasAccess = perms.every(p => hasPermission(p));
  } else if (anyPermission) {
    hasAccess = hasAnyPermission(anyPermission);
  } else if (can) {
    hasAccess = canCheck(can[0], can[1]);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <button
      type={type}
      className={`btn ${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * UnauthorizedPage - Shown when user lacks permission
 */
export function UnauthorizedPage({ message = 'You do not have permission to access this resource.' }: { message?: string }) {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <span className="unauthorized-icon">🔒</span>
        <h2>403 - Unauthorized</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
