import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';

export const inventoryHistoryRouter = Router();

// Permission constants - PART 4: Using granular permissions
const VIEW_PERMISSION = 'inventory:view';
const VIEW_HISTORY_PERMISSION = 'inventory:view_history';

// Helper to check if user is Super Admin
function isSuperAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Super Admin') ?? false;
}

// Helper to check if user is Admin
function isAdmin(user: Express.Request['user']): boolean {
  return user?.roles.includes('Admin') ?? false;
}

// ============================================
// History Routes
// ============================================

// GET /inventory-master/:itemId/history - Get history for an inventory item
inventoryHistoryRouter.get('/inventory-master/:itemId/history', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const { itemId } = req.params;

    // Verify item exists
    const item = await prisma.inventoryMaster.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }

    const history = await prisma.inventoryHistory.findMany({
      where: { inventoryId: itemId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-master/:itemId/history - Add history entry
inventoryHistoryRouter.post('/inventory-master/:itemId/history', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user) && !isAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin or Admin can add history entries');
    }

    const { itemId } = req.params;
    const { action, description, performedBy } = req.body;

    if (!action) {
      throw new HttpError(400, 'Action is required');
    }

    // Verify item exists
    const item = await prisma.inventoryMaster.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }

    const historyEntry = await prisma.inventoryHistory.create({
      data: {
        inventoryId: itemId,
        action,
        description: description || null,
        performedBy: performedBy || req.user?.name || 'System',
        userId: req.user?.id
      }
    });

    res.status(201).json({ history: historyEntry });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Document Routes
// ============================================

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// GET /inventory-master/:itemId/documents - Get documents for an inventory item
inventoryHistoryRouter.get('/inventory-master/:itemId/documents', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(VIEW_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

    const { itemId } = req.params;

    // Verify item exists
    const item = await prisma.inventoryMaster.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }

    const documents = await prisma.inventoryDocument.findMany({
      where: { inventoryId: itemId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-master/:itemId/documents - Upload document
inventoryHistoryRouter.post('/inventory-master/:itemId/documents', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can upload documents');
    }

    const { itemId } = req.params;
    const { fileName, fileType, fileSize, url, documentType } = req.body;

    if (!fileName || !fileType || !fileSize || !url) {
      throw new HttpError(400, 'fileName, fileType, fileSize, and url are required');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      throw new HttpError(400, 'Invalid file type. Allowed: PDF, DOC, DOCX, XLSX');
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      throw new HttpError(400, 'File size exceeds 25 MB limit');
    }

    // Verify item exists
    const item = await prisma.inventoryMaster.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }

    const document = await prisma.inventoryDocument.create({
      data: {
        inventoryId: itemId,
        fileName,
        fileType,
        fileSize,
        url,
        documentType: documentType || 'Other',
        uploadedBy: req.user?.name || 'Unknown',
        userId: req.user?.id
      }
    });

    // Add history entry
    await prisma.inventoryHistory.create({
      data: {
        inventoryId: itemId,
        action: 'Document Uploaded',
        description: `Uploaded document: ${fileName}`,
        performedBy: req.user?.name || 'System',
        userId: req.user?.id
      }
    });

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// DELETE /inventory-master/:itemId/documents/:documentId - Delete document
inventoryHistoryRouter.delete('/inventory-master/:itemId/documents/:documentId', requireAuth, async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      throw new HttpError(403, 'Only Super Admin can delete documents');
    }

    const { itemId, documentId } = req.params;

    const document = await prisma.inventoryDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new HttpError(404, 'Document not found');
    }

    if (document.inventoryId !== itemId) {
      throw new HttpError(400, 'Document does not belong to this inventory item');
    }

    await prisma.inventoryDocument.delete({
      where: { id: documentId }
    });

    // Add history entry
    await prisma.inventoryHistory.create({
      data: {
        inventoryId: itemId,
        action: 'Document Deleted',
        description: `Deleted document: ${document.fileName}`,
        performedBy: req.user?.name || 'System',
        userId: req.user?.id
      }
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});
