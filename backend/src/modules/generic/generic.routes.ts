import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { env } from '../../config/env.js';
import { promises as fs } from 'fs';
import multer from 'multer';
import path from 'path';
import {
  createIncident,
  updateIncident,
  updateIncidentStatus,
  createProblem,
  updateProblem,
  createChangeRequest,
  updateChangeRequest,
  updateChangeStatus,
  createAsset,
  updateAsset,
  updateAssetStatus,
  createAccessRequest,
  updateAccessRequest,
  updateAccessStatus,
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
import { ProjectDocumentService } from '../../services/projectDocument.service.js';
import { ProjectActivityService, PROJECT_ACTIVITY_TYPES } from '../../services/projectActivity.service.js';

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
    deletePermission: 'incidents:manage',
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
    deletePermission: 'problems:manage',
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
    deletePermission: 'changes:manage',
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
    deletePermission: 'inventory:manage',
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
    deletePermission: 'access:manage',
    viewPermission: 'access:view',
    createPermission: 'access:request',
    managePermission: 'access:approve',
    exportPermission: 'access:export',
    entityType: 'AccessRequest',
    list: () => prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload, actor, ip) => createAccessRequest({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateAccessRequest(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  // NOTE: 'compliance' module uses dedicated routes at /api/compliance for PDF document management
  'projects-environments': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    deletePermission: 'projects:manage',
    viewPermission: 'projects:view',
    createPermission: 'projects:create',
    managePermission: 'projects:manage',
    exportPermission: 'projects:export',
    entityType: 'ProjectEnvironment',
    list: async () => {
      const projects = await prisma.projectEnvironment.findMany({ 
        orderBy: { createdAt: 'desc' }, 
        take: 100 
      });
      // Fetch all users for manager and team member enrichment
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, department: true, roles: { include: { role: { select: { name: true } } } } }
      });
      // Enrich projects with manager and team member data
      return projects.map(project => {
        const manager = project.managerId ? users.find(u => u.id === project.managerId) : null;
        let teamMembers: typeof users = [];
        if (project.teamMemberIds) {
          try {
            const memberIds = JSON.parse(project.teamMemberIds);
            teamMembers = users.filter(u => memberIds.includes(u.id));
          } catch {
            teamMembers = [];
          }
        }
        return {
          ...project,
          manager,
          teamMembers
        };
      });
    },
    create: async (payload, actor, ip) => createProjectEnvironment({ ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip }),
    update: async (id, payload, actor, ip) => updateProjectEnvironment(id, { ...payload, actorId: actor?.id, actorEmail: actor?.email, ipAddress: ip })
  },
  'vendors-licenses': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    deletePermission: 'vendors:manage',
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
    deletePermission: 'kb:manage',
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

// GET /:module/:id - Get single record by ID
genericModuleRouter.get('/:module/:id', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const config = moduleMap[moduleName];
    if (!config) return next();

    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([config.permission, config.viewPermission || config.permission])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    let item;

    switch (moduleName) {
      case 'incidents':
        item = await prisma.incident.findUnique({ where: { id } });
        break;
      case 'problems':
        item = await prisma.problem.findUnique({ where: { id } });
        break;
      case 'changes':
        item = await prisma.changeRequest.findUnique({ where: { id } });
        break;
      case 'inventory':
        item = await prisma.asset.findUnique({ where: { id } });
        break;
      case 'access-management':
        item = await prisma.accessRequest.findUnique({ where: { id } });
        break;
      case 'projects-environments': {
        const project = await prisma.projectEnvironment.findUnique({ where: { id } });
        if (project) {
          // Fetch manager and team members
          const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, department: true, roles: { include: { role: { select: { name: true } } } } }
          });
          const manager = project.managerId ? users.find(u => u.id === project.managerId) : null;
          let teamMembers: typeof users = [];
          if (project.teamMemberIds) {
            try {
              const memberIds = JSON.parse(project.teamMemberIds);
              teamMembers = users.filter(u => memberIds.includes(u.id));
            } catch {
              teamMembers = [];
            }
          }
          item = { ...project, manager, teamMembers };
        } else {
          item = null;
        }
        break;
      }
      case 'vendors-licenses':
        item = await prisma.vendorLicense.findUnique({ where: { id } });
        break;
      case 'knowledge-base':
        item = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
        break;
      default:
        return next();
    }

    if (!item) {
      throw new HttpError(404, `${moduleName.slice(0, -1)} not found`);
    }

    res.json({ item });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(500, 'Failed to fetch record'));
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
    const id = req.params.id as string;
    const config = moduleMap[moduleName];

    if (!id) {
      throw new HttpError(400, 'ID is required');
    }

    // Special handling for users-teams (uses soft delete service)
    if (moduleName === 'users-teams') {
      const deletePermission = config?.deletePermission;
      if (deletePermission) {
        await new Promise<void>((resolve, reject) =>
          requirePermission(deletePermission)(req, res, (err) => err ? reject(err) : resolve())
        );
      }
      const result = await deleteUser(id, {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        ipAddress: req.ip
      });
      res.json(result);
      return;
    }

    // For other modules, check delete permission
    const deletePermission = config?.deletePermission;
    if (deletePermission) {
      await new Promise<void>((resolve, reject) =>
        requirePermission(deletePermission)(req, res, (err) => err ? reject(err) : resolve())
      );
    }

    // Map module names to Prisma model operations
    const deleteHandlers: Record<string, () => Promise<unknown>> = {
      'incidents': () => prisma.incident.delete({ where: { id } }),
      'problems': () => prisma.problem.delete({ where: { id } }),
      'changes': () => prisma.changeRequest.delete({ where: { id } }),
      'inventory': () => prisma.asset.delete({ where: { id } }),
      'access-management': () => prisma.accessRequest.delete({ where: { id } }),
      'projects-environments': () => prisma.projectEnvironment.delete({ where: { id } }),
      'vendors-licenses': () => prisma.vendorLicense.delete({ where: { id } }),
      'knowledge-base': () => prisma.knowledgeBaseArticle.delete({ where: { id } }),
    };

    const deleteHandler = deleteHandlers[moduleName];
    if (!deleteHandler) {
      throw new HttpError(400, `"'Delete not supported for module: '"`);
    }

    // Check if record exists first
    const entityType = config?.entityType;
    let existing;
    switch (moduleName) {
      case 'incidents': existing = await prisma.incident.findUnique({ where: { id } }); break;
      case 'problems': existing = await prisma.problem.findUnique({ where: { id } }); break;
      case 'changes': existing = await prisma.changeRequest.findUnique({ where: { id } }); break;
      case 'inventory': existing = await prisma.asset.findUnique({ where: { id } }); break;
      case 'access-management': existing = await prisma.accessRequest.findUnique({ where: { id } }); break;
      case 'projects-environments': existing = await prisma.projectEnvironment.findUnique({ where: { id } }); break;
      case 'vendors-licenses': existing = await prisma.vendorLicense.findUnique({ where: { id } }); break;
      case 'knowledge-base': existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } }); break;
    }

    if (!existing) {
      throw new HttpError(404, `"'Record not found'"`);
    }

    // Delete the record
    const deleted = await deleteHandler();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'DELETE',
        entityType: entityType || moduleName,
        entityId: id,
        oldValue: existing as any,
        ipAddress: req.ip || null
      }
    });

    res.json({ success: true, deleted });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Delete failed'));
  }
});

// ============================================================================
// STATUS UPDATE ENDPOINTS
// ============================================================================

// PATCH /:module/:id/status - Update status for modules with status workflows
genericModuleRouter.patch('/:module/:id/status', requireAuth, async (req, res, next) => {
  try {
    const moduleName = req.params.module as string;
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      throw new HttpError(400, 'Status is required');
    }

    const actor = { id: req.user?.id, email: req.user?.email };

    let item;
    switch (moduleName) {
      case 'incidents':
        await new Promise<void>((resolve, reject) =>
          requirePermissionOr(['incidents:manage', 'incidents:write'])(req, res, (err) => err ? reject(err) : resolve())
        );
        item = await updateIncidentStatus(id, { status, ...actor, ipAddress: req.ip });
        break;

      case 'changes':
        await new Promise<void>((resolve, reject) =>
          requirePermissionOr(['changes:approve', 'changes:manage'])(req, res, (err) => err ? reject(err) : resolve())
        );
        item = await updateChangeStatus(id, { status, ...actor, ipAddress: req.ip });
        break;

      case 'inventory':
        await new Promise<void>((resolve, reject) =>
          requirePermissionOr(['inventory:manage', 'inventory:write'])(req, res, (err) => err ? reject(err) : resolve())
        );
        item = await updateAssetStatus(id, { status, ...actor, ipAddress: req.ip });
        break;

      case 'access-management':
        await new Promise<void>((resolve, reject) =>
          requirePermissionOr(['access:approve', 'access:manage'])(req, res, (err) => err ? reject(err) : resolve())
        );
        item = await updateAccessStatus(id, { status, ...actor, ipAddress: req.ip });
        break;

      case 'problems':
        await new Promise<void>((resolve, reject) =>
          requirePermissionOr(['problems:manage', 'problems:write'])(req, res, (err) => err ? reject(err) : resolve())
        );
        // Use the existing update function with status
        item = await updateProblem(id, { status, ...actor, ipAddress: req.ip });
        break;

      default:
        throw new HttpError(400, 'Status updates not supported for this module');
    }

    res.json({ item });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Status update failed'));
  }
});

// ============================================
// Incident-Specific Routes
// ============================================

// GET /incidents/:id - Get single incident
genericModuleRouter.get('/incidents/:id', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await prisma.incident.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, 'Incident not found');
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// PATCH /incidents/:id/ownership - Take ownership
genericModuleRouter.patch('/incidents/:id/ownership', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const userRoles = req.user?.roles || [];
    
    // Only Admin and Super Admin can take ownership
    const isAdmin = userRoles.includes('Admin');
    const isSuperAdmin = userRoles.includes('Super Admin');
    
    if (!isAdmin && !isSuperAdmin) {
      throw new HttpError(403, 'Only Admin and Super Admin can take ownership');
    }
    
    // Use the current logged-in user's name as the owner
    const ownerName = req.user?.name;
    
    if (!ownerName) {
      throw new HttpError(400, 'Unable to determine user name for ownership');
    }
    
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Incident not found');
    
    if (existing.ownerName) {
      throw new HttpError(400, 'Incident is already assigned to someone');
    }
    
    const item = await prisma.incident.update({
      where: { id },
      data: { ownerName }
    });
    
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// GET /incidents/:id/timeline - Get incident timeline (returns basic info from incident record)
// Timeline entries are generated on the frontend based on incident state
genericModuleRouter.get('/incidents/:id/timeline', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    // Return empty timeline - frontend will build timeline from incident data
    res.json({ timeline: [] });
  } catch (error) {
    next(error);
  }
});

// PATCH /incidents/:id/status - Update incident status (owner only, forward transitions only)
genericModuleRouter.patch('/incidents/:id/status', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      throw new HttpError(400, 'Status is required');
    }
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    // Check if user is the assigned owner
    const isOwner = incident.ownerName === req.user?.name;
    
    if (!isOwner) {
      throw new HttpError(403, 'Only the assigned owner can change the status');
    }
    
    const newStatus = status.toUpperCase();
    const currentStatus = incident.status;
    
    // Valid status transitions (forward only)
    const validTransitions: Record<string, string[]> = {
      'OPEN': ['IN_PROGRESS'],
      'IN_PROGRESS': ['RESOLVED'],
      'RESOLVED': ['CLOSED'],
      'CLOSED': [] // No transitions from CLOSED
    };
    
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new HttpError(400, `Invalid status transition. From ${currentStatus}, you can only move to: ${allowedNextStatuses.join(', ') || 'none'}`);
    }
    
    const now = new Date();
    
    // Update incident with new status and tracking fields
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
        statusChangedAt: now,
        statusChangedBy: req.user?.name || null
      }
    });
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'STATUS_CHANGE',
        entityType: 'Incident',
        entityId: incident.id,
        oldValue: { status: currentStatus },
        newValue: { status: newStatus },
        ipAddress: req.ip || null
      }
    });
    
    res.json({ item: updatedIncident });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Status update failed'));
  }
});

// ============================================
// Incident Resolution Document Routes
// ============================================

// Ensure resolution document directory exists
async function ensureResolutionDocDir() {
  const dir = path.join(process.cwd(), 'uploads', 'resolution-docs');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  return dir;
}

// Configure multer for resolution document uploads
const resolutionStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = await ensureResolutionDocDir();
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resolution-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_RESOLUTION_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const ALLOWED_RESOLUTION_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

const resolutionDocFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_RESOLUTION_DOC_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed: pdf, doc, docx, txt'));
  }
};

const resolutionUpload = multer({
  storage: resolutionStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 1
  },
  fileFilter: resolutionDocFilter
});

// Helper to check if user can upload resolution document
function canUploadResolutionDoc(user: Express.Request['user'], incident: { ownerName?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can upload only if they own the incident
  if (user.roles.includes('Super Admin')) {
    return incident.ownerName === user.name;
  }
  
  // Admin can upload only if they own the incident
  if (user.roles.includes('Admin')) {
    return incident.ownerName === user.name;
  }
  
  // Employees cannot upload
  return false;
}

// GET /incidents/:id/resolution-document - Get resolution document
genericModuleRouter.get('/incidents/:id/resolution-document', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    const document = await prisma.incidentResolutionDocument.findUnique({
      where: { incidentId: id }
    });
    
    if (!document) {
      return res.json({ document: null });
    }
    
    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// POST /incidents/:id/resolution-document - Upload resolution document
genericModuleRouter.post('/incidents/:id/resolution-document', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    if (!canUploadResolutionDoc(req.user, incident)) {
      throw new HttpError(403, 'Only the assigned owner can upload the resolution document');
    }
    
    resolutionUpload.single('file')(req, res, async (err) => {
      if (err) {
        if (err.message && err.message.includes('File type not allowed')) {
          return res.status(400).json({ error: err.message });
        }
        if (err.message && err.message.includes('File too large')) {
          return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }
      
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Delete existing resolution document if any
      const existing = await prisma.incidentResolutionDocument.findUnique({
        where: { incidentId: id }
      });
      
      const now = new Date();
      
      if (existing) {
        // Delete old file from disk
        const oldFilePath = path.join(process.cwd(), 'uploads', 'resolution-docs', existing.storedName);
        try {
          await fs.unlink(oldFilePath);
        } catch {}
        
        // Delete old record
        await prisma.incidentResolutionDocument.delete({
          where: { id: existing.id }
        });
        
        // Update incident to track replacement
        await prisma.incident.update({
          where: { id },
          data: { resolutionDocReplacedAt: now }
        });
      } else {
        // First upload - track initial upload time
        await prisma.incident.update({
          where: { id },
          data: { resolutionDocUploadedAt: now }
        });
      }
      
      // Create new resolution document record
      const document = await prisma.incidentResolutionDocument.create({
        data: {
          incidentId: id,
          fileName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedBy: req.user?.id || null,
          uploadedByName: req.user?.name || null
        }
      });
      
      res.status(201).json({ document });
    });
  } catch (error) {
    next(error);
  }
});

// GET /incidents/:id/resolution-document/download - Download resolution document
genericModuleRouter.get('/incidents/:id/resolution-document/download', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    const document = await prisma.incidentResolutionDocument.findUnique({
      where: { incidentId: id }
    });
    
    if (!document) {
      throw new HttpError(404, 'Resolution document not found');
    }
    
    const filePath = path.join(process.cwd(), 'uploads', 'resolution-docs', document.storedName);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'File not found on server');
    }
    
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});

// DELETE /incidents/:id/resolution-document - Delete resolution document
genericModuleRouter.delete('/incidents/:id/resolution-document', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpError(404, 'Incident not found');
    
    // Only the owner can delete
    if (!canUploadResolutionDoc(req.user, incident)) {
      throw new HttpError(403, 'Only the assigned owner can delete the resolution document');
    }
    
    const document = await prisma.incidentResolutionDocument.findUnique({
      where: { incidentId: id }
    });
    
    if (!document) {
      throw new HttpError(404, 'Resolution document not found');
    }
    
    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'resolution-docs', document.storedName);
    try {
      await fs.unlink(filePath);
    } catch {}
    
    // Delete from database
    await prisma.incidentResolutionDocument.delete({
      where: { id: document.id }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Configure multer for project documents
const projectDocStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const projectId = req.params.id;
    const uploadDir = path.join(process.cwd(), 'uploads', 'project-docs', projectId);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const projectDocUpload = multer({
  storage: projectDocStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// GET /projects-environments/:id/documents - List documents
genericModuleRouter.get('/projects-environments/:id/documents', requireAuth, async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { search, sortBy, sortOrder } = req.query;

    const project = await prisma.projectEnvironment.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found');

    const result = await ProjectDocumentService.list(projectId, {
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /projects-environments/:id/documents - Upload document
genericModuleRouter.post('/projects-environments/:id/documents', requireAuth, requirePermission('projects:manage'), projectDocUpload.single('file'), async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const project = await prisma.projectEnvironment.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found');

    if (!req.file) throw new HttpError(400, 'No file uploaded');

    const file = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    const validation = ProjectDocumentService.validateFile({
      mimeType: file.mimeType,
      originalName: file.originalName,
      size: file.size
    });

    if (!validation.valid) throw new HttpError(400, validation.error!);

    const uploadedBy = req.user?.name || req.user?.email || 'Unknown';
    const remarks = req.body.remarks || undefined;

    const document = await ProjectDocumentService.upload(projectId, file, uploadedBy, remarks);

    // Create activity for document upload
    await prisma.projectActivity.create({
      data: {
        projectId,
        activityType: 'DOCUMENT_UPLOADED',
        title: 'Document Uploaded',
        description: `Document "${file.originalName}" was uploaded`,
        performedBy: uploadedBy,
        performedAt: new Date()
      }
    });

    res.json({ document, success: true });
  } catch (error) {
    next(error);
  }
});

// GET /projects-environments/:id/documents/:docId - Download document
genericModuleRouter.get('/projects-environments/:id/documents/:docId', requireAuth, async (req, res, next) => {
  try {
    const { id: projectId, docId } = req.params;

    const project = await prisma.projectEnvironment.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found');

    const document = await ProjectDocumentService.getById(docId);
    if (!document) throw new HttpError(404, 'Document not found');
    if (document.projectId !== projectId) throw new HttpError(404, 'Document not found');

    const filePath = path.join(process.cwd(), 'uploads', 'project-docs', projectId, document.fileName);

    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    res.setHeader('Content-Length', document.fileSize);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
});

// DELETE /projects-environments/:id/documents/:docId - Delete document
genericModuleRouter.delete('/projects-environments/:id/documents/:docId', requireAuth, requirePermission('projects:manage'), async (req, res, next) => {
  try {
    const { id: projectId, docId } = req.params;

    const project = await prisma.projectEnvironment.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found');

    const document = await ProjectDocumentService.getById(docId);
    if (!document) throw new HttpError(404, 'Document not found');
    if (document.projectId !== projectId) throw new HttpError(404, 'Document not found');

    const deletedBy = req.user?.name || req.user?.email || 'Unknown';
    const deletedDocName = document.originalFileName;

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'project-docs', projectId, document.fileName);
    try {
      await fs.unlink(filePath);
    } catch {}

    // Delete from database
    await ProjectDocumentService.delete(docId);

    // Create activity for document deletion
    await prisma.projectActivity.create({
      data: {
        projectId,
        activityType: 'DOCUMENT_DELETED',
        title: 'Document Deleted',
        description: `Document "${deletedDocName}" was deleted`,
        performedBy: deletedBy,
        performedAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /projects-environments/:id/activities - Get project activities (timeline)
genericModuleRouter.get('/projects-environments/:id/activities', requireAuth, async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { search, filter, sortBy, sortOrder } = req.query;

    const project = await prisma.projectEnvironment.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found');

    const result = await ProjectActivityService.list(projectId, {
      search: search as string,
      filter: filter as 'today' | 'this_week' | 'this_month' | 'all',
      sortBy: sortBy as string,
      sortOrder: sortOrder as string
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});
