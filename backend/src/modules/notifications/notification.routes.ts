/**
 * Notification Routes
 * 
 * API endpoints for in-app notifications.
 * Includes real-time notification support via Server-Sent Events (SSE).
 */

import { Router, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../services/notification.service.js';
import { prisma } from '../../common/prisma.js';

export const notificationRouter = Router();

// Store for active SSE connections per user
// Express Response has a write() method for SSE
const sseConnections = new Map<string, { res: Response }>();

// Clean up SSE connection when client disconnects
function cleanupSSEConnection(userId: string) {
  const connection = sseConnections.get(userId);
  if (connection) {
    try {
      // Just remove from map - Express handles cleanup
    } catch {
      // Connection already closed
    }
    sseConnections.delete(userId);
  }
}

// Broadcast notification to a specific user
export function broadcastNotificationToUser(userId: string, notification: {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceModule?: string;
  referenceId?: string;
  actionUrl?: string;
  createdAt: Date;
}) {
  const connection = sseConnections.get(userId);
  if (connection) {
    try {
      const data = JSON.stringify(notification);
      // Express Response has write method - cast to any to bypass type checking
      (connection.res as Response & { write: (data: string) => boolean }).write(`event: notification\ndata: ${data}\n\n`);
    } catch {
      cleanupSSEConnection(userId);
    }
  }
}

// Broadcast unread count update to a specific user
export function broadcastUnreadCountToUser(userId: string, count: number) {
  const connection = sseConnections.get(userId);
  if (connection) {
    try {
      (connection.res as Response & { write: (data: string) => boolean }).write(`event: unread-count\ndata: ${JSON.stringify({ count })}\n\n`);
    } catch {
      cleanupSSEConnection(userId);
    }
  }
}

// GET /api/notifications/stream - SSE endpoint for real-time notifications
notificationRouter.get('/stream', requireAuth, (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Express Response has write method for SSE
  const resWithWrite = res as Response & { write: (data: string) => boolean };

  // Send initial connection message
  resWithWrite.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', userId })}\n\n`);

  // Store the connection
  sseConnections.set(userId, { res });

  // Send initial unread count
  getUnreadCount(userId).then(count => {
    if (sseConnections.has(userId)) {
      resWithWrite.write(`event: unread-count\ndata: ${JSON.stringify({ count })}\n\n`);
    }
  });

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    if (sseConnections.has(userId)) {
      try {
        resWithWrite.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeatInterval);
        cleanupSSEConnection(userId);
      }
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Heartbeat every 30 seconds

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    cleanupSSEConnection(userId);
  });

  req.on('error', () => {
    clearInterval(heartbeatInterval);
    cleanupSSEConnection(userId);
  });
});

// GET /api/notifications - Get notifications for current user
notificationRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const notifications = await getUserNotifications(userId, { unreadOnly, limit });
    
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count - Get unread notification count
notificationRouter.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const count = await getUnreadCount(userId);
    
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/:id/read - Mark notification as read
notificationRouter.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notificationId = String(req.params.id);
    await markAsRead(notificationId, userId);

    // Broadcast unread count update
    const count = await getUnreadCount(userId);
    broadcastUnreadCountToUser(userId, count);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
notificationRouter.post('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await markAllAsRead(userId);

    // Broadcast unread count update
    broadcastUnreadCountToUser(userId, 0);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete a notification
notificationRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notificationId = String(req.params.id);
    await deleteNotification(notificationId, userId);

    // Broadcast unread count update
    const count = await getUnreadCount(userId);
    broadcastUnreadCountToUser(userId, count);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
