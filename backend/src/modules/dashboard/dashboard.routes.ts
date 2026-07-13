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

// GET /api/dashboard/kpi
// Returns KPI data for the dashboard cards
dashboardRouter.get('/kpi', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const [totalIncidents, openProblems, pendingChanges, complianceDocuments] = await Promise.all([
      // Total Incidents - count all incidents
      prisma.incident.count(),
      // Open Problems - problems not yet resolved
      prisma.problem.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      // Pending Changes - changes awaiting approval or implementation
      prisma.changeRequest.count({ where: { status: { in: ['PENDING', 'IN_REVIEW', 'SCHEDULED', 'IN_PROGRESS'] } } }),
      // Compliance Documents - all documents in repository
      prisma.complianceDocument.count()
    ]);

    res.json({
      totalIncidents,
      openProblems,
      pendingChanges,
      complianceDocuments
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-activity
// Returns recent activity for the dashboard
dashboardRouter.get('/recent-activity', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 5;

    const [recentIncidents, recentComplianceDocuments] = await Promise.all([
      // Recent incidents
      prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          incidentNo: true,
          title: true,
          status: true,
          createdAt: true,
          createdBy: true
        }
      }),
      // Recent compliance documents
      prisma.complianceDocument.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          createdAt: true,
          uploadedBy: true
        }
      })
    ]);

    const incidents = recentIncidents.map(incident => ({
      id: incident.id,
      type: 'incident',
      title: incident.title,
      reference: incident.incidentNo,
      status: incident.status,
      createdAt: incident.createdAt.toISOString(),
      createdBy: incident.createdBy
    }));

    const complianceDocuments = recentComplianceDocuments.map(doc => ({
      id: doc.id,
      type: 'compliance',
      title: doc.fileName,
      reference: doc.id,
      createdAt: doc.createdAt.toISOString(),
      createdBy: doc.uploadedBy
    }));

    res.json({ incidents, complianceDocuments });
  } catch (error) {
    next(error);
  }
});
