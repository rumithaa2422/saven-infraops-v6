import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

export const usersRouter = Router();

// GET /users/admins - Get all users with Admin role
// Requires authentication
usersRouter.get('/admins', requireAuth, async (_req, res, next) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
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
      },
      orderBy: { name: 'asc' }
    });
    res.json(admins);
  } catch (error) {
    next(error);
  }
});

// GET /users/me - Get current user profile
usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        department: true,
        status: true,
        createdAt: true
      }
    });
    
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Schema for updating user profile
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  department: z.string().optional()
});

// PUT /users/me - Update current user profile
usersRouter.put('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const payload = updateProfileSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.phoneNumber !== undefined && { phoneNumber: payload.phoneNumber || null }),
        ...(payload.department !== undefined && { department: payload.department || null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        department: true,
        status: true
      }
    });
    
    res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/preferences - Get user notification preferences
usersRouter.get('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Try to get preferences from system settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: `user_prefs_${userId}_`
        }
      }
    });
    
    // Parse preferences from settings or return defaults
    const preferences: Record<string, boolean | string> = {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifyMyTickets: true,
      notifyMyRequests: true,
      notifyAssignedIncidents: true,
      notifyIncidentAssigned: true,
      notifyChangeApproval: true,
      notifyAccessRequests: true,
      notifySlaAlerts: true
    };
    
    settings.forEach(setting => {
      const key = setting.key.replace(`user_prefs_${userId}_`, '');
      if (setting.value === 'true' || setting.value === 'false') {
        preferences[key] = setting.value === 'true';
      } else {
        preferences[key] = setting.value;
      }
    });
    
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Schema for updating user preferences
const updatePreferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  notifyMyTickets: z.boolean().optional(),
  notifyMyRequests: z.boolean().optional(),
  notifyAssignedIncidents: z.boolean().optional(),
  notifyIncidentAssigned: z.boolean().optional(),
  notifyChangeApproval: z.boolean().optional(),
  notifyAccessRequests: z.boolean().optional(),
  notifySlaAlerts: z.boolean().optional()
});

// PUT /users/me/preferences - Update user notification preferences
usersRouter.put('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const payload = updatePreferencesSchema.parse(req.body);
    
    // Prepare batch upsert operations
    const upsertOps = Object.entries(payload).map(([key, value]) => {
      const settingKey = `user_prefs_${userId}_${key}`;
      return prisma.systemSetting.upsert({
        where: { key: settingKey },
        update: { value: String(value) },
        create: {
          group: 'user_preferences',
          key: settingKey,
          value: String(value),
          isSecret: false
        }
      });
    });
    
    await Promise.all(upsertOps);
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    next(error);
  }
});
