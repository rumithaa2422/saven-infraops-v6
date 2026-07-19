import { prisma } from '../../common/prisma.js';
import { generateExcel, formatDate, formatDateTime, formatNumber, formatBytes } from '../../services/excelGenerator.service.js';

export type ReportType = 
  | 'incidents'
  | 'service-requests'
  | 'changes'
  | 'problems'
  | 'inventory'
  | 'access-requests'
  | 'compliance'
  | 'projects'
  | 'vendors'
  | 'users'
  | 'knowledge-base'
  | 'documents'
  | 'roles'
  | 'permissions'
  | 'audit-logs';

export interface ReportFilter {
  status?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: string;
  priority?: string;
  category?: string;
  department?: string;
  country?: string;
  project?: string;
}

export interface ReportDefinition {
  id: ReportType;
  name: string;
  description: string;
  module: string;
  icon: string;
  filters: string[];
}

export const reportDefinitions: ReportDefinition[] = [
  { id: 'incidents', name: 'Incident Summary Report', description: 'Summary of all incidents with severity, status, and owner information', module: 'incidents', icon: 'alert-triangle', filters: ['status', 'severity', 'dateFrom', 'dateTo'] },
  { id: 'service-requests', name: 'Service Request Report', description: 'All service requests with category, priority, and assignment details', module: 'tickets', icon: 'ticket', filters: ['status', 'priority', 'category', 'dateFrom', 'dateTo'] },
  { id: 'changes', name: 'Change Request Report', description: 'Change requests with risk levels and approval status', module: 'changes', icon: 'git-branch', filters: ['status', 'dateFrom', 'dateTo'] },
  { id: 'problems', name: 'Problem Report', description: 'Problems and known errors with status and resolution details', module: 'problems', icon: 'alert-circle', filters: ['status', 'dateFrom', 'dateTo'] },
  { id: 'inventory', name: 'Inventory Report', description: 'Asset inventory with assignment and location details', module: 'inventory', icon: 'package', filters: ['status', 'dateFrom', 'dateTo'] },
  { id: 'access-requests', name: 'Access Request Report', description: 'System access requests with approval workflow', module: 'access', icon: 'key', filters: ['status', 'dateFrom', 'dateTo'] },
  { id: 'compliance', name: 'Compliance Status Report', description: 'Compliance documents and their upload status', module: 'compliance', icon: 'shield', filters: ['dateFrom', 'dateTo'] },
  { id: 'projects', name: 'Project Report', description: 'Projects and environments with ownership details', module: 'projects', icon: 'folder', filters: ['owner', 'dateFrom', 'dateTo'] },
  { id: 'vendors', name: 'Vendor License Report', description: 'Vendor licenses with assignment and renewal information', module: 'vendors', icon: 'building', filters: ['status', 'dateFrom', 'dateTo'] },
  { id: 'knowledge-base', name: 'Knowledge Base Report', description: 'Knowledge base articles with view counts and attachments', module: 'knowledge-base', icon: 'book-open', filters: ['status', 'category', 'dateFrom', 'dateTo'] },
  { id: 'documents', name: 'Document Repository Report', description: 'Project documents with file information and metadata', module: 'documents', icon: 'file-text', filters: ['project', 'dateFrom', 'dateTo'] },
  { id: 'users', name: 'User Report', description: 'User accounts with department and role information', module: 'users', icon: 'users', filters: ['status', 'department'] },
  { id: 'roles', name: 'Roles Report', description: 'Role definitions and their associated permissions', module: 'roles', icon: 'shield-check', filters: [] },
  { id: 'permissions', name: 'Permissions Report', description: 'All available permissions grouped by module', module: 'permissions', icon: 'lock', filters: [] },
  { id: 'audit-logs', name: 'Audit Log Report', description: 'System audit logs with actor and action details', module: 'audit-logs', icon: 'activity', filters: ['dateFrom', 'dateTo'] }
];

export function getAvailableReports(): ReportDefinition[] {
  return reportDefinitions;
}

export async function generateReport(type: ReportType, filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  switch (type) {
    case 'incidents': return generateIncidentReport(filters);
    case 'service-requests': return generateServiceRequestReport(filters);
    case 'changes': return generateChangeReport(filters);
    case 'problems': return generateProblemReport(filters);
    case 'inventory': return generateInventoryReport(filters);
    case 'access-requests': return generateAccessRequestReport(filters);
    case 'compliance': return generateComplianceReport(filters);
    case 'projects': return generateProjectReport(filters);
    case 'vendors': return generateVendorReport(filters);
    case 'knowledge-base': return generateKnowledgeBaseReport(filters);
    case 'documents': return generateDocumentReport(filters);
    case 'users': return generateUserReport(filters);
    case 'roles': return generateRoleReport();
    case 'permissions': return generatePermissionReport();
    case 'audit-logs': return generateAuditLogReport(filters);
    default: throw new Error(`Unknown report type: ${type}`);
  }
}

async function generateIncidentReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const incidents = await prisma.incident.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Incidents Report',
    headers: ['Incident No', 'Title', 'Severity', 'Status', 'Owner', 'Impacted Service', 'Created Date', 'Resolved Date'],
    rows: incidents.map(i => ({
      'Incident No': i.incidentNo, 'Title': i.title, 'Severity': i.severity, 'Status': i.status,
      'Owner': i.ownerName || '-', 'Impacted Service': i.impactedService || '-',
      'Created Date': formatDate(i.createdAt), 'Resolved Date': i.resolvedAt ? formatDate(i.resolvedAt) : '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `Incidents_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateServiceRequestReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const requests = await prisma.serviceRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Service Requests Report',
    headers: ['Ticket No', 'Category', 'Priority', 'Status', 'Requester', 'Assignee', 'Created Date', 'Closed Date'],
    rows: requests.map(r => ({
      'Ticket No': r.ticketNo, 'Category': r.category, 'Priority': r.priority, 'Status': r.status,
      'Requester': r.requesterName, 'Assignee': r.assigneeName || 'Unassigned',
      'Created Date': formatDate(r.createdAt), 'Closed Date': r.closedAt ? formatDate(r.closedAt) : '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `ServiceRequests_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateChangeReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.owner) where.ownerName = { contains: filters.owner };
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const changes = await prisma.changeRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Change Requests Report',
    headers: ['Change No', 'Title', 'Risk Level', 'Owner', 'Status', 'Change Window', 'Created Date'],
    rows: changes.map(c => ({
      'Change No': c.changeNo, 'Title': c.title, 'Risk Level': c.riskLevel, 'Owner': c.ownerName || '-',
      'Status': c.status, 'Change Window': c.changeWindow ? formatDate(c.changeWindow) : '-',
      'Created Date': formatDate(c.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Changes_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateProblemReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const problems = await prisma.problem.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Problems Report',
    headers: ['Problem No', 'Title', 'Status', 'Owner', 'Root Cause', 'Created Date'],
    rows: problems.map(p => ({
      'Problem No': p.problemNo, 'Title': p.title, 'Status': p.status, 'Owner': p.ownerName || '-',
      'Root Cause': (p.rootCause || '-').substring(0, 200), 'Created Date': formatDate(p.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Problems_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateInventoryReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const assets = await prisma.asset.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Inventory Report',
    headers: ['Asset No', 'Asset Type', 'Make', 'Model', 'Location', 'Status', 'Created Date'],
    rows: assets.map(a => ({
      'Asset No': a.assetNo, 'Asset Type': a.assetType, 'Make': a.make || '-', 'Model': a.model || '-',
      'Location': a.location || '-', 'Status': a.status, 'Created Date': formatDate(a.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateAccessRequestReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const requests = await prisma.accessRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Access Requests Report',
    headers: ['Request No', 'Requester', 'System', 'Access Type', 'Approver', 'Status', 'Created Date'],
    rows: requests.map(r => ({
      'Request No': r.requestNo, 'Requester': r.requesterName, 'System': r.systemName,
      'Access Type': r.accessType, 'Approver': r.approverName || 'Pending',
      'Status': r.status, 'Created Date': formatDate(r.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `AccessRequests_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateComplianceReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const documents = await prisma.complianceDocument.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Compliance Documents Report',
    headers: ['File Name', 'Uploaded By', 'Email', 'File Size', 'Upload Date'],
    rows: documents.map(d => ({
      'File Name': d.fileName, 'Uploaded By': d.uploadedBy || '-', 'Email': d.uploadedByEmail || '-',
      'File Size': formatBytes(d.fileSize), 'Upload Date': formatDate(d.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Compliance_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateProjectReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.owner) where.ownerName = { contains: filters.owner };
  if (filters.project) where.projectName = { contains: filters.project };
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const projects = await prisma.projectEnvironment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Projects Report',
    headers: ['Project Name', 'Environment', 'Owner', 'Service', 'Server', 'Database', 'Status', 'Created Date'],
    rows: projects.map(p => ({
      'Project Name': p.projectName, 'Environment': p.environmentName, 'Owner': p.ownerName || '-',
      'Service': p.serviceName || '-', 'Server': p.serverName || '-', 'Database': p.databaseName || '-',
      'Status': p.status || '-', 'Created Date': formatDate(p.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Projects_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateVendorReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.owner) where.ownerName = { contains: filters.owner };
  if (filters.dateFrom) where.renewalAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.renewalAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const licenses = await prisma.vendorLicense.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Vendor Licenses Report',
    headers: ['Vendor Name', 'License Name', 'Assigned', 'Total', 'Cost', 'Renewal Date', 'Owner'],
    rows: licenses.map(l => ({
      'Vendor Name': l.vendorName, 'License Name': l.licenseName, 'Assigned': l.assignedCount || 0,
      'Total': l.licenseCount, 'Cost': l.cost ? formatNumber(Number(l.cost)) : '-',
      'Renewal Date': l.renewalAt ? formatDate(l.renewalAt) : '-', 'Owner': l.ownerName || '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `Vendors_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateKnowledgeBaseReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const articles = await prisma.knowledgeBaseArticle.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Knowledge Base Report',
    headers: ['Title', 'Category', 'Status', 'Views', 'Author', 'Created Date', 'Published Date'],
    rows: articles.map(a => ({
      'Title': a.title, 'Category': a.category || '-', 'Status': a.status,
      'Views': a.viewCount || 0, 'Author': a.authorName || '-',
      'Created Date': formatDate(a.createdAt), 'Published Date': a.publishedAt ? formatDate(a.publishedAt) : '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `KnowledgeBase_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateDocumentReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.project) where.originalFileName = { contains: filters.project };
  if (filters.dateFrom) where.uploadedAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.uploadedAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const documents = await prisma.projectDocument.findMany({ where, orderBy: { uploadedAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Document Repository Report',
    headers: ['File Name', 'File Type', 'Uploaded By', 'File Size', 'Upload Date'],
    rows: documents.map(d => ({
      'File Name': d.originalFileName, 'File Type': d.fileType, 'Uploaded By': d.uploadedBy || '-',
      'File Size': formatBytes(d.fileSize), 'Upload Date': formatDate(d.uploadedAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Documents_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateUserReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.department) where.department = filters.department;

  const users = await prisma.user.findMany({ 
    where, 
    include: { roles: { include: { role: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' }, 
    take: 10000 
  });

  const data = {
    reportName: 'Users Report',
    headers: ['Name', 'Email', 'Department', 'Designation', 'Team', 'Status', 'Created Date'],
    rows: users.map(u => ({
      'Name': u.name, 'Email': u.email, 'Department': u.department || '-',
      'Designation': u.designation || '-', 'Team': u.team || '-', 'Status': u.status,
      'Created Date': formatDate(u.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `Users_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateRoleReport(): Promise<{ buffer: Buffer; fileName: string }> {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' }, take: 1000 });

  const data = {
    reportName: 'Roles Report',
    headers: ['Role Name', 'Description'],
    rows: roles.map(r => ({
      'Role Name': r.name, 'Description': r.description || '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `Roles_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generatePermissionReport(): Promise<{ buffer: Buffer; fileName: string }> {
  const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' }, take: 1000 });

  const data = {
    reportName: 'Permissions Report',
    headers: ['Permission Code', 'Description'],
    rows: permissions.map(p => ({
      'Permission Code': p.code, 'Description': p.description || '-'
    }))
  };

  return { buffer: generateExcel(data), fileName: `Permissions_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

async function generateAuditLogReport(filters: ReportFilter): Promise<{ buffer: Buffer; fileName: string }> {
  const where: Record<string, unknown> = {};
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo + 'T23:59:59') };

  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

  const data = {
    reportName: 'Audit Logs Report',
    headers: ['Action', 'Entity Type', 'Entity ID', 'Actor Email', 'IP Address', 'Timestamp'],
    rows: logs.map(l => ({
      'Action': l.action, 'Entity Type': l.entityType || '-', 'Entity ID': l.entityId || '-',
      'Actor Email': l.actorEmail || '-', 'IP Address': l.ipAddress || '-', 'Timestamp': formatDateTime(l.createdAt)
    }))
  };

  return { buffer: generateExcel(data), fileName: `AuditLogs_Report_${new Date().toISOString().split('T')[0]}.xlsx` };
}

export async function getReportStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [totalReportsAvailable, reportsGeneratedToday, totalReportsGenerated, recentReports] = await Promise.all([
    Promise.resolve(reportDefinitions.length),
    prisma.auditLog.count({ where: { action: 'GENERATE_REPORT', createdAt: { gte: today } } }),
    prisma.auditLog.count({ where: { action: 'GENERATE_REPORT' } }),
    prisma.auditLog.findMany({
      where: { action: 'GENERATE_REPORT' },
      orderBy: { createdAt: 'desc' }, take: 1,
      select: { entityId: true, actorEmail: true, createdAt: true }
    })
  ]);

  return {
    totalReportsAvailable,
    reportsGeneratedToday,
    totalReportsGenerated,
    lastGenerated: recentReports[0] ? { type: recentReports[0].entityId || '', by: recentReports[0].actorEmail || 'Unknown', at: recentReports[0].createdAt } : null
  };
}
