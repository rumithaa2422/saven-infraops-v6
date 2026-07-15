import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
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
import { env } from '../../config/env.js';
import { promises as fs } from 'fs';

export const serviceRequestRouter = Router();

// Timeline action types
const TimelineAction = {
  CREATED: 'Created',
  STATUS_CHANGED: 'Status Changed',
  ASSIGNED: 'Assigned',
  UNASSIGNED: 'Unassigned',
  ATTACHMENT_UPLOADED: 'Attachment Uploaded',
  COMMENT_ADDED: 'Comment Added',
  PRIORITY_CHANGED: 'Priority Changed',
  UPDATED: 'Updated'
} as const;

// Helper function to add timeline entry
async function addTimelineEntry(
  requestId: string,
  action: string,
  description: string,
  user?: Express.Request['user']
) {
  await prisma.serviceRequestTimeline.create({
    data: {
      requestId,
      action,
      description,
      performedBy: user?.id || null,
      performedByName: user?.name || null
    }
  });
}

// Ensure upload directory exists
async function ensureAttachmentDir() {
  const dir = path.join(process.cwd(), 'uploads', 'attachments');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  return dir;
}

// Configure multer for attachment uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = await ensureAttachmentDir();
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx', '.txt'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed: png, jpg, jpeg, pdf, docx, xlsx, txt'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: env.PDF_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10
  },
  fileFilter
});

// Helper to check if user can download attachment
function canDownloadAttachment(user: Express.Request['user'], request: { assigneeId?: string | null; requesterId?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can download any
  if (user.roles.includes('Super Admin')) return true;
  
  // Admin can download if ticket is assigned to them
  if (user.roles.includes('Admin')) {
    return request.assigneeId === user.id;
  }
  
  // Regular users can download their own requests
  return request.requesterId === user.id;
}

// Helper to check if user can upload attachment
function canUploadAttachment(user: Express.Request['user'], request: { requesterId?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can upload to any
  if (user.roles.includes('Super Admin')) return true;
  
  // Admin can upload to any request
  if (user.roles.includes('Admin')) return true;
  
  // Regular users can upload to their own requests
  return request.requesterId === user.id;
}

// Helper to check if user can delete attachment
function canDeleteAttachment(user: Express.Request['user']): boolean {
  if (!user) return false;
  return user.roles.includes('Super Admin');
}

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
    
    // Add timeline entry for ticket creation
    await addTimelineEntry(
      item.id,
      TimelineAction.CREATED,
      `Service request created with title: ${item.title}`,
      req.user
    );
    
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
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED']).optional(),
  requesterName: z.string().min(2).optional(),
  assigneeName: z.string().optional(),
  projectName: z.string().optional()
});

// Status transition validation
const ADMIN_STATUS_TRANSITIONS: Record<string, string[]> = {
  'OPEN': [],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['WAITING_FOR_USER', 'COMPLETED'],
  'WAITING_FOR_USER': ['IN_PROGRESS', 'COMPLETED'],
  'COMPLETED': ['CLOSED'],
  'CLOSED': []
};

function canPerformAction(user: Express.Request['user'], ticket: { assigneeId?: string | null }): boolean {
  if (!user) return false;

  if (user.roles.includes('Super Admin')) return true;

  if (user.roles.includes('Admin')) {
    return ticket.assigneeId === user.id;
  }

  return false;
}

// Validate status transition based on user role
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  userRoles: string[],
  assigneeId?: string | null
): { valid: boolean; error?: string } {
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isAdmin = userRoles.includes('Admin');
  const isAssignedToUser = assigneeId === assigneeId; // Already checked in canPerformAction

  // Super Admin can move to any status
  if (isSuperAdmin) {
    return { valid: true };
  }

  // Employees cannot change status
  if (!isAdmin) {
    return { valid: false, error: 'Employees cannot change ticket status' };
  }

  // Admin must be assigned to the ticket to change status
  if (!isAssignedToUser) {
    return { valid: false, error: 'You can only change status on tickets assigned to you' };
  }

  // Check admin allowed transitions
  const allowedTransitions = ADMIN_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    const validOptions = allowedTransitions.length > 0 
      ? allowedTransitions.join(', ') 
      : 'No transitions allowed from this status';
    return { 
      valid: false, 
      error: `Invalid status transition. Allowed transitions: ${validOptions}` 
    };
  }

  return { valid: true };
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

    // Validate status transition
    if (payload.status && payload.status !== existing.status) {
      const validation = validateStatusTransition(
        existing.status,
        payload.status,
        req.user?.roles || [],
        existing.assigneeId
      );
      if (!validation.valid) {
        throw new HttpError(400, validation.error || 'Invalid status transition');
      }
    }

    const item = await updateServiceRequest(id, payload);
    
    // Add timeline entry for status change
    if (payload.status && payload.status !== existing.status) {
      await addTimelineEntry(
        id,
        TimelineAction.STATUS_CHANGED,
        `Status changed from ${existing.status} to ${payload.status}`,
        req.user
      );
    }
    
    // Add timeline entry for priority change
    if (payload.priority && payload.priority !== existing.priority) {
      await addTimelineEntry(
        id,
        TimelineAction.PRIORITY_CHANGED,
        `Priority changed to ${payload.priority}`,
        req.user
      );
    }
    
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

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    const { assigneeId } = assignSchema.parse(req.body);

    const item = await assignServiceRequest(id, { assigneeId });
    
    // Add timeline entry for assignment
    await addTimelineEntry(
      id,
      TimelineAction.ASSIGNED,
      `Assigned to ${item.assigneeName}`,
      req.user
    );
    
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// PUT /service-requests/:id - Update service request (full replacement)
serviceRequestRouter.put('/:id', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const payload = updateSchema.parse(req.body);
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    const item = await updateServiceRequest(id, payload);
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// DELETE /service-requests/:id - Delete service request
serviceRequestRouter.delete('/:id', requireAuth, requirePermissionOr(['tickets:manage']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Service request not found');

    await prisma.serviceRequest.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'DELETE',
        entityType: 'ServiceRequest',
        entityId: id,
        oldValue: existing as any,
        ipAddress: req.ip || null
      }
    });

    res.json({ success: true, deleted: existing });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Attachment Routes
// ============================================

// GET /service-requests/:id/attachments - List attachments for a request
serviceRequestRouter.get('/:id/attachments', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    const attachments = await prisma.serviceRequestAttachment.findMany({
      where: { requestId: id },
      orderBy: { uploadedAt: 'desc' }
    });
    
    res.json({ attachments });
  } catch (error) {
    next(error);
  }
});

// POST /service-requests/:id/attachments - Upload attachment(s)
serviceRequestRouter.post('/:id/attachments', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), async (req: Request, res: Response, next) => {
  try {
    const id = req.params.id as string;
    
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    if (!canUploadAttachment(req.user, request)) {
      throw new HttpError(403, 'You can only upload attachments to your own requests');
    }
    
    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        if (err.message && err.message.includes('File type not allowed')) {
          return res.status(400).json({ error: err.message });
        }
        if (err.message && err.message.includes('File too large')) {
          return res.status(400).json({ 
            error: `File too large. Maximum size is ${env.PDF_MAX_FILE_SIZE_MB}MB.` 
          });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      // Create attachment records
      const attachments = await Promise.all(
        files.map(async (file) => {
          return prisma.serviceRequestAttachment.create({
            data: {
              requestId: id,
              fileName: file.originalname,
              storedName: file.filename,
              fileSize: file.size,
              mimeType: file.mimetype,
              uploadedBy: req.user?.id || null,
              uploadedByName: req.user?.name || null
            }
          });
        })
      );
      
      // Add timeline entry for attachment upload
      const fileNames = files.map(f => f.originalname).join(', ');
      await addTimelineEntry(
        id,
        TimelineAction.ATTACHMENT_UPLOADED,
        `Uploaded attachment(s): ${fileNames}`,
        req.user
      );
      
      res.status(201).json({ attachments });
    });
  } catch (error) {
    next(error);
  }
});

// GET /service-requests/:requestId/attachments/:attachmentId/download - Download attachment
serviceRequestRouter.get('/:requestId/attachments/:attachmentId/download', requireAuth, async (req, res, next) => {
  try {
    const { requestId, attachmentId } = req.params;
    
    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    if (!canDownloadAttachment(req.user, request)) {
      throw new HttpError(403, 'You do not have permission to download this attachment');
    }
    
    const attachment = await prisma.serviceRequestAttachment.findUnique({
      where: { id: attachmentId }
    });
    
    if (!attachment || attachment.requestId !== requestId) {
      throw new HttpError(404, 'Attachment not found');
    }
    
    const filePath = path.join(process.cwd(), 'uploads', 'attachments', attachment.storedName);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'File not found on server');
    }
    
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Length', attachment.fileSize);
    
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});

// DELETE /service-requests/:requestId/attachments/:attachmentId - Delete attachment
serviceRequestRouter.delete('/:requestId/attachments/:attachmentId', requireAuth, async (req, res, next) => {
  try {
    const { requestId, attachmentId } = req.params;
    
    if (!canDeleteAttachment(req.user)) {
      throw new HttpError(403, 'Only Super Admin can delete attachments');
    }
    
    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    const attachment = await prisma.serviceRequestAttachment.findUnique({
      where: { id: attachmentId }
    });
    
    if (!attachment || attachment.requestId !== requestId) {
      throw new HttpError(404, 'Attachment not found');
    }
    
    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'attachments', attachment.storedName);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might not exist, continue with database deletion
    }
    
    // Delete from database
    await prisma.serviceRequestAttachment.delete({ where: { id: attachmentId } });
    
    res.json({ success: true, deleted: attachment });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Comment Routes
// ============================================

// Helper to check if user can view comments
function canViewComments(user: Express.Request['user'], request: { assigneeId?: string | null; requesterId?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can view all
  if (user.roles.includes('Super Admin')) return true;
  
  // Admin can view if ticket is assigned to them
  if (user.roles.includes('Admin')) {
    return request.assigneeId === user.id;
  }
  
  // Regular users can view their own requests
  return request.requesterId === user.id;
}

// Helper to check if user can post comments
function canPostComment(user: Express.Request['user'], request: { assigneeId?: string | null; requesterId?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can post to any
  if (user.roles.includes('Super Admin')) return true;
  
  // Admin can post if ticket is assigned to them
  if (user.roles.includes('Admin')) {
    return request.assigneeId === user.id;
  }
  
  // Regular users can post to their own requests
  return request.requesterId === user.id;
}

// GET /service-requests/:id/comments - List comments for a request
serviceRequestRouter.get('/:id/comments', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    if (!canViewComments(req.user, request)) {
      throw new HttpError(403, 'You do not have permission to view comments');
    }
    
    const comments = await prisma.serviceRequestComment.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

// POST /service-requests/:id/comments - Create a new comment
const commentSchema = z.object({
  message: z.string().min(1).max(5000)
});

serviceRequestRouter.post('/:id/comments', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { message } = commentSchema.parse(req.body);
    
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    if (!canPostComment(req.user, request)) {
      throw new HttpError(403, 'You do not have permission to post comments');
    }
    
    const comment = await prisma.serviceRequestComment.create({
      data: {
        requestId: id,
        userId: req.user?.id || null,
        userName: req.user?.name || 'Unknown',
        message: message.trim()
      }
    });
    
    // Add timeline entry for comment
    const messagePreview = message.trim().substring(0, 50) + (message.trim().length > 50 ? '...' : '');
    await addTimelineEntry(
      id,
      TimelineAction.COMMENT_ADDED,
      `Added comment: "${messagePreview}"`,
      req.user
    );
    
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Timeline Routes
// ============================================

// GET /service-requests/:id/timeline - Get timeline for a service request
serviceRequestRouter.get('/:id/timeline', requireAuth, requirePermissionOr(['tickets:read', 'tickets:view']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, 'Service request not found');
    
    // Fetch timeline entries ordered by creation time
    const timeline = await prisma.serviceRequestTimeline.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ timeline });
  } catch (error) {
    next(error);
  }
});
