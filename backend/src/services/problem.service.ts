import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';
import { ProblemStatus } from '@prisma/client';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateProblemInput {
  title: string;
  ownerName?: string | null;
  description?: string | null;
  rootCause?: string | null;
  status?: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

// Valid status values for problems (ProblemStatus enum)
const PROBLEM_STATUSES: ProblemStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export type { ProblemStatus };

export async function createProblem(data: CreateProblemInput) {
  const count = await prisma.problem.count();
  
  const item = await prisma.problem.create({
    data: {
      problemNo: withRef('PRB', count),
      title: data.title,
      ownerName: data.ownerName || null,
      description: data.description || null,
      rootCause: data.rootCause || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'Problem',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateProblem(
  id: string,
  data: Partial<CreateProblemInput>
) {
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Problem not found');
  }

  // Handle status update
  if (data.status) {
    const newStatus = data.status.toUpperCase();
    if (!PROBLEM_STATUSES.includes(newStatus as ProblemStatus)) {
      throw new HttpError(400, `Invalid status. Must be one of: ${PROBLEM_STATUSES.join(', ')}`);
    }

    const item = await prisma.problem.update({
      where: { id },
      data: { status: newStatus as ProblemStatus }
    });

    await prisma.auditLog.create({
      data: {
        actorId: data.actorId || null,
        actorEmail: data.actorEmail || null,
        action: 'STATUS_CHANGE',
        entityType: 'Problem',
        entityId: item.id,
        oldValue: { status: existing.status },
        newValue: { status: item.status },
        ipAddress: data.ipAddress || null
      }
    });

    return item;
  }

  // Handle regular field updates
  const item = await prisma.problem.update({
    where: { id },
    data: {
      title: data.title,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined,
      rootCause: data.rootCause !== undefined ? (data.rootCause || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'Problem',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
