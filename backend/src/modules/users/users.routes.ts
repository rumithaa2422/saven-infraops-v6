import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../common/prisma.js';

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
