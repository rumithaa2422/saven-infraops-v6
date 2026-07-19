import { NextFunction, Request, Response } from 'express';
import { HttpError, permissionDenied as createPermissionDenied } from '../common/httpError.js';
import {
  hasPermissionViaAlias,
  hasAnyPermissionViaAlias,
  hasAllPermissionsViaAlias
} from '../common/permissionAliases.js';

/**
 * Require a single permission (with alias support)
 * Supports backward compatibility: if user has a legacy permission
 * that satisfies the required permission via alias, access is granted.
 * 
 * PART 10: Uses standard permission denied error format
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required', undefined, 'UNAUTHORIZED');
    }
    
    if (!hasPermissionViaAlias(req.user.permissions, permission)) {
      throw createPermissionDenied(permission);
    }
    next();
  };
}

/**
 * Require ANY ONE of the provided permissions (OR logic with alias support)
 * For backward compatibility during RBAC migration
 * Accepts: 'permission1' OR 'permission2' OR ...
 * 
 * A user satisfies this if they have ANY of the permissions directly
 * OR any permission that satisfies one of them via alias.
 * 
 * PART 10: Uses standard permission denied error format
 */
export function requirePermissionOr(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required', undefined, 'UNAUTHORIZED');
    }
    
    if (!hasAnyPermissionViaAlias(req.user.permissions, permissions)) {
      // Use the first permission in the list for the error
      throw createPermissionDenied(permissions[0], `Permission required: one of [${permissions.join(', ')}]`);
    }
    next();
  };
}

/**
 * Require ALL of the provided permissions (AND logic with alias support)
 * A user satisfies this if they have ALL of the permissions directly
 * OR any permission that satisfies each of them via alias.
 * 
 * PART 10: Uses standard permission denied error format
 */
export function requirePermissionAnd(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required', undefined, 'UNAUTHORIZED');
    }
    
    if (!hasAllPermissionsViaAlias(req.user.permissions, permissions)) {
      // Use the first permission in the list for the error
      throw createPermissionDenied(permissions[0], `Permission required: all of [${permissions.join(', ')}]`);
    }
    next();
  };
}

/**
 * Re-export alias utilities for convenience
 */
export { hasPermissionViaAlias, hasAnyPermissionViaAlias, hasAllPermissionsViaAlias } from '../common/permissionAliases.js';
