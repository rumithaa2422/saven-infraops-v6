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
  const existing = await prisma.role.findUnique({ where: { name: data.name.trim() } });
  if (existing) {
    throw new HttpError(400, 'A role with this name already exists');
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: data.permissions } }
  });

  const role = await prisma.$transaction(async (tx) => {
    const newRole = await tx.role.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isSystem: false,
        isActive: true,
        createdBy: data.actorEmail || null
      }
    });

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
    isSystem: role.isSystem,
    isActive: role.isActive,
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
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Role not found');
  }

  if (existing.isSystem) {
    throw new HttpError(400, 'System roles cannot be renamed');
  }

  if (data.name) {
    const duplicate = await prisma.role.findFirst({
      where: { name: data.name.trim(), id: { not: id } }
    });
    if (duplicate) {
      throw new HttpError(400, 'A role with this name already exists');
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      description: data.description !== undefined ? (data.description?.trim() || null) : undefined
    }
  });

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
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive
  };
}

export interface UpdateRoleStatusInput {
  isActive: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateRoleStatus(id: string, data: UpdateRoleStatusInput) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Role not found');
  }

  if (existing.isSystem) {
    throw new HttpError(400, 'System roles cannot be disabled');
  }

  const role = await prisma.role.update({
    where: { id },
    data: { isActive: data.isActive }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: data.isActive ? 'ROLE_ENABLED' : 'ROLE_DISABLED',
      entityType: 'Role',
      entityId: role.id,
      oldValue: { isActive: existing.isActive },
      newValue: { isActive: role.isActive }
    }
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive
  };
}

export interface CloneRoleInput {
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function cloneRole(id: string, data: CloneRoleInput) {
  const existing = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } } }
  });

  if (!existing) {
    throw new HttpError(404, 'Role not found');
  }

  let newName = `${existing.name} Copy`;
  let counter = 1;
  while (await prisma.role.findUnique({ where: { name: newName } })) {
    counter++;
    newName = `${existing.name} Copy ${counter}`;
  }

  const permissionCodes = existing.permissions.map((rp) => rp.permission.code);
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } }
  });

  const clonedRole = await prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: newName,
        description: existing.description,
        isSystem: false,
        isActive: true,
        createdBy: data.actorEmail || null
      }
    });

    for (const permission of permissions) {
      await tx.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }

    return role;
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ROLE_CLONED',
      entityType: 'Role',
      entityId: clonedRole.id,
      newValue: { 
        name: clonedRole.name, 
        clonedFrom: existing.name,
        permissions: permissionCodes 
      }
    }
  });

  return {
    id: clonedRole.id,
    name: clonedRole.name,
    description: clonedRole.description,
    isSystem: clonedRole.isSystem,
    isActive: clonedRole.isActive,
    permissionCount: permissions.length
  };
}

export interface UpdateRolePermissionsInput {
  permissions: string[];
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateRolePermissions(id: string, data: UpdateRolePermissionsInput) {
  const existingRole = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } } }
  });

  if (!existingRole) {
    throw new HttpError(404, 'Role not found');
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: data.permissions } }
  });
  
  const role = await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    });

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

  const oldPermissions = existingRole.permissions.map((rp) => rp.permission.code);

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
    isSystem: role!.isSystem,
    isActive: role!.isActive,
    permissions: role!.permissions.map((rp) => rp.permission.code)
  };
}

export interface DeleteRoleInput {
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function deleteRole(id: string, data: DeleteRoleInput) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } }
  });

  if (!role) {
    throw new HttpError(404, 'Role not found');
  }

  if (role.isSystem) {
    throw new HttpError(400, 'System roles cannot be deleted');
  }

  if (role._count.users > 0) {
    throw new HttpError(400, `Cannot delete role because ${role._count.users} user(s) are assigned to it.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    });

    await tx.role.delete({
      where: { id }
    });
  });

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

export async function getRoleUsers(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId }
  });

  if (!role) {
    throw new HttpError(404, 'Role not found');
  }

  const users = await prisma.userRole.findMany({
    where: { roleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          createdAt: true
        }
      }
    }
  });

  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description
    },
    users: users.map((ur) => ({
      id: ur.user.id,
      name: ur.user.name,
      email: ur.user.email,
      department: ur.user.department,
      status: ur.user.status,
      assignedAt: ur.createdAt
    })),
    totalCount: users.length
  };
}
