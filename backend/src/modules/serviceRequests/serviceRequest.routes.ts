import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

export const serviceRequestRouter = Router();

// GET /service-requests - List tickets with role-based visibility
// Supports both legacy (tickets:read) and new (tickets:view) permissions
// Super Admin and Admin see all tickets; Employees see only their own
serviceRequestRouter.get('/', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const userRoles = req.user?.roles || [];

    // Build where clause based on user role
    const isPrivileged = userRoles.includes('Super Admin') || userRoles.includes('Admin');

    const where: { status?: string; requesterId?: string } = {};
    if (status) {
      where.status = status;
    }
    if (!isPrivileged) {
      // Employees can only see their own tickets
      where.requesterId = req.user?.id;
    }

    const items = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /service-requests/:id - Get single ticket
serviceRequestRouter.get('/:id', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const item = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!item) throw new HttpError(404, 'Service request not found');
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().min(2),
  subCategory: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  requesterName: z.string().min(2),
  projectName: z.string().optional()
});

// POST /service-requests - Create ticket
// Supports both legacy (tickets:write) and new (tickets:create) permissions
serviceRequestRouter.post('/', requireAuth, requirePermissionOr(['tickets:write', 'tickets:create']), async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const count = await prisma.serviceRequest.count();
    const item = await prisma.serviceRequest.create({
      data: {
        ...payload,
        ticketNo: `SR-${1001 + count}`,
        requesterId: req.user?.id  // Set from authenticated user, not from request body
      }
    });
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'CREATE',
        entityType: 'ServiceRequest',
        entityId: item.id,
        newValue: item as any,
        ipAddress: req.ip
      }
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.string().min(2).optional(),
  subCategory: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED']).optional(),
  requesterName: z.string().min(2).optional(),
  assigneeName: z.string().optional(),
  projectName: z.string().optional(),
  comment: z.string().optional()
});

// PATCH /service-requests/:id - Update ticket
// Supports both legacy (tickets:write) and new (tickets:manage) permissions
serviceRequestRouter.patch('/:id', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), async (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const existing = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    const { comment, ...updates } = payload;
    const description = comment?.trim()
      ? `${existing.description || ''}\n\n[${new Date().toISOString()}] ${req.user?.email || 'user'}: ${comment.trim()}`.trim()
      : updates.description;

    const item = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: {
        ...updates,
        ...(description !== undefined ? { description } : {})
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'UPDATE',
        entityType: 'ServiceRequest',
        entityId: item.id,
        oldValue: existing as any,
        newValue: item as any,
        ipAddress: req.ip
      }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// PATCH /service-requests/:id/assign - Assign ticket to Admin user
// Only Super Admin can assign tickets; assignee must have Admin role
const assignSchema = z.object({
  assigneeId: z.string().min(1)
});

serviceRequestRouter.patch('/:id/assign', requireAuth, async (req, res, next) => {
  try {
    // Check if user has Super Admin role
    const userRoles = req.user?.roles || [];
    if (!userRoles.includes('Super Admin')) {
      throw new HttpError(403, 'Only Super Admin can assign tickets');
    }

    const { assigneeId } = assignSchema.parse(req.body);

    // Verify the assignee has Admin role
    const assignee = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        roles: {
          some: {
            role: {
              name: 'Admin'
            }
          }
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!assignee) {
      throw new HttpError(400, 'Assignee must have Admin role');
    }

    // Get existing ticket
    const existing = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    // Update the ticket
    const item = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: {
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        status: 'ASSIGNED'
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'ASSIGN',
        entityType: 'ServiceRequest',
        entityId: item.id,
        oldValue: existing as any,
        newValue: item as any,
        ipAddress: req.ip
      }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});
