import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { askAi } from './ai.service.js';

export const aiRouter = Router();

const askSchema = z.object({ question: z.string().min(2).max(1000) });

aiRouter.post('/ask', requireAuth, requirePermission('ai:ask'), async (req, res, next) => {
  try {
    const payload = askSchema.parse(req.body);
    const result = await askAi({ question: payload.question, userId: req.user?.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
