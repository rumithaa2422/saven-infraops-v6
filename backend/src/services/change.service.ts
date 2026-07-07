import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateChangeRequestInput {
  title: string;
  riskLevel?: string;
  ownerName?: string | null;
  rollbackPlan?: string | null;
  changeWindow?: Date | string | null;
  description?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createChangeRequest(data: CreateChangeRequestInput) {
  const count = await prisma.changeRequest.count();
  
  const item = await prisma.changeRequest.create({
    data: {
      changeNo: withRef('CHG', count),
      title: data.title,
      riskLevel: data.riskLevel || 'MEDIUM',
      ownerName: data.ownerName || null,
      rollbackPlan: data.rollbackPlan || null,
      changeWindow: data.changeWindow ? new Date(data.changeWindow) : null,
      description: data.description || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'ChangeRequest',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateChangeRequest(
  id: string,
  data: Partial<CreateChangeRequestInput>
) {
  const existing = await prisma.changeRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Change request not found');
  }

  const item = await prisma.changeRequest.update({
    where: { id },
    data: {
      title: data.title,
      riskLevel: data.riskLevel,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      rollbackPlan: data.rollbackPlan !== undefined ? (data.rollbackPlan || null) : undefined,
      changeWindow: data.changeWindow !== undefined ? (data.changeWindow ? new Date(data.changeWindow) : null) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'ChangeRequest',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
