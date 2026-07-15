import { prisma } from '../common/prisma.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

// Status transition types
export type WorkStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'COMPLETED' | 'CLOSED';

// Valid status transitions for assigned admin
const ADMIN_STATUS_TRANSITIONS: Record<WorkStatus, WorkStatus[]> = {
  'OPEN': [],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['WAITING_FOR_USER', 'COMPLETED'],
  'WAITING_FOR_USER': ['IN_PROGRESS', 'COMPLETED'],
  'COMPLETED': ['CLOSED'],
  'CLOSED': []
};

// Valid status transitions for super admin (can move to any status)
const SUPER_ADMIN_STATUS_TRANSITIONS: Record<WorkStatus, WorkStatus[]> = {
  'OPEN': ['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED'],
  'ASSIGNED': ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED'],
  'IN_PROGRESS': ['OPEN', 'ASSIGNED', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED'],
  'WAITING_FOR_USER': ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'],
  'COMPLETED': ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'CLOSED'],
  'CLOSED': ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED']
};

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
  status?: WorkStatus;
  requesterName?: string;
  assigneeName?: string | null;
  projectName?: string | null;
  closedAt?: Date | null;
}

export async function updateServiceRequest(
  id: string,
  data: UpdateServiceRequestInput
) {
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Service request not found');
  }

  // Build only the fields that exist in the schema
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subCategory !== undefined) updateData.subCategory = data.subCategory;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set closedAt when status is CLOSED
    if (data.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }
  }
  if (data.requesterName !== undefined) updateData.requesterName = data.requesterName;
  if (data.assigneeName !== undefined) updateData.assigneeName = data.assigneeName;
  if (data.projectName !== undefined) updateData.projectName = data.projectName;
  if (data.closedAt !== undefined) updateData.closedAt = data.closedAt;

  const item = await prisma.serviceRequest.update({
    where: { id },
    data: updateData
  });

  return item;
}

// Validate status transition based on user role
export function validateStatusTransition(
  currentStatus: WorkStatus,
  newStatus: WorkStatus,
  isSuperAdmin: boolean,
  isAdmin: boolean,
  isAssignedToUser: boolean
): { valid: boolean; error?: string } {
  // Super Admin can move to any status
  if (isSuperAdmin) {
    return { valid: true };
  }

  // Employees cannot change status
  if (!isAdmin) {
    return { valid: false, error: 'Employees cannot change ticket status' };
  }

  // Admin must be assigned to the ticket to change status
  if (!isAssignedToUser) {
    return { valid: false, error: 'You can only change status on tickets assigned to you' };
  }

  // Check admin allowed transitions
  const allowedTransitions = ADMIN_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    const validOptions = allowedTransitions.length > 0 
      ? allowedTransitions.join(', ') 
      : 'No transitions allowed from this status';
    return { 
      valid: false, 
      error: `Invalid status transition. Allowed: ${validOptions}` 
    };
  }

  return { valid: true };
}

export interface AssignServiceRequestInput {
  assigneeId: string;
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

  return item;
}
