/**
 * Notification Routes
 * 
 * API endpoints for in-app notifications.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../services/notification.service.js';

export const notificationRouter = Router();

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
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
