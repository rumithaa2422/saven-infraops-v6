import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const dashboardRouter = Router();

// GET /api/dashboard/summary
// Supports both legacy (dashboard:read) and new (dashboard:view) permissions
dashboardRouter.get('/summary', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const [openServiceRequests, criticalIncidents, slaBreaches, complianceDocuments, availableAssets, pendingApprovals] = await Promise.all([
      prisma.serviceRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.incident.count({ where: { severity: 'SEV1', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() }, status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.complianceDocument.count(), // Compliance is now a document repository
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.accessRequest.count({ where: { status: 'REQUESTED' } })
    ]);

    res.json({ openServiceRequests, criticalIncidents, slaBreaches, complianceDocuments, availableAssets, pendingApprovals });
  } catch (error) {
    next(error);
  }
});
