import { prisma } from '../common/prisma.js';
import { ServiceRequestStatus } from '@prisma/client';
import {
  createNotification,
  createNotificationsForUsers,
  notifySuperAdminsNewRequest,
  notifyAssigneeNewAssignment,
  notifyRequesterAssignment,
  notifyRequesterStatusChange,
  notifyOldAssigneeRemoval,
  notifyRequesterReassignment,
  notifyRequesterTicketClosed
} from './notification.service.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

// Status transition types - using Prisma enum
export type ServiceRequestStatusType = ServiceRequestStatus;

// Status display names
export const STATUS_DISPLAY_NAMES: Record<ServiceRequestStatusType, string> = {
  'OPEN': 'Open',
  'ASSIGNED': 'Assigned',
  'IN_PROGRESS': 'In Progress',
  'WAITING_FOR_USER': 'Waiting for User',
  'COMPLETED': 'Completed',
  'CLOSED': 'Closed'
};

// Valid status transitions for assigned admin
const ADMIN_STATUS_TRANSITIONS: Record<ServiceRequestStatusType, ServiceRequestStatusType[]> = {
  'OPEN': [],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['WAITING_FOR_USER', 'COMPLETED'],
  'WAITING_FOR_USER': ['IN_PROGRESS', 'COMPLETED'],
  'COMPLETED': ['CLOSED'],
  'CLOSED': []
};

// Valid status transitions for super admin (can move to any status)
const SUPER_ADMIN_STATUS_TRANSITIONS: Record<ServiceRequestStatusType, ServiceRequestStatusType[]> = {
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

  // Create audit log
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

  // Create timeline entry
  await prisma.serviceRequestTimeline.create({
    data: {
      requestId: item.id,
      action: 'Created',
      description: 'Service request created',
      performedBy: data.actorId || null,
      performedByName: data.requesterName
    }
  });

  // Notify Super Admins about new request
  await notifySuperAdminsNewRequest(
    item.id,
    item.ticketNo,
    item.title,
    item.requesterName,
    item.priority
  );

  return item;
}

export interface UpdateServiceRequestInput {
  title?: string;
  description?: string | null;
  category?: string;
  subCategory?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: ServiceRequestStatusType;
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
  currentStatus: ServiceRequestStatusType,
  newStatus: ServiceRequestStatusType,
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
  actorId?: string | null;
  actorName?: string;
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

  const oldAssigneeId = existing.assigneeId;
  const oldAssigneeName = existing.assigneeName;

  // Update in a transaction
  const item = await prisma.$transaction(async (tx) => {
    // Update the request
    const updated = await tx.serviceRequest.update({
      where: { id },
      data: {
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        status: 'ASSIGNED'
      }
    });

    // Create timeline entry
    await tx.serviceRequestTimeline.create({
      data: {
        requestId: id,
        action: 'Assigned',
        description: `Assigned to ${assignee.name}`,
        performedBy: data.actorId || null,
        performedByName: data.actorName || null
      }
    });

    // Create system comment
    await tx.serviceRequestComment.create({
      data: {
        requestId: id,
        userId: null,
        userName: 'System',
        message: `Status changed to Assigned. Assigned to ${assignee.name}.`
      }
    });

    return updated;
  });

  // Notify assigned admin
  await notifyAssigneeNewAssignment(
    assignee.id,
    id,
    item.ticketNo,
    item.title,
    data.actorName || 'System Administrator'
  );

  // Notify requester
  if (item.requesterId) {
    await notifyRequesterAssignment(
      item.requesterId,
      id,
      item.ticketNo,
      assignee.name
    );
  }

  // Notify old assignee if reassigned
  if (oldAssigneeId && oldAssigneeId !== assignee.id) {
    await notifyOldAssigneeRemoval(
      oldAssigneeId,
      id,
      item.ticketNo,
      assignee.name
    );
    // Notify requester of reassignment
    if (item.requesterId) {
      await notifyRequesterReassignment(
        item.requesterId,
        id,
        item.ticketNo,
        oldAssigneeName || 'Unknown',
        assignee.name
      );
    }
  }

  return item;
}

// ============================================================================
// Update Status with Timeline, Comments, and Notifications
// ============================================================================

export interface UpdateStatusInput {
  status: ServiceRequestStatusType;
  actorId?: string | null;
  actorName?: string;
  comment?: string; // Optional comment to add
}

export async function updateServiceRequestStatus(
  id: string,
  data: UpdateStatusInput
) {
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Service request not found');
  }

  const oldStatus = existing.status;
  const oldAssigneeId = existing.assigneeId;
  const oldAssigneeName = existing.assigneeName;

  // Build update data
  const updateData: Record<string, unknown> = {
    status: data.status
  };

  // Set closedAt when status is CLOSED
  if (data.status === 'CLOSED') {
    updateData.closedAt = new Date();
  }

  // Update in a transaction
  const item = await prisma.$transaction(async (tx) => {
    // Update the request
    const updated = await tx.serviceRequest.update({
      where: { id },
      data: updateData
    });

    // Create timeline entry for status change
    const statusDisplayOld = STATUS_DISPLAY_NAMES[oldStatus] || oldStatus;
    const statusDisplayNew = STATUS_DISPLAY_NAMES[data.status] || data.status;
    
    await tx.serviceRequestTimeline.create({
      data: {
        requestId: id,
        action: 'Status Changed',
        description: `Status changed from ${statusDisplayOld} to ${statusDisplayNew}`,
        performedBy: data.actorId || null,
        performedByName: data.actorName || null
      }
    });

    // Create system comment for status change
    let commentMessage = `Status changed from ${statusDisplayOld} → ${statusDisplayNew}`;
    if (data.comment) {
      commentMessage += `. Note: ${data.comment}`;
    }
    commentMessage += ` by ${data.actorName || 'System'}.`;

    await tx.serviceRequestComment.create({
      data: {
        requestId: id,
        userId: null,
        userName: 'System',
        message: commentMessage
      }
    });

    return updated;
  });

  // Notify requester about status change
  if (item.requesterId) {
    // Special notification for ticket closure
    if (item.status === 'CLOSED') {
      await notifyRequesterTicketClosed(
        item.requesterId,
        id,
        item.ticketNo,
        data.actorName || 'System'
      );
    } else {
      await notifyRequesterStatusChange(
        item.requesterId,
        id,
        item.ticketNo,
        STATUS_DISPLAY_NAMES[oldStatus] || oldStatus,
        STATUS_DISPLAY_NAMES[item.status] || item.status,
        data.actorName || 'System'
      );
    }
  }

  return item;
}

// Get allowed status transitions for display
export function getAllowedTransitions(
  currentStatus: ServiceRequestStatusType,
  isSuperAdmin: boolean,
  isAdmin: boolean,
  isAssignedToUser: boolean
): ServiceRequestStatusType[] {
  if (isSuperAdmin) {
    return SUPER_ADMIN_STATUS_TRANSITIONS[currentStatus];
  }

  if (isAdmin && isAssignedToUser) {
    return ADMIN_STATUS_TRANSITIONS[currentStatus];
  }

  return [];
}

// Get all possible statuses for Super Admin
export function getAllStatuses(): ServiceRequestStatusType[] {
  return Object.values(ServiceRequestStatus);
}
