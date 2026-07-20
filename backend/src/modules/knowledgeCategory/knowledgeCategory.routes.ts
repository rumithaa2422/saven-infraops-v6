/**
 * Knowledge Category Routes
 * 
 * Handles CRUD operations for knowledge base categories.
 * Provides endpoints for listing, creating, updating, and deleting categories.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import { logger } from '../../common/logger.js';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryNameExists
} from '../../services/knowledgeCategory.service.js';

export const knowledgeCategoryRouter = Router();

// Helper to extract IP address from request
function getClientIp(req: Request): string | null {
  const ip = req.ip;
  if (Array.isArray(ip)) {
    return ip[0] || null;
  }
  return ip || null;
}

// ============================================================
// GET /api/knowledge/categories
// List all active categories sorted by displayOrder then name
// ============================================================
knowledgeCategoryRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([
        'knowledge.category:view',
        'kb:view',
        'kb:manage',
        'knowledge.category:create',
        'knowledge.category:update',
        'knowledge.category:delete'
      ])(req, res, (err) => err ? reject(err) : resolve())
    );

    const categories = await listCategories();
    
    logger.info({
      action: 'LIST_CATEGORIES',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      count: categories.length
    }, 'Listed knowledge categories');

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/knowledge/categories/:id
// Get a single category by ID
// ============================================================
knowledgeCategoryRouter.get('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([
        'knowledge.category:view',
        'kb:view',
        'kb:manage',
        'knowledge.category:create',
        'knowledge.category:update',
        'knowledge.category:delete'
      ])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const category = await getCategoryById(id);

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    logger.info({
      action: 'GET_CATEGORY',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      categoryId: id
    }, 'Retrieved knowledge category');

    res.json(category);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/knowledge/categories
// Create a new category
// ============================================================
knowledgeCategoryRouter.post('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.category:create', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description, color, icon, displayOrder, isActive } = req.body;

    // Validation
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new HttpError(400, 'Category name is required');
    }
    if (trimmedName.length > 100) {
      throw new HttpError(400, 'Category name must be 100 characters or less');
    }

    // Check for duplicate name
    const exists = await categoryNameExists(trimmedName);
    if (exists) {
      throw new HttpError(400, 'A category with this name already exists');
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new HttpError(400, 'Invalid color format. Use hex format (e.g., #5468ff)');
    }

    const clientIp = getClientIp(req);

    const category = await createCategory({
      name: trimmedName,
      description,
      color,
      icon,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      actorId: req.user?.id || null,
      actorEmail: req.user?.email || null,
      ipAddress: clientIp
    });

    logger.info({
      action: 'CREATE_CATEGORY',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      categoryId: category.id,
      categoryName: category.name
    }, 'Created knowledge category');

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUT /api/knowledge/categories/:id
// Update an existing category
// ============================================================
knowledgeCategoryRouter.put('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.category:update', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const { name, description, color, icon, displayOrder, isActive } = req.body;

    // Check if category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new HttpError(404, 'Category not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new HttpError(400, 'Category name cannot be blank');
      }
      if (trimmedName.length > 100) {
        throw new HttpError(400, 'Category name must be 100 characters or less');
      }

      // Check for duplicate name (excluding current category)
      if (trimmedName !== existing.name) {
        const exists = await categoryNameExists(trimmedName, id);
        if (exists) {
          throw new HttpError(400, 'A category with this name already exists');
        }
      }
    }

    // Validate color format if provided
    if (color !== undefined && color !== null && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new HttpError(400, 'Invalid color format. Use hex format (e.g., #5468ff)');
    }

    const clientIp = getClientIp(req);

    const category = await updateCategory(id, {
      name,
      description,
      color,
      icon,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
      actorId: req.user?.id || null,
      actorEmail: req.user?.email || null,
      ipAddress: clientIp
    });

    logger.info({
      action: 'UPDATE_CATEGORY',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      categoryId: id,
      updatedFields: Object.keys(req.body)
    }, 'Updated knowledge category');

    res.json(category);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE /api/knowledge/categories/:id
// Delete a category (only if no articles exist)
// ============================================================
knowledgeCategoryRouter.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.category:delete', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const clientIp = getClientIp(req);

    const result = await deleteCategory(
      id,
      req.user?.id || null,
      req.user?.email || null,
      clientIp
    );

    if (!result.deleted) {
      throw new HttpError(
        400,
        `Cannot delete category: ${result.articleCount} article(s) are assigned to this category. Please reassign or delete the articles first.`
      );
    }

    logger.info({
      action: 'DELETE_CATEGORY',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      categoryId: id
    }, 'Deleted knowledge category');

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});
