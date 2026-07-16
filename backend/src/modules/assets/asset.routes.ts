import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const assetRouter = Router();

// Permission constants
const SUPER_ADMIN_PERMISSION = 'assets:manage';
const ADMIN_VIEW_PERMISSION = 'assets:view';

// Helper to check if user is Super Admin
function isSuperAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Super Admin') ?? false;
}

// Generate unique asset number
async function generateAssetNo(): Promise<string> {
  const count = await prisma.asset.count();
  const assetNo = `ASSET-${String(count + 1).padStart(5, '0')}`;
  return assetNo;
}

// ============================================
// Asset Routes
// ============================================

// GET /assets - List all assets
assetRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const subcategoryId = req.query.subcategoryId as string | undefined;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { assetNo: { contains: search } },
        { assetType: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
        { serialNo: { contains: search } },
        { assignedToName: { contains: search } },
        { location: { contains: search } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ assets });
  } catch (error) {
    next(error);
  }
});

// GET /assets/stats - Get asset statistics
assetRouter.get('/stats', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const total = await prisma.asset.count();
    const available = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const assigned = await prisma.asset.count({ where: { status: 'ASSIGNED' } });
    const underRepair = await prisma.asset.count({ where: { status: 'UNDER_REPAIR' } });
    const retired = await prisma.asset.count({ where: { status: 'RETIRED' } });
    const damaged = await prisma.asset.count({ where: { status: 'DAMAGED' } });
    const lost = await prisma.asset.count({ where: { status: 'LOST' } });

    res.json({
      stats: {
        total,
        available,
        assigned,
        underRepair,
        retired,
        damaged,
        lost
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /assets/categories - Get categories with assets
assetRouter.get('/categories', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const categories = await prisma.inventoryCategory.findMany({
      where: {
        assets: { some: {} }
      },
      include: {
        subcategories: {
          include: {
            assets: {
              select: { id: true }
            }
          }
        },
        assets: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      assetCount: cat.assets.length,
      subcategoryCount: cat.subcategories.length
    }));

    res.json({ categories: categoriesWithCounts });
  } catch (error) {
    next(error);
  }
});

// GET /assets/:id - Get single asset
assetRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ asset });
  } catch (error) {
    next(error);
  }
});

// POST /assets - Create asset
assetRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can create assets' });
    }

    const {
      assetType,
      make,
      model,
      serialNo,
      status,
      assignedToName,
      location,
      warrantyEndAt,
      categoryId,
      subcategoryId
    } = req.body;

    // Validation
    const errors: string[] = [];
    
    if (!assetType || !assetType.trim()) {
      errors.push('Asset Type is required');
    }
    
    if (serialNo) {
      const existing = await prisma.asset.findUnique({
        where: { serialNo }
      });
      if (existing) {
        errors.push('Serial Number already exists');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    const assetNo = await generateAssetNo();

    const asset = await prisma.asset.create({
      data: {
        assetNo,
        assetType: assetType.trim(),
        make: make?.trim() || null,
        model: model?.trim() || null,
        serialNo: serialNo?.trim() || null,
        status: status || 'AVAILABLE',
        assignedToName: assignedToName?.trim() || null,
        location: location?.trim() || null,
        warrantyEndAt: warrantyEndAt ? new Date(warrantyEndAt) : null,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null
      },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ asset });
  } catch (error) {
    next(error);
  }
});

// PATCH /assets/:id - Update asset
assetRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can update assets' });
    }

    const id = req.params.id;
    const {
      assetType,
      make,
      model,
      serialNo,
      status,
      assignedToName,
      location,
      warrantyEndAt,
      categoryId,
      subcategoryId
    } = req.body;

    // Check if asset exists
    const existing = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check for duplicate serial number
    if (serialNo && serialNo !== existing.serialNo) {
      const duplicate = await prisma.asset.findUnique({
        where: { serialNo }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'Serial Number already exists' });
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        assetType: assetType?.trim() || undefined,
        make: make !== undefined ? (make?.trim() || null) : undefined,
        model: model !== undefined ? (model?.trim() || null) : undefined,
        serialNo: serialNo !== undefined ? (serialNo?.trim() || null) : undefined,
        status: status || undefined,
        assignedToName: assignedToName !== undefined ? (assignedToName?.trim() || null) : undefined,
        location: location !== undefined ? (location?.trim() || null) : undefined,
        warrantyEndAt: warrantyEndAt !== undefined ? (warrantyEndAt ? new Date(warrantyEndAt) : null) : undefined,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        subcategoryId: subcategoryId !== undefined ? (subcategoryId || null) : undefined
      },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } }
      }
    });

    res.json({ asset });
  } catch (error) {
    next(error instanceof Error ? error : new Error('Failed to update asset'));
  }
});

// DELETE /assets/:id - Delete asset
assetRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can delete assets' });
    }

    const id = req.params.id;

    const existing = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    await prisma.asset.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    next(error instanceof Error ? error : new Error('Failed to delete asset'));
  }
});
