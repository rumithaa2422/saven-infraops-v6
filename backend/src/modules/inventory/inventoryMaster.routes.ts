import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const inventoryMasterRouter = Router();

// Permission constants
const SUPER_ADMIN_PERMISSION = 'inventory:manage';
const ADMIN_VIEW_PERMISSION = 'inventory:view';

// Helper to check if user is Super Admin
function isSuperAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Super Admin') ?? false;
}

// Helper to check if user is Admin
function isAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Admin') ?? false;
}

// Generate unique item number
async function generateItemNo(): Promise<string> {
  const count = await prisma.inventoryMaster.count();
  const itemNo = `INV-${String(count + 1).padStart(5, '0')}`;
  return itemNo;
}

// ============================================
// Inventory Master Routes
// ============================================

// GET /inventory-master - List all inventory items
inventoryMasterRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const subcategoryId = req.query.subcategoryId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { itemNo: { contains: search } },
        { itemName: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { location: { contains: search } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }
    
    if (status) {
      where.status = status;
    }

    const items = await prisma.inventoryMaster.findMany({
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

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-master/:id - Get single inventory item
inventoryMasterRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const item = await prisma.inventoryMaster.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-master - Create inventory item
inventoryMasterRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can create inventory items' });
    }

    const {
      itemName,
      brand,
      model,
      vendor,
      invoiceNo,
      purchaseCost,
      gst,
      purchaseDate,
      warrantyMonths,
      location,
      minStock,
      currentQty,
      status,
      categoryId,
      subcategoryId
    } = req.body;

    // Validation
    const errors: string[] = [];
    
    if (!itemName || !itemName.trim()) {
      errors.push('Item Name is required');
    }
    
    if (!categoryId) {
      errors.push('Category is required');
    }
    
    if (!subcategoryId) {
      errors.push('Subcategory is required');
    }
    
    if (currentQty !== undefined && currentQty < 0) {
      errors.push('Quantity cannot be negative');
    }
    
    if (purchaseCost !== undefined && purchaseCost < 0) {
      errors.push('Purchase Cost cannot be negative');
    }
    
    // Calculate warranty expiry for validation
    let calculatedWarrantyExpiry = req.body.warrantyExpiry;
    if (purchaseDate && warrantyMonths && !calculatedWarrantyExpiry) {
      const purchase = new Date(purchaseDate);
      purchase.setMonth(purchase.getMonth() + warrantyMonths);
      calculatedWarrantyExpiry = purchase;
    }
    
    if (purchaseDate && calculatedWarrantyExpiry && new Date(calculatedWarrantyExpiry) < new Date(purchaseDate)) {
      errors.push('Warranty Expiry cannot be before Purchase Date');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    // Verify category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Verify subcategory exists and belongs to category
    const subcategory = await prisma.inventorySubCategory.findUnique({
      where: { id: subcategoryId }
    });
    
    if (!subcategory) {
      return res.status(400).json({ message: 'Subcategory not found' });
    }
    
    if (subcategory.categoryId !== categoryId) {
      return res.status(400).json({ message: 'Subcategory does not belong to the selected category' });
    }

    // Calculate warranty expiry if not provided
    let warrantyExpiry = req.body.warrantyExpiry;
    if (purchaseDate && warrantyMonths && !warrantyExpiry) {
      const purchase = new Date(purchaseDate);
      purchase.setMonth(purchase.getMonth() + warrantyMonths);
      warrantyExpiry = purchase;
    }

    const itemNo = await generateItemNo();

    const item = await prisma.inventoryMaster.create({
      data: {
        itemNo,
        itemName: itemName.trim(),
        brand: brand?.trim() || null,
        model: model?.trim() || null,
        vendor: vendor?.trim() || null,
        invoiceNo: invoiceNo?.trim() || null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        gst: gst ? parseFloat(gst) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        location: location?.trim() || null,
        minStock: minStock !== undefined ? parseInt(minStock) : null,
        currentQty: currentQty !== undefined ? parseInt(currentQty) : 0,
        status: status || 'ACTIVE',
        categoryId,
        subcategoryId
      },
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// PATCH /inventory-master/:id - Update inventory item
inventoryMasterRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can update inventory items' });
    }

    const id = req.params.id as string;
    const {
      itemName,
      brand,
      model,
      vendor,
      invoiceNo,
      purchaseCost,
      gst,
      purchaseDate,
      warrantyMonths,
      location,
      minStock,
      currentQty,
      status,
      categoryId,
      subcategoryId
    } = req.body;

    // Validation
    if (itemName !== undefined && !itemName.trim()) {
      return res.status(400).json({ message: 'Item Name cannot be empty' });
    }
    
    if (currentQty !== undefined && currentQty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }
    
    if (purchaseCost !== undefined && purchaseCost < 0) {
      return res.status(400).json({ message: 'Purchase Cost cannot be negative' });
    }

    // Calculate warranty expiry
    let warrantyExpiry = req.body.warrantyExpiry;
    if (purchaseDate && warrantyMonths) {
      const purchase = new Date(purchaseDate);
      purchase.setMonth(purchase.getMonth() + warrantyMonths);
      warrantyExpiry = purchase;
    }

    const item = await prisma.inventoryMaster.update({
      where: { id },
      data: {
        ...(itemName !== undefined && { itemName: itemName.trim() }),
        ...(brand !== undefined && { brand: brand?.trim() || null }),
        ...(model !== undefined && { model: model?.trim() || null }),
        ...(vendor !== undefined && { vendor: vendor?.trim() || null }),
        ...(invoiceNo !== undefined && { invoiceNo: invoiceNo?.trim() || null }),
        ...(purchaseCost !== undefined && { purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null }),
        ...(gst !== undefined && { gst: gst ? parseFloat(gst) : null }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(warrantyMonths !== undefined && { warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : null }),
        ...(warrantyExpiry !== undefined && { warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(minStock !== undefined && { minStock: minStock !== null ? parseInt(minStock) : null }),
        ...(currentQty !== undefined && { currentQty: parseInt(currentQty) }),
        ...(status !== undefined && { status }),
        ...(categoryId !== undefined && { categoryId }),
        ...(subcategoryId !== undefined && { subcategoryId })
      },
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// DELETE /inventory-master/:id - Delete inventory item
inventoryMasterRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can delete inventory items' });
    }

    const id = req.params.id as string;
    await prisma.inventoryMaster.delete({
      where: { id }
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-master/categories - Get categories for dropdown
inventoryMasterRouter.get('/categories/list', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const categories = await prisma.inventoryCategory.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        subcategories: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});
