/**
 * Compliance Document Repository Routes
 * 
 * Handles PDF document upload, list, delete, and export operations.
 * Phase 1: Document Repository with folder management
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { ZipArchive } from 'archiver';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import {
  createComplianceDocument,
  listComplianceDocuments,
  listComplianceDocumentsFiltered,
  getUniqueUploaders,
  deleteComplianceDocument,
  getComplianceDocument,
  ensureUploadDir,
  getDocumentFilePath,
  importComplianceDocuments
} from '../../services/compliance.service.js';
import { prisma } from '../../common/prisma.js';
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

// Multer config for multiple file uploads (import)
const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: env.PDF_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 50 // Maximum 50 files at once
  },
  fileFilter
});

/**
 * GET /api/compliance
 * List all compliance documents with search, filter, and sort support
 * Query params:
 *   - search: Search term (matches fileName, uploadedBy, uploadedByEmail)
 *   - uploadedBy: Filter by specific uploader ID
 *   - dateRange: today | last7days | last30days | thisYear | allTime
 *   - sortBy: fileName | createdAt | fileSize
 *   - sortOrder: asc | desc
 *   - uploaders: If true, returns list of unique uploaders for filter dropdown
 */
complianceRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Check if requesting uploaders list for filter dropdown
    if (req.query.uploaders === 'true') {
      const uploaders = await getUniqueUploaders();
      return res.json({ uploaders });
    }

    // Parse query parameters
    const search = req.query.search as string | undefined;
    const uploadedBy = req.query.uploadedBy as string | undefined;
    const dateRange = req.query.dateRange as 'today' | 'last7days' | 'last30days' | 'thisYear' | 'allTime' | undefined;
    const sortBy = req.query.sortBy as 'fileName' | 'createdAt' | 'fileSize' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    // Get filtered documents
    const result = await listComplianceDocumentsFiltered({
      search,
      uploadedBy,
      dateRange,
      sortBy,
      sortOrder
    });

    // Format documents for frontend
    const items = result.items.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      uploadedByEmail: doc.uploadedByEmail,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({ items, total: result.total });
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
 * POST /api/compliance/import
 * Import multiple PDF documents
 */
complianceRouter.post('/import', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    uploadMultiple.array('files', 50)(req, res, async (err) => {
      if (err) {
        if (err.message === 'Only PDF files are allowed') {
          return res.status(400).json({ 
            error: 'Only PDF files are allowed',
            imported: [],
            skipped: []
          });
        }
        if (err.message && err.message.includes('File too large')) {
          return res.status(400).json({ 
            error: `Some files exceed the ${env.PDF_MAX_FILE_SIZE_MB}MB size limit`,
            imported: [],
            skipped: []
          });
        }
        return res.status(400).json({ 
          error: 'File upload failed',
          imported: [],
          skipped: []
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No files uploaded',
          imported: [],
          skipped: []
        });
      }

      // Process the files - check for non-PDFs first
      const validFiles: { originalname: string; filename: string; mimetype: string; size: number }[] = [];
      const invalidFiles: { fileName: string; reason: 'invalid_type' }[] = [];

      for (const file of files) {
        if (file.mimetype === 'application/pdf') {
          validFiles.push({
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
          });
        } else {
          invalidFiles.push({
            fileName: file.originalname,
            reason: 'invalid_type'
          });
        }
      }

      // Import valid files (handles duplicates)
      const importResult = await importComplianceDocuments(
        validFiles,
        req.user?.id || null,
        req.user?.email || null,
        typeof req.ip === 'string' ? req.ip : (Array.isArray(req.ip) ? req.ip[0] : null)
      );

      // Combine invalid files with skipped files from import
      const allSkipped = [
        ...invalidFiles,
        ...importResult.skipped
      ];

      res.status(201).json({
        imported: importResult.imported,
        skipped: allSkipped,
        totalImported: importResult.imported.length,
        totalSkipped: allSkipped.length
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
 * GET /api/compliance/export/all
 * Export all compliance documents as a ZIP archive
 */
complianceRouter.get('/export/all', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const documents = await listComplianceDocuments();

    if (documents.length === 0) {
      throw new HttpError(404, 'No documents to export');
    }

    // Set ZIP headers
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-documents-${timestamp}.zip"`);

    // Create archive
    const archive = new ZipArchive({ zlib: { level: 9 } });
    
    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(res);

    // Add each document to the ZIP
    for (const doc of documents) {
      const filePath = getDocumentFilePath(doc.storedFileName);
      try {
        await fs.access(filePath);
        // Use original filename to preserve it
        archive.file(filePath, { name: doc.fileName });
      } catch {
        console.error(`File not found for document ${doc.id}: ${filePath}`);
      }
    }

    archive.finalize();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/:id/export
 * Export a single compliance document
 */
complianceRouter.get('/:id/export', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      throw new HttpError(400, 'Document ID is required');
    }

    const document = await getComplianceDocument(id);
    if (!document) {
      throw new HttpError(404, 'Document not found');
    }

    const filePath = getDocumentFilePath(document.storedFileName);

    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'Document file not found');
    }

    // Set PDF download headers - preserve original filename
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);

    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});

// ============================================
// Document Repository - Folder Explorer (Phase 2)
// ============================================

type FolderWithCounts = {
  id: string;
  name: string;
  description: string | null;
  parentFolderId: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    children: number;
  };
};

type BreadcrumbItem = {
  id: string | null;
  name: string;
};

// Helper to get breadcrumbs for a folder
async function getBreadcrumbs(folderId: string | null): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: 'Document Repository' }];
  
  if (!folderId) return breadcrumbs;
  
  const ids: string[] = [];
  let currentId: string | null = folderId;
  
  // Collect all ancestor IDs
  while (currentId) {
    ids.unshift(currentId);
    const folder = await prisma.documentFolder.findUnique({
      where: { id: currentId },
      select: { parentFolderId: true }
    });
    currentId = folder?.parentFolderId || null;
  }
  
  // Fetch all folders in one query
  if (ids.length > 0) {
    const folders = await prisma.documentFolder.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true }
    });
    
    // Sort by the order in ids
    folders.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    
    for (const folder of folders) {
      breadcrumbs.push({ id: folder.id, name: folder.name });
    }
  }
  
  return breadcrumbs;
}

// Helper to count all descendants recursively
async function countDescendants(folderId: string): Promise<{ folders: number; files: number }> {
  let folderCount = 0;
  let fileCount = 0;
  
  const children = await prisma.documentFolder.findMany({
    where: { parentFolderId: folderId },
    select: { id: true }
  });
  
  for (const child of children) {
    const counts = await countDescendants(child.id);
    folderCount += 1 + counts.folders;
    fileCount += counts.files;
  }
  
  return { folders: folderCount, files: fileCount };
}

/**
 * GET /api/compliance/folders
 * List folders with optional parentFolderId for hierarchy navigation
 * Query params:
 *   - parentFolderId: (optional) ID of parent folder, null for root
 *   - search: Search term (matches name, description)
 *   - sortBy: name | createdAt | updatedAt
 *   - sortOrder: asc | desc
 */
complianceRouter.get('/folders', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const parentFolderId = req.query.parentFolderId as string | null || null;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Build where clause
    const where: any = { parentFolderId };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Fetch folders with child count
    const folders = await prisma.documentFolder.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { children: true }
        }
      }
    }) as FolderWithCount[];

    // Format folders with counts
    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      parentFolderId: folder.parentFolderId,
      createdBy: folder.createdBy,
      createdByEmail: folder.createdByEmail,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      subfolderCount: folder._count.children,
      fileCount: 0 // Will be updated when files are implemented
    }));

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbs(parentFolderId);

    // Get summary for current folder level
    const totalSubfolders = folders.length;
    const totalFiles = 0; // Will be updated when files are implemented
    const storageUsed = 0; // Will be updated when files are implemented

    // Get recently modified folders at this level
    const recentFolders = await prisma.documentFolder.findMany({
      where: { parentFolderId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, updatedAt: true }
    });

    res.json({
      items: formattedFolders,
      breadcrumbs,
      currentFolderId: parentFolderId,
      summary: {
        totalSubfolders,
        totalFiles,
        storageUsed,
        recentlyModified: recentFolders
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/folders
 * Create a new folder (optionally inside a parent folder)
 */
complianceRouter.post('/folders', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description, parentFolderId } = req.body;

    if (!name || name.trim() === '') {
      throw new HttpError(400, 'Folder name is required');
    }

    // Validate parent folder exists if provided
    if (parentFolderId) {
      const parent = await prisma.documentFolder.findUnique({ where: { id: parentFolderId } });
      if (!parent) {
        throw new HttpError(404, 'Parent folder not found');
      }
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentFolderId: parentFolderId || null,
        createdBy: req.user?.id || null,
        createdByEmail: req.user?.email || null
      }
    });

    res.status(201).json({ item: folder });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/compliance/folders/:id
 * Update a folder (rename)
 */
complianceRouter.patch('/folders/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) {
      throw new HttpError(400, 'Folder ID is required');
    }

    const existingFolder = await prisma.documentFolder.findUnique({ where: { id } });
    if (!existingFolder) {
      throw new HttpError(404, 'Folder not found');
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (name.trim() === '') {
        throw new HttpError(400, 'Folder name cannot be empty');
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const folder = await prisma.documentFolder.update({
      where: { id },
      data: updateData
    });

    res.json({ item: folder });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance/folders/:id
 * Delete a folder (only if no children)
 */
complianceRouter.delete('/folders/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage', 'compliance:delete'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, 'Folder ID is required');
    }

    const existingFolder = await prisma.documentFolder.findUnique({ 
      where: { id },
      include: { _count: { select: { children: true } } }
    });
    if (!existingFolder) {
      throw new HttpError(404, 'Folder not found');
    }

    // Check for child folders - prevent deletion if children exist
    if (existingFolder._count.children > 0) {
      throw new HttpError(400, 'This folder contains subfolders. Delete them first.');
    }

    await prisma.documentFolder.delete({ where: { id } });

    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/folders/:id
 * Get folder details with breadcrumbs
 */
complianceRouter.get('/folders/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, 'Folder ID is required');
    }

    const folder = await prisma.documentFolder.findUnique({ 
      where: { id },
      include: { _count: { select: { children: true } } }
    });
    if (!folder) {
      throw new HttpError(404, 'Folder not found');
    }

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbs(id);

    res.json({ 
      item: {
        ...folder,
        subfolderCount: folder._count.children,
        fileCount: 0
      },
      breadcrumbs 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/folders/:id/breadcrumbs
 * Get breadcrumbs for a specific folder
 */
complianceRouter.get('/folders/:id/breadcrumbs', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, 'Folder ID is required');
    }

    const breadcrumbs = await getBreadcrumbs(id);

    res.json({ breadcrumbs });
  } catch (error) {
    next(error);
  }
});
