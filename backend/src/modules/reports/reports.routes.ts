import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr, hasPermissionViaAlias } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { 
  getAvailableReports, 
  generateReport, 
  getReportStats,
  ReportType,
  ReportFilter,
  ReportDefinition
} from './reports.service.js';

export const reportsRouter = Router();

// Mapping of report module to required permission
const REPORT_MODULE_PERMISSIONS: Record<string, string> = {
  'incidents': 'incidents:view',
  'tickets': 'tickets:view',
  'changes': 'changes:view',
  'problems': 'problems:view',
  'inventory': 'inventory:view',
  'access': 'access:view',
  'compliance': 'compliance:view',
  'projects': 'projects:view',
  'vendors': 'vendors:view',
  'knowledge-base': 'kb:view',
  'documents': 'projects:view',
  'users': 'users:view',
  'roles': 'roles:view',
  'permissions': 'roles:view',
  'audit-logs': 'audit:view'
};

// GET /api/reports - List available report types with counts (filtered by user permissions)
reportsRouter.get('/', requireAuth, requirePermissionOr(['reports:view', 'reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allReports = getAvailableReports();
    const userPermissions: string[] = req.user?.permissions || [];
    
    // Filter reports based on user permissions
    const filteredReports = allReports.filter(report => {
      const requiredPermission = REPORT_MODULE_PERMISSIONS[report.module];
      // If no permission mapping, show the report
      if (!requiredPermission) return true;
      // Check if user has the required permission
      return hasPermissionViaAlias(userPermissions, requiredPermission);
    });
    
    // Get counts for each report type (only for accessible reports)
    const counts = await getAllReportCounts();
    
    // Attach counts to filtered reports
    const reportsWithCounts = filteredReports.map(report => ({
      ...report,
      recordCount: counts[report.id] || 0
    }));
    
    res.json({ reports: reportsWithCounts });
  } catch (error) {
    next(error);
  }
});

// Helper function to get counts for all report types
async function getAllReportCounts() {
  const [incidents, serviceRequests, changes, problems, inventory, accessRequests, compliance, projects, vendors, knowledgeBase, documents, users, roles, permissions, auditLogs] = await Promise.all([
    prisma.incident.count(),
    prisma.serviceRequest.count(),
    prisma.changeRequest.count(),
    prisma.problem.count(),
    prisma.asset.count(),
    prisma.accessRequest.count(),
    prisma.complianceDocument.count(),
    prisma.projectEnvironment.count(),
    prisma.vendorLicense.count(),
    prisma.knowledgeBaseArticle.count(),
    prisma.projectDocument.count(),
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.auditLog.count()
  ]);
  
  return {
    'incidents': incidents,
    'service-requests': serviceRequests,
    'changes': changes,
    'problems': problems,
    'inventory': inventory,
    'access-requests': accessRequests,
    'compliance': compliance,
    'projects': projects,
    'vendors': vendors,
    'knowledge-base': knowledgeBase,
    'documents': documents,
    'users': users,
    'roles': roles,
    'permissions': permissions,
    'audit-logs': auditLogs
  };
}

// GET /api/reports/stats/summary - Get report statistics
reportsRouter.get('/stats/summary', requireAuth, requirePermissionOr(['reports:view', 'reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getReportStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:type/download - Generate and download Excel report
reportsRouter.get('/:type/download', requireAuth, requirePermissionOr(['reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params as { type: ReportType };
    const { status, owner, dateFrom, dateTo, severity, priority, category, department, country, project } = req.query as Record<string, string>;
    const userPermissions: string[] = req.user?.permissions || [];

    // Validate report type
    const validTypes: ReportType[] = [
      'incidents', 
      'service-requests', 
      'changes',
      'problems',
      'inventory', 
      'access-requests', 
      'compliance', 
      'projects', 
      'vendors',
      'users',
      'knowledge-base',
      'documents',
      'roles',
      'permissions',
      'audit-logs'
    ];

    if (!validTypes.includes(type)) {
      throw new HttpError(400, `Invalid report type. Valid types: ${validTypes.join(', ')}`);
    }

    // Get report module for permission check
    const reportModule = getReportModuleForType(type);
    const requiredPermission = reportModule ? REPORT_MODULE_PERMISSIONS[reportModule] : null;
    
    // Check if user has access to this report's module
    if (requiredPermission && !hasPermissionViaAlias(userPermissions, requiredPermission)) {
      throw new HttpError(403, 'You do not have permission to access this report module');
    }

    const filters: ReportFilter = {};
    if (status) filters.status = status;
    if (owner) filters.owner = owner;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (severity) filters.severity = severity;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (department) filters.department = department;
    if (country) filters.country = country;
    if (project) filters.project = project;

    const { buffer, fileName } = await generateReport(type, filters);

    // Create audit log for report generation
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'GENERATE_REPORT',
        entityType: 'Report',
        entityId: type,
        newValue: JSON.stringify({ reportType: type, filters }),
        ipAddress: req.ip || null
      }
    });

    // Send Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:type/preview - Preview report data (without downloading)
reportsRouter.get('/:type/preview', requireAuth, requirePermissionOr(['reports:view', 'reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params as { type: ReportType };
    const { status, owner, dateFrom, dateTo, severity, priority, category, department, country, project } = req.query as Record<string, string>;
    const userPermissions: string[] = req.user?.permissions || [];

    // Validate report type
    const validTypes: ReportType[] = [
      'incidents', 
      'service-requests', 
      'changes',
      'problems',
      'inventory', 
      'access-requests', 
      'compliance', 
      'projects', 
      'vendors',
      'users',
      'knowledge-base',
      'documents',
      'roles',
      'permissions',
      'audit-logs'
    ];

    if (!validTypes.includes(type)) {
      throw new HttpError(400, `Invalid report type. Valid types: ${validTypes.join(', ')}`);
    }

    // Get report module for permission check
    const reportModule = getReportModuleForType(type);
    const requiredPermission = reportModule ? REPORT_MODULE_PERMISSIONS[reportModule] : null;
    
    // Check if user has access to this report's module
    if (requiredPermission && !hasPermissionViaAlias(userPermissions, requiredPermission)) {
      throw new HttpError(403, 'You do not have permission to access this report module');
    }

    const filters: ReportFilter = {};
    if (status) filters.status = status;
    if (owner) filters.owner = owner;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (severity) filters.severity = severity;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (department) filters.department = department;
    if (country) filters.country = country;
    if (project) filters.project = project;

    const { buffer } = await generateReport(type, filters);

    // Return base64 encoded Excel for preview
    res.json({ 
      success: true, 
      data: buffer.toString('base64'),
      fileName: `Preview_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:type/count - Get count of records that would be exported
reportsRouter.get('/:type/count', requireAuth, requirePermissionOr(['reports:view', 'reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params as { type: ReportType };
    const { status, owner, dateFrom, dateTo, severity, priority, category, department, country, project } = req.query as Record<string, string>;
    const userPermissions: string[] = req.user?.permissions || [];

    // Validate report type
    const validTypes: ReportType[] = [
      'incidents', 
      'service-requests', 
      'changes',
      'problems',
      'inventory', 
      'access-requests', 
      'compliance', 
      'projects', 
      'vendors',
      'users',
      'knowledge-base',
      'documents',
      'roles',
      'permissions',
      'audit-logs'
    ];

    if (!validTypes.includes(type)) {
      throw new HttpError(400, `Invalid report type. Valid types: ${validTypes.join(', ')}`);
    }

    // Get report module for permission check
    const reportModule = getReportModuleForType(type);
    const requiredPermission = reportModule ? REPORT_MODULE_PERMISSIONS[reportModule] : null;
    
    // Check if user has access to this report's module
    if (requiredPermission && !hasPermissionViaAlias(userPermissions, requiredPermission)) {
      throw new HttpError(403, 'You do not have permission to access this report module');
    }

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (owner) where.ownerName = { contains: owner };
    if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { lte: new Date(dateTo + 'T23:59:59') };
    if (severity) where.severity = severity;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (department) where.department = department;
    if (country) where.country = country;
    if (project) where.projectName = { contains: project };

    let count = 0;

    switch (type) {
      case 'incidents':
        count = await prisma.incident.count({ where });
        break;
      case 'service-requests':
        count = await prisma.serviceRequest.count({ where });
        break;
      case 'changes':
        count = await prisma.changeRequest.count({ where });
        break;
      case 'problems':
        count = await prisma.problem.count({ where });
        break;
      case 'inventory':
        count = await prisma.asset.count({ where });
        break;
      case 'access-requests':
        count = await prisma.accessRequest.count({ where });
        break;
      case 'compliance':
        count = await prisma.complianceDocument.count({ where });
        break;
      case 'projects':
        count = await prisma.projectEnvironment.count({ where });
        break;
      case 'vendors':
        count = await prisma.vendorLicense.count({ where });
        break;
      case 'knowledge-base':
        count = await prisma.knowledgeBaseArticle.count({ where });
        break;
      case 'documents':
        count = await prisma.projectDocument.count({ where });
        break;
      case 'users':
        count = await prisma.user.count({ where });
        break;
      case 'roles':
        count = await prisma.role.count();
        break;
      case 'permissions':
        count = await prisma.permission.count();
        break;
      case 'audit-logs':
        count = await prisma.auditLog.count({ where });
        break;
      default:
        throw new HttpError(400, `Unknown report type: ${type}`);
    }

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Helper function to map report type to module
function getReportModuleForType(type: ReportType): string | null {
  const typeToModule: Record<ReportType, string | null> = {
    'incidents': 'incidents',
    'service-requests': 'tickets',
    'changes': 'changes',
    'problems': 'problems',
    'inventory': 'inventory',
    'access-requests': 'access',
    'compliance': 'compliance',
    'projects': 'projects',
    'vendors': 'vendors',
    'knowledge-base': 'knowledge-base',
    'documents': 'documents',
    'users': 'users',
    'roles': 'roles',
    'permissions': 'permissions',
    'audit-logs': 'audit-logs'
  };
  return typeToModule[type];
}
