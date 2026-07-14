import { prisma } from '../../common/prisma.js';

// Report types available
export type ReportType = 
  | 'incidents'
  | 'service-requests'
  | 'changes'
  | 'inventory'
  | 'access-requests'
  | 'compliance'
  | 'projects'
  | 'vendors'
  | 'users';

export interface ReportFilter {
  status?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: string;
  priority?: string;
}

export interface ReportDefinition {
  id: ReportType;
  name: string;
  description: string;
  module: string;
}

// Available report definitions
export const reportDefinitions: ReportDefinition[] = [
  {
    id: 'incidents',
    name: 'Incident Summary Report',
    description: 'Summary of all incidents with severity, status, and owner information',
    module: 'incidents'
  },
  {
    id: 'service-requests',
    name: 'Service Request Report',
    description: 'All service requests with category, priority, and assignment details',
    module: 'tickets'
  },
  {
    id: 'changes',
    name: 'Change Request Report',
    description: 'Change requests with risk levels and approval status',
    module: 'changes'
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Asset inventory with assignment and location details',
    module: 'inventory'
  },
  {
    id: 'access-requests',
    name: 'Access Request Report',
    description: 'System access requests with approval workflow',
    module: 'access'
  },
  {
    id: 'compliance',
    name: 'Compliance Status Report',
    description: 'Compliance documents and their upload status',
    module: 'compliance'
  },
  {
    id: 'projects',
    name: 'Project Report',
    description: 'Projects and environments with ownership details',
    module: 'projects'
  },
  {
    id: 'vendors',
    name: 'Vendor License Report',
    description: 'Vendor licenses with assignment and renewal information',
    module: 'vendors'
  },
  {
    id: 'users',
    name: 'User Report',
    description: 'User accounts with department and role information',
    module: 'users'
  }
];

// Get all available reports
export function getAvailableReports(): ReportDefinition[] {
  return reportDefinitions;
}

// Generate report based on type and filters
export async function generateReport(
  type: ReportType,
  filters: ReportFilter,
  actorEmail?: string
): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  switch (type) {
    case 'incidents':
      return generateIncidentReport(filters, actorEmail);
    case 'service-requests':
      return generateServiceRequestReport(filters, actorEmail);
    case 'changes':
      return generateChangeReport(filters, actorEmail);
    case 'inventory':
      return generateInventoryReport(filters, actorEmail);
    case 'access-requests':
      return generateAccessRequestReport(filters, actorEmail);
    case 'compliance':
      return generateComplianceReport(filters, actorEmail);
    case 'projects':
      return generateProjectReport(filters, actorEmail);
    case 'vendors':
      return generateVendorReport(filters, actorEmail);
    case 'users':
      return generateUserReport(filters, actorEmail);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

// Incident Report
async function generateIncidentReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.severity) {
    where.severity = filters.severity;
  }
  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  const incidents = await prisma.incident.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Incident Summary Report',
    headers: ['Incident No', 'Title', 'Severity', 'Status', 'Owner', 'Created Date'],
    rows: incidents.map(i => ({
      incidentNo: i.incidentNo,
      title: i.title,
      severity: i.severity,
      status: i.status,
      ownerName: i.ownerName || '-',
      createdAt: i.createdAt.toISOString().split('T')[0]
    }))
  };
}

// Service Request Report
async function generateServiceRequestReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  const requests = await prisma.serviceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Service Request Report',
    headers: ['Ticket No', 'Category', 'Priority', 'Status', 'Requester', 'Assignee'],
    rows: requests.map(r => ({
      ticketNo: r.ticketNo,
      category: r.category,
      priority: r.priority,
      status: r.status,
      requesterName: r.requesterName,
      assigneeName: r.assigneeName || 'Unassigned'
    }))
  };
}

// Change Report
async function generateChangeReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.owner) {
    where.ownerName = { contains: filters.owner };
  }
  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  const changes = await prisma.changeRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Change Request Report',
    headers: ['Change No', 'Risk Level', 'Owner', 'Status', 'Change Window'],
    rows: changes.map(c => ({
      changeNo: c.changeNo,
      riskLevel: c.riskLevel,
      ownerName: c.ownerName || '-',
      status: c.status,
      changeWindow: c.changeWindow ? new Date(c.changeWindow).toISOString().split('T')[0] : '-'
    }))
  };
}

// Inventory Report
async function generateInventoryReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.owner) {
    where.assignedToName = { contains: filters.owner };
  }

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Inventory Report',
    headers: ['Asset No', 'Asset Type', 'Assigned To', 'Location', 'Status'],
    rows: assets.map(a => ({
      assetNo: a.assetNo,
      assetType: a.assetType,
      assignedToName: a.assignedToName || 'Unassigned',
      location: a.location || '-',
      status: a.status
    }))
  };
}

// Access Request Report
async function generateAccessRequestReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  const requests = await prisma.accessRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Access Request Report',
    headers: ['Request No', 'Requester', 'System', 'Access Type', 'Approver', 'Status'],
    rows: requests.map(r => ({
      requestNo: r.requestNo,
      requesterName: r.requesterName,
      systemName: r.systemName,
      accessType: r.accessType,
      approverName: r.approverName || 'Pending',
      status: r.status
    }))
  };
}

// Compliance Report
async function generateComplianceReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.owner) {
    where.uploadedByEmail = { contains: filters.owner };
  }

  const documents = await prisma.complianceDocument.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Compliance Status Report',
    headers: ['File Name', 'Uploaded By', 'Email', 'Upload Date', 'File Size (KB)'],
    rows: documents.map(d => ({
      fileName: d.fileName,
      uploadedBy: d.uploadedBy || '-',
      uploadedByEmail: d.uploadedByEmail || '-',
      uploadDate: d.createdAt.toISOString().split('T')[0],
      fileSizeKB: Math.round(d.fileSize / 1024)
    }))
  };
}

// Project Report
async function generateProjectReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.owner) {
    where.ownerName = { contains: filters.owner };
  }

  const projects = await prisma.projectEnvironment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Project Report',
    headers: ['Project', 'Environment', 'Owner', 'Service', 'Server', 'Database'],
    rows: projects.map(p => ({
      projectName: p.projectName,
      environmentName: p.environmentName,
      ownerName: p.ownerName || '-',
      serviceName: p.serviceName || '-',
      serverName: p.serverName || '-',
      databaseName: p.databaseName || '-'
    }))
  };
}

// Vendor License Report
async function generateVendorReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.owner) {
    where.ownerName = { contains: filters.owner };
  }
  if (filters.dateFrom) {
    where.renewalAt = { ...where.renewalAt, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.renewalAt = { ...where.renewalAt, lte: new Date(filters.dateTo) };
  }

  const licenses = await prisma.vendorLicense.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'Vendor License Report',
    headers: ['Vendor', 'License', 'Assigned Count', 'Available Count', 'Renewal Date', 'Owner'],
    rows: licenses.map(l => ({
      vendorName: l.vendorName,
      licenseName: l.licenseName,
      assignedCount: l.assignedCount || 0,
      licenseCount: l.licenseCount,
      renewalAt: l.renewalAt ? new Date(l.renewalAt).toISOString().split('T')[0] : '-',
      ownerName: l.ownerName || '-'
    }))
  };
}

// User Report
async function generateUserReport(filters: ReportFilter, actorEmail?: string): Promise<{ headers: string[]; rows: Record<string, unknown>[]; reportName: string }> {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.owner) {
    where.department = filters.owner;
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      roles: {
        include: {
          role: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  return {
    reportName: 'User Report',
    headers: ['Name', 'Email', 'Department', 'Role', 'Status'],
    rows: users.map(u => ({
      name: u.name,
      email: u.email,
      department: u.department || '-',
      role: u.roles.map(r => r.role.name).join(', ') || '-',
      status: u.status
    }))
  };
}
