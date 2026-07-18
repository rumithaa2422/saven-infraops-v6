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
    });

    // Get file counts for each folder
    const folderIds = folders.map(f => f.id);
    const fileCounts = await prisma.documentFile.groupBy({
      by: ['folderId'],
      _count: true,
      _sum: { fileSize: true },
      where: { folderId: { in: folderIds } }
    });

    const fileCountMap = new Map(fileCounts.map(fc => [fc.folderId, { count: fc._count, size: fc._sum.fileSize || 0 }]));

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
      fileCount: fileCountMap.get(folder.id)?.count || 0
    }));

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbs(parentFolderId);

    // Get summary
    let totalFiles: number;
    let storageUsed: number;
    let recentItems: { id: string; name: string; updatedAt: Date; type: string }[];

    if (parentFolderId === null) {
      // Root level: Repository-wide statistics
      const [fileStats, recentFolders, recentFiles] = await Promise.all([
        prisma.documentFile.aggregate({
          _count: true,
          _sum: { fileSize: true }
        }),
        prisma.documentFolder.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: { id: true, name: true, updatedAt: true }
        }),
        prisma.documentFile.findMany({
          orderBy: { modifiedAt: 'desc' },
          take: 3,
          select: { id: true, originalFileName: true, modifiedAt: true }
        })
      ]);

      totalFiles = fileStats._count;
      storageUsed = fileStats._sum.fileSize || 0;

      // Combine and sort by most recent (all repository items)
      recentItems = [
        ...recentFolders.map(f => ({ id: f.id, name: f.name, updatedAt: f.updatedAt, type: 'folder' })),
        ...recentFiles.map(f => ({ id: f.id, name: f.originalFileName, updatedAt: f.modifiedAt, type: 'file' }))
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    } else {
      // Inside a folder: Folder-level statistics
      const totalSubfolders = folders.length;

      const [fileStats, recentFolders, recentFiles] = await Promise.all([
        prisma.documentFile.aggregate({
          where: { folderId: parentFolderId },
          _count: true,
          _sum: { fileSize: true }
        }),
        prisma.documentFolder.findMany({
          where: { parentFolderId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: { id: true, name: true, updatedAt: true }
        }),
        prisma.documentFile.findMany({
          where: { folderId: parentFolderId },
          orderBy: { modifiedAt: 'desc' },
          take: 3,
          select: { id: true, originalFileName: true, modifiedAt: true }
        })
      ]);

      totalFiles = fileStats._count;
      storageUsed = fileStats._sum.fileSize || 0;

      // Combine and sort by most recent (items in this folder)
      recentItems = [
        ...recentFolders.map(f => ({ id: f.id, name: f.name, updatedAt: f.updatedAt, type: 'folder' })),
        ...recentFiles.map(f => ({ id: f.id, name: f.originalFileName, updatedAt: f.modifiedAt, type: 'file' }))
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    }

    const totalSubfolders = folders.length;

    res.json({
      items: formattedFolders,
      breadcrumbs,
      currentFolderId: parentFolderId,
      summary: {
        totalSubfolders,
        totalFiles,
        storageUsed,
        recentlyModified: recentItems
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/folders/all
 * Get all folders for folder picker (move dialog)
 */
complianceRouter.get('/folders/all', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    // Get all folders with their path for tree view
    const folders = await prisma.documentFolder.findMany({
      select: {
        id: true,
        name: true,
        parentFolderId: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ items: folders });
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

// ============================================
// Document Repository - File Management (Phase 3)
// ============================================

// Allowed file extensions and their MIME types
const ALLOWED_EXTENSIONS = new Map([
  ['pdf', 'application/pdf'],
  ['doc', 'application/msword'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xls', 'application/vnd.ms-excel'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['ppt', 'application/vnd.ms-powerpoint'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['txt', 'text/plain'],
  ['zip', 'application/zip'],
]);

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Helper to ensure upload directory exists
async function ensureUploadDir(dirPath: string): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const fullPath = path.join(process.cwd(), dirPath);
  try {
    await fs.promises.access(fullPath);
  } catch {
    await fs.promises.mkdir(fullPath, { recursive: true });
  }
}

// Configure multer for document repository uploads (multiple files, various formats)
const documentStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir('uploads/documents');
    cb(null, path.join(process.cwd(), 'uploads', 'documents'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const documentFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not allowed. Allowed types: ${[...ALLOWED_EXTENSIONS.keys()].join(', ')}`));
  }
};

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10 // Max 10 files per upload
  },
  fileFilter: documentFileFilter
});

// Get file icon based on extension
function getFileIcon(fileExtension: string): string {
  const icons: Record<string, string> = {
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    ppt: 'powerpoint',
    pptx: 'powerpoint',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    txt: 'text',
    zip: 'archive',
  };
  return icons[fileExtension.toLowerCase()] || 'file';
}

/**
 * GET /api/compliance/files
 * List files in a folder
 * Query params:
 *   - folderId: (required) ID of folder
 *   - search: Search term
 *   - sortBy: fileName | uploadedAt | fileSize
 *   - sortOrder: asc | desc
 */
complianceRouter.get('/files', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const folderId = req.query.folderId as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as 'fileName' | 'uploadedAt' | 'fileSize') || 'uploadedAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Files must belong to a folder - return empty if no folderId
    if (!folderId) {
      return res.json({ items: [] });
    }

    // Build where clause
    const where: any = { folderId };
    
    if (search) {
      where.OR = [
        { originalFileName: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Fetch files
    const files = await prisma.documentFile.findMany({
      where,
      orderBy: { [sortBy]: sortOrder }
    });

    // Format files with icon type
    const formattedFiles = files.map(file => ({
      id: file.id,
      folderId: file.folderId,
      originalFileName: file.originalFileName,
      fileExtension: file.fileExtension,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      iconType: getFileIcon(file.fileExtension),
      uploadedBy: file.uploadedBy,
      uploadedByEmail: file.uploadedByEmail,
      uploadedAt: file.uploadedAt,
      modifiedAt: file.modifiedAt,
      description: file.description
    }));

    res.json({ items: formattedFiles });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/files
 * Upload one or multiple files
 */
complianceRouter.post('/files', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    documentUpload.array('files', 10)(req, res, async (err) => {
      if (err) {
        if (err.message && err.message.includes('not allowed')) {
          return res.status(400).json({ message: err.message });
        }
        if (err.message && err.message.includes('File too large')) {
          return res.status(400).json({ message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` });
        }
        return res.status(400).json({ message: 'File upload failed' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const folderId = req.body.folderId || null;

      // Validate folder exists if provided
      if (folderId) {
        const folder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
        if (!folder) {
          // Clean up uploaded files
          for (const file of files) {
            try {
              await fs.unlink(path.join(process.cwd(), 'uploads', 'documents', file.filename));
            } catch { /* ignore */ }
          }
          return res.status(404).json({ message: 'Folder not found' });
        }
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        
        // Double-check extension
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          errors.push({ fileName: file.originalname, error: `File type .${ext} is not allowed` });
          try {
            await fs.unlink(path.join(process.cwd(), 'uploads', 'documents', file.filename));
          } catch { /* ignore */ }
          continue;
        }

        try {
          const docFile = await prisma.documentFile.create({
            data: {
              folderId: folderId,
              fileName: file.filename,
              originalFileName: file.originalname,
              fileExtension: ext,
              mimeType: file.mimetype,
              fileSize: file.size,
              storagePath: path.join('uploads', 'documents', file.filename),
              uploadedBy: req.user?.id || null,
              uploadedByEmail: req.user?.email || null
            }
          });

          uploadedFiles.push({
            id: docFile.id,
            folderId: docFile.folderId,
            originalFileName: docFile.originalFileName,
            fileExtension: docFile.fileExtension,
            mimeType: docFile.mimeType,
            fileSize: docFile.fileSize,
            iconType: getFileIcon(docFile.fileExtension),
            uploadedBy: docFile.uploadedBy,
            uploadedByEmail: docFile.uploadedByEmail,
            uploadedAt: docFile.uploadedAt,
            modifiedAt: docFile.modifiedAt,
            description: docFile.description
          });
        } catch (dbErr) {
          errors.push({ fileName: file.originalname, error: 'Failed to save file metadata' });
          try {
            await fs.unlink(path.join(process.cwd(), 'uploads', 'documents', file.filename));
          } catch { /* ignore */ }
        }
      }

      res.status(201).json({
        uploaded: uploadedFiles,
        errors,
        totalUploaded: uploadedFiles.length,
        totalErrors: errors.length
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/files/:id
 * Download or preview a file
 * Query params:
 *   - action: 'download' | 'preview'
 */
complianceRouter.get('/files/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const action = (req.query.action as string) || 'download';

    if (!id) {
      throw new HttpError(400, 'File ID is required');
    }

    const file = await prisma.documentFile.findUnique({ where: { id } });
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    const filePath = path.join(process.cwd(), file.storagePath);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'File not found on disk');
    }

    if (action === 'preview') {
      // Check if file is previewable (images and PDFs)
      const previewableTypes = ['png', 'jpg', 'jpeg', 'pdf'];
      if (previewableTypes.includes(file.fileExtension.toLowerCase())) {
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.originalFileName}"`);
      } else {
        return res.status(400).json({ 
          message: 'Preview unavailable for this file type',
          downloadUrl: `/api/compliance/files/${id}?action=download`
        });
      }
    } else {
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalFileName}"`);
    }

    res.setHeader('Content-Length', file.fileSize);
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/compliance/files/:id
 * Rename or move a file
 */
complianceRouter.patch('/files/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const { originalFileName, folderId, description } = req.body;

    if (!id) {
      throw new HttpError(400, 'File ID is required');
    }

    const existingFile = await prisma.documentFile.findUnique({ where: { id } });
    if (!existingFile) {
      throw new HttpError(404, 'File not found');
    }

    const updateData: any = {};

    // Handle rename - keep extension
    if (originalFileName !== undefined) {
      if (originalFileName.trim() === '') {
        throw new HttpError(400, 'File name cannot be empty');
      }
      // Preserve original extension
      const currentExt = existingFile.fileExtension;
      const newName = originalFileName.trim();
      // Only update if name changed (keep extension logic handled by frontend)
      updateData.originalFileName = newName.endsWith(`.${currentExt}`) ? newName : `${newName}.${currentExt}`;
    }

    // Handle move to different folder
    if (folderId !== undefined) {
      if (folderId === null) {
        updateData.folderId = null;
      } else {
        const targetFolder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
        if (!targetFolder) {
          throw new HttpError(404, 'Target folder not found');
        }
        updateData.folderId = folderId;
      }
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new HttpError(400, 'No valid fields to update');
    }

    const file = await prisma.documentFile.update({
      where: { id },
      data: updateData
    });

    res.json({ 
      item: {
        id: file.id,
        folderId: file.folderId,
        originalFileName: file.originalFileName,
        fileExtension: file.fileExtension,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        iconType: getFileIcon(file.fileExtension),
        uploadedBy: file.uploadedBy,
        uploadedByEmail: file.uploadedByEmail,
        uploadedAt: file.uploadedAt,
        modifiedAt: file.modifiedAt,
        description: file.description
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance/files/:id
 * Delete a file
 */
complianceRouter.delete('/files/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage', 'compliance:delete'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, 'File ID is required');
    }

    const file = await prisma.documentFile.findUnique({ where: { id } });
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), file.storagePath);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might already be deleted, continue with database deletion
    }

    // Delete metadata
    await prisma.documentFile.delete({ where: { id } });

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/files/:id/info
 * Get file info
 */
complianceRouter.get('/files/:id/info', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, 'File ID is required');
    }

    const file = await prisma.documentFile.findUnique({ where: { id } });
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    // Get folder path for breadcrumbs
    let folderPath: { id: string; name: string }[] = [];
    if (file.folderId) {
      folderPath = await getBreadcrumbs(file.folderId);
    }

    res.json({
      item: {
        id: file.id,
        folderId: file.folderId,
        originalFileName: file.originalFileName,
        fileExtension: file.fileExtension,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        iconType: getFileIcon(file.fileExtension),
        uploadedBy: file.uploadedBy,
        uploadedByEmail: file.uploadedByEmail,
        uploadedAt: file.uploadedAt,
        modifiedAt: file.modifiedAt,
        description: file.description
      },
      folderPath
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/items
 * Combined endpoint for listing folders and files with filtering and sorting
 * Query params:
 *   - folderId: (optional) ID of folder, null for root
 *   - search: Search term
 *   - type: 'both' | 'folders' | 'files'
 *   - fileTypes: comma-separated list of file types (pdf,word,excel,powerpoint,image,text,zip,other)
 *   - dateFrom: Start date (ISO string)
 *   - dateTo: End date (ISO string)
 *   - sizeMin: Minimum file size in bytes
 *   - sizeMax: Maximum file size in bytes
 *   - uploadedBy: Filter by uploader email
 *   - sortBy: 'name' | 'createdAt' | 'updatedAt' | 'uploadedAt' | 'modifiedAt' | 'fileSize'
 *   - sortOrder: 'asc' | 'desc'
 *   - foldersFirst: boolean - show folders before files
 */
complianceRouter.get('/items', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const folderId = req.query.folderId as string | null || null;
    const search = req.query.search as string | undefined;
    const type = (req.query.type as 'both' | 'folders' | 'files') || 'both';
    const fileTypes = req.query.fileTypes as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const sizeMin = req.query.sizeMin ? Number(req.query.sizeMin) : undefined;
    const sizeMax = req.query.sizeMax ? Number(req.query.sizeMax) : undefined;
    const uploadedBy = req.query.uploadedBy as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const foldersFirst = req.query.foldersFirst === 'true';

    // Parse file types
    const fileTypeExtensions: Record<string, string[]> = {
      pdf: ['pdf'],
      word: ['doc', 'docx'],
      excel: ['xls', 'xlsx'],
      powerpoint: ['ppt', 'pptx'],
      image: ['png', 'jpg', 'jpeg'],
      text: ['txt'],
      zip: ['zip']
    };

    let selectedExtensions: string[] | undefined;
    if (fileTypes) {
      const types = fileTypes.split(',').map(t => t.trim().toLowerCase());
      selectedExtensions = [];
      for (const t of types) {
        if (t === 'other') {
          // 'other' means extensions not in the predefined list
          // We'll handle this separately
        } else if (fileTypeExtensions[t]) {
          selectedExtensions.push(...fileTypeExtensions[t]);
        }
      }
    }

    // Get folders
    let folders: any[] = [];
    if (type === 'both' || type === 'folders') {
      const folderWhere: any = { parentFolderId: folderId };
      
      if (search) {
        folderWhere.OR = [
          { name: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const folderSortBy = ['name', 'createdAt', 'updatedAt'].includes(sortBy) ? sortBy : 'createdAt';
      
      const rawFolders = await prisma.documentFolder.findMany({
        where: folderWhere,
        orderBy: { [folderSortBy]: sortOrder },
        include: {
          _count: { select: { children: true, files: true } }
        }
      });

      // Get file counts for folders
      const folderIds = rawFolders.map(f => f.id);
      const fileCounts = folderIds.length > 0 ? await prisma.documentFile.groupBy({
        by: ['folderId'],
        _count: true,
        where: { folderId: { in: folderIds } }
      }) : [];
      
      const fileCountMap = new Map(fileCounts.map(fc => [fc.folderId, fc._count]));

      folders = rawFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        createdBy: folder.createdBy,
        createdByEmail: folder.createdByEmail,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        itemType: 'folder',
        subfolderCount: folder._count.children,
        fileCount: fileCountMap.get(folder.id) || folder._count.files || 0
      }));
    }

    // Get files
    let files: any[] = [];
    if ((type === 'both' || type === 'files') && folderId) {
      const fileWhere: any = { folderId };
      
      // Search in file name and description
      if (search) {
        fileWhere.OR = [
          { originalFileName: { contains: search } },
          { description: { contains: search } }
        ];
      }

      // Filter by file extensions
      if (selectedExtensions && selectedExtensions.length > 0) {
        fileWhere.fileExtension = { in: selectedExtensions };
      } else if (fileTypes?.includes('other')) {
        // Other means extensions not in standard list
        const standardExtensions = Object.values(fileTypeExtensions).flat();
        fileWhere.NOT = { fileExtension: { in: standardExtensions } };
      }

      // Date filters
      if (dateFrom || dateTo) {
        fileWhere.uploadedAt = {};
        if (dateFrom) fileWhere.uploadedAt.gte = new Date(dateFrom);
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          fileWhere.uploadedAt.lte = endDate;
        }
      }

      // Size filters
      if (sizeMin !== undefined || sizeMax !== undefined) {
        fileWhere.fileSize = {};
        if (sizeMin !== undefined) fileWhere.fileSize.gte = sizeMin;
        if (sizeMax !== undefined) fileWhere.fileSize.lte = sizeMax;
      }

      // Filter by uploader
      if (uploadedBy) {
        fileWhere.uploadedByEmail = uploadedBy;
      }

      // Handle sortBy for files
      let fileSortBy: any = 'uploadedAt';
      if (sortBy === 'name') fileSortBy = 'originalFileName';
      else if (sortBy === 'modifiedAt' || sortBy === 'updatedAt') fileSortBy = 'modifiedAt';
      else if (sortBy === 'fileSize') fileSortBy = 'fileSize';
      else if (sortBy === 'createdAt') fileSortBy = 'uploadedAt';

      const rawFiles = await prisma.documentFile.findMany({
        where: fileWhere,
        orderBy: { [fileSortBy]: sortOrder }
      });

      files = rawFiles.map(file => ({
        id: file.id,
        folderId: file.folderId,
        originalFileName: file.originalFileName,
        fileExtension: file.fileExtension,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        iconType: getFileIcon(file.fileExtension),
        uploadedBy: file.uploadedBy,
        uploadedByEmail: file.uploadedByEmail,
        uploadedAt: file.uploadedAt,
        modifiedAt: file.modifiedAt,
        description: file.description,
        itemType: 'file'
      }));
    }

    // Combine and sort
    let items: any[];
    if (foldersFirst) {
      items = [...folders, ...files];
      // Sort folders and files separately
      folders.sort((a, b) => {
        const aVal = sortBy === 'name' ? a.name : (sortBy === 'updatedAt' ? a.updatedAt : a.createdAt);
        const bVal = sortBy === 'name' ? b.name : (sortBy === 'updatedAt' ? b.updatedAt : b.createdAt);
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
      files.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortBy === 'name') { aVal = a.originalFileName; bVal = b.originalFileName; }
        else if (sortBy === 'modifiedAt' || sortBy === 'updatedAt') { aVal = a.modifiedAt; bVal = b.modifiedAt; }
        else if (sortBy === 'fileSize') { aVal = a.fileSize; bVal = b.fileSize; }
        else { aVal = a.uploadedAt; bVal = b.uploadedAt; }
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
      items = [...folders, ...files];
    } else {
      items = [...folders, ...files];
      // Mixed sort
      items.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortBy === 'name') {
          aVal = a.name || a.originalFileName;
          bVal = b.name || b.originalFileName;
        } else if (sortBy === 'modifiedAt' || sortBy === 'updatedAt') {
          aVal = a.modifiedAt || a.updatedAt;
          bVal = b.modifiedAt || b.updatedAt;
        } else if (sortBy === 'fileSize') {
          aVal = a.fileSize || 0;
          bVal = b.fileSize || 0;
        } else {
          aVal = a.uploadedAt || a.createdAt;
          bVal = b.uploadedAt || b.createdAt;
        }
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }

    // Summary stats
    let summary = { totalFolders: folders.length, totalFiles: files.length };
    if (folderId === null) {
      // Root level - get total repository stats
      const [totalStats] = await Promise.all([
        prisma.documentFile.aggregate({ _count: true, _sum: { fileSize: true } })
      ]);
      summary = {
        totalFolders: folders.length,
        totalFiles: totalStats._count
      };
    }

    res.json({ items, summary });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/uploaders
 * Get list of unique uploaders for filter dropdown
 */
complianceRouter.get('/uploaders', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const files = await prisma.documentFile.findMany({
      select: { uploadedByEmail: true },
      distinct: ['uploadedByEmail'],
      where: { uploadedByEmail: { not: null } }
    });

    const uploaders = files
      .map(f => f.uploadedByEmail)
      .filter(Boolean)
      .sort();

    res.json({ uploaders });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/export
 * Export files/folders as ZIP
 * Query params:
 *   - type: 'selected' | 'folder' | 'all'
 *   - folderId: (required for 'folder' type)
 *   - itemIds: (required for 'selected' type) - comma-separated IDs
 */
complianceRouter.get('/export', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const exportType = (req.query.type as 'selected' | 'folder' | 'all') || 'all';
    const folderId = req.query.folderId as string | undefined;
    const itemIds = req.query.itemIds as string | undefined;

    if (exportType === 'folder' && !folderId) {
      throw new HttpError(400, 'Folder ID is required for folder export');
    }

    if (exportType === 'selected' && !itemIds) {
      throw new HttpError(400, 'Item IDs are required for selected export');
    }

    const archive = new ZipArchive({ zlib: { level: 9 } });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    
    // Handle stream errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Export failed: ' + err.message });
      }
    });

    // Handle warnings
    archive.on('warning', (err) => {
      console.warn('Archive warning:', err);
    });

    // Pipe archive to response
    archive.pipe(res);

    let itemsAdded = 0;

    // Helper to recursively add folder contents
    const addFolderContents = async (fid: string, folderPath: string): Promise<void> => {
      // Add files in this folder
      const files = await prisma.documentFile.findMany({
        where: { folderId: fid }
      });

      for (const file of files) {
        const filePath = path.join(process.cwd(), file.storagePath);
        try {
          // Check if file exists
          await fs.access(filePath);
          archive.file(filePath, { name: path.join(folderPath, file.originalFileName) });
          itemsAdded++;
        } catch {
          // File not found on disk, skip
          console.warn(`File not found: ${filePath}`);
        }
      }

      // Recursively add subfolders
      const subfolders = await prisma.documentFolder.findMany({
        where: { parentFolderId: fid }
      });

      for (const subfolder of subfolders) {
        await addFolderContents(subfolder.id, path.join(folderPath, subfolder.name));
      }
    };

    if (exportType === 'all') {
      // Export entire repository
      const rootFolders = await prisma.documentFolder.findMany({
        where: { parentFolderId: null }
      });

      if (rootFolders.length === 0) {
        throw new HttpError(404, 'No folders to export');
      }

      for (const folder of rootFolders) {
        await addFolderContents(folder.id, folder.name);
      }
    } else if (exportType === 'folder' && folderId) {
      // Export specific folder
      const folder = await prisma.documentFolder.findUnique({
        where: { id: folderId }
      });

      if (!folder) {
        throw new HttpError(404, 'Folder not found');
      }

      await addFolderContents(folderId, folder.name);
    } else if (exportType === 'selected' && itemIds) {
      const ids = itemIds.split(',');

      for (const id of ids) {
        // Check if it's a folder
        const folder = await prisma.documentFolder.findUnique({ where: { id } });
        if (folder) {
          await addFolderContents(folder.id, folder.name);
        } else {
          // It's a file
          const file = await prisma.documentFile.findUnique({ where: { id } });
          if (file) {
            const filePath = path.join(process.cwd(), file.storagePath);
            try {
              await fs.access(filePath);
              archive.file(filePath, { name: file.originalFileName });
              itemsAdded++;
            } catch {
              console.warn(`File not found: ${filePath}`);
            }
          }
        }
      }
    }

    // Check if anything was added
    if (itemsAdded === 0 && exportType === 'selected') {
      throw new HttpError(404, 'No files found in selection');
    }

    // Finalize the archive
    archive.finalize();

    // Log completion
    archive.on('finish', () => {
      console.log(`Export completed: ${itemsAdded} files added`);
    });
  } catch (error: any) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
});

/**
 * DELETE /api/compliance/items
 * Delete multiple items (files and folders)
 * Body: { itemIds: string[] }
 */
complianceRouter.delete('/items', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { itemIds } = req.body as { itemIds: string[] };

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      throw new HttpError(400, 'Item IDs are required');
    }

    const results = { deleted: { folders: 0, files: 0 }, errors: [] as string[] };

    // Helper to recursively delete folder and contents
    const deleteFolderRecursive = async (folderId: string): Promise<void> => {
      // Delete all files in this folder
      const files = await prisma.documentFile.findMany({
        where: { folderId },
        select: { id: true, storagePath: true }
      });

      for (const file of files) {
        try {
          await fs.unlink(path.join(process.cwd(), file.storagePath));
        } catch { /* ignore */ }
        await prisma.documentFile.delete({ where: { id: file.id } });
        results.deleted.files++;
      }

      // Get subfolders
      const subfolders = await prisma.documentFolder.findMany({
        where: { parentFolderId: folderId },
        select: { id: true }
      });

      // Recursively delete subfolders
      for (const subfolder of subfolders) {
        await deleteFolderRecursive(subfolder.id);
      }

      // Delete this folder
      await prisma.documentFolder.delete({ where: { id: folderId } });
      results.deleted.folders++;
    };

    for (const id of itemIds) {
      try {
        // Check if it's a folder
        const folder = await prisma.documentFolder.findUnique({ where: { id } });
        if (folder) {
          await deleteFolderRecursive(id);
        } else {
          // It's a file
          const file = await prisma.documentFile.findUnique({
            where: { id },
            select: { storagePath: true }
          });
          if (file) {
            try {
              await fs.unlink(path.join(process.cwd(), file.storagePath));
            } catch { /* ignore */ }
            await prisma.documentFile.delete({ where: { id } });
            results.deleted.files++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Failed to delete ${id}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      deleted: results.deleted,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/tags
 * Get all tags
 */
complianceRouter.get('/tags', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const tags = await prisma.documentTag.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/tags
 * Create a new tag
 * Body: { name: string, color?: string }
 */
complianceRouter.post('/tags', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, color } = req.body as { name: string; color?: string };

    if (!name || !name.trim()) {
      throw new HttpError(400, 'Tag name is required');
    }

    const tag = await prisma.documentTag.create({
      data: {
        name: name.trim(),
        color: color || '#5468ff'
      }
    });

    res.status(201).json({ tag });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/files/:id
 * Get file details with tags, versions, and activity
 */
complianceRouter.get('/files/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    const file = await prisma.documentFile.findUnique({
      where: { id },
      include: {
        folder: true,
        tags: {
          include: { tag: true }
        }
      }
    });

    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    // Get folder path for breadcrumbs
    const getFolderPath = async (folderId: string | null): Promise<{ id: string; name: string }[]> => {
      const path: { id: string; name: string }[] = [];
      let currentId = folderId;
      
      while (currentId) {
        const folder = await prisma.documentFolder.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, parentFolderId: true }
        });
        if (folder) {
          path.unshift({ id: folder.id, name: folder.name });
          currentId = folder.parentFolderId;
        } else {
          break;
        }
      }
      return path;
    };

    const folderPath = await getFolderPath(file.folderId);

    // Get activity for this file
    const activities = await prisma.documentActivity.findMany({
      where: { fileId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get all versions (files with same original name in same folder)
    const versions = await prisma.documentFile.findMany({
      where: {
        folderId: file.folderId,
        originalFileName: file.originalFileName
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        uploadedBy: true,
        uploadedByEmail: true,
        uploadedAt: true,
        fileSize: true,
        modifiedAt: true
      }
    });

    res.json({
      file: {
        id: file.id,
        folderId: file.folderId,
        originalFileName: file.originalFileName,
        fileExtension: file.fileExtension,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        iconType: getFileIcon(file.fileExtension),
        uploadedBy: file.uploadedBy,
        uploadedByEmail: file.uploadedByEmail,
        uploadedAt: file.uploadedAt,
        modifiedAt: file.modifiedAt,
        description: file.description,
        downloadCount: file.downloadCount,
        version: file.version,
        storagePath: file.storagePath,
        folder: file.folder,
        tags: file.tags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color }))
      },
      folderPath,
      versions,
      activities
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/compliance/files/:id
 * Update file description or tags
 * Body: { description?: string, tagIds?: string[] }
 */
complianceRouter.patch('/files/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const { description, tagIds, action } = req.body as { 
      description?: string; 
      tagIds?: string[];
      action?: string;
    };

    const file = await prisma.documentFile.findUnique({ where: { id } });
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    // Update description
    if (description !== undefined) {
      await prisma.documentFile.update({
        where: { id },
        data: { description }
      });

      // Log activity if description changed
      if (action === 'description_updated') {
        await prisma.documentActivity.create({
          data: {
            fileId: id,
            action: 'renamed',
            details: 'Description updated',
            performedBy: req.body.userName || 'Unknown',
            performedByEmail: req.body.userEmail || ''
          }
        });
      }
    }

    // Update tags
    if (tagIds !== undefined) {
      // Remove existing tags
      await prisma.documentFileTag.deleteMany({
        where: { fileId: id }
      });

      // Add new tags
      if (tagIds.length > 0) {
        await prisma.documentFileTag.createMany({
          data: tagIds.map(tagId => ({
            fileId: id,
            tagId
          }))
        });
      }
    }

    // Fetch updated file
    const updatedFile = await prisma.documentFile.findUnique({
      where: { id },
      include: {
        folder: true,
        tags: { include: { tag: true } }
      }
    });

    res.json({
      success: true,
      file: updatedFile ? {
        ...updatedFile,
        tags: updatedFile.tags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color }))
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/files/:id/download
 * Download file and increment counter
 */
complianceRouter.post('/files/:id/download', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;

    const file = await prisma.documentFile.findUnique({ where: { id } });
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    // Increment download count
    await prisma.documentFile.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    // Log activity
    await prisma.documentActivity.create({
      data: {
        fileId: id,
        action: 'downloaded',
        details: `Downloaded ${file.originalFileName}`,
        performedBy: req.body.userName || 'Unknown',
        performedByEmail: req.body.userEmail || ''
      }
    });

    res.json({ success: true, downloadCount: file.downloadCount + 1 });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/files/:id/replace
 * Replace file with new version
 */
complianceRouter.post('/files/:id/replace', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const userName = req.body.userName || 'Unknown';
    const userEmail = req.body.userEmail || '';

    const existingFile = await prisma.documentFile.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!existingFile) {
      throw new HttpError(404, 'File not found');
    }

    // Get current max version in this folder with same original filename
    const maxVersion = await prisma.documentFile.findFirst({
      where: {
        folderId: existingFile.folderId,
        originalFileName: existingFile.originalFileName
      },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const newVersion = (maxVersion?.version || existingFile.version) + 1;

    // Create new version with new storage
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(existingFile.originalFileName);
    const newStoragePath = path.join('uploads', 'compliance', `compliance-${uniqueSuffix}${ext}`);
    const fullPath = path.join(process.cwd(), newStoragePath);

    await ensureUploadDir();

    // The actual file upload should be handled by multer middleware before this endpoint
    // For now, we'll just create the version record

    const newFile = await prisma.documentFile.create({
      data: {
        folderId: existingFile.folderId,
        fileName: `compliance-${uniqueSuffix}${ext}`,
        originalFileName: existingFile.originalFileName,
        fileExtension: existingFile.fileExtension,
        mimeType: existingFile.mimeType,
        fileSize: req.body.fileSize || existingFile.fileSize,
        storagePath: newStoragePath,
        uploadedBy: userName,
        uploadedByEmail: userEmail,
        description: existingFile.description,
        version: newVersion
      }
    });

    // Copy tags to new version
    for (const tag of existingFile.tags) {
      await prisma.documentFileTag.create({
        data: {
          fileId: newFile.id,
          tagId: tag.tagId
        }
      });
    }

    // Log activity
    await prisma.documentActivity.create({
      data: {
        fileId: newFile.id,
        action: 'version_created',
        details: `Version ${newVersion} created`,
        performedBy: userName,
        performedByEmail: userEmail
      }
    });

    res.status(201).json({
      success: true,
      file: newFile,
      version: newVersion
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/files/:id/restore
 * Restore a specific version
 */
complianceRouter.post('/files/:id/restore', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { id } = req.params;
    const { targetVersionId } = req.body as { targetVersionId: string };
    const userName = req.body.userName || 'Unknown';
    const userEmail = req.body.userEmail || '';

    const sourceFile = await prisma.documentFile.findUnique({
      where: { id: targetVersionId },
      include: { tags: true }
    });

    if (!sourceFile) {
      throw new HttpError(404, 'Version not found');
    }

    // Get current file
    const currentFile = await prisma.documentFile.findUnique({ where: { id } });
    if (!currentFile) {
      throw new HttpError(404, 'File not found');
    }

    // Get max version
    const maxVersion = await prisma.documentFile.findFirst({
      where: {
        folderId: currentFile.folderId,
        originalFileName: currentFile.originalFileName
      },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const newVersion = (maxVersion?.version || currentFile.version) + 1;

    // Create new version from source
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(sourceFile.originalFileName);
    const newStoragePath = path.join('uploads', 'compliance', `compliance-${uniqueSuffix}${ext}`);

    // Copy the file
    const srcPath = path.join(process.cwd(), sourceFile.storagePath);
    const destPath = path.join(process.cwd(), newStoragePath);
    await fs.copyFile(srcPath, destPath);

    const newFile = await prisma.documentFile.create({
      data: {
        folderId: currentFile.folderId,
        fileName: `compliance-${uniqueSuffix}${ext}`,
        originalFileName: currentFile.originalFileName,
        fileExtension: sourceFile.fileExtension,
        mimeType: sourceFile.mimeType,
        fileSize: sourceFile.fileSize,
        storagePath: newStoragePath,
        uploadedBy: userName,
        uploadedByEmail: userEmail,
        description: currentFile.description,
        version: newVersion
      }
    });

    // Copy tags
    for (const tag of sourceFile.tags) {
      await prisma.documentFileTag.create({
        data: {
          fileId: newFile.id,
          tagId: tag.tagId
        }
      });
    }

    // Log activity
    await prisma.documentActivity.create({
      data: {
        fileId: newFile.id,
        action: 'version_created',
        details: `Restored to version ${sourceFile.version} as version ${newVersion}`,
        performedBy: userName,
        performedByEmail: userEmail
      }
    });

    res.status(201).json({
      success: true,
      file: newFile,
      version: newVersion
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/activity
 * Get recent activity
 * Query params: folderId (optional), limit (default 10)
 */
complianceRouter.get('/activity', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const folderId = req.query.folderId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    const where: any = {};
    if (folderId) {
      where.folderId = folderId;
    }

    const activities = await prisma.documentActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50)
    });

    const total = await prisma.documentActivity.count({ where });

    res.json({ activities, total });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/summary
 * Get repository summary with activity stats
 */
complianceRouter.get('/summary', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const folderId = req.query.folderId as string | null || null;

    // Get counts
    const [folderCount, fileStats, recentActivity, recentModified] = await Promise.all([
      folderId 
        ? prisma.documentFolder.count({ where: { parentFolderId: folderId } })
        : prisma.documentFolder.count({ where: { parentFolderId: null } }),
      folderId
        ? prisma.documentFile.aggregate({ where: { folderId }, _count: true, _sum: { fileSize: true } })
        : prisma.documentFile.aggregate({ _count: true, _sum: { fileSize: true } }),
      prisma.documentActivity.count(),
      prisma.documentActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, createdAt: true }
      })
    ]);

    res.json({
      totalFolders: folderCount,
      totalFiles: fileStats._count,
      storageUsed: fileStats._sum.fileSize || 0,
      recentActivityCount: recentActivity,
      recentModified
    });
  } catch (error) {
    next(error);
  }
});
