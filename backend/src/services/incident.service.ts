import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

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

// Valid status values for incidents (WorkStatus enum)
const INCIDENT_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED'] as const;
type IncidentStatus = typeof INCIDENT_STATUSES[number];

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

// Status update for incidents
export interface UpdateIncidentStatusInput {
  status: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateIncidentStatus(id: string, data: UpdateIncidentStatusInput) {
  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Incident not found');
  }

  const newStatus = data.status.toUpperCase();
  if (!INCIDENT_STATUSES.includes(newStatus as IncidentStatus)) {
    throw new HttpError(400, `Invalid status. Must be one of: ${INCIDENT_STATUSES.join(', ')}`);
  }

  const item = await prisma.incident.update({
    where: { id },
    data: { status: newStatus as IncidentStatus }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'STATUS_CHANGE',
      entityType: 'Incident',
      entityId: item.id,
      oldValue: { status: existing.status },
      newValue: { status: item.status },
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
