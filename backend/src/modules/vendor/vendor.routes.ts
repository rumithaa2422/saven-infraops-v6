/**
 * Vendor Management Routes
 * 
 * Handles CRUD operations for vendor directory.
 * Only includes inventory integration - no project, license, or compliance features.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';

export const vendorRouter = Router();

// ============================================================
// GET /api/vendors
// List all vendors with optional filters
// ============================================================
vendorRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      search,
      category,
      status,
      country,
      contractExpiryFrom,
      contractExpiryTo,
      contractStatus,
      year,
      sortBy = 'vendorName',
      sortOrder = 'asc',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search across multiple fields (MySQL is case-insensitive by default with contains)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { vendorName: { contains: searchTerm } },
        { vendorCode: { contains: searchTerm } },
        { primaryContactName: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { phone: { contains: searchTerm } },
        { website: { contains: searchTerm } }
      ];
    }

    // Filters - exact matches
    if (category && typeof category === 'string' && category.trim()) {
      where.category = category.trim();
    }
    if (status && typeof status === 'string' && status.trim()) {
      where.status = status.trim();
    }
    if (country && typeof country === 'string' && country.trim()) {
      where.country = country.trim();
    }

    // Year filter - filter by contract expiry or renewal year
    if (year && typeof year === 'string' && year.trim()) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        const yearStart = new Date(yearNum, 0, 1);
        const yearEnd = new Date(yearNum, 11, 31, 23, 59, 59);
        where.OR = where.OR || [];
        where.OR.push(
          {
            AND: [
              { contractExpiryDate: { not: null } },
              { contractExpiryDate: { gte: yearStart, lte: yearEnd } }
            ]
          },
          {
            AND: [
              { renewalDate: { not: null } },
              { renewalDate: { gte: yearStart, lte: yearEnd } }
            ]
          }
        );
      }
    }

    // Contract status filter (mutually exclusive with date range)
    if (contractStatus && typeof contractStatus === 'string' && contractStatus.trim()) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      thirtyDaysFromNow.setHours(23, 59, 59, 999);
      
      if (contractStatus === 'active') {
        where.contractExpiryDate = { gte: now };
      } else if (contractStatus === 'expiring') {
        where.contractExpiryDate = { 
          gte: now, 
          lte: thirtyDaysFromNow 
        };
      } else if (contractStatus === 'expired') {
        where.contractExpiryDate = { lt: now };
      }
    }

    // Contract expiry date range (mutually exclusive with status filter)
    if ((contractExpiryFrom || contractExpiryTo) && !contractStatus) {
      const dateCondition: any = {};
      if (contractExpiryFrom) {
        const fromDate = new Date(contractExpiryFrom as string);
        fromDate.setHours(0, 0, 0, 0);
        dateCondition.gte = fromDate;
      }
      if (contractExpiryTo) {
        const toDate = new Date(contractExpiryTo as string);
        toDate.setHours(23, 59, 59, 999);
        dateCondition.lte = toDate;
      }
      if (Object.keys(dateCondition).length > 0) {
        where.contractExpiryDate = dateCondition;
      }
    }

    // Sort options
    let orderBy: any = { vendorName: 'asc' };
    const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';
    
    switch (sortBy) {
      case 'vendorName':
        orderBy = { vendorName: orderDirection };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'contractExpiry':
        orderBy = { contractExpiryDate: orderDirection || 'asc' };
        break;
      case 'status':
        orderBy = { status: orderDirection || 'asc' };
        break;
      case 'category':
        orderBy = { category: orderDirection || 'asc' };
        break;
      default:
        orderBy = { vendorName: 'asc' };
    }

    // Get total count for pagination
    const total = await prisma.vendor.count({ where });

    // Fetch vendors
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy,
      skip,
      take: limitNum
    });

    res.json({
      vendors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/categories
// Get all unique vendor categories
// ============================================================
vendorRouter.get('/categories', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const categories = await prisma.vendor.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/stats
// Get vendor statistics
// ============================================================
vendorRouter.get('/stats', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const [
      totalVendors,
      activeVendors,
      expiringContracts,
      expiredContracts
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count({
        where: {
          contractExpiryDate: { gte: now, lte: thirtyDaysFromNow }
        }
      }),
      prisma.vendor.count({
        where: {
          contractExpiryDate: { lt: now }
        }
      })
    ]);

    res.json({
      totalVendors,
      activeVendors,
      expiringContracts,
      expiredContracts
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/summary
// Get vendor dashboard summary statistics
// ============================================================
vendorRouter.get('/summary', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const [
      totalVendors,
      activeVendors,
      expiringContracts,
      pendingRenewals
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count({
        where: {
          contractExpiryDate: { gte: now, lte: thirtyDaysFromNow }
        }
      }),
      prisma.vendor.count({
        where: {
          contractExpiryDate: { lt: now }
        }
      })
    ]);

    res.json({
      totalVendors,
      activeVendors,
      expiringContracts,
      pendingRenewals
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/countries
// Get all unique vendor countries
// ============================================================
vendorRouter.get('/countries', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const countries = await prisma.vendor.findMany({
      select: { country: true },
      distinct: ['country'],
      where: { country: { not: null } },
      orderBy: { country: 'asc' }
    });

    res.json({
      countries: countries.map(c => c.country).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/years
// Get all distinct contract years
// ============================================================
vendorRouter.get('/years', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Get distinct years from contractExpiryDate
    const vendors = await prisma.vendor.findMany({
      select: {
        contractExpiryDate: true,
        renewalDate: true
      },
      where: {
        OR: [
          { contractExpiryDate: { not: null } },
          { renewalDate: { not: null } }
        ]
      }
    });

    // Extract unique years from both fields
    const yearsSet = new Set<number>();
    vendors.forEach(vendor => {
      if (vendor.contractExpiryDate) {
        yearsSet.add(new Date(vendor.contractExpiryDate).getFullYear());
      }
      if (vendor.renewalDate) {
        yearsSet.add(new Date(vendor.renewalDate).getFullYear());
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a); // Descending order

    res.json({ years });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id
// Get single vendor by ID
// ============================================================
vendorRouter.get('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/vendors
// Create new vendor
// ============================================================
vendorRouter.post('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:create', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      vendorName,
      vendorCode,
      category,
      status = 'ACTIVE',
      website,
      country,
      gstNumber,
      registrationNumber,
      primaryContactName,
      designation,
      email,
      phone,
      address,
      remarks,
      contractStartDate,
      contractExpiryDate,
      renewalDate,
      paymentTerms,
      internalOwnerId
    } = req.body;

    // Validation
    if (!vendorName) throw new HttpError(400, 'Vendor name is required');
    if (!vendorCode) throw new HttpError(400, 'Vendor code is required');
    if (!category) throw new HttpError(400, 'Category is required');
    if (!primaryContactName) throw new HttpError(400, 'Primary contact name is required');
    if (!email) throw new HttpError(400, 'Email is required');
    if (!phone) throw new HttpError(400, 'Phone is required');

    // Check for duplicate vendor code
    const existing = await prisma.vendor.findUnique({ where: { vendorCode } });
    if (existing) {
      throw new HttpError(400, 'Vendor code already exists');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpError(400, 'Invalid email format');
    }

    const vendor = await prisma.vendor.create({
      data: {
        vendorName,
        vendorCode,
        category,
        status,
        website: website || null,
        country: country || null,
        gstNumber: gstNumber || null,
        registrationNumber: registrationNumber || null,
        primaryContactName,
        designation: designation || null,
        email,
        phone,
        address: address || null,
        remarks: remarks || null,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractExpiryDate: contractExpiryDate ? new Date(contractExpiryDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        paymentTerms: paymentTerms || null,
        internalOwnerId: internalOwnerId || null
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'CREATE',
        entityType: 'Vendor',
        entityId: vendor.id,
        newValue: vendor as any,
        ipAddress: req.ip || null
      }
    });

    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUT /api/vendors/:id
// Update vendor
// ============================================================
vendorRouter.put('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:write', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'Vendor not found');
    }

    const {
      vendorName,
      vendorCode,
      category,
      status,
      website,
      country,
      gstNumber,
      registrationNumber,
      primaryContactName,
      designation,
      email,
      phone,
      address,
      remarks,
      contractStartDate,
      contractExpiryDate,
      renewalDate,
      paymentTerms,
      internalOwnerId
    } = req.body;

    // Validation
    if (!vendorName) throw new HttpError(400, 'Vendor name is required');
    if (!vendorCode) throw new HttpError(400, 'Vendor code is required');
    if (!category) throw new HttpError(400, 'Category is required');
    if (!primaryContactName) throw new HttpError(400, 'Primary contact name is required');
    if (!email) throw new HttpError(400, 'Email is required');
    if (!phone) throw new HttpError(400, 'Phone is required');

    // Check for duplicate vendor code (excluding current)
    if (vendorCode !== existing.vendorCode) {
      const duplicate = await prisma.vendor.findUnique({ where: { vendorCode } });
      if (duplicate) {
        throw new HttpError(400, 'Vendor code already exists');
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpError(400, 'Invalid email format');
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        vendorName,
        vendorCode,
        category,
        status,
        website: website || null,
        country: country || null,
        gstNumber: gstNumber || null,
        registrationNumber: registrationNumber || null,
        primaryContactName,
        designation: designation || null,
        email,
        phone,
        address: address || null,
        remarks: remarks || null,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractExpiryDate: contractExpiryDate ? new Date(contractExpiryDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        paymentTerms: paymentTerms || null,
        internalOwnerId: internalOwnerId || null
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'UPDATE',
        entityType: 'Vendor',
        entityId: vendor.id,
        oldValue: existing as any,
        newValue: vendor as any,
        ipAddress: req.ip || null
      }
    });

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE /api/vendors/:id
// Delete vendor
// ============================================================
vendorRouter.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:delete', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    
    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Check for associated inventory - only dependency check now
    const associatedInventory = await prisma.inventoryMaster.count({
      where: { vendorId: id }
    });

    if (associatedInventory > 0) {
      throw new HttpError(400, `Cannot delete vendor: ${associatedInventory} inventory item(s) are associated with this vendor`);
    }

    await prisma.vendor.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'DELETE',
        entityType: 'Vendor',
        entityId: id,
        oldValue: vendor as any,
        ipAddress: req.ip || null
      }
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
});


// ============================================================
// GET /api/vendors/:id/details
// Get vendor with full details including inventory
// ============================================================
vendorRouter.get('/:id/details', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        internalOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            roles: {
              select: {
                role: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Get inventory count
    const inventoryCount = await prisma.inventoryMaster.count({
      where: { vendorId: id }
    });

    // Calculate contract status
    let contractStatus = 'no_contract';
    if (vendor.contractExpiryDate) {
      const now = new Date();
      const expiry = new Date(vendor.contractExpiryDate);
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (expiry < now) {
        contractStatus = 'expired';
      } else if (expiry <= thirtyDays) {
        contractStatus = 'expiring';
      } else {
        contractStatus = 'active';
      }
    }

    res.json({
      ...vendor,
      inventoryCount,
      contractStatus
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id/inventory
// Get inventory purchased from this vendor
// ============================================================
vendorRouter.get('/:id/inventory', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id: idParam } = req.params;
    const id = idParam as string;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Get inventory items from this vendor
    const inventory = await prisma.inventoryMaster.findMany({
      where: { vendorId: id },
      select: {
        id: true,
        itemNo: true,
        itemName: true,
        brand: true,
        model: true,
        status: true,
        warrantyExpiry: true,
        purchaseDate: true,
        purchaseCost: true
      },
      take: 20
    });

    res.json({ inventory });
  } catch (error) {
    next(error);
  }
});
