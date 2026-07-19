import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import {
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole
} from '../../services/role.service.js';
import {
  getGroupedPermissions,
  getRolePermissionsWithMetadata,
  getPermissionStats
} from '../../services/permissionMetadata.service.js';
import {
  updateRolePermissionsDelta,
  bulkUpdateRolePermissions
} from '../../services/rolePermission.service.js';

export const rolesRouter = Router();

// ============================================
// EXISTING ENDPOINTS (Backward Compatible)
// ============================================

rolesRouter.get('/permissions', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (_req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: 'asc' }
    });
    res.json({ items: permissions });
  } catch (error) {
    next(error);
  }
});

rolesRouter.get('/', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { permissions: true, users: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    const items = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissionCount: role._count.permissions,
      userCount: role._count.users
    }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

rolesRouter.get('/:id', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          include: { permission: true }
        }
      }
    });

    if (!role) {
      throw new HttpError(404, 'Role not found');
    }

    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(rp => rp.permission.code)
    });
  } catch (error) {
    next(error);
  }
});

const createRoleSchema = z.object({
  name: z.string().min(1).max(191),
  description: z.string().optional(),
  permissions: z.array(z.string())
});

rolesRouter.post('/', requireAuth, requirePermissionOr(['users:write', 'roles:create', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = createRoleSchema.parse(req.body);
    const role = await createRole({
      ...payload,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(191),
  description: z.string().optional()
});

rolesRouter.patch('/:id', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updateRoleSchema.parse(req.body);
    const id = req.params.id as string;
    const role = await updateRole(id, {
      ...payload,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.json(role);
  } catch (error) {
    next(error);
  }
});

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string())
});

rolesRouter.patch('/:id/permissions', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updatePermissionsSchema.parse(req.body);
    const id = req.params.id as string;
    const role = await updateRolePermissions(id, {
      ...payload,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.json(role);
  } catch (error) {
    next(error);
  }
});

rolesRouter.delete('/:id', requireAuth, requirePermissionOr(['users:write', 'roles:delete']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await deleteRole(id, {
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// NEW RBAC 2.0 ENDPOINTS
// ============================================

/**
 * GET /api/roles/permissions/stats
 * Get summary statistics for the permissions dashboard
 */
rolesRouter.get('/permissions/stats', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (_req, res, next) => {
  try {
    const stats = await getPermissionStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roles/permissions/modules
 * Get all permissions grouped by module with metadata
 */
rolesRouter.get('/permissions/modules', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (_req, res, next) => {
  try {
    const grouped = await getGroupedPermissions();
    res.json(grouped);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roles/:id/permissions/detailed
 * Get role permissions with full metadata for the new UI
 */
rolesRouter.get('/:id/permissions/detailed', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await getRolePermissionsWithMetadata(id);
    
    if (!result) {
      throw new HttpError(404, 'Role not found');
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/roles/:id/permissions/delta
 * Update role permissions using delta (only added/removed)
 */
const updatePermissionsDeltaSchema = z.object({
  added: z.array(z.string()).optional(),
  removed: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional()
}).refine(
  data => data.added !== undefined || data.removed !== undefined || data.permissions !== undefined,
  { message: 'At least one of added, removed, or permissions must be provided' }
);

rolesRouter.put('/:id/permissions/delta', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updatePermissionsDeltaSchema.parse(req.body);
    const id = req.params.id as string;
    
    const result = await updateRolePermissionsDelta(id, {
      ...payload,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/roles/:id/permissions/bulk
 * Bulk update role permissions (full replacement)
 */
rolesRouter.post('/:id/permissions/bulk', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updatePermissionsSchema.parse(req.body);
    const id = req.params.id as string;
    
    const result = await bulkUpdateRolePermissions(id, {
      permissions: payload.permissions,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/roles/:id/permissions/module/:moduleKey
 * Enable/disable all permissions for a specific module
 */
const updateModulePermissionsSchema = z.object({
  enabled: z.boolean(),
  permissions: z.array(z.string())
});

rolesRouter.put('/:id/permissions/module/:moduleKey', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { enabled, permissions } = updateModulePermissionsSchema.parse(req.body);
    
    const result = await updateRolePermissionsDelta(id, {
      added: enabled ? permissions : undefined,
      removed: !enabled ? permissions : undefined,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});
