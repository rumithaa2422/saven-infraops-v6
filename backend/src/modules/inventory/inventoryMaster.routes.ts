import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const inventoryMasterRouter = Router();

// Permission constants - PART 4: Using granular permissions
const VIEW_PERMISSION = 'inventory:view';
const CREATE_PERMISSION = 'inventory:create_asset';
const UPDATE_PERMISSION = 'inventory:update_asset';
const DELETE_PERMISSION = 'inventory:delete_asset';

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
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
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
        },
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, projectName: true, projectCode: true } }
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform items to include assignment data at top level
    const itemsWithAssignments = items.map(item => ({
      ...item,
      assignedTo: item.assignments[0]?.user || null,
      projectName: item.assignments[0]?.project?.projectName || null,
      projectCode: item.assignments[0]?.project?.projectCode || null,
      assignments: undefined // Remove nested assignments
    }));

    res.json({ items: itemsWithAssignments });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-master/:id - Get single inventory item
inventoryMasterRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
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
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        documents: {
          orderBy: { createdAt: 'desc' }
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

    // Add creation history entry
    await prisma.inventoryHistory.create({
      data: {
        inventoryId: item.id,
        action: 'Created',
        description: `Inventory item "${itemName}" was created`,
        performedBy: req.user?.name || 'System',
        userId: req.user?.id
      }
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-master/bulk-import - Bulk import inventory items
inventoryMasterRouter.post('/bulk-import', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can import inventory items' });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      duplicates: [] as any[],
      errors: [] as any[],
      created: [] as any[]
    };

    // Get existing inventory items for duplicate detection
    const existingItems = await prisma.inventoryMaster.findMany({
      select: {
        id: true,
        itemName: true,
        brand: true,
        model: true,
        categoryId: true,
        subcategoryId: true,
        itemNo: true
      }
    });

    // Create a map for quick lookup of existing items
    const existingItemMap = new Map();
    existingItems.forEach(item => {
      const key = `${item.categoryId}|${item.subcategoryId}|${item.itemName.toLowerCase()}|${(item.brand || '').toLowerCase()}|${(item.model || '').toLowerCase()}`;
      existingItemMap.set(key, item);
    });

    // Get all categories and subcategories for mapping
    const allCategories = await prisma.inventoryCategory.findMany({
      include: { subcategories: true }
    });

    type CategoryWithSubcategories = typeof allCategories[number];
    const categoryMap = new Map<string, CategoryWithSubcategories | { id: string; name: string; status: string; createdAt: Date; updatedAt: Date; description: string | null }>();
    const subcategoryMap = new Map<string, { id: string; name: string; categoryId: string; status: string; createdAt: Date; updatedAt: Date; description: string | null }>();
    allCategories.forEach(c => {
      c.subcategories.forEach(s => {
        const key = `${c.id}|${s.name.toLowerCase()}`;
        subcategoryMap.set(key, s);
      });
    });

    // Process each item
    for (const item of items) {
      try {
        const { categoryName, subcategoryName, itemName, brand, model, vendor, invoiceNo, purchaseCost, gst, purchaseDate, warrantyMonths, warrantyExpiry, location, minStock, currentQty, status } = item;

        // Check if Category exists, create if not
        let categoryId: string;
        let category = categoryMap.get((categoryName || '').toLowerCase());

        if (!category) {
          category = await prisma.inventoryCategory.create({
            data: {
              name: categoryName.trim(),
              status: 'ACTIVE'
            }
          });
          categoryMap.set(category.name.toLowerCase(), category);
        }
        categoryId = category.id;

        // Check if Subcategory exists under that Category, create if not
        let subcategoryId: string;
        let subcategoryKey = `${categoryId}|${(subcategoryName || '').toLowerCase()}`;
        let subcategory = subcategoryMap.get(subcategoryKey);

        if (!subcategory) {
          subcategory = await prisma.inventorySubCategory.create({
            data: {
              name: subcategoryName.trim(),
              categoryId: categoryId,
              status: 'ACTIVE'
            }
          });
          subcategoryMap.set(subcategoryKey, subcategory);
        }
        subcategoryId = subcategory.id;

        // Check for duplicates using: Category + Subcategory + Item Name + Brand + Model
        const duplicateKey = `${categoryId}|${subcategoryId}|${(itemName || '').toLowerCase()}|${(brand || '').toLowerCase()}|${(model || '').toLowerCase()}`;
        
        if (existingItemMap.has(duplicateKey)) {
          const existingItem = existingItemMap.get(duplicateKey);
          results.duplicates.push({
            row: item._rowIndex,
            itemName,
            brand,
            model,
            categoryName,
            subcategoryName,
            existingItemNo: existingItem.itemNo
          });
          results.failed++;
          continue;
        }

        // Check for duplicate invoice numbers
        if (invoiceNo) {
          const existingWithInvoice = existingItems.find(i => i.itemNo === invoiceNo);
          if (existingWithInvoice) {
            results.errors.push({
              row: item._rowIndex,
              itemName,
              error: `Invoice Number "${invoiceNo}" already exists (${existingWithInvoice.itemNo})`
            });
            results.failed++;
            continue;
          }
        }

        // Generate item number and create
        const itemNo = await generateItemNo();

        const newItem = await prisma.inventoryMaster.create({
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
            category: { select: { id: true, name: true } },
            subcategory: { select: { id: true, name: true } }
          }
        });

        // Add to existing map for within-file duplicate detection
        existingItemMap.set(duplicateKey, newItem);

        // Add creation history
        await prisma.inventoryHistory.create({
          data: {
            inventoryId: newItem.id,
            action: 'Created',
            description: `Inventory item "${itemName}" was created via bulk import`,
            performedBy: req.user?.name || 'System',
            userId: req.user?.id
          }
        });

        results.created.push(newItem);
        results.success++;
      } catch (err: any) {
        results.errors.push({
          row: item._rowIndex,
          itemName: item.itemName,
          error: err.message || 'Unknown error'
        });
        results.failed++;
      }
    }

    res.json(results);
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

    // Get current item for comparison
    const currentItem = await prisma.inventoryMaster.findUnique({
      where: { id }
    });

    if (!currentItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
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

    // Add history entries for changes
    const historyEntries: { action: string; description: string }[] = [];

    if (itemName !== undefined && itemName !== currentItem.itemName) {
      historyEntries.push({ action: 'Updated', description: `Item name changed from "${currentItem.itemName}" to "${itemName}"` });
    }

    if (warrantyExpiry !== undefined) {
      const oldExpiry = currentItem.warrantyExpiry ? new Date(currentItem.warrantyExpiry).toLocaleDateString() : 'None';
      const newExpiry = warrantyExpiry ? new Date(warrantyExpiry).toLocaleDateString() : 'None';
      if (oldExpiry !== newExpiry) {
        historyEntries.push({ action: 'Warranty Changed', description: `Warranty expiry changed from ${oldExpiry} to ${newExpiry}` });
      }
    }

    if (currentQty !== undefined && currentQty !== currentItem.currentQty) {
      const diff = currentQty - currentItem.currentQty;
      const action = diff > 0 ? 'Quantity Increased' : 'Quantity Reduced';
      historyEntries.push({ action, description: `Quantity changed from ${currentItem.currentQty} to ${currentQty} (${diff > 0 ? '+' : ''}${diff})` });
    }

    if (location !== undefined && location !== currentItem.location) {
      historyEntries.push({ action: 'Moved Location', description: `Location changed from "${currentItem.location || 'None'}" to "${location || 'None'}"` });
    }

    if (status !== undefined && status !== currentItem.status) {
      historyEntries.push({ action: 'Status Changed', description: `Status changed from "${currentItem.status}" to "${status}"` });
    }

    // Add all history entries
    for (const entry of historyEntries) {
      await prisma.inventoryHistory.create({
        data: {
          inventoryId: id,
          action: entry.action,
          description: entry.description,
          performedBy: req.user?.name || 'System',
          userId: req.user?.id
        }
      });
    }

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
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
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
