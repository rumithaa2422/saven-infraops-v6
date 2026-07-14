import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { 
  getAvailableReports, 
  generateReport, 
  ReportType,
  ReportFilter 
} from './reports.service.js';

export const reportsRouter = Router();

// GET /api/reports - List available report types
reportsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const reports = getAvailableReports();
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:type - Generate a specific report
reportsRouter.get('/:type', requireAuth, async (req, res, next) => {
  try {
    const { type } = req.params as { type: ReportType };
    const { status, owner, dateFrom, dateTo, severity, priority } = req.query as Record<string, string>;

    // Validate report type
    const validTypes: ReportType[] = [
      'incidents', 
      'service-requests', 
      'changes', 
      'inventory', 
      'access-requests', 
      'compliance', 
      'projects', 
      'vendors', 
      'users'
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

    const report = await generateReport(type, filters, req.user?.email);

    // Create audit log for report generation
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'GENERATE_REPORT',
        entityType: 'Report',
        entityId: type,
        newValue: { reportType: type, filters } as any,
        ipAddress: req.ip || null
      }
    });

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/stats - Get report statistics
reportsRouter.get('/stats/summary', requireAuth, async (req, res, next) => {
  try {
    // Get counts for KPIs
    const [
      totalReportsGenerated,
      recentReports,
      availableTemplates,
      exportCount
    ] = await Promise.all([
      // Total reports generated (from audit logs)
      prisma.auditLog.count({
        where: { action: 'GENERATE_REPORT' }
      }),
      // Last 5 generated reports
      prisma.auditLog.findMany({
        where: { action: 'GENERATE_REPORT' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          entityId: true,
          actorEmail: true,
          createdAt: true
        }
      }),
      // Available report templates count
      Promise.resolve(getAvailableReports().length),
      // Export count (same as reports for now)
      prisma.auditLog.count({
        where: { action: 'GENERATE_REPORT' }
      })
    ]);

    res.json({
      totalReportsGenerated,
      availableTemplates,
      exportCount,
      lastGenerated: recentReports[0] ? {
        type: recentReports[0].entityId,
        by: recentReports[0].actorEmail,
        at: recentReports[0].createdAt
      } : null
    });
  } catch (error) {
    next(error);
  }
});
