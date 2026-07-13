import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { WorkStatus, UserStatus, AccessStatus } from '@prisma/client';

export const dashboardRouter = Router();

// Terminal statuses - records with these statuses are considered closed/resolved
const CLOSED_STATUSES: WorkStatus[] = [WorkStatus.CLOSED, WorkStatus.RESOLVED];

// GET /api/dashboard/summary
// Returns comprehensive system-wide metrics using only existing Prisma models
dashboardRouter.get('/summary', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalRoles,
      openTickets,
      slaBreaches,
      totalIncidents,
      criticalIncidents,
      openIncidents,
      openProblems,
      pendingChanges,
      pendingAccessRequests,
      complianceDocuments,
      totalAssets,
      availableAssets,
      totalProjects,
      totalVendors,
      totalKnowledgeBase
    ] = await Promise.all([
      // Users - count active users
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      // Roles - count all roles
      prisma.role.count(),
      // Open Service Requests (Tickets) - not closed or resolved
      prisma.serviceRequest.count({ where: { status: { notIn: CLOSED_STATUSES } } }),
      // SLA Breaches - overdue tickets
      prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() }, status: { notIn: CLOSED_STATUSES } } }),
      // Total Incidents - all incidents
      prisma.incident.count(),
      // Critical Incidents - SEV1 and open
      prisma.incident.count({ where: { severity: 'SEV1', status: { notIn: CLOSED_STATUSES } } }),
      // Open Incidents - not closed
      prisma.incident.count({ where: { status: { notIn: CLOSED_STATUSES } } }),
      // Open Problems - not resolved
      prisma.problem.count({ where: { status: { notIn: CLOSED_STATUSES } } }),
      // Pending Changes - not closed or resolved
      prisma.changeRequest.count({ where: { status: { notIn: CLOSED_STATUSES } } }),
      // Pending Access Requests
      prisma.accessRequest.count({ where: { status: AccessStatus.REQUESTED } }),
      // Compliance Documents
      prisma.complianceDocument.count(),
      // Total Assets
      prisma.asset.count(),
      // Available Assets
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      // Projects & Environments
      prisma.projectEnvironment.count(),
      // Vendors & Licenses
      prisma.vendorLicense.count(),
      // Knowledge Base Articles
      prisma.knowledgeBaseArticle.count()
    ]);

    res.json({
      totalUsers,
      totalRoles,
      openTickets,
      slaBreaches,
      totalIncidents,
      criticalIncidents,
      openIncidents,
      openProblems,
      pendingChanges,
      pendingAccessRequests,
      complianceDocuments,
      totalAssets,
      availableAssets,
      totalProjects,
      totalVendors,
      totalKnowledgeBase
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-tasks
// Returns user-specific task counts using only existing Prisma models
dashboardRouter.get('/my-tasks', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const user = _req.user as { id?: string; name?: string } | undefined;
    const userName = user?.name || '';

    const [openIncidents, pendingChanges, pendingAccessRequests, openProblems] = await Promise.all([
      // Open incidents owned by the user
      prisma.incident.count({
        where: {
          status: { notIn: CLOSED_STATUSES },
          ownerName: userName
        }
      }),
      // Pending changes owned by the user
      prisma.changeRequest.count({
        where: {
          status: { notIn: CLOSED_STATUSES },
          ownerName: userName
        }
      }),
      // Pending access requests from the user
      prisma.accessRequest.count({
        where: {
          status: AccessStatus.REQUESTED,
          requesterName: userName
        }
      }),
      // Open problems owned by the user
      prisma.problem.count({
        where: {
          status: { notIn: CLOSED_STATUSES },
          ownerName: userName
        }
      })
    ]);

    res.json({
      openIncidents,
      pendingChanges,
      pendingAccessRequests,
      openProblems
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-activity
// Returns recent activity from existing modules only
dashboardRouter.get('/recent-activity', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
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
      // Recent incidents - Incident model has: incidentNo, title, status, ownerName, createdAt
      prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          incidentNo: true, 
          title: true, 
          status: true, 
          createdAt: true, 
          ownerName: true 
        }
      }),
      // Recent problems - Problem model has: problemNo, title, status, ownerName, createdAt
      prisma.problem.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          problemNo: true, 
          title: true, 
          status: true, 
          createdAt: true, 
          ownerName: true 
        }
      }),
      // Recent changes - ChangeRequest model has: changeNo, title, status, ownerName, createdAt
      prisma.changeRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          changeNo: true, 
          title: true, 
          status: true, 
          createdAt: true, 
          ownerName: true 
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
      }),
      // Recent access requests
      prisma.accessRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          requestNo: true, 
          systemName: true, 
          status: true, 
          createdAt: true, 
          requesterName: true 
        }
      }),
      // Recent service requests (tickets) - ServiceRequest model has: ticketNo, title, status, requesterName, createdAt
      prisma.serviceRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          ticketNo: true, 
          title: true, 
          status: true, 
          createdAt: true, 
          requesterName: true 
        }
      })
    ]);

    // Transform to activity format
    const incidents = recentIncidents.map(item => ({
      id: item.id,
      type: 'incident' as const,
      title: item.title,
      reference: item.incidentNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName
    }));

    const problems = recentProblems.map(item => ({
      id: item.id,
      type: 'problem' as const,
      title: item.title,
      reference: item.problemNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName
    }));

    const changes = recentChanges.map(item => ({
      id: item.id,
      type: 'change' as const,
      title: item.title,
      reference: item.changeNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName
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
      reference: item.ticketNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.requesterName
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

// GET /api/dashboard/health
// Returns system health status with real database connectivity check
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
      ]
    });
  } catch (error) {
    next(error);
  }
});

// DEPRECATED: /api/dashboard/kpi - Use /api/dashboard/summary instead
dashboardRouter.get('/kpi', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const [totalIncidents, openProblems, pendingChanges, complianceDocuments] = await Promise.all([
      prisma.incident.count(),
      prisma.problem.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.changeRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
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
