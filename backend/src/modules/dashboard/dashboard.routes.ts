import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { 
  ServiceRequestStatus, 
  IncidentStatus, 
  ProblemStatus, 
  ChangeRequestStatus,
  UserStatus, 
  AccessStatus, 
  TicketPriority, 
  IncidentSeverity,
  AssetStatus 
} from '@prisma/client';

export const dashboardRouter = Router();

// Terminal statuses for each module - records with these statuses are considered closed/resolved
const CLOSED_SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [ServiceRequestStatus.CLOSED];
const CLOSED_INCIDENT_STATUSES: IncidentStatus[] = [IncidentStatus.CLOSED, IncidentStatus.RESOLVED];
const CLOSED_PROBLEM_STATUSES: ProblemStatus[] = [ProblemStatus.CLOSED, ProblemStatus.RESOLVED];
const CLOSED_CHANGE_STATUSES: ChangeRequestStatus[] = [ChangeRequestStatus.CLOSED, ChangeRequestStatus.COMPLETED];

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// GET /api/dashboard/summary
// Returns comprehensive system-wide metrics using only existing Prisma models
dashboardRouter.get('/summary', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    // Calculate date ranges
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalRoles,
      openTickets,
      unassignedTickets,
      highPriorityTickets,
      slaBreaches,
      totalIncidents,
      criticalIncidents,
      sev2Incidents,
      openIncidents,
      openProblems,
      pendingChanges,
      overdueChanges,
      pendingAccessRequests,
      expiringLicenses,
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
      prisma.serviceRequest.count({ where: { status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES } } }),
      // Unassigned tickets - no assignee
      prisma.serviceRequest.count({ where: { status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES }, assigneeName: null } }),
      // High priority tickets
      prisma.serviceRequest.count({ 
        where: { 
          status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES }, 
          priority: { in: [TicketPriority.HIGH, TicketPriority.CRITICAL] } 
        } 
      }),
      // SLA Breaches - overdue tickets
      prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() }, status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES } } }),
      // Total Incidents - all incidents
      prisma.incident.count(),
      // Critical Incidents - SEV1 and open
      prisma.incident.count({ where: { severity: 'SEV1', status: { notIn: CLOSED_INCIDENT_STATUSES } } }),
      // SEV2 Incidents - open
      prisma.incident.count({ where: { severity: 'SEV2', status: { notIn: CLOSED_INCIDENT_STATUSES } } }),
      // Open Incidents - not closed
      prisma.incident.count({ where: { status: { notIn: CLOSED_INCIDENT_STATUSES } } }),
      // Open Problems - not resolved
      prisma.problem.count({ where: { status: { notIn: CLOSED_PROBLEM_STATUSES } } }),
      // Pending Changes - not closed or resolved
      prisma.changeRequest.count({ where: { status: { notIn: CLOSED_CHANGE_STATUSES } } }),
      // Overdue Changes - past change window
      prisma.changeRequest.count({ 
        where: { 
          status: { notIn: CLOSED_CHANGE_STATUSES },
          changeWindow: { lt: new Date() }
        } 
      }),
      // Pending Access Requests
      prisma.accessRequest.count({ where: { status: AccessStatus.REQUESTED } }),
      // Expiring Licenses - renewal within 30 days
      prisma.vendorLicense.count({ 
        where: { 
          renewalAt: { 
            gte: startOfToday,
            lte: thirtyDaysFromNow 
          } 
        } 
      }),
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
      // Users & Teams
      totalUsers,
      totalRoles,
      // Tickets
      openTickets,
      unassignedTickets,
      highPriorityTickets,
      slaBreaches,
      // Incidents
      totalIncidents,
      criticalIncidents,
      sev2Incidents,
      openIncidents,
      // Problems
      openProblems,
      // Changes
      pendingChanges,
      overdueChanges,
      // Access
      pendingAccessRequests,
      // Licenses
      expiringLicenses,
      // Compliance
      complianceDocuments,
      // Inventory
      totalAssets,
      availableAssets,
      // Projects
      totalProjects,
      // Vendors
      totalVendors,
      // Knowledge Base
      totalKnowledgeBase
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-tasks
// Returns user-specific task counts using only existing Prisma models
// Filters by current logged-in user's name
dashboardRouter.get('/my-tasks', requireAuth, requirePermissionOr(['dashboard:read', 'dashboard:view']), async (_req, res, next) => {
  try {
    const user = _req.user as { id?: string; name?: string; email?: string } | undefined;
    const userName = user?.name || user?.email?.split('@')[0] || '';

    // If no user context, return zeros
    if (!userName) {
      return res.json({
        openIncidents: 0,
        pendingChanges: 0,
        pendingAccessRequests: 0,
        openProblems: 0,
        assignedTickets: 0,
        unassignedTickets: 0
      });
    }

    const [
      // Open incidents owned by the user
      openIncidents,
      // Pending changes owned by the user
      pendingChanges,
      // Pending access requests from the user
      pendingAccessRequests,
      // Open problems owned by the user
      openProblems,
      // Tickets assigned to the user
      assignedTickets,
      // Tickets requested by the user
      requestedTickets
    ] = await Promise.all([
      prisma.incident.count({
        where: {
          status: { notIn: CLOSED_INCIDENT_STATUSES },
          ownerName: userName
        }
      }),
      prisma.changeRequest.count({
        where: {
          status: { notIn: CLOSED_CHANGE_STATUSES },
          ownerName: userName
        }
      }),
      prisma.accessRequest.count({
        where: {
          status: AccessStatus.REQUESTED,
          requesterName: userName
        }
      }),
      prisma.problem.count({
        where: {
          status: { notIn: CLOSED_PROBLEM_STATUSES },
          ownerName: userName
        }
      }),
      // Tickets assigned to this user
      prisma.serviceRequest.count({
        where: {
          status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES },
          assigneeName: userName
        }
      }),
      // Tickets requested by this user
      prisma.serviceRequest.count({
        where: {
          status: { notIn: CLOSED_SERVICE_REQUEST_STATUSES },
          requesterName: userName
        }
      })
    ]);

    res.json({
      openIncidents,
      pendingChanges,
      pendingAccessRequests,
      openProblems,
      assignedTickets,
      requestedTickets,
      userName
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-activity
// Returns recent activity from existing modules only with improved formatting
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
      // Recent incidents with severity
      prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          incidentNo: true, 
          title: true, 
          status: true, 
          severity: true,
          createdAt: true, 
          ownerName: true 
        }
      }),
      // Recent problems
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
      // Recent changes with risk level
      prisma.changeRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          changeNo: true, 
          title: true, 
          status: true, 
          riskLevel: true,
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
          fileSize: true,
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
          accessType: true,
          status: true, 
          createdAt: true, 
          requesterName: true 
        }
      }),
      // Recent service requests with priority
      prisma.serviceRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          ticketNo: true, 
          title: true, 
          status: true,
          priority: true,
          createdAt: true, 
          requesterName: true,
          assigneeName: true
        }
      })
    ]);

    // Transform incidents with improved formatting
    const incidents = recentIncidents.map(item => ({
      id: item.id,
      type: 'incident' as const,
      title: truncateText(item.title),
      reference: item.incidentNo,
      status: item.status,
      severity: item.severity,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName || 'Unassigned'
    }));

    // Transform problems
    const problems = recentProblems.map(item => ({
      id: item.id,
      type: 'problem' as const,
      title: truncateText(item.title),
      reference: item.problemNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName || 'Unassigned'
    }));

    // Transform changes with risk level
    const changes = recentChanges.map(item => ({
      id: item.id,
      type: 'change' as const,
      title: truncateText(item.title),
      reference: item.changeNo,
      status: item.status,
      riskLevel: item.riskLevel,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.ownerName || 'Unassigned'
    }));

    // Transform compliance documents with formatted size
    const complianceDocuments = recentComplianceDocuments.map(item => ({
      id: item.id,
      type: 'compliance' as const,
      title: truncateText(item.fileName, 40),
      reference: item.id,
      fileSize: item.fileSize,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.uploadedBy || 'System'
    }));

    // Transform access requests
    const accessRequests = recentAccessRequests.map(item => ({
      id: item.id,
      type: 'access' as const,
      title: `${item.accessType} - ${truncateText(item.systemName, 25)}`,
      reference: item.requestNo,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.requesterName
    }));

    // Transform service requests with priority
    const serviceRequests = recentServiceRequests.map(item => ({
      id: item.id,
      type: 'ticket' as const,
      title: truncateText(item.title),
      reference: item.ticketNo,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.requesterName,
      assignedTo: item.assigneeName
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
    let dbDetail = 'Connected';
    
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'warning';
      dbDetail = 'Connection issue';
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: [
        { name: 'API Server', status: 'healthy', detail: 'Operational' },
        { name: 'Database', status: dbStatus, detail: dbDetail },
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
      prisma.problem.count({ where: { status: { notIn: CLOSED_PROBLEM_STATUSES } } }),
      prisma.changeRequest.count({ where: { status: { notIn: CLOSED_CHANGE_STATUSES } } }),
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
