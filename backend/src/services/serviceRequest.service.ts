import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateServiceRequestInput {
  title: string;
  description?: string | null;
  category: string;
  subCategory?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requesterName: string;
  projectName?: string | null;
  requesterId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createServiceRequest(data: CreateServiceRequestInput) {
  const count = await prisma.serviceRequest.count();
  
  const item = await prisma.serviceRequest.create({
    data: {
      ticketNo: withRef('SR', count),
      title: data.title,
      description: data.description || null,
      category: data.category,
      subCategory: data.subCategory || null,
      priority: data.priority || 'MEDIUM',
      requesterName: data.requesterName,
      projectName: data.projectName || null,
      requesterId: data.requesterId || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'ServiceRequest',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export interface UpdateServiceRequestInput {
  title?: string;
  description?: string | null;
  category?: string;
  subCategory?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requesterName?: string;
  assigneeName?: string | null;
  projectName?: string | null;
  comment?: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateServiceRequest(
  id: string,
  data: UpdateServiceRequestInput
) {
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Service request not found');
  }

  const { comment, ...updates } = data;
  
  // Handle comment appending
  const description = comment?.trim()
    ? `${existing.description || ''}\n\n[${new Date().toISOString()}] ${data.actorEmail || 'user'}: ${comment.trim()}`.trim()
    : updates.description;

  const item = await prisma.serviceRequest.update({
    where: { id },
    data: {
      ...updates,
      description: description !== undefined ? description : existing.description
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'ServiceRequest',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export interface AssignServiceRequestInput {
  assigneeId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function assignServiceRequest(
  id: string,
  data: AssignServiceRequestInput
) {
  // Verify the assignee has Admin role
  const assignee = await prisma.user.findFirst({
    where: {
      id: data.assigneeId,
      roles: {
        some: {
          role: {
            name: 'Admin'
          }
        }
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!assignee) {
    throw new Error('Assignee must have Admin role');
  }

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Service request not found');
  }

  const item = await prisma.serviceRequest.update({
    where: { id },
    data: {
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      status: 'ASSIGNED'
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'ASSIGN',
      entityType: 'ServiceRequest',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
