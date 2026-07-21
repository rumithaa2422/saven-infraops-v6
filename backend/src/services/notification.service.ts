/**
 * Notification Service
 * 
 * Provides in-app notification functionality for the ITSM system.
 * Handles creating and managing notifications for various events.
 */

import { prisma } from '../common/prisma.js';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  referenceModule?: string;
  referenceId?: string;
  actionUrl?: string;
}

/**
 * Create a notification for a single user
 */
export async function createNotification(data: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      referenceModule: data.referenceModule,
      referenceId: data.referenceId,
      actionUrl: data.actionUrl
    }
  });
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  title: string,
  message: string,
  referenceModule?: string,
  referenceId?: string,
  actionUrl?: string
) {
  const notifications = userIds.map(userId => ({
    userId,
    title,
    message,
    referenceModule,
    referenceId,
    actionUrl
  }));

  return prisma.notification.createMany({
    data: notifications
  });
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
  const where: Record<string, unknown> = { userId };
  
  if (options?.unreadOnly) {
    where.isRead = false;
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId // Ensure user owns this notification
    },
    data: {
      isRead: true
    }
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId // Ensure user owns this notification
    }
  });
}

// ============================================================================
// Service Request Notification Helpers
// ============================================================================

/**
 * Notify Super Admins about a new service request
 */
export async function notifySuperAdminsNewRequest(
  requestId: string,
  ticketNo: string,
  title: string,
  requesterName: string,
  priority: string
) {
  // Get all Super Admins
  const superAdmins = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'Super Admin'
          }
        }
      }
    },
    select: { id: true }
  });

  const adminIds = superAdmins.map(admin => admin.id);
  
  if (adminIds.length === 0) return;

  return createNotificationsForUsers(
    adminIds,
    'New Service Request',
    `Laptop request submitted by ${requesterName}. Priority: ${priority}. Open Request.`,
    'ServiceRequest',
    requestId,
    `/service-requests/${requestId}`
  );
}

/**
 * Notify assigned admin about a new assignment
 */
export async function notifyAssigneeNewAssignment(
  assigneeId: string,
  requestId: string,
  ticketNo: string,
  title: string,
  assignedBy: string
) {
  return createNotification({
    userId: assigneeId,
    title: 'You have been assigned',
    message: `${ticketNo}: ${title}. Assigned by ${assignedBy}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify requester about assignment
 */
export async function notifyRequesterAssignment(
  requesterId: string,
  requestId: string,
  ticketNo: string,
  assigneeName: string
) {
  return createNotification({
    userId: requesterId,
    title: 'Your request has been assigned',
    message: `Your request ${ticketNo} has been assigned to ${assigneeName}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify requester about status change
 */
export async function notifyRequesterStatusChange(
  requesterId: string,
  requestId: string,
  ticketNo: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string
) {
  return createNotification({
    userId: requesterId,
    title: 'Request Status Changed',
    message: `${ticketNo}: Status changed from ${oldStatus} → ${newStatus} by ${changedBy}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify old assignee about reassignment
 */
export async function notifyOldAssigneeRemoval(
  oldAssigneeId: string,
  requestId: string,
  ticketNo: string,
  newAssigneeName: string
) {
  return createNotification({
    userId: oldAssigneeId,
    title: 'Request removed',
    message: `${ticketNo} has been reassigned to ${newAssigneeName}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify requester about reassignment
 */
export async function notifyRequesterReassignment(
  requesterId: string,
  requestId: string,
  ticketNo: string,
  oldAssigneeName: string,
  newAssigneeName: string
) {
  return createNotification({
    userId: requesterId,
    title: 'Request reassigned',
    message: `${ticketNo}: Request has been reassigned from ${oldAssigneeName} to ${newAssigneeName}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify admin when employee replies
 */
export async function notifyAdminEmployeeReply(
  assigneeId: string,
  requestId: string,
  ticketNo: string,
  employeeName: string
) {
  return createNotification({
    userId: assigneeId,
    title: 'Customer replied',
    message: `${ticketNo}: Customer ${employeeName} has replied.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify employee when admin replies
 */
export async function notifyEmployeeAdminReply(
  requesterId: string,
  requestId: string,
  ticketNo: string,
  adminName: string
) {
  return createNotification({
    userId: requesterId,
    title: 'Support replied',
    message: `${ticketNo}: ${adminName} has replied to your request.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify requester when ticket is closed
 */
export async function notifyRequesterTicketClosed(
  requesterId: string,
  requestId: string,
  ticketNo: string,
  closedBy: string
) {
  return createNotification({
    userId: requesterId,
    title: 'Your ticket has been closed',
    message: `${ticketNo}: Your request has been closed by ${closedBy}.`,
    referenceModule: 'ServiceRequest',
    referenceId: requestId,
    actionUrl: `/service-requests/${requestId}`
  });
}

/**
 * Notify Super Admins when a comment is added
 */
export async function notifySuperAdminsCommentAdded(
  requestId: string,
  ticketNo: string,
  title: string,
  commenterName: string,
  isEmployee: boolean
) {
  // Get all Super Admins
  const superAdmins = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'Super Admin'
          }
        }
      }
    },
    select: { id: true }
  });

  const adminIds = superAdmins.map(admin => admin.id);
  
  if (adminIds.length === 0) return;

  return createNotificationsForUsers(
    adminIds,
    isEmployee ? 'Customer replied' : 'Admin replied',
    `${ticketNo}: ${commenterName} ${isEmployee ? 'replied' : 'responded'}.`,
    'ServiceRequest',
    requestId,
    `/service-requests/${requestId}`
  );
}
