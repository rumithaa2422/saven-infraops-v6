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

// GET /api/dashboard/my-tasks
// Returns user-specific task counts
dashboardRouter.get('/my-tasks', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const user = _req.user as { id?: string; name?: string } | undefined;
    const userName = user?.name || '';

    const [openIncidents, pendingChanges, pendingAccessRequests, complianceReviews] = await Promise.all([
      // Open incidents assigned to or created by the user
      prisma.incident.count({
        where: {
          status: { notIn: ['CLOSED', 'RESOLVED'] },
          OR: [
            { ownerName: userName },
            { createdBy: userName }
          ]
        }
      }),
      // Pending changes assigned to or owned by the user
      prisma.changeRequest.count({
        where: {
          status: { in: ['PENDING', 'IN_REVIEW', 'SCHEDULED', 'IN_PROGRESS'] },
          OR: [
            { ownerName: userName },
            { createdBy: userName }
          ]
        }
      }),
      // Pending access requests from the user
      prisma.accessRequest.count({
        where: {
          status: 'REQUESTED',
          requesterName: userName
        }
      }),
      // Compliance reviews (placeholder - would need specific logic)
      Promise.resolve(0)
    ]);

    res.json({
      openIncidents,
      pendingChanges,
      pendingAccessRequests,
      complianceReviews
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/system-summary
// Returns comprehensive system-wide metrics
dashboardRouter.get('/system-summary', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      openTickets,
      criticalIncidents,
      pendingChanges,
      pendingAccessRequests,
      complianceDocuments,
      knowledgeBaseArticles
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { isActive: true } }),
      // Active users (placeholder - would need lastLogin tracking)
      prisma.user.count({ where: { isActive: true } }),
      // Open tickets
      prisma.serviceRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      // Critical incidents
      prisma.incident.count({ where: { severity: 'SEV1', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      // Pending changes
      prisma.changeRequest.count({ where: { status: { in: ['PENDING', 'IN_REVIEW', 'SCHEDULED', 'IN_PROGRESS'] } } }),
      // Pending access requests
      prisma.accessRequest.count({ where: { status: 'REQUESTED' } }),
      // Compliance documents
      prisma.complianceDocument.count(),
      // Knowledge base articles
      prisma.knowledgeBaseArticle.count()
    ]);

    res.json({
      totalUsers,
      activeUsers,
      openTickets,
      criticalIncidents,
      pendingChanges,
      pendingAccessRequests,
      complianceDocuments,
      knowledgeBaseArticles
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/health
// Returns system health status
dashboardRouter.get('/health', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    // Check database connectivity
    let dbStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'warning';
    }

    res.json({
      services: [
        { name: 'API Server', status: 'healthy', detail: 'Operational' },
        { name: 'Database', status: dbStatus, detail: dbStatus === 'healthy' ? 'Connected' : 'Degraded' },
        { name: 'AI Assistant', status: 'healthy', detail: 'Ready' },
        { name: 'Compliance Repository', status: 'healthy', detail: 'Available' }
      ],
      metrics: {
        storageUsed: 45, // Placeholder - would need real storage tracking
        storageTotal: 100,
        onlineUsers: 1 // Placeholder - would need real session tracking
      }
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

// GET /api/dashboard/recent-activity-timeline
// Returns enhanced timeline of recent activities
dashboardRouter.get('/recent-activity-timeline', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 8;

    const [
      recentIncidents,
      recentProblems,
      recentChanges,
      recentComplianceDocuments,
      recentAccessRequests,
      recentServiceRequests
    ] = await Promise.all([
      prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, incidentNo: true, title: true, status: true, createdAt: true, createdBy: true }
      }),
      prisma.problem.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, problemNo: true, title: true, status: true, createdAt: true, createdBy: true }
      }),
      prisma.changeRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, changeNo: true, title: true, status: true, createdAt: true, createdBy: true }
      }),
      prisma.complianceDocument.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fileName: true, createdAt: true, uploadedBy: true }
      }),
      prisma.accessRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, requestNo: true, systemName: true, status: true, createdAt: true, requesterName: true }
      }),
      prisma.serviceRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, requestNo: true, title: true, status: true, createdAt: true, createdBy: true }
      })
    ]);

    const incidents = recentIncidents.map(item => ({
      id: item.id,
      type: 'incident' as const,
      title: item.title,
      reference: item.incidentNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.createdBy
    }));

    const problems = recentProblems.map(item => ({
      id: item.id,
      type: 'problem' as const,
      title: item.title,
      reference: item.problemNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.createdBy
    }));

    const changes = recentChanges.map(item => ({
      id: item.id,
      type: 'change' as const,
      title: item.title,
      reference: item.changeNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.createdBy
    }));

    const complianceDocuments = recentComplianceDocuments.map(item => ({
      id: item.id,
      type: 'compliance' as const,
      title: item.fileName,
      reference: item.id,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.uploadedBy
    }));

    const accessRequests = recentAccessRequests.map(item => ({
      id: item.id,
      type: 'access' as const,
      title: item.systemName,
      reference: item.requestNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.requesterName
    }));

    const serviceRequests = recentServiceRequests.map(item => ({
      id: item.id,
      type: 'ticket' as const,
      title: item.title,
      reference: item.requestNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.createdBy
    }));

    res.json({
      incidents,
      problems,
      changes,
      complianceDocuments,
      accessRequests,
      serviceRequests
    });
  } catch (error) {
    next(error);
  }
});
