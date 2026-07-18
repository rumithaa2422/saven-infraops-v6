/**
 * Vendor Management Routes
 * 
 * Handles CRUD operations for vendor directory.
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
      default:
        orderBy = { vendorName: 'asc' };
    }

    // Execute query
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.vendor.count({ where })
    ]);

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
// GET /api/vendors/summary
// Get vendor summary statistics
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

    const [totalVendors, activeVendors, expiringContracts, pendingRenewals] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count({
        where: {
          contractExpiryDate: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        }
      }),
      prisma.vendor.count({
        where: {
          renewalDate: { lt: now },
          status: 'ACTIVE'
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
// GET /api/vendors/categories
// Get unique vendor categories
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
// GET /api/vendors/countries
// Get unique countries
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

    res.json({ countries: countries.map(c => c.country).filter(Boolean) });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/years
// Get unique years from contract expiry and renewal dates
// ============================================================
vendorRouter.get('/years', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const vendors = await prisma.vendor.findMany({
      select: {
        contractExpiryDate: true,
        renewalDate: true
      }
    });

    const years = new Set<number>();
    vendors.forEach(v => {
      if (v.contractExpiryDate) years.add(v.contractExpiryDate.getFullYear());
      if (v.renewalDate) years.add(v.renewalDate.getFullYear());
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    res.json({ years: sortedYears });
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

    const { id } = req.params;
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

    const { id } = req.params;
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

    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    
    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Check for associated inventory
    const associatedInventory = await prisma.inventoryMaster.count({
      where: { vendorId: id }
    });
    
    // Check for associated licenses
    const associatedLicenses = await prisma.vendorLicense.count({
      where: { vendorId: id }
    });

    // Check for associated projects
    const associatedProjects = await prisma.projectEnvironment.count({
      where: { primaryVendorId: id }
    });

    if (associatedInventory > 0) {
      throw new HttpError(400, `Cannot delete vendor: ${associatedInventory} inventory item(s) are associated with this vendor`);
    }

    if (associatedLicenses > 0) {
      throw new HttpError(400, `Cannot delete vendor: ${associatedLicenses} license(s) are associated with this vendor`);
    }

    if (associatedProjects > 0) {
      throw new HttpError(400, `Cannot delete vendor: ${associatedProjects} project(s) are associated with this vendor`);
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
// POST /api/vendors/import
// Import vendors from Excel
// ============================================================
vendorRouter.post('/import', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:create', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { vendors } = req.body;

    if (!Array.isArray(vendors)) {
      throw new HttpError(400, 'Invalid import data');
    }

    const imported: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];

    // Get existing vendor codes for duplicate check
    const existingCodes = await prisma.vendor.findMany({
      select: { vendorCode: true }
    });
    const existingCodeSet = new Set(existingCodes.map(e => e.vendorCode.toLowerCase()));

    for (const item of vendors) {
      try {
        // Required field validation
        if (!item.vendorName || !item.vendorCode || !item.category || !item.primaryContactName || !item.email || !item.phone) {
          failed.push({
            data: item,
            error: 'Missing required fields (vendorName, vendorCode, category, primaryContactName, email, phone)'
          });
          continue;
        }

        // Duplicate vendor code check
        if (existingCodeSet.has(item.vendorCode.toLowerCase())) {
          skipped.push({
            data: item,
            reason: `Duplicate vendor code: ${item.vendorCode}`
          });
          continue;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(item.email)) {
          failed.push({
            data: item,
            error: 'Invalid email format'
          });
          continue;
        }

        // Create vendor
        const vendor = await prisma.vendor.create({
          data: {
            vendorName: item.vendorName,
            vendorCode: item.vendorCode,
            category: item.category,
            status: item.status || 'ACTIVE',
            website: item.website || null,
            country: item.country || null,
            gstNumber: item.gstNumber || null,
            registrationNumber: item.registrationNumber || null,
            primaryContactName: item.primaryContactName,
            designation: item.designation || null,
            email: item.email,
            phone: item.phone,
            address: item.address || null,
            remarks: item.remarks || null,
            contractStartDate: item.contractStartDate ? new Date(item.contractStartDate) : null,
            contractExpiryDate: item.contractExpiryDate ? new Date(item.contractExpiryDate) : null,
            renewalDate: item.renewalDate ? new Date(item.renewalDate) : null,
            paymentTerms: item.paymentTerms || null
          }
        });

        existingCodeSet.add(item.vendorCode.toLowerCase());
        imported.push(vendor);
      } catch (err: any) {
        failed.push({
          data: item,
          error: err.message || 'Unknown error'
        });
      }
    }

    // Audit log
    if (imported.length > 0) {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          actorEmail: req.user?.email || null,
          action: 'IMPORT',
          entityType: 'Vendor',
          entityId: 'bulk',
          newValue: { count: imported.length } as any,
          ipAddress: req.ip || null
        }
      });
    }

    res.json({
      imported: imported.length,
      skipped: skipped.length,
      failed: failed.length,
      details: { imported, skipped, failed }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/export
// Export vendors
// ============================================================
vendorRouter.get('/export', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:export', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const vendors = await prisma.vendor.findMany({
      orderBy: { vendorName: 'asc' }
    });

    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id/details
// Get vendor with full details including related data
// ============================================================
vendorRouter.get('/:id/details', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    
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

    // Get licenses for this vendor
    const licenses = await prisma.vendorLicense.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Get projects count
    const projectCount = await prisma.projectEnvironment.count({
      where: { primaryVendorId: id }
    });

    // Get audit log for this vendor
    let auditLogs: any[] = [];
    try {
      const logs = await prisma.auditLog.findMany({
        where: { 
          entityType: 'Vendor',
          entityId: id
        },
        orderBy: { performedAt: 'desc' },
        take: 20
      });
      auditLogs = logs.map(log => ({
        ...log,
        performedAt: log.performedAt.toISOString()
      }));
    } catch {
      // auditLog table might not exist or have different schema
    }

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
      licenseCount: licenses.length,
      projectCount,
      licenses,
      contractStatus,
      auditLogs
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id/linked-projects
// Get projects linked to this vendor
// ============================================================
vendorRouter.get('/:id/linked-projects', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Get projects that have this vendor as primary
    const projects = await prisma.projectEnvironment.findMany({
      where: { primaryVendorId: id },
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        status: true,
        startDate: true,
        ownerName: true
      },
      take: 10
    });

    res.json({ projects });
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

    const { id } = req.params;
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
        serialNumber: true,
        status: true,
        warrantyExpiry: true,
        purchaseDate: true
      },
      take: 20
    });

    res.json({ inventory });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id/licenses
// Get licenses for this vendor
// ============================================================
vendorRouter.get('/:id/licenses', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Get licenses for this vendor
    const licenses = await prisma.vendorLicense.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ licenses });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/vendors/:id/documents
// Get documents linked to this vendor
// ============================================================
vendorRouter.get('/:id/documents', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      throw new HttpError(404, 'Vendor not found');
    }

    // Search for documents in vendor folder by name
    const vendorFolder = await prisma.documentFolder.findFirst({
      where: {
        name: { equals: vendor.vendorName }
      }
    });

    if (!vendorFolder) {
      return res.json({ documents: [], folderId: null });
    }

    // Get documents from this folder
    const documents = await prisma.documentFile.findMany({
      where: { folderId: vendorFolder.id },
      select: {
        id: true,
        fileName: true,
        originalFileName: true,
        fileExtension: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        uploadedByEmail: true
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ documents, folderId: vendorFolder.id });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// License Management Routes
// ============================================================

// GET /api/vendors/licenses
// Get all licenses
vendorRouter.get('/licenses/all', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const licenses = await prisma.vendorLicense.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            vendorCode: true
          }
        }
      }
    });

    res.json({ licenses });
  } catch (error) {
    next(error);
  }
});

// GET /api/vendors/licenses/:id
// Get single license
vendorRouter.get('/licenses/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:view', 'vendors:read', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const license = await prisma.vendorLicense.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            vendorCode: true
          }
        }
      }
    });

    if (!license) {
      throw new HttpError(404, 'License not found');
    }

    res.json({ license });
  } catch (error) {
    next(error);
  }
});

// POST /api/vendors/licenses
// Create new license
vendorRouter.post('/licenses', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:create', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      vendorName,
      vendorId,
      licenseName,
      licenseCount = 0,
      assignedCount = 0,
      cost,
      renewalAt,
      ownerName
    } = req.body;

    if (!licenseName) {
      throw new HttpError(400, 'License name is required');
    }
    if (!vendorName) {
      throw new HttpError(400, 'Vendor name is required');
    }

    const license = await prisma.vendorLicense.create({
      data: {
        vendorName,
        vendorId: vendorId || null,
        licenseName,
        licenseCount: Number(licenseCount),
        assignedCount: Number(assignedCount),
        cost: cost ? Number(cost) : null,
        renewalAt: renewalAt ? new Date(renewalAt) : null,
        ownerName: ownerName || null
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'CREATE',
        entityType: 'VendorLicense',
        entityId: license.id,
        newValue: license as any,
        ipAddress: req.ip || null
      }
    });

    res.status(201).json(license);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vendors/licenses/:id
// Update license
vendorRouter.put('/licenses/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:write', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const existing = await prisma.vendorLicense.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'License not found');
    }

    const {
      vendorName,
      vendorId,
      licenseName,
      licenseCount,
      assignedCount,
      cost,
      renewalAt,
      ownerName
    } = req.body;

    if (!licenseName) {
      throw new HttpError(400, 'License name is required');
    }

    const license = await prisma.vendorLicense.update({
      where: { id },
      data: {
        vendorName: vendorName || existing.vendorName,
        vendorId: vendorId !== undefined ? (vendorId || null) : existing.vendorId,
        licenseName,
        licenseCount: licenseCount !== undefined ? Number(licenseCount) : existing.licenseCount,
        assignedCount: assignedCount !== undefined ? Number(assignedCount) : existing.assignedCount,
        cost: cost !== undefined ? (cost ? Number(cost) : null) : existing.cost,
        renewalAt: renewalAt !== undefined ? (renewalAt ? new Date(renewalAt) : null) : existing.renewalAt,
        ownerName: ownerName !== undefined ? (ownerName || null) : existing.ownerName
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'UPDATE',
        entityType: 'VendorLicense',
        entityId: license.id,
        oldValue: existing as any,
        newValue: license as any,
        ipAddress: req.ip || null
      }
    });

    res.json(license);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vendors/licenses/:id
// Delete license
vendorRouter.delete('/licenses/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['vendors:delete', 'vendors:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const existing = await prisma.vendorLicense.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'License not found');
    }

    await prisma.vendorLicense.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'DELETE',
        entityType: 'VendorLicense',
        entityId: id,
        oldValue: existing as any,
        ipAddress: req.ip || null
      }
    });

    res.json({ message: 'License deleted successfully' });
  } catch (error) {
    next(error);
  }
});
