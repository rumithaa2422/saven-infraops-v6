import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

export const rolesRouter = Router();

// Get all permissions
// Supports both legacy (users:read) and new (roles:view) permissions
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

// Get all roles with permission count
// Supports both legacy (users:read) and new (roles:view) permissions
rolesRouter.get('/', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    const items = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissionCount: role._count.permissions,
      createdAt: role.createdAt
    }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Get single role with permissions
// Supports both legacy (users:read) and new (roles:view) permissions
rolesRouter.get('/:id', requireAuth, requirePermissionOr(['users:read', 'roles:view']), async (req, res, next) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
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

// Create role with permissions
// Supports both legacy (users:write) and new (roles:create, roles:manage) permissions
const createRoleSchema = z.object({
  name: z.string().min(1).max(191),
  description: z.string().optional(),
  permissions: z.array(z.string())
});

rolesRouter.post('/', requireAuth, requirePermissionOr(['users:write', 'roles:create', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = createRoleSchema.parse(req.body);
    
    // Check for duplicate name
    const existing = await prisma.role.findUnique({ where: { name: payload.name } });
    if (existing) {
      throw new HttpError(400, 'A role with this name already exists');
    }

    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { code: { in: payload.permissions } }
    });

    // Create role with permissions in transaction
    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: payload.name,
          description: payload.description || null
        }
      });

      // Create role-permission mappings
      for (const permission of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId: newRole.id,
            permissionId: permission.id
          }
        });
      }

      return newRole;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'ROLE_CREATED',
        entityType: 'Role',
        entityId: role.id,
        newValue: { name: role.name, permissions: payload.permissions }
      }
    });

    res.status(201).json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: payload.permissions
    });
  } catch (error) {
    next(error);
  }
});

// Update role name and description
// Supports both legacy (users:write) and new (roles:manage) permissions
const updateRoleSchema = z.object({
  name: z.string().min(1).max(191),
  description: z.string().optional()
});

rolesRouter.patch('/:id', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updateRoleSchema.parse(req.body);

    // Check if role exists
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, 'Role not found');
    }

    // Check for duplicate name (excluding current role)
    const duplicate = await prisma.role.findFirst({
      where: { name: payload.name, id: { not: req.params.id } }
    });
    if (duplicate) {
      throw new HttpError(400, 'A role with this name already exists');
    }

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        name: payload.name,
        description: payload.description || null
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'ROLE_UPDATED',
        entityType: 'Role',
        entityId: role.id,
        oldValue: { name: existing.name, description: existing.description },
        newValue: { name: role.name, description: role.description }
      }
    });

    res.json({
      id: role.id,
      name: role.name,
      description: role.description
    });
  } catch (error) {
    next(error);
  }
});

// Update role permissions
// Supports both legacy (users:write) and new (roles:manage) permissions
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string())
});

rolesRouter.patch('/:id/permissions', requireAuth, requirePermissionOr(['users:write', 'roles:manage']), async (req, res, next) => {
  try {
    const payload = updatePermissionsSchema.parse(req.body);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissions: { include: { permission: true } } }
    });
    
    if (!existingRole) {
      throw new HttpError(404, 'Role not found');
    }

    // Get new permission IDs
    const permissions = await prisma.permission.findMany({
      where: { code: { in: payload.permissions } }
    });

    // Replace permissions in transaction
    const role = await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: req.params.id }
      });

      // Create new permissions
      for (const permission of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId: req.params.id,
            permissionId: permission.id
          }
        });
      }

      return tx.role.findUnique({
        where: { id: req.params.id },
        include: { permissions: { include: { permission: true } } }
      });
    });

    const oldPermissions = existingRole.permissions.map(rp => rp.permission.code);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'ROLE_PERMISSIONS_UPDATED',
        entityType: 'Role',
        entityId: req.params.id,
        oldValue: { permissions: oldPermissions },
        newValue: { permissions: payload.permissions }
      }
    });

    res.json({
      id: role!.id,
      name: role!.name,
      description: role!.description,
      permissions: role!.permissions.map(rp => rp.permission.code)
    });
  } catch (error) {
    next(error);
  }
});

// Delete role
// Supports both legacy (users:write) and new (roles:delete) permissions
rolesRouter.delete('/:id', requireAuth, requirePermissionOr(['users:write', 'roles:delete']), async (req, res, next) => {
  try {
    // Check if role exists and count assigned users
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true } } }
    });
    
    if (!role) {
      throw new HttpError(404, 'Role not found');
    }

    // Prevent deletion of Super Admin
    if (role.name === 'Super Admin') {
      throw new HttpError(400, 'Cannot delete the Super Admin role');
    }

    // Prevent deletion if users are assigned
    if (role._count.users > 0) {
      throw new HttpError(400, 'Cannot delete role because users are assigned to it.');
    }

    // Delete RolePermission records and role in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all RolePermission records for this role
      await tx.rolePermission.deleteMany({
        where: { roleId: req.params.id }
      });
      
      // Delete the role
      await tx.role.delete({
        where: { id: req.params.id }
      });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'ROLE_DELETED',
        entityType: 'Role',
        entityId: req.params.id,
        oldValue: { name: role.name, description: role.description }
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
