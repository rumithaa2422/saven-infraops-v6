import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';
import { IncidentStatus } from '@prisma/client';

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

// Valid status values for incidents (IncidentStatus enum)
const INCIDENT_STATUSES: IncidentStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export type { IncidentStatus };

/**
 * Generates a unique incident number in format: INC-YYYYMMDD-XXXX
 * Uses database transaction with row-level locking to ensure uniqueness
 * even under concurrent creation requests.
 */
async function generateUniqueIncidentNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `INC-${dateStr}-`;

  // Use a transaction with serializable isolation to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // Find the highest incident number for today
    const latestIncident = await tx.incident.findFirst({
      where: {
        incidentNo: {
          startsWith: prefix
        }
      },
      orderBy: {
        incidentNo: 'desc'
      },
      select: {
        incidentNo: true
      }
    });

    let nextSeq = 1;
    if (latestIncident) {
      // Extract the sequence number from the latest incident
      const latestSeq = parseInt(latestIncident.incidentNo.replace(prefix, ''), 10);
      if (!isNaN(latestSeq)) {
        nextSeq = latestSeq + 1;
      }
    }

    // Format with zero-padded sequence number (4 digits)
    const incidentNo = `${prefix}${nextSeq.toString().padStart(4, '0')}`;
    return incidentNo;
  }, {
    isolationLevel: 'Serializable' // Ensures atomic unique number generation
  });
}

export async function createIncident(data: CreateIncidentInput) {
  const incidentNo = await generateUniqueIncidentNo();
  
  const item = await prisma.incident.create({
    data: {
      incidentNo,
      title: data.title,
      severity: (data.severity || 'SEV3') as 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4',
      impactedService: data.impactedService || null,
      impactedProject: data.impactedProject || null,
      // Incidents are always created without an owner - ownership happens via Take Ownership
      ownerName: null,
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
