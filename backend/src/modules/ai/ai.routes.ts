import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { askAi } from './ai.service.js';

export const aiRouter = Router();

const askSchema = z.object({ question: z.string().min(2).max(1000) });

/**
 * POST /api/ai/ask
 * 
 * Main AI endpoint. Requires authentication and 'ai:ask' permission.
 * Passes user permissions to the agent for tool filtering.
 */
aiRouter.post('/ask', requireAuth, requirePermission('ai:ask'), async (req, res, next) => {
  try {
    const payload = askSchema.parse(req.body);
    
    // Pass user context including permissions for tool filtering
    const result = await askAi({ 
      question: payload.question, 
      userId: req.user?.id,
      userPermissions: req.user?.permissions || [],
      userRoles: req.user?.roles || []
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});
