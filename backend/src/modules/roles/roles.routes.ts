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

export const rolesRouter = Router();

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
        createdAt: true,
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
      userCount: role._count.users,
      createdAt: role.createdAt
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
        createdAt: true,
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
      permissions: role.permissions.map(rp => rp.permission.code),
      createdAt: role.createdAt
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
