import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const assetRouter = Router();

// Permission constants
const SUPER_ADMIN_PERMISSION = 'inventory:manage';
const ADMIN_VIEW_PERMISSION = 'inventory:view';

// Helper to check if user is Super Admin
function isSuperAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Super Admin') ?? false;
}

// Generate unique asset number
async function generateAssetNo(): Promise<string> {
  const count = await prisma.asset.count();
  const assetNo = `AST-${String(count + 1).padStart(5, '0')}`;
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
        { assetTag: { contains: search } },
        { serialNo: { contains: search } },
        { assetType: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
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
        },
        inventoryItem: {
          select: { 
            id: true, 
            itemNo: true, 
            itemName: true,
            brand: true,
            model: true,
            vendor: true,
            purchaseDate: true,
            warrantyMonths: true,
            warrantyExpiry: true,
            location: true
          }
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

    res.json({
      stats: {
        total,
        available,
        assigned,
        underRepair,
        retired
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /assets/inventory-items - Get inventory items available for asset creation
assetRouter.get('/inventory-items', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can create assets' });
    }

    const categoryId = req.query.categoryId as string | undefined;
    const subcategoryId = req.query.subcategoryId as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {
      currentQty: { gt: 0 },
      status: 'ACTIVE'
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }

    if (search) {
      where.OR = [
        { itemNo: { contains: search } },
        { itemName: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } }
      ];
    }

    const items = await prisma.inventoryMaster.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        _count: { select: { assets: true } }
      },
      orderBy: { itemName: 'asc' }
    });

    // Filter out items that have already been converted to assets (qty already reduced)
    // and include available quantity
    const itemsWithAvailability = items.map(item => ({
      ...item,
      availableQty: item.currentQty - item._count.assets
    })).filter(item => item.availableQty > 0);

    res.json({ items: itemsWithAvailability });
  } catch (error) {
    next(error);
  }
});

// GET /assets/categories - Get categories with subcategories for asset creation
assetRouter.get('/categories', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can create assets' });
    }

    const categories = await prisma.inventoryCategory.findMany({
      where: { status: 'ACTIVE' },
      include: {
        subcategories: {
          where: { status: 'ACTIVE' },
          include: {
            inventoryItems: {
              where: {
                currentQty: { gt: 0 },
                status: 'ACTIVE'
              },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Only return categories/subcategories that have available inventory
    const filtered = categories
      .map(cat => ({
        ...cat,
        subcategories: cat.subcategories.filter(sub => sub.inventoryItems.length > 0),
        hasAvailableInventory: cat.subcategories.some(sub => sub.inventoryItems.length > 0)
      }))
      .filter(cat => cat.hasAvailableInventory);

    res.json({ categories: filtered });
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
        subcategory: true,
        inventoryItem: {
          include: {
            category: { select: { id: true, name: true } },
            subcategory: { select: { id: true, name: true } }
          }
        }
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

// POST /assets - Create asset from inventory
assetRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can create assets' });
    }

    const {
      inventoryItemId,
      assetTag,
      serialNo,
      remarks,
      status,
      assignedToName
    } = req.body;

    // Validation
    const errors: string[] = [];
    
    if (!inventoryItemId) {
      errors.push('Inventory Item is required');
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

    // Get inventory item
    const inventoryItem = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryItemId },
      include: {
        _count: { select: { assets: true } }
      }
    });

    if (!inventoryItem) {
      return res.status(400).json({ message: 'Inventory Item not found' });
    }

    // Check if inventory is available (currentQty > assets created from it)
    const availableQty = inventoryItem.currentQty - inventoryItem._count.assets;
    if (availableQty <= 0) {
      return res.status(400).json({ message: 'No available inventory. All items have been converted to assets.' });
    }

    // Generate asset number
    const assetNo = await generateAssetNo();

    // Create asset with data from inventory
    const asset = await prisma.asset.create({
      data: {
        assetNo,
        assetTag: assetTag?.trim() || null,
        serialNo: serialNo?.trim() || null,
        remarks: remarks?.trim() || null,
        status: status || 'AVAILABLE',
        assignedToName: assignedToName?.trim() || null,
        
        // Link to inventory
        inventoryItemId: inventoryItemId,
        
        // Denormalized data from inventory
        assetType: inventoryItem.itemName,
        make: inventoryItem.brand,
        model: inventoryItem.model,
        vendor: inventoryItem.vendor,
        purchaseDate: inventoryItem.purchaseDate,
        warrantyMonths: inventoryItem.warrantyMonths,
        warrantyEndAt: inventoryItem.warrantyExpiry,
        location: inventoryItem.location,
        categoryId: inventoryItem.categoryId,
        subcategoryId: inventoryItem.subcategoryId
      },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        inventoryItem: {
          select: { 
            id: true, 
            itemNo: true, 
            itemName: true,
            brand: true,
            model: true
          }
        }
      }
    });

    // Create history entry
    await prisma.inventoryHistory.create({
      data: {
        inventoryId: inventoryItemId,
        action: 'Asset Created',
        description: `Asset "${assetNo}" was created from this inventory`,
        performedBy: req.user?.name || 'System',
        userId: req.user?.id
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
      assetTag,
      serialNo,
      remarks,
      status,
      assignedToName
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
        assetTag: assetTag !== undefined ? (assetTag?.trim() || null) : undefined,
        serialNo: serialNo !== undefined ? (serialNo?.trim() || null) : undefined,
        remarks: remarks !== undefined ? (remarks?.trim() || null) : undefined,
        status: status || undefined,
        assignedToName: assignedToName !== undefined ? (assignedToName?.trim() || null) : undefined
      },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        inventoryItem: {
          select: { 
            id: true, 
            itemNo: true, 
            itemName: true,
            brand: true,
            model: true
          }
        }
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
