import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { getKbAnalytics, getAttachmentStats } from '../../services/knowledgeAnalytics.service.js';

const router = Router();

// Get all KB analytics
router.get('/', requireAuth, requirePermissionOr(['kb:view', 'kb:manage']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getKbAnalytics();
    res.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    next(error);
  }
});

// Get attachment stats
router.get('/attachments', requireAuth, requirePermissionOr(['kb:view', 'kb:manage']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getAttachmentStats();
    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
