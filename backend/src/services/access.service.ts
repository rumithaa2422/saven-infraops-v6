import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateAccessRequestInput {
  requesterName: string;
  accessType: string;
  systemName: string;
  approverName?: string | null;
  justification?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createAccessRequest(data: CreateAccessRequestInput) {
  const count = await prisma.accessRequest.count();
  
  const item = await prisma.accessRequest.create({
    data: {
      requestNo: withRef('ACC', count),
      requesterName: data.requesterName,
      accessType: data.accessType,
      systemName: data.systemName,
      approverName: data.approverName || null,
      justification: data.justification || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'AccessRequest',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateAccessRequest(
  id: string,
  data: Partial<CreateAccessRequestInput>
) {
  const existing = await prisma.accessRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Access request not found');
  }

  const item = await prisma.accessRequest.update({
    where: { id },
    data: {
      requesterName: data.requesterName,
      accessType: data.accessType,
      systemName: data.systemName,
      approverName: data.approverName !== undefined ? (data.approverName || null) : undefined,
      justification: data.justification !== undefined ? (data.justification || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'AccessRequest',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
