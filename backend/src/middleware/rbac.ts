import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../common/httpError.js';

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}
