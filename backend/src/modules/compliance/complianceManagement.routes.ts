/**
 * Compliance Management Routes
 * 
 * Handles CRUD operations for compliance frameworks and controls.
 * Phase C: Enterprise Compliance Management
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import { ComplianceManagementService } from '../../services/complianceManagement.service.js';

export const complianceManagementRouter = Router();

// ============================================================
// Framework Routes
// ============================================================

/**
 * GET /api/compliance-management/frameworks
 * List all frameworks with optional filters
 */
complianceManagementRouter.get('/frameworks', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const result = await ComplianceManagementService.listFrameworks({
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/frameworks/dropdown
 * Get frameworks for dropdown selection
 */
complianceManagementRouter.get('/frameworks/dropdown', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const frameworks = await ComplianceManagementService.getFrameworksDropdown();
    res.json({ items: frameworks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/frameworks/:id
 * Get single framework by ID
 */
complianceManagementRouter.get('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const framework = await ComplianceManagementService.getFramework(id);

    if (!framework) {
      throw new HttpError(404, 'Framework not found');
    }

    res.json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance-management/frameworks
 * Create a new framework
 */
complianceManagementRouter.post('/frameworks', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Framework name is required');
    }

    const framework = await ComplianceManagementService.createFramework({
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user?.id || null
    });

    res.status(201).json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/compliance-management/frameworks/:id
 * Update a framework
 */
complianceManagementRouter.patch('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const { name, description, status } = req.body;

    // Check if framework exists
    const existing = await ComplianceManagementService.getFramework(id);
    if (!existing) {
      throw new HttpError(404, 'Framework not found');
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const framework = await ComplianceManagementService.updateFramework(id, {
      name: name?.trim(),
      description: description?.trim(),
      status
    });

    res.json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance-management/frameworks/:id
 * Delete a framework
 */
complianceManagementRouter.delete('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:delete', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    // Check if framework exists
    const existing = await ComplianceManagementService.getFramework(id);
    if (!existing) {
      throw new HttpError(404, 'Framework not found');
    }

    await ComplianceManagementService.deleteFramework(id);

    res.json({ success: true, message: 'Framework deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Control Routes
// ============================================================

/**
 * GET /api/compliance-management/controls
 * List all controls with optional filters
 */
complianceManagementRouter.get('/controls', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      frameworkId,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const result = await ComplianceManagementService.listControls({
      frameworkId: frameworkId as string,
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/controls/:id
 * Get single control by ID
 */
complianceManagementRouter.get('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const control = await ComplianceManagementService.getControl(id);

    if (!control) {
      throw new HttpError(404, 'Control not found');
    }

    res.json(control);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance-management/controls
 * Create a new control
 */
complianceManagementRouter.post('/controls', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { frameworkId, name, description } = req.body;

    if (!frameworkId || typeof frameworkId !== 'string') {
      throw new HttpError(400, 'Framework ID is required');
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Control name is required');
    }

    const control = await ComplianceManagementService.createControl({
      frameworkId,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user?.id || null
    });

    res.status(201).json(control);
  } catch (error: any) {
    if (error.message === 'Framework not found') {
      throw new HttpError(404, 'Framework not found');
    }
    next(error);
  }
});

/**
 * PATCH /api/compliance-management/controls/:id
 * Update a control
 */
complianceManagementRouter.patch('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const { name, description, status } = req.body;

    // Check if control exists
    const existing = await ComplianceManagementService.getControl(id);
    if (!existing) {
      throw new HttpError(404, 'Control not found');
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const control = await ComplianceManagementService.updateControl(id, {
      name: name?.trim(),
      description: description?.trim(),
      status
    });

    res.json(control);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance-management/controls/:id
 * Delete a control
 */
complianceManagementRouter.delete('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:delete', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    // Check if control exists
    const existing = await ComplianceManagementService.getControl(id);
    if (!existing) {
      throw new HttpError(404, 'Control not found');
    }

    await ComplianceManagementService.deleteControl(id);

    res.json({ success: true, message: 'Control deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Summary Route
// ============================================================

/**
 * GET /api/compliance-management/summary
 * Get compliance summary statistics
 */
complianceManagementRouter.get('/summary', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const summary = await ComplianceManagementService.getSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});
