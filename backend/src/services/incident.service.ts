import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateIncidentInput {
  title: string;
  severity?: string;
  impactedService?: string | null;
  impactedProject?: string | null;
  ownerName?: string | null;
  description?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createIncident(data: CreateIncidentInput) {
  const count = await prisma.incident.count();
  
  const item = await prisma.incident.create({
    data: {
      incidentNo: withRef('INC', count),
      title: data.title,
      severity: (data.severity || 'SEV3') as 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4',
      impactedService: data.impactedService || null,
      impactedProject: data.impactedProject || null,
      ownerName: data.ownerName || null,
      description: data.description || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'Incident',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateIncident(
  id: string,
  data: Partial<CreateIncidentInput>
) {
  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Incident not found');
  }

  const item = await prisma.incident.update({
    where: { id },
    data: {
      title: data.title,
      severity: data.severity as 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4' | undefined,
      impactedService: data.impactedService !== undefined ? (data.impactedService || null) : undefined,
      impactedProject: data.impactedProject !== undefined ? (data.impactedProject || null) : undefined,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'Incident',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
