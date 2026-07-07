import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateComplianceControlInput {
  title: string;
  controlArea: string;
  ownerName: string;
  frequency?: string;
  riskRating?: string;
  dueAt?: Date | string | null;
  evidenceUrl?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createComplianceControl(data: CreateComplianceControlInput) {
  const count = await prisma.complianceControl.count();
  
  const item = await prisma.complianceControl.create({
    data: {
      controlNo: withRef('CMP', count),
      title: data.title,
      controlArea: data.controlArea,
      ownerName: data.ownerName,
      frequency: data.frequency || 'Quarterly',
      riskRating: data.riskRating || 'MEDIUM',
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      evidenceUrl: data.evidenceUrl || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'ComplianceControl',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateComplianceControl(
  id: string,
  data: Partial<CreateComplianceControlInput>
) {
  const existing = await prisma.complianceControl.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Compliance control not found');
  }

  const item = await prisma.complianceControl.update({
    where: { id },
    data: {
      title: data.title,
      controlArea: data.controlArea,
      ownerName: data.ownerName,
      frequency: data.frequency,
      riskRating: data.riskRating,
      dueAt: data.dueAt !== undefined ? (data.dueAt ? new Date(data.dueAt) : null) : undefined,
      evidenceUrl: data.evidenceUrl !== undefined ? (data.evidenceUrl || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'ComplianceControl',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
