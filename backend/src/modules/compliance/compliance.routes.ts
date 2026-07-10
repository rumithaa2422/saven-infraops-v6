/**
 * Compliance Document Repository Routes
 * 
 * Handles PDF document upload, list, and delete operations.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import {
  createComplianceDocument,
  listComplianceDocuments,
  deleteComplianceDocument,
  getComplianceDocument,
  ensureUploadDir,
  getDocumentFilePath
} from '../../services/compliance.service.js';
import { env } from '../../config/env.js';
import { promises as fs } from 'fs';

export const complianceRouter = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir();
    cb(null, path.join(process.cwd(), 'uploads', 'compliance'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `compliance-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: env.PDF_MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter
});

/**
 * GET /api/compliance
 * List all compliance documents
 */
complianceRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const documents = await listComplianceDocuments();
    
    // Format documents for frontend
    const items = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      uploadedByEmail: doc.uploadedByEmail,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/upload
 * Upload a PDF document
 */
complianceRouter.post('/upload', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    upload.single('file')(req, res, async (err) => {
      if (err) {
        if (err.message === 'Only PDF files are allowed') {
          return res.status(400).json({ error: err.message });
        }
        if (err.message && err.message.includes('File too large')) {
          return res.status(400).json({ 
            error: `File too large. Maximum size is ${env.PDF_MAX_FILE_SIZE_MB}MB.` 
          });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const document = await createComplianceDocument({
        fileName: file.originalname,
        storedFileName: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user?.id || null,
        uploadedByEmail: req.user?.email || null,
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        ipAddress: typeof req.ip === 'string' ? req.ip : (Array.isArray(req.ip) ? req.ip[0] : null)
      });

      res.status(201).json({
        item: {
          id: document.id,
          fileName: document.fileName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          uploadedBy: document.uploadedBy,
          uploadedByEmail: document.uploadedByEmail,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance/:id
 * Delete a compliance document
 */
complianceRouter.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage', 'compliance:delete'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      throw new HttpError(400, 'Document ID is required');
    }

    const result = await deleteComplianceDocument(
      id,
      req.user?.id || null,
      req.user?.email || null,
      typeof req.ip === 'string' ? req.ip : (Array.isArray(req.ip) ? req.ip[0] : null)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/:id/view
 * View a PDF document inline in the browser
 */
complianceRouter.get('/:id/view', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      throw new HttpError(400, 'Document ID is required');
    }

    // Get document metadata
    const document = await getComplianceDocument(id);
    if (!document) {
      throw new HttpError(404, 'Document not found');
    }

    // Get the file path
    const filePath = getDocumentFilePath(document.storedFileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'Document file not found');
    }

    // Stream the PDF file with inline disposition (opens in browser)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});
