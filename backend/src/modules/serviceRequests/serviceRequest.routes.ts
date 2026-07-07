import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { WorkStatus } from '@prisma/client';
import {
  createServiceRequest,
  updateServiceRequest,
  assignServiceRequest
} from '../../services/serviceRequest.service.js';

export const serviceRequestRouter = Router();

serviceRequestRouter.get('/', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const userRoles = req.user?.roles || [];

    const isPrivileged = userRoles.includes('Super Admin') || userRoles.includes('Admin');

    const where: { status?: WorkStatus; requesterId?: string } = {};
    if (status && status in WorkStatus) {
      where.status = status as WorkStatus;
    }
    if (!isPrivileged) {
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

serviceRequestRouter.get('/:id', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.serviceRequest.findUnique({ where: { id } });
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

serviceRequestRouter.post('/', requireAuth, requirePermissionOr(['tickets:write', 'tickets:create']), async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const item = await createServiceRequest({
      ...payload,
      requesterId: req.user?.id,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
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

function canPerformAction(user: Express.Request['user'], ticket: { assigneeId?: string | null }): boolean {
  if (!user) return false;

  if (user.roles.includes('Super Admin')) return true;

  if (user.roles.includes('Admin')) {
    return ticket.assigneeId === user.id;
  }

  return false;
}

serviceRequestRouter.patch('/:id', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const payload = updateSchema.parse(req.body);
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    if (!canPerformAction(req.user, existing)) {
      throw new HttpError(403, 'You can only perform actions on tickets assigned to you');
    }

    const item = await updateServiceRequest(id, {
      ...payload,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

const assignSchema = z.object({
  assigneeId: z.string().min(1)
});

serviceRequestRouter.patch('/:id/assign', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const userRoles = req.user?.roles || [];
    if (!userRoles.includes('Super Admin')) {
      throw new HttpError(403, 'Only Super Admin can assign tickets');
    }

    const { assigneeId } = assignSchema.parse(req.body);

    const item = await assignServiceRequest(id, {
      assigneeId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});
