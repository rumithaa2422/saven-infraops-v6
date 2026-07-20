import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

/**
 * PART 4: Inventory Category Permission Enforcement
 * 
 * Permissions:
 * - inventory:view - View categories
 * - inventory:view_categories - View category details
 * - inventory:create_category - Create categories
 * - inventory:update_category - Update categories
 * - inventory:delete_category - Delete categories
 */

export const inventoryCategoryRouter = Router();

// Permission constants - PART 4: Using granular permissions
const VIEW_PERMISSION = 'inventory:view';
const CREATE_PERMISSION = 'inventory:create_category';
const UPDATE_PERMISSION = 'inventory:update_category';
const DELETE_PERMISSION = 'inventory:delete_category';

// Helper to check if user is Super Admin
function isSuperAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Super Admin') ?? false;
}

// Helper to check if user is Admin
function isAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Admin') ?? false;
}

// ============================================
// Category Routes - PART 4: Permission Protected
// ============================================

// GET /categories - List all categories with subcategories
inventoryCategoryRouter.get('/categories', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const categories = await prisma.inventoryCategory.findMany({
      where,
      include: {
        subcategories: {
          where: status ? { status } : undefined,
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get inventory counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const inventoryCount = await prisma.inventoryMaster.count({
          where: { categoryId: category.id }
        });
        return {
          ...category,
          inventoryCount,
          subcategoryCount: category.subcategories.length
        };
      })
    );

    res.json({ categories: categoriesWithCounts });
  } catch (error) {
    next(error);
  }
});

// GET /categories/:id - Get single category with subcategories
inventoryCategoryRouter.get('/categories/:id', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const category = await prisma.inventoryCategory.findUnique({
      where: { id: req.params.id as string },
      include: {
        subcategories: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// POST /categories - Create new category (PART 4: inventory:create_category)
inventoryCategoryRouter.post('/categories', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(CREATE_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description, status } = req.body;

    if (!name || name.trim() === '') {
      throw new HttpError(400, 'Category name is required');
    }

    // Check if category with same name exists
    const existing = await prisma.inventoryCategory.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      throw new HttpError(400, 'Category with this name already exists');
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'ACTIVE'
      },
      include: {
        subcategories: true
      }
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

// PATCH /categories/:id - Update category (PART 4: inventory:update_category)
inventoryCategoryRouter.patch('/categories/:id', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(UPDATE_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description, status } = req.body;
    const { id: idParam } = req.params;
    const id = idParam as string;

    const existing = await prisma.inventoryCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new HttpError(404, 'Category not found');
    }

    // Check if new name conflicts with another category
    if (name && name.trim() !== existing.name) {
      const nameConflict = await prisma.inventoryCategory.findUnique({
        where: { name: name.trim() }
      });
      if (nameConflict) {
        throw new HttpError(400, 'Category with this name already exists');
      }
    }

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        status: status || undefined
      },
      include: {
        subcategories: {
          orderBy: { name: 'asc' }
        }
      }
    });

    res.json({ category });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(500, 'Failed to update category'));
  }
});

// DELETE /categories/:id - Delete category (Super Admin only)
inventoryCategoryRouter.delete('/categories/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can delete categories');
    }

    const { id: idParam } = req.params;
    const id = idParam as string;

    const existing = await prisma.inventoryCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new HttpError(404, 'Category not found');
    }

    // Check if category has assets
    const assetCount = await prisma.asset.count({
      where: { categoryId: id }
    });

    if (assetCount > 0) {
      throw new HttpError(400, 'Cannot delete category that has associated assets. Please reassign or remove assets first.');
    }

    // Check if category has inventory items
    const inventoryCount = await prisma.inventoryMaster.count({
      where: { categoryId: id }
    });

    if (inventoryCount > 0) {
      throw new HttpError(400, 'Cannot delete category that has inventory items. Please remove or reassign the items first.');
    }

    // Check if category has subcategories
    const subcategoryCount = await prisma.inventorySubCategory.count({
      where: { categoryId: id }
    });

    if (subcategoryCount > 0) {
      throw new HttpError(400, 'Cannot delete category that has subcategories. Please remove the subcategories first.');
    }

    await prisma.inventoryCategory.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(500, 'Failed to delete category'));
  }
});

// ============================================
// Subcategory Routes
// ============================================

// GET /categories/:categoryId/subcategories - List subcategories for a category
inventoryCategoryRouter.get('/categories/:categoryId/subcategories', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const { categoryId: categoryIdParam } = req.params;
    const categoryId = categoryIdParam as string;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    // Verify category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    const where: any = { categoryId };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const subcategories = await prisma.inventorySubCategory.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ subcategories });
  } catch (error) {
    next(error);
  }
});

// POST /categories/:categoryId/subcategories - Create subcategory (Super Admin only)
inventoryCategoryRouter.post('/categories/:categoryId/subcategories', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can create subcategories');
    }

    const { categoryId: categoryIdParam } = req.params;
    const categoryId = categoryIdParam as string;
    const { name, description, status } = req.body;

    if (!name || name.trim() === '') {
      throw new HttpError(400, 'Subcategory name is required');
    }

    // Verify category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    // Check if subcategory with same name exists under this category
    const existing = await prisma.inventorySubCategory.findUnique({
      where: {
        categoryId_name: {
          categoryId,
          name: name.trim()
        }
      }
    });

    if (existing) {
      throw new HttpError(400, 'Subcategory with this name already exists under this category');
    }

    const subcategory = await prisma.inventorySubCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'ACTIVE',
        categoryId
      }
    });

    res.status(201).json({ subcategory });
  } catch (error) {
    next(error);
  }
});

// PATCH /subcategories/:id - Update subcategory (Super Admin only)
inventoryCategoryRouter.patch('/subcategories/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can update subcategories');
    }

    const { id: idParam } = req.params;
    const id = idParam as string;
    const { name, description, status } = req.body;

    const existing = await prisma.inventorySubCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new HttpError(404, 'Subcategory not found');
    }

    // Check if new name conflicts with another subcategory under same category
    if (name && name.trim() !== existing.name) {
      const nameConflict = await prisma.inventorySubCategory.findUnique({
        where: {
          categoryId_name: {
            categoryId: existing.categoryId,
            name: name.trim()
          }
        }
      });
      if (nameConflict) {
        throw new HttpError(400, 'Subcategory with this name already exists under this category');
      }
    }

    const subcategory = await prisma.inventorySubCategory.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        status: status || undefined
      }
    });

    res.json({ subcategory });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(500, 'Failed to update subcategory'));
  }
});

// DELETE /subcategories/:id - Delete subcategory (Super Admin only)
inventoryCategoryRouter.delete('/subcategories/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can delete subcategories');
    }

    const { id: idParam } = req.params;
    const id = idParam as string;

    const existing = await prisma.inventorySubCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new HttpError(404, 'Subcategory not found');
    }

    // Check if subcategory has inventory items
    const inventoryCount = await prisma.inventoryMaster.count({
      where: { subcategoryId: id }
    });

    if (inventoryCount > 0) {
      throw new HttpError(400, 'Cannot delete. This subcategory contains inventory items. Please remove or reassign the items first.');
    }

    await prisma.inventorySubCategory.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (error) {
    next(error instanceof Error ? error : new HttpError(500, 'Failed to delete subcategory'));
  }
});

// GET /categories/list - Get categories for dropdown (returns flat list for inventory form)
inventoryCategoryRouter.get('/categories/list', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const categories = await prisma.inventoryCategory.findMany({
      where: { status: 'ACTIVE' },
      include: {
        subcategories: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});
