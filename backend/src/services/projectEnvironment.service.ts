import { prisma } from '../common/prisma.js';
import { AuditLogData } from './types.js';

export interface CreateProjectEnvironmentInput {
  projectName: string;
  environmentName: string;
  serviceName?: string | null;
  serverName?: string | null;
  databaseName?: string | null;
  ownerName?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createProjectEnvironment(
  data: CreateProjectEnvironmentInput
) {
  const item = await prisma.projectEnvironment.create({
    data: {
      projectName: data.projectName,
      environmentName: data.environmentName,
      serviceName: data.serviceName || null,
      serverName: data.serverName || null,
      databaseName: data.databaseName || null,
      ownerName: data.ownerName || null
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
    throw new Error('Project environment not found');
  }

  const item = await prisma.projectEnvironment.update({
    where: { id },
    data: {
      projectName: data.projectName,
      environmentName: data.environmentName,
      serviceName: data.serviceName !== undefined ? (data.serviceName || null) : undefined,
      serverName: data.serverName !== undefined ? (data.serverName || null) : undefined,
      databaseName: data.databaseName !== undefined ? (data.databaseName || null) : undefined,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined
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
