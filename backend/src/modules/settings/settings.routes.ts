import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const settingsRouter = Router();

settingsRouter.get('/', requireAuth, requirePermission('settings:read'), async (_req, res, next) => {
  try {
    const items = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    res.json({ items: items.map((item) => ({ ...item, value: item.isSecret ? '********' : item.value })) });
  } catch (error) {
    next(error);
  }
});

const updateSchema = z.object({ value: z.string() });

settingsRouter.put('/:key', requireAuth, requirePermission('settings:write'), async (req, res, next) => {
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
