import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

export interface CreateProjectEnvironmentInput {
  projectName: string;
  projectCode: string;
  environmentName?: string | null;
  serviceName?: string | null;
  serverName?: string | null;
  databaseName?: string | null;
  ownerName?: string | null;
  client?: string | null;
  description?: string | null;
  department?: string | null;
  technologyStack?: string | null;
  priority?: string;
  status?: string;
  budget?: number | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  projectType?: string | null;
  projectLocation?: string | null;
  remarks?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createProjectEnvironment(
  data: CreateProjectEnvironmentInput
) {
  // Check for duplicate project code
  const existingByCode = await prisma.projectEnvironment.findUnique({
    where: { projectCode: data.projectCode }
  });
  if (existingByCode) {
    throw HttpError.conflict('Project code already exists');
  }

  // Check for duplicate project name
  const existingByName = await prisma.projectEnvironment.findFirst({
    where: { projectName: data.projectName }
  });
  if (existingByName) {
    throw HttpError.conflict('Project name already exists');
  }

  const item = await prisma.projectEnvironment.create({
    data: {
      projectName: data.projectName,
      projectCode: data.projectCode,
      environmentName: data.environmentName || null,
      serviceName: data.serviceName || null,
      serverName: data.serverName || null,
      databaseName: data.databaseName || null,
      ownerName: data.ownerName || null,
      client: data.client || null,
      description: data.description || null,
      department: data.department || null,
      technologyStack: data.technologyStack || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'ACTIVE',
      budget: data.budget ? data.budget : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
      projectType: data.projectType || null,
      projectLocation: data.projectLocation || null,
      remarks: data.remarks || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'ProjectEnvironment',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateProjectEnvironment(
  id: string,
  data: Partial<CreateProjectEnvironmentInput> & { actorId?: string; actorEmail?: string; ipAddress?: string }
) {
  const existing = await prisma.projectEnvironment.findUnique({ where: { id } });
  if (!existing) {
    throw HttpError.notFound('Project not found');
  }

  // Check for duplicate project name (excluding current project)
  if (data.projectName && data.projectName !== existing.projectName) {
    const existingByName = await prisma.projectEnvironment.findFirst({
      where: { 
        projectName: data.projectName,
        id: { not: id }
      }
    });
    if (existingByName) {
      throw HttpError.conflict('Project name already exists');
    }
  }

  const item = await prisma.projectEnvironment.update({
    where: { id },
    data: {
      projectName: data.projectName,
      environmentName: data.environmentName !== undefined ? (data.environmentName || null) : undefined,
      serviceName: data.serviceName !== undefined ? (data.serviceName || null) : undefined,
      serverName: data.serverName !== undefined ? (data.serverName || null) : undefined,
      databaseName: data.databaseName !== undefined ? (data.databaseName || null) : undefined,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      client: data.client !== undefined ? (data.client || null) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined,
      department: data.department !== undefined ? (data.department || null) : undefined,
      technologyStack: data.technologyStack !== undefined ? (data.technologyStack || null) : undefined,
      priority: data.priority,
      status: data.status,
      budget: data.budget !== undefined ? (data.budget || null) : undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      expectedEndDate: data.expectedEndDate !== undefined ? (data.expectedEndDate ? new Date(data.expectedEndDate) : null) : undefined,
      actualEndDate: data.actualEndDate !== undefined ? (data.actualEndDate ? new Date(data.actualEndDate) : null) : undefined,
      projectType: data.projectType !== undefined ? (data.projectType || null) : undefined,
      projectLocation: data.projectLocation !== undefined ? (data.projectLocation || null) : undefined,
      remarks: data.remarks !== undefined ? (data.remarks || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'ProjectEnvironment',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
