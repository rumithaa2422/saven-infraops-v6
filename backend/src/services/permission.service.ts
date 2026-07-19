/**
 * Permission Service
 * 
 * Provides utility functions for checking permissions with automatic
 * backward compatibility support via alias mapping.
 * 
 * All permission checks in the application should use these functions
 * to ensure consistent behavior and backward compatibility.
 */

import {
  hasPermissionViaAlias,
  hasAnyPermissionViaAlias,
  hasAllPermissionsViaAlias,
  getSatisfiedPermissions
} from '../common/permissionAliases.js';

/**
 * Check if a user has a specific permission.
 * Supports both direct permissions and alias-based permissions.
 * 
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermission - The permission to check
 * @returns true if the user has the permission (directly or via alias)
 * 
 * @example
 * // Direct permission check
 * hasPermission(['tickets:view', 'tickets:create'], 'tickets:view') // true
 * 
 * // Alias permission check
 * hasPermission(['tickets:manage'], 'tickets:edit') // true (via alias)
 * 
 * // Missing permission
 * hasPermission(['tickets:view'], 'tickets:delete') // false
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return hasPermissionViaAlias(userPermissions, requiredPermission);
}

/**
 * Check if a user has ANY of the specified permissions.
 * Returns true if at least one permission is satisfied.
 * Supports both direct permissions and alias-based permissions.
 * 
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions to check
 * @returns true if at least one permission is satisfied
 * 
 * @example
 * hasAnyPermission(['tickets:view'], ['tickets:manage', 'tickets:edit']) // true
 * hasAnyPermission(['tickets:view'], ['tickets:delete', 'tickets:manage']) // false
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return hasAnyPermissionViaAlias(userPermissions, requiredPermissions);
}

/**
 * Check if a user has ALL of the specified permissions.
 * Returns true only if every permission is satisfied.
 * Supports both direct permissions and alias-based permissions.
 * 
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions to check
 * @returns true if ALL permissions are satisfied
 * 
 * @example
 * hasAllPermissions(['tickets:view', 'tickets:manage'], ['tickets:view', 'tickets:edit']) // true
 * hasAllPermissions(['tickets:view'], ['tickets:view', 'tickets:edit']) // false
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return hasAllPermissionsViaAlias(userPermissions, requiredPermissions);
}

/**
 * Get all permissions that would satisfy a given permission.
 * Useful for documentation and debugging.
 * 
 * @param permission - The permission to check
 * @returns Set of permissions that satisfy the given permission
 * 
 * @example
 * getSatisfiedPermissions('tickets:edit')
 * // Returns Set { 'tickets:edit', 'tickets:manage' }
 */
export function getPermissionsForAlias(permission: string): Set<string> {
  return getSatisfiedPermissions(permission);
}

/**
 * Check if a user has a Super Admin role.
 * Super Admin has access to everything.
 * 
 * @param userRoles - Array of role names
 * @returns true if user has Super Admin role
 */
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes('Super Admin');
}

/**
 * Check if a user has an Admin role.
 * Admin has elevated access but not full system access.
 * 
 * @param userRoles - Array of role names
 * @returns true if user has Admin role
 */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes('Admin');
}

/**
 * Check if a user has elevated privileges (Super Admin or Admin).
 * 
 * @param userRoles - Array of role names
 * @returns true if user has elevated privileges
 */
export function isPrivileged(userRoles: string[]): boolean {
  return isSuperAdmin(userRoles) || isAdmin(userRoles);
}

/**
 * Check if a user can perform an action on a resource they own.
 * Owners can always perform certain actions on their own resources.
 * 
 * @param userId - The current user's ID
 * @param ownerId - The resource owner's ID (can be null/undefined)
 * @param userRoles - The user's roles
 * @returns true if the user owns the resource or is privileged
 */
export function canManageOwnResource(
  userId: string | undefined,
  ownerId: string | null | undefined,
  userRoles: string[]
): boolean {
  if (!userId) return false;
  if (isPrivileged(userRoles)) return true;
  return userId === ownerId;
}

/**
 * Create a permission checker function for a specific permission.
 * Useful for middleware-like patterns.
 * 
 * @param requiredPermission - The permission required
 * @returns Function that checks if user has the permission
 * 
 * @example
 * const requireTicketsView = createPermissionChecker('tickets:view');
 * const canAccess = requireTicketsView(['tickets:manage']); // true
 */
export function createPermissionChecker(requiredPermission: string) {
  return (userPermissions: string[]): boolean => {
    return hasPermission(userPermissions, requiredPermission);
  };
}

/**
 * Create a permission checker that requires ANY of the specified permissions.
 * 
 * @param requiredPermissions - Array of permissions (any match)
 * @returns Function that checks if user has any of the permissions
 */
export function createAnyPermissionChecker(requiredPermissions: string[]) {
  return (userPermissions: string[]): boolean => {
    return hasAnyPermission(userPermissions, requiredPermissions);
  };
}

/**
 * Create a permission checker that requires ALL of the specified permissions.
 * 
 * @param requiredPermissions - Array of permissions (all required)
 * @returns Function that checks if user has all permissions
 */
export function createAllPermissionChecker(requiredPermissions: string[]) {
  return (userPermissions: string[]): boolean => {
    return hasAllPermissions(userPermissions, requiredPermissions);
  };
}

/**
 * Export all permission constants for use in route definitions.
 * Import from this file for consistent permission checking.
 */
export * from '../common/permissions.js';
