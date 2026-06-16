import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', requireAuth, requirePermission('dashboard:read'), async (_req, res, next) => {
  try {
    const [openServiceRequests, criticalIncidents, slaBreaches, pendingCompliance, availableAssets, pendingApprovals] = await Promise.all([
      prisma.serviceRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.incident.count({ where: { severity: 'SEV1', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() }, status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.complianceControl.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.accessRequest.count({ where: { status: 'REQUESTED' } })
    ]);

    res.json({ openServiceRequests, criticalIncidents, slaBreaches, pendingCompliance, availableAssets, pendingApprovals });
  } catch (error) {
    next(error);
  }
});
