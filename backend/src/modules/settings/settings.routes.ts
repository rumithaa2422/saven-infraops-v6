import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const settingsRouter = Router();

// GET /api/settings
// Supports both legacy (settings:read) and new (settings:view) permissions
settingsRouter.get('/', requireAuth, requirePermissionOr(['settings:read', 'settings:view']), async (_req, res, next) => {
  try {
    const items = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    res.json({ items: items.map((item) => ({ ...item, value: item.isSecret ? '********' : item.value })) });
  } catch (error) {
    next(error);
  }
});

const updateSchema = z.object({ value: z.string() });

// PUT /api/settings/:key
// Supports both legacy (settings:write) and new (settings:manage) permissions
settingsRouter.put('/:key', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), async (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const item = await prisma.systemSetting.update({
      where: { key: req.params.key },
      data: { value: payload.value, updatedBy: req.user?.email }
    });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});
