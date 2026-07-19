import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { 
  getAvailableReports, 
  generateReport, 
  getReportStats,
  ReportType,
  ReportFilter 
} from './reports.service.js';

export const reportsRouter = Router();

// GET /api/reports - List available report types
reportsRouter.get('/', requireAuth, requirePermissionOr(['reports:view', 'reports:export']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = getAvailableReports();
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

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
