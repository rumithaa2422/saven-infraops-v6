/**
 * Permission Components
 * 
 * Generic reusable components for permission-based UI rendering.
 * These components wrap the permission checking logic and provide
 * clean abstractions for hiding/showing UI elements based on permissions.
 * 
 * Usage:
 *   <PermissionGate permission="tickets:create">
 *     <Button>Create Ticket</Button>
 *   </PermissionGate>
 */

import { ReactNode, isValidElement, cloneElement, memo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Navigate } from 'react-router-dom';

/* ============================================
 * PermissionGate
 * Conditionally renders children based on permission
 * ============================================ */

interface PermissionGateProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Content to render when permission is denied */
  fallback?: ReactNode;
  /** If true, renders fallback instead of nothing when denied */
  showFallback?: boolean;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  showFallback = false
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    // No permission specified - always allow
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback) {
    return <>{fallback}</>;
  }

  return null;
}

/* ============================================
 * PermissionButton
 * Renders a button that is disabled or hidden based on permission
 * ============================================ */

interface PermissionButtonProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Button content */
  children: ReactNode;
  /** Additional button props */
  className?: string;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** If true, hides the button instead of disabling */
  hideWhenDenied?: boolean;
  /** If true, disables the button instead of hiding */
  disableWhenDenied?: boolean;
  /** OnClick handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

export function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  children,
  className = '',
  type = 'button',
  hideWhenDenied = false,
  disableWhenDenied = true,
  onClick,
  disabled = false
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }

  const isDisabled = disabled || (!hasAccess && disableWhenDenied);
  const isHidden = !hasAccess && hideWhenDenied;

  if (isHidden) {
    return null;
  }

  // Clone child element if it's a valid React element
  if (isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      type,
      className: `${className} ${(children as React.ReactElement<any>).props?.className || ''}`.trim(),
      onClick,
      disabled: isDisabled
    });
  }

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}

/* ============================================
 * PermissionMenuItem
 * Renders a menu item that is hidden based on permission
 * ============================================ */

interface PermissionMenuItemProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Menu item content */
  children: ReactNode;
  /** Click handler */
  onClick?: () => void;
}

export function PermissionMenuItem({
  permission,
  permissions,
  requireAll = false,
  children,
  onClick
}: PermissionMenuItemProps) {
  return (
    <PermissionGate
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
    >
      {isValidElement(children) ? (
        cloneElement(children as React.ReactElement<any>, { onClick })
      ) : (
        <div onClick={onClick}>{children}</div>
      )}
    </PermissionGate>
  );
}

/* ============================================
 * PermissionRoute
 * Redirects to a specified path or renders unauthorized when permission is denied
 * ============================================ */

interface PermissionRouteProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Path to redirect to when denied */
  redirectTo?: string;
  /** If true, renders unauthorized component instead of redirect */
  showUnauthorized?: boolean;
}

export function PermissionRoute({
  permission,
  permissions,
  requireAll = false,
  children,
  redirectTo = '/',
  showUnauthorized = false
}: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <div className="unauthorized-container">
          <div className="unauthorized-content">
            <div className="unauthorized-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2>Access Denied</h2>
            <p>You don't have permission to perform this action.</p>
            <p className="unauthorized-hint">Contact your administrator if you believe this is an error.</p>
            <button onClick={() => window.history.back()} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

/* ============================================
 * PermissionWidget
 * Wraps a widget/card with permission checking
 * Shows empty state when permission is denied
 * ============================================ */

interface PermissionWidgetProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Widget content */
  children: ReactNode;
  /** Widget title */
  title?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state icon */
  emptyIcon?: ReactNode;
}

export function PermissionWidget({
  permission,
  permissions,
  requireAll = false,
  children,
  title,
  emptyMessage = 'You do not have permission to view this section.',
  emptyIcon
}: PermissionWidgetProps) {
  const defaultIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );

  return (
    <PermissionGate
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      fallback={
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {title && <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-slate-300 mb-3">
              {emptyIcon || defaultIcon}
            </div>
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        </div>
      }
      showFallback
    >
      {children}
    </PermissionGate>
  );
}

/* ============================================
 * PermissionTooltip
 * Shows tooltip when user lacks permission
 * ============================================ */

interface PermissionTooltipProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions - any one satisfies the gate (OR logic) */
  permissions?: string[];
  /** Require ALL permissions (AND logic) */
  requireAll?: boolean;
  /** Content to wrap */
  children: ReactNode;
  /** Tooltip message when denied */
  deniedMessage?: string;
}

export function PermissionTooltip({
  permission,
  permissions,
  requireAll = false,
  children,
  deniedMessage = 'You do not have permission for this action'
}: PermissionTooltipProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative group" title={deniedMessage}>
      <div className="opacity-50 cursor-not-allowed">
        {children}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {deniedMessage}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
}

export default {
  PermissionGate,
  PermissionButton,
  PermissionMenuItem,
  PermissionRoute,
  PermissionWidget,
  PermissionTooltip
};
