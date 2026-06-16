import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

export const genericModuleRouter = Router();

type ModuleConfig = {
  permission: string;
  writePermission?: string;
  entityType: string;
  list: () => Promise<unknown[]>;
  create?: (payload: any) => Promise<unknown>;
  update?: (id: string, payload: any) => Promise<unknown>;
};

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

const moduleMap: Record<string, ModuleConfig> = {
  incidents: {
    permission: 'incidents:read',
    writePermission: 'incidents:write',
    entityType: 'Incident',
    list: () => prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.incident.create({ data: { incidentNo: withRef('INC', await prisma.incident.count()), title: payload.title, severity: payload.severity || 'SEV3', impactedService: payload.impactedService || null, impactedProject: payload.impactedProject || null, ownerName: payload.ownerName || null, description: payload.description || null } }),
    update: (id, payload) => prisma.incident.update({ where: { id }, data: payload })
  },
  problems: {
    permission: 'incidents:read',
    writePermission: 'incidents:write',
    entityType: 'Problem',
    list: () => prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.problem.create({ data: { problemNo: withRef('PRB', await prisma.problem.count()), title: payload.title, ownerName: payload.ownerName || null, description: payload.description || null, rootCause: payload.rootCause || null } }),
    update: (id, payload) => prisma.problem.update({ where: { id }, data: payload })
  },
  changes: {
    permission: 'changes:read',
    writePermission: 'changes:approve',
    entityType: 'ChangeRequest',
    list: () => prisma.changeRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.changeRequest.create({ data: { changeNo: withRef('CHG', await prisma.changeRequest.count()), title: payload.title, riskLevel: payload.riskLevel || 'MEDIUM', ownerName: payload.ownerName || null, rollbackPlan: payload.rollbackPlan || null, changeWindow: payload.changeWindow ? new Date(payload.changeWindow) : null } }),
    update: (id, payload) => prisma.changeRequest.update({ where: { id }, data: payload })
  },
  inventory: {
    permission: 'inventory:read',
    writePermission: 'inventory:write',
    entityType: 'Asset',
    list: () => prisma.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.asset.create({ data: { assetNo: withRef('AST', await prisma.asset.count()), assetType: payload.assetType, make: payload.make || null, model: payload.model || null, serialNo: payload.serialNo || null, assignedToName: payload.assignedToName || null, location: payload.location || null } }),
    update: (id, payload) => prisma.asset.update({ where: { id }, data: payload })
  },
  'access-management': {
    permission: 'access:read',
    writePermission: 'access:approve',
    entityType: 'AccessRequest',
    list: () => prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.accessRequest.create({ data: { requestNo: withRef('ACC', await prisma.accessRequest.count()), requesterName: payload.requesterName, accessType: payload.accessType, systemName: payload.systemName, approverName: payload.approverName || null, justification: payload.justification || null } }),
    update: (id, payload) => prisma.accessRequest.update({ where: { id }, data: payload })
  },
  compliance: {
    permission: 'compliance:read',
    writePermission: 'compliance:write',
    entityType: 'ComplianceControl',
    list: () => prisma.complianceControl.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.complianceControl.create({ data: { controlNo: withRef('CMP', await prisma.complianceControl.count()), title: payload.title, controlArea: payload.controlArea, ownerName: payload.ownerName, frequency: payload.frequency || 'Quarterly', riskRating: payload.riskRating || 'MEDIUM' } }),
    update: (id, payload) => prisma.complianceControl.update({ where: { id }, data: payload })
  },
  'projects-environments': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    entityType: 'ProjectEnvironment',
    list: () => prisma.projectEnvironment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: (payload) => prisma.projectEnvironment.create({ data: { projectName: payload.projectName, environmentName: payload.environmentName, serviceName: payload.serviceName || null, serverName: payload.serverName || null, databaseName: payload.databaseName || null, ownerName: payload.ownerName || null } }),
    update: (id, payload) => prisma.projectEnvironment.update({ where: { id }, data: payload })
  },
  'vendors-licenses': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    entityType: 'VendorLicense',
    list: () => prisma.vendorLicense.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: (payload) => prisma.vendorLicense.create({ data: { vendorName: payload.vendorName, licenseName: payload.licenseName, licenseCount: Number(payload.licenseCount || 0), assignedCount: Number(payload.assignedCount || 0), ownerName: payload.ownerName || null, renewalAt: payload.renewalAt ? new Date(payload.renewalAt) : null } }),
    update: (id, payload) => prisma.vendorLicense.update({ where: { id }, data: payload })
  },
  'knowledge-base': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    entityType: 'KnowledgeBaseArticle',
    list: () => prisma.knowledgeBaseArticle.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    create: (payload) => prisma.knowledgeBaseArticle.create({ data: { title: payload.title, category: payload.category, authorName: payload.authorName || null, body: payload.body || '' } }),
    update: (id, payload) => prisma.knowledgeBaseArticle.update({ where: { id }, data: payload })
  },
  'users-teams': {
    permission: 'users:read',
    writePermission: 'users:write',
    entityType: 'User',
    list: () => prisma.user.findMany({ select: { id: true, name: true, email: true, department: true, isActive: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    create: async (payload) => prisma.user.create({ data: { name: payload.name, email: payload.email, department: payload.department || null, passwordHash: payload.password ? await bcrypt.hash(payload.password, 12) : null } }),
    update: (id, payload) => prisma.user.update({ where: { id }, data: { name: payload.name, department: payload.department, isActive: payload.isActive } })
  },
  'reports-analytics': {
    permission: 'dashboard:read',
    writePermission: 'dashboard:read',
    entityType: 'Report',
    list: async () => [
      { id: 'ticket-aging', title: 'Ticket Ageing Report', description: 'Open service requests by priority and owner', owner: 'Admin Team' },
      { id: 'sla-breach', title: 'SLA Breach Report', description: 'SLA breaches across service requests and incidents', owner: 'Delivery Team' },
      { id: 'compliance-status', title: 'Compliance Status Report', description: 'Open, overdue, and completed compliance controls', owner: 'InfoSec Team' }
    ],
    create: async (payload) => ({ id: `custom-${Date.now()}`, ...payload })
  }
};


genericModuleRouter.get('/:module', requireAuth, async (req, res, next) => {
  try {
    const config = moduleMap[req.params.module];
    if (!config) return next();
    await new Promise<void>((resolve, reject) => requirePermission(config.permission)(req, res, (err) => err ? reject(err) : resolve()));
    const items = await config.list();
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

genericModuleRouter.post('/:module', requireAuth, async (req, res, next) => {
  try {
    const config = moduleMap[req.params.module];
    if (!config?.create) return next();
    await new Promise<void>((resolve, reject) => requirePermission(config.writePermission || config.permission)(req, res, (err) => err ? reject(err) : resolve()));
    const item = await config.create(req.body);
    await prisma.auditLog.create({ data: { actorId: req.user?.id, actorEmail: req.user?.email, action: 'CREATE', entityType: config.entityType, newValue: item as any, ipAddress: req.ip } });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

genericModuleRouter.patch('/:module/:id', requireAuth, async (req, res, next) => {
  try {
    const config = moduleMap[req.params.module];
    if (!config?.update) return next();
    await new Promise<void>((resolve, reject) => requirePermission(config.writePermission || config.permission)(req, res, (err) => err ? reject(err) : resolve()));
    const item = await config.update(req.params.id, req.body);
    await prisma.auditLog.create({ data: { actorId: req.user?.id, actorEmail: req.user?.email, action: 'UPDATE', entityType: config.entityType, entityId: req.params.id, newValue: item as any, ipAddress: req.ip } });
    res.json({ item });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(400, 'Update failed'));
  }
});
