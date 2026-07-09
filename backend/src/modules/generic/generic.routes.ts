import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import {
  createIncident,
  updateIncident,
  createProblem,
  updateProblem,
  createChangeRequest,
  updateChangeRequest,
  createAsset,
  updateAsset,
  createAccessRequest,
  updateAccessRequest,
  createComplianceControl,
  updateComplianceControl,
  createProjectEnvironment,
  updateProjectEnvironment,
  createVendorLicense,
  updateVendorLicense,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  createUser,
  updateUser,
  deleteUser
} from '../../services/index.js';

export const genericModuleRouter = Router();

/**
 * Module configuration with permission support for RBAC migration
 * Supports both legacy (old) and new permissions for backward compatibility
 */
type ModuleConfig = {
  permission: string;
  writePermission?: string;
  deletePermission?: string;
  viewPermission?: string;
  createPermission?: string;
  managePermission?: string;
  exportPermission?: string;
  entityType: string;
  list: () => Promise<unknown[]>;
  create?: (payload: any, actor?: { id?: string; email?: string }, ip?: string) => Promise<unknown>;
  update?: (id: string, payload: any, actor?: { id?: string; email?: string }, ip?: string) => Promise<unknown>;
};

const moduleMap: Record<string, ModuleConfig> = {
  incidents: {
    permission: 'incidents:read',
    writePermission: 'incidents:write',
    viewPermission: 'incidents:view',
    createPermission: 'incidents:create',
    managePermission: 'incidents:manage',
    exportPermission: 'incidents:export',
    entityType: 'Incident',
    list: () => prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createIncident({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateIncident(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  problems: {
    permission: 'incidents:read',
    writePermission: 'incidents:write',
    viewPermission: 'problems:view',
    createPermission: 'problems:create',
    managePermission: 'problems:manage',
    exportPermission: 'problems:export',
    entityType: 'Problem',
    list: () => prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createProblem({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateProblem(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  changes: {
    permission: 'changes:read',
    writePermission: 'changes:approve',
    viewPermission: 'changes:view',
    createPermission: 'changes:create',
    managePermission: 'changes:manage',
    exportPermission: 'changes:export',
    entityType: 'ChangeRequest',
    list: () => prisma.changeRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createChangeRequest({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateChangeRequest(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  inventory: {
    permission: 'inventory:read',
    writePermission: 'inventory:write',
    viewPermission: 'inventory:view',
    createPermission: 'inventory:create',
    managePermission: 'inventory:manage',
    exportPermission: 'inventory:export',
    entityType: 'Asset',
    list: () => prisma.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createAsset({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateAsset(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'access-management': {
    permission: 'access:read',
    writePermission: 'access:approve',
    viewPermission: 'access:view',
    createPermission: 'access:request',
    managePermission: 'access:approve',
    exportPermission: 'access:export',
    entityType: 'AccessRequest',
    list: () => prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createAccessRequest({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateAccessRequest(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  compliance: {
    permission: 'compliance:read',
    writePermission: 'compliance:write',
    viewPermission: 'compliance:view',
    createPermission: 'compliance:create',
    managePermission: 'compliance:manage',
    exportPermission: 'compliance:export',
    entityType: 'ComplianceControl',
    list: () => prisma.complianceControl.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createComplianceControl({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateComplianceControl(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'projects-environments': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    viewPermission: 'projects:view',
    createPermission: 'projects:create',
    managePermission: 'projects:manage',
    exportPermission: 'projects:export',
    entityType: 'ProjectEnvironment',
    list: () => prisma.projectEnvironment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createProjectEnvironment({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateProjectEnvironment(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'vendors-licenses': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    viewPermission: 'vendors:view',
    createPermission: 'vendors:create',
    managePermission: 'vendors:manage',
    exportPermission: 'vendors:export',
    entityType: 'VendorLicense',
    list: () => prisma.vendorLicense.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createVendorLicense({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateVendorLicense(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'knowledge-base': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    viewPermission: 'kb:view',
    createPermission: 'kb:create',
    managePermission: 'kb:manage',
    exportPermission: 'kb:export',
    entityType: 'KnowledgeBaseArticle',
    list: () => prisma.knowledgeBaseArticle.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createKnowledgeBaseArticle({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateKnowledgeBaseArticle(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'users-teams': {
    permission: 'users:read',
    writePermission: 'users:write',
    deletePermission: 'users:delete',
    viewPermission: 'users:view',
    createPermission: 'users:create',
    managePermission: 'users:manage',
    exportPermission: 'users:export',
    entityType: 'User',
    list: () => prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        phoneNumber: true, 
        department: true, 
        status: true, 
        createdAt: true, 
        updatedAt: true,
        roles: {
          include: {
            role: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    create: async (payload, actor, ip) => createUser({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateUser(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'reports-analytics': {
    permission: 'dashboard:read',
    writePermission: 'dashboard:read',
    viewPermission: 'reports:view',
    createPermission: 'reports:create',
    managePermission: 'reports:create',
    exportPermission: 'reports:export',
    entityType: 'Report',
    list: async () => [
      { id: 'ticket-aging', title: 'Ticket Ageing Report', description: 'Open service requests by priority and owner', owner: 'Admin Team' },
      { id: 'sla-breach', title: 'SLA Breach Report', description: 'SLA breaches across service requests and incidents', owner: 'Delivery Team' },
      { id: 'compliance-status', title: 'Compliance Status Report', description: 'Open, overdue, and completed compliance controls', owner: 'InfoSec Team' }
    ],
    create: async (payload) => ({ id: `custom-${Date.now()}`, ...payload })
  }
};

// Roles endpoint for user management
genericModuleRouter.get('/roles', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['users:read', 'roles:view'])(req, res, (err) => err ? reject(err) : resolve())
    );
    const items = await prisma.role.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: 'asc' } });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET - List records (view permission)
genericModuleRouter.get('/:module', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const config = moduleMap[moduleName];
    if (!config) return next();

    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([config.permission, config.viewPermission || config.permission])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Handle search for users-teams module
    const search = req.query.search as string | undefined;
    let items: unknown[];

    // Common select for users with roles included
    const userSelect = {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      department: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: {
            select: { name: true }
          }
        }
      }
    };

    if (moduleName === 'users-teams' && search) {
      // Search users by name, email, or phoneNumber
      items = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phoneNumber: { contains: search } }
          ]
        },
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } else if (moduleName === 'users-teams') {
      // Default list for users-teams without search
      items = await prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } else {
      items = await config.list();
    }

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// POST - Create record (create permission)
genericModuleRouter.post('/:module', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const config = moduleMap[moduleName];
    if (!config?.create) return next();

    const legacyPerm = config.writePermission || config.permission;
    const newPerm = config.createPermission || legacyPerm;
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([legacyPerm, newPerm])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Services handle their own audit logging
    const item = await config.create(req.body, { id: req.user?.id, email: req.user?.email }, req.ip);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// PATCH - Update record (manage permission)
genericModuleRouter.patch('/:module/:id', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const config = moduleMap[moduleName];
    if (!config?.update) return next();

    const legacyPerm = config.writePermission || config.permission;
    const newPerm = config.managePermission || legacyPerm;
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([legacyPerm, newPerm])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Services handle their own audit logging
    const id = req.params.id as string;
    const item = await config.update(id, req.body, { id: req.user?.id, email: req.user?.email }, req.ip);
    res.json({ item });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Update failed'));
  }
});

// DELETE - Delete record (delete permission)
genericModuleRouter.delete('/:module/:id', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const config = moduleMap[moduleName];

    if (moduleName !== 'users-teams') {
      return next();
    }

    const deletePermission = config?.deletePermission;
    if (!deletePermission) {
      throw new HttpError(403, 'Delete permission not configured for this module');
    }

    await new Promise<void>((resolve, reject) =>
      requirePermission(deletePermission)(req, res, (err) => err ? reject(err) : resolve())
    );

    // Use the user service for deletion
    const id = req.params.id as string;
    if (!id) {
      throw new HttpError(400, 'ID is required');
    }
    const result = await deleteUser(id, {
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });

    res.json(result);
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Delete failed'));
  }
});
