import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

export const inventoryAnalyticsRouter = Router();

const ADMIN_VIEW_PERMISSION = 'inventory:view';

// GET /inventory/analytics - Get inventory analytics data
inventoryAnalyticsRouter.get('/analytics', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const items = await prisma.inventoryMaster.findMany({
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        }
      }
    });

    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Summary Stats
    const totalInventory = items.length;
    const available = items.filter(i => i.currentQty > 0).length;
    const allocated = items.filter(i => i.status === 'ASSIGNED').length;
    const lowStock = items.filter(i => i.minStock && i.currentQty < i.minStock).length;
    const expired = items.filter(i => {
      if (!i.warrantyExpiry) return false;
      return new Date(i.warrantyExpiry) < now;
    }).length;
    const warrantyExpiring = items.filter(i => {
      if (!i.warrantyExpiry) return false;
      const expiry = new Date(i.warrantyExpiry);
      return expiry >= now && expiry <= thirtyDays;
    }).length;

    // Inventory by Category
    const byCategory = items.reduce((acc, item) => {
      const catName = item.category.name;
      if (!acc[catName]) acc[catName] = 0;
      acc[catName]++;
      return acc;
    }, {} as Record<string, number>);

    // Inventory by Subcategory
    const bySubcategory = items.reduce((acc, item) => {
      const subName = item.subcategory.name;
      if (!acc[subName]) acc[subName] = 0;
      acc[subName]++;
      return acc;
    }, {} as Record<string, number>);

    // Inventory by Location
    const byLocation = items.reduce((acc, item) => {
      const loc = item.location || 'Unassigned';
      if (!acc[loc]) acc[loc] = 0;
      acc[loc]++;
      return acc;
    }, {} as Record<string, number>);

    // Inventory by Status
    const byStatus = items.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = 0;
      acc[item.status]++;
      return acc;
    }, {} as Record<string, number>);

    // Warranty Expiry Distribution
    const warrantyExpiry: { active: number; expiring30: number; expired: number; noWarranty: number } = {
      active: 0,
      expiring30: 0,
      expired: 0,
      noWarranty: 0
    };
    items.forEach(item => {
      if (!item.warrantyExpiry) {
        warrantyExpiry.noWarranty++;
      } else {
        const expiry = new Date(item.warrantyExpiry);
        if (expiry < now) {
          warrantyExpiry.expired++;
        } else if (expiry <= thirtyDays) {
          warrantyExpiry.expiring30++;
        } else {
          warrantyExpiry.active++;
        }
      }
    });

    // Stock Trend (items added by month - last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const stockTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = items.filter(item => {
        const created = new Date(item.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;
      stockTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count
      });
    }

    // Quick Insights
    const itemsExpiringThisMonth = items.filter(i => {
      if (!i.warrantyExpiry) return false;
      const expiry = new Date(i.warrantyExpiry);
      return expiry >= thisMonth && expiry <= new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }).length;

    const lowStockItems = items.filter(i => i.minStock && i.currentQty < i.minStock);
    const itemsWithoutWarranty = items.filter(i => !i.warrantyExpiry).length;
    const recentlyAdded = items.filter(i => {
      const created = new Date(i.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return created >= sevenDaysAgo;
    }).length;

    // Most used categories (by inventory count)
    const categoryCounts = Object.entries(byCategory)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Unique values for filters
    const uniqueCategories = [...new Set(items.map(i => i.category.name))].sort();
    const uniqueSubcategories = [...new Set(items.map(i => i.subcategory.name))].sort();
    const uniqueLocations = [...new Set(items.map(i => i.location).filter(Boolean))].sort() as string[];
    const uniqueVendors = [...new Set(items.map(i => i.vendorName).filter(Boolean))].sort() as string[];
    const uniqueStatuses = [...new Set(items.map(i => i.status))].sort();

    res.json({
      summary: {
        totalInventory,
        available,
        allocated,
        lowStock,
        expired,
        warrantyExpiring
      },
      byCategory,
      bySubcategory,
      byLocation,
      byStatus,
      warrantyExpiry,
      stockTrend,
      insights: {
        itemsExpiringThisMonth,
        lowStockItems: lowStockItems.map(i => ({ id: i.id, itemName: i.itemName, currentQty: i.currentQty, minStock: i.minStock })),
        itemsWithoutWarranty,
        recentlyAdded,
        mostUsedCategories: categoryCounts
      },
      filters: {
        categories: uniqueCategories,
        subcategories: uniqueSubcategories,
        locations: uniqueLocations,
        vendors: uniqueVendors,
        statuses: uniqueStatuses
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/analytics/search - Search and filter inventory
inventoryAnalyticsRouter.get('/analytics/search', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ADMIN_VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      search,
      category,
      subcategory,
      location,
      vendor,
      status,
      warranty,
      sortBy = 'itemName',
      sortOrder = 'asc'
    } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { itemName: { contains: search as string } },
        { brand: { contains: search as string } },
        { model: { contains: search as string } },
        { vendor: { contains: search as string } },
        { invoiceNo: { contains: search as string } },
        { location: { contains: search as string } }
      ];
    }

    if (category) {
      where.category = { name: category as string };
    }

    if (subcategory) {
      where.subcategory = { name: subcategory as string };
    }

    if (location) {
      where.location = { contains: location as string };
    }

    if (vendor) {
      where.vendor = { contains: vendor as string };
    }

    if (status) {
      where.status = status;
    }

    if (warranty === 'expired') {
      where.warrantyExpiry = { lt: new Date() };
    } else if (warranty === 'expiring') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      where.warrantyExpiry = {
        gte: new Date(),
        lte: thirtyDays
      };
    } else if (warranty === 'active') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      where.warrantyExpiry = { gt: thirtyDays };
    } else if (warranty === 'none') {
      where.warrantyExpiry = null;
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'itemName':
        orderBy = { itemName: sortOrder };
        break;
      case 'purchaseDate':
        orderBy = { purchaseDate: sortOrder };
        break;
      case 'warrantyExpiry':
        orderBy = { warrantyExpiry: sortOrder };
        break;
      case 'currentQty':
        orderBy = { currentQty: sortOrder };
        break;
      case 'vendor':
        orderBy = { vendor: sortOrder };
        break;
      case 'location':
        orderBy = { location: sortOrder };
        break;
      default:
        orderBy = { itemName: 'asc' };
    }

    const items = await prisma.inventoryMaster.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } }
      }
    });

    res.json({ items, total: items.length });
  } catch (error) {
    next(error);
  }
});
