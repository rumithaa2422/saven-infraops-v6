/**
 * Role Permission Service
 * 
 * Handles role permission management with delta updates and audit logging.
 * Only sends/changes the permissions that were actually modified.
 */

import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UpdatePermissionsDelta {
  added: string[];
  removed: string[];
}

export interface RolePermissionUpdateInput {
  added?: string[];
  removed?: string[];
  permissions?: string[]; // Full replacement (alternative to delta)
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export interface RolePermissionResult {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  addedPermissions: string[];
  removedPermissions: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function computeDelta(current: Set<string>, target: string[]): UpdatePermissionsDelta {
  const targetSet = new Set(target);
  const added: string[] = [];
  const removed: string[] = [];
  
  for (const perm of target) {
    if (!current.has(perm)) {
      added.push(perm);
    }
  }
  
  for (const perm of current) {
    if (!targetSet.has(perm)) {
      removed.push(perm);
    }
  }
  
  return { added, removed };
}

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Get current permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  
  if (!role) {
    throw new HttpError(404, 'Role not found');
  }
  
  return role.permissions.map(rp => rp.permission.code);
}

/**
 * Update role permissions using delta (only changed permissions)
 */
export async function updateRolePermissionsDelta(
  roleId: string,
  data: RolePermissionUpdateInput
): Promise<RolePermissionResult> {
  // Get current role with permissions
  const existingRole = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  
  if (!existingRole) {
    throw new HttpError(404, 'Role not found');
  }
  
  const currentPermissions = new Set(existingRole.permissions.map(rp => rp.permission.code));
  let added: string[] = [];
  let removed: string[] = [];
  let newPermissions: string[];
  
  if (data.permissions !== undefined) {
    // Full replacement - compute delta
    const delta = computeDelta(currentPermissions, data.permissions);
    added = delta.added;
    removed = delta.removed;
    newPermissions = data.permissions;
  } else {
    // Delta update - apply added/removed
    added = data.added || [];
    removed = data.removed || [];
    
    // Validate that removed permissions exist
    for (const perm of removed) {
      if (!currentPermissions.has(perm)) {
        throw new HttpError(400, `Permission '${perm}' is not currently assigned to this role`);
      }
    }
    
    // Validate that added permissions exist in database
    const validPermissions = await prisma.permission.findMany({
      where: { code: { in: added } },
      select: { code: true }
    });
    const validCodes = new Set(validPermissions.map(p => p.code));
    
    for (const perm of added) {
      if (!validCodes.has(perm)) {
        throw new HttpError(400, `Permission '${perm}' does not exist`);
      }
    }
    
    // Build new permission set
    newPermissions = [...currentPermissions];
    for (const perm of removed) {
      const idx = newPermissions.indexOf(perm);
      if (idx !== -1) newPermissions.splice(idx, 1);
    }
    for (const perm of added) {
      if (!newPermissions.includes(perm)) {
        newPermissions.push(perm);
      }
    }
  }
  
  // If nothing changed, return early
  if (added.length === 0 && removed.length === 0) {
    return {
      id: existingRole.id,
      name: existingRole.name,
      description: existingRole.description,
      permissions: [...currentPermissions],
      addedPermissions: [],
      removedPermissions: []
    };
  }
  
  // Get permission records for new permissions
  const permissions = await prisma.permission.findMany({
    where: { code: { in: newPermissions } }
  });
  
  // Update in transaction
  const updatedRole = await prisma.$transaction(async (tx) => {
    // Delete all existing role permissions
    await tx.rolePermission.deleteMany({
      where: { roleId }
    });
    
    // Create new role permissions
    for (const permission of permissions) {
      await tx.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id
        }
      });
    }
    
    // Get updated role
    return tx.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  });
  
  // Create audit logs for each permission change
  if (added.length > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: data.actorId || null,
        actorEmail: data.actorEmail || null,
        action: 'ROLE_PERMISSION_ADDED',
        entityType: 'Role',
        entityId: roleId,
        newValue: { 
          roleName: existingRole.name,
          addedPermissions: added 
        }
      }
    });
  }
  
  if (removed.length > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: data.actorId || null,
        actorEmail: data.actorEmail || null,
        action: 'ROLE_PERMISSION_REMOVED',
        entityType: 'Role',
        entityId: roleId,
        oldValue: { 
          roleName: existingRole.name,
          removedPermissions: removed 
        }
      }
    });
  }
  
  return {
    id: updatedRole!.id,
    name: updatedRole!.name,
    description: updatedRole!.description,
    permissions: updatedRole!.permissions.map(rp => rp.permission.code),
    addedPermissions: added,
    removedPermissions: removed
  };
}

/**
 * Bulk update permissions for a role (full replacement)
 */
export async function bulkUpdateRolePermissions(
  roleId: string,
  data: RolePermissionUpdateInput
): Promise<RolePermissionResult> {
  if (!data.permissions) {
    throw new HttpError(400, 'Permissions array is required for bulk update');
  }
  
  return updateRolePermissionsDelta(roleId, {
    permissions: data.permissions,
    actorId: data.actorId,
    actorEmail: data.actorEmail,
    ipAddress: data.ipAddress
  });
}

/**
 * Enable a single permission for a role
 */
export async function enablePermission(
  roleId: string,
  permissionCode: string,
  actor?: { id?: string | null; email?: string | null }
): Promise<RolePermissionResult> {
  return updateRolePermissionsDelta(roleId, {
    added: [permissionCode],
    actorId: actor?.id,
    actorEmail: actor?.email
  });
}

/**
 * Disable a single permission for a role
 */
export async function disablePermission(
  roleId: string,
  permissionCode: string,
  actor?: { id?: string | null; email?: string | null }
): Promise<RolePermissionResult> {
  return updateRolePermissionsDelta(roleId, {
    removed: [permissionCode],
    actorId: actor?.id,
    actorEmail: actor?.email
  });
}

/**
 * Enable all permissions in a module for a role
 */
export async function enableModulePermissions(
  roleId: string,
  moduleKey: string,
  permissions: string[],
  actor?: { id?: string | null; email?: string | null }
): Promise<RolePermissionResult> {
  const currentPermissions = await getRolePermissions(roleId);
  const currentSet = new Set(currentPermissions);
  
  const toAdd = permissions.filter(p => !currentSet.has(p));
  
  if (toAdd.length === 0) {
    return {
      id: roleId,
      name: '',
      description: null,
      permissions: currentPermissions,
      addedPermissions: [],
      removedPermissions: []
    };
  }
  
  return updateRolePermissionsDelta(roleId, {
    added: toAdd,
    actorId: actor?.id,
    actorEmail: actor?.email
  });
}

/**
 * Disable all permissions in a module for a role
 */
export async function disableModulePermissions(
  roleId: string,
  moduleKey: string,
  permissions: string[],
  actor?: { id?: string | null; email?: string | null }
): Promise<RolePermissionResult> {
  const currentPermissions = await getRolePermissions(roleId);
  const permSet = new Set(permissions);
  
  const toRemove = currentPermissions.filter(p => permSet.has(p));
  
  if (toRemove.length === 0) {
    return {
      id: roleId,
      name: '',
      description: null,
      permissions: currentPermissions,
      addedPermissions: [],
      removedPermissions: []
    };
  }
  
  return updateRolePermissionsDelta(roleId, {
    removed: toRemove,
    actorId: actor?.id,
    actorEmail: actor?.email
  });
}

/**
 * Get permission audit history for a role
 */
export async function getRolePermissionHistory(
  roleId: string,
  limit: number = 50
): Promise<any[]> {
  const role = await prisma.role.findUnique({
    where: { id: roleId }
  });
  
  if (!role) {
    throw new HttpError(404, 'Role not found');
  }
  
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: 'Role',
      entityId: roleId,
      action: {
        in: ['ROLE_PERMISSIONS_UPDATED', 'ROLE_PERMISSION_ADDED', 'ROLE_PERMISSION_REMOVED']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return logs;
}
