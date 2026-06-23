import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../common/httpError.js';

/**
 * Require a single permission (exact match)
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}

/**
 * Require ANY ONE of the provided permissions (OR logic)
 * For backward compatibility during RBAC migration
 * Accepts: 'permission1' OR 'permission2' OR ...
 */
export function requirePermissionOr(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    
    const hasAnyPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );
    
    if (!hasAnyPermission) {
      throw new HttpError(403, `Permission required: one of [${permissions.join(', ')}]`);
    }
    next();
  };
}

/**
 * Require ALL of the provided permissions (AND logic)
 */
export function requirePermissionAnd(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    
    const hasAllPermissions = permissions.every(permission => 
      req.user!.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      throw new HttpError(403, `Permission required: all of [${permissions.join(', ')}]`);
    }
    next();
  };
}
