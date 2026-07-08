import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  permissions: string[];
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createRole(data: CreateRoleInput) {
  // Check for duplicate name
  const existing = await prisma.role.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new HttpError(400, 'A role with this name already exists');
  }

  // Get permission IDs
  const permissions = await prisma.permission.findMany({
    where: { code: { in: data.permissions } }
  });

  // Create role with permissions in transaction
  const role = await prisma.$transaction(async (tx: { role: { create: (arg0: { data: { name: string; description: string | null; }; }) => any; }; rolePermission: { create: (arg0: { data: { roleId: any; permissionId: any; }; }) => any; }; }) => {
    const newRole = await tx.role.create({
      data: {
        name: data.name,
        description: data.description || null
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
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role.id,
      newValue: { name: role.name, permissions: data.permissions }
    }
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: data.permissions
  };
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateRole(id: string, data: UpdateRoleInput) {
  // Check if role exists
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Role not found');
  }

  // Check for duplicate name (excluding current role)
  if (data.name) {
    const duplicate = await prisma.role.findFirst({
      where: { name: data.name, id: { not: id } }
    });
    if (duplicate) {
      throw new HttpError(400, 'A role with this name already exists');
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description !== undefined ? (data.description || null) : undefined
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: role.id,
      oldValue: { name: existing.name, description: existing.description },
      newValue: { name: role.name, description: role.description }
    }
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description
  };
}

export interface UpdateRolePermissionsInput {
  permissions: string[];
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateRolePermissions(id: string, data: UpdateRolePermissionsInput) {
  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } } }
  });

  if (!existingRole) {
    throw new HttpError(404, 'Role not found');
  }

  // Get new permission IDs
  const permissions = await prisma.permission.findMany({
    where: { code: { in: data.permissions } }
  });

  // Replace permissions in transaction
  const role = await prisma.$transaction(async (tx: { rolePermission: { deleteMany: (arg0: { where: { roleId: string; }; }) => any; create: (arg0: { data: { roleId: string; permissionId: any; }; }) => any; }; role: { findUnique: (arg0: { where: { id: string; }; include: { permissions: { include: { permission: boolean; }; }; }; }) => any; }; }) => {
    // Delete existing permissions
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    });

    // Create new permissions
    for (const permission of permissions) {
      await tx.rolePermission.create({
        data: {
          roleId: id,
          permissionId: permission.id
        }
      });
    }

    return tx.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
  });

  const oldPermissions = existingRole.permissions.map((rp: { permission: { code: any; }; }) => rp.permission.code);

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'Role',
      entityId: id,
      oldValue: { permissions: oldPermissions },
      newValue: { permissions: data.permissions }
    }
  });

  return {
    id: role!.id,
    name: role!.name,
    description: role!.description,
    permissions: role!.permissions.map((rp: { permission: { code: any; }; }) => rp.permission.code)
  };
}

export interface DeleteRoleInput {
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function deleteRole(id: string, data: DeleteRoleInput) {
  // Check if role exists and count assigned users
  const role = await prisma.role.findUnique({
    where: { id },
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
  await prisma.$transaction(async (tx: { rolePermission: { deleteMany: (arg0: { where: { roleId: string; }; }) => any; }; role: { delete: (arg0: { where: { id: string; }; }) => any; }; }) => {
    // Delete all RolePermission records for this role
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    });

    // Delete the role
    await tx.role.delete({
      where: { id }
    });
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: id,
      oldValue: { name: role.name, description: role.description }
    }
  });

  return { success: true };
}
