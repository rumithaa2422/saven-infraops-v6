import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

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

// Valid status values for access requests
const ACCESS_STATUSES = ['REQUESTED', 'APPROVED', 'PROVISIONED', 'REVOKED', 'REJECTED'] as const;
type AccessStatus = typeof ACCESS_STATUSES[number];

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

// Status update for access requests
export interface UpdateAccessStatusInput {
  status: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateAccessStatus(id: string, data: UpdateAccessStatusInput) {
  const existing = await prisma.accessRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Access request not found');
  }

  const newStatus = data.status.toUpperCase();
  if (!ACCESS_STATUSES.includes(newStatus as AccessStatus)) {
    throw new HttpError(400, `Invalid status. Must be one of: ${ACCESS_STATUSES.join(', ')}`);
  }

  // Business rule: Cannot Provision unless Approved
  if (newStatus === 'PROVISIONED' && existing.status !== 'APPROVED') {
    throw new HttpError(400, 'Cannot provision access that has not been approved');
  }

  // Business rule: Cannot Revoke if already Revoked
  if (newStatus === 'REVOKED' && existing.status === 'REVOKED') {
    throw new HttpError(400, 'Access is already revoked');
  }

  const item = await prisma.accessRequest.update({
    where: { id },
    data: { status: newStatus as AccessStatus }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'STATUS_CHANGE',
      entityType: 'AccessRequest',
      entityId: item.id,
      oldValue: { status: existing.status },
      newValue: { status: item.status },
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
