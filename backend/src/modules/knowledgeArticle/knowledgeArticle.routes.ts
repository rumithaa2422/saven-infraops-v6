/**
 * Knowledge Article Routes
 * 
 * Handles CRUD operations for knowledge base articles.
 * Provides endpoints for listing, creating, updating, and deleting articles.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import { logger } from '../../common/logger.js';
import { prisma } from '../../common/prisma.js';
import { env } from '../../config/env.js';
import { promises as fs } from 'fs';

export const knowledgeArticleRouter = Router();

// ============================================================
// Multer configuration for KB attachments
// ============================================================

const KB_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'knowledge-base');

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.zip', '.png', '.jpg', '.jpeg'
]);

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'image/png',
  'image/jpeg'
]);

// Ensure upload directory exists
async function ensureKbuploadDir(): Promise<void> {
  try {
    await fs.access(KB_UPLOAD_DIR);
  } catch {
    await fs.mkdir(KB_UPLOAD_DIR, { recursive: true });
  }
}

// Get file path for attachment
function getAttachmentFilePath(storedFileName: string): string {
  return path.join(KB_UPLOAD_DIR, storedFileName);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureKbuploadDir();
    cb(null, KB_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `kb-attachment-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
  }
};

// Multer upload configuration
const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: env.KB_MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter
});

// Helper to extract IP address from request
function getClientIp(req: Request): string | null | undefined {
  const ip = req.ip;
  if (Array.isArray(ip)) {
    return ip[0] || null;
  }
  return ip || null;
}

// Helper to get string from query param (handles string | string[])
function getStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

// ============================================================
// GET /api/knowledge/articles
// List all articles with filtering and pagination
// ============================================================
knowledgeArticleRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([
        'knowledge.article:view',
        'kb:view',
        'kb:manage',
        'knowledge.article:create',
        'knowledge.article:update',
        'knowledge.article:delete'
      ])(req, res, (err) => err ? reject(err) : resolve())
    );

    const categoryId = getStringParam(req.query.categoryId as string | string[]);
    const search = getStringParam(req.query.search as string | string[]);
    const page = getStringParam(req.query.page as string | string[]) || '1';
    const limit = getStringParam(req.query.limit as string | string[]) || '50';
    const sortBy = getStringParam(req.query.sortBy as string | string[]) || 'createdAt';
    const sortOrder = getStringParam(req.query.sortOrder as string | string[]) || 'desc';

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    // Filter by category if specified
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Search filter - searches title, summary, body, tags, and category name
    if (search) {
      const searchTerm = search.toLowerCase();
      where.OR = [
        { title: { contains: searchTerm } },
        { summary: { contains: searchTerm } },
        { body: { contains: searchTerm } },
        { tags: { contains: searchTerm } },
        { categoryInfo: { name: { contains: searchTerm } } }
      ];
    }

    // Build orderBy
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'viewCount', 'authorName'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy: any = {};
    orderBy[orderByField] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get total count
    const total = await prisma.knowledgeBaseArticle.count({ where });

    // Get articles with category info and attachment count
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        categoryInfo: {
          select: { id: true, name: true }
        },
        _count: {
          select: { attachments: true }
        }
      }
    });

    // Transform to include category name and attachment count
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      categoryName: article.categoryInfo?.name || article.category,
      tags: article.tags ? JSON.parse(article.tags) : [],
      attachmentCount: article._count?.attachments || 0
    }));

    logger.info({
      action: 'LIST_ARTICLES',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      count: articles.length,
      filters: { categoryId, search }
    }, 'Listed knowledge articles');

    res.json({
      articles: transformedArticles,
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
// GET /api/knowledge/articles/stats
// Get article statistics
// ============================================================
knowledgeArticleRouter.get('/stats', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([
        'knowledge.article:view',
        'kb:view',
        'kb:manage'
      ])(req, res, (err) => err ? reject(err) : resolve())
    );

    const categoryId = getStringParam(req.query.categoryId as string | string[]);

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const total = await prisma.knowledgeBaseArticle.count({ where });

    res.json({
      total
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/knowledge/articles/:id
// Get a single article by ID
// ============================================================
knowledgeArticleRouter.get('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr([
        'knowledge.article:view',
        'kb:view',
        'kb:manage'
      ])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = getStringParam(req.params.id) as string;
    
    const article: any = await prisma.knowledgeBaseArticle.findUnique({
      where: { id },
      include: {
        categoryInfo: {
          select: { id: true, name: true }
        },
        attachments: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            fileSize: true,
            uploadedBy: true,
            uploadedAt: true
          },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!article) {
      throw new HttpError(404, 'Article not found');
    }

    // Increment view count
    await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    });

    logger.info({
      action: 'VIEW_ARTICLE',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      articleId: id
    }, 'Viewed knowledge article');

    res.json({
      ...article,
      categoryName: article.categoryInfo?.name || article.category,
      tags: article.tags ? JSON.parse(article.tags) : []
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/knowledge/articles
// Create a new article
// ============================================================
knowledgeArticleRouter.post('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.article:create', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { title, categoryId, category, summary, body, tags, status = 'DRAFT' } = req.body;

    // Validation
    if (!title?.trim()) {
      throw new HttpError(400, 'Title is required');
    }
    if (!categoryId && !category?.trim()) {
      throw new HttpError(400, 'Category is required');
    }

    const clientIp = getClientIp(req);

    // Get category name if categoryId is provided
    let categoryName = category;
    if (categoryId) {
      const cat = await prisma.knowledgeCategory.findUnique({ where: { id: categoryId } });
      if (cat) {
        categoryName = cat.name;
      }
    }

    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title: title.trim(),
        categoryId: categoryId || null,
        category: categoryName || '',
        summary: summary?.trim() || null,
        body: body || '',
        tags: tags?.length ? JSON.stringify(tags) : null,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorName: req.user?.name || req.user?.email || null
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'CREATE',
        entityType: 'KnowledgeBaseArticle',
        entityId: article.id,
        newValue: article as any,
        ipAddress: clientIp
      }
    });

    logger.info({
      action: 'CREATE_ARTICLE',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      articleId: article.id,
      title: article.title
    }, 'Created knowledge article');

    res.status(201).json({
      ...article,
      categoryName,
      tags: tags || []
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUT /api/knowledge/articles/:id
// Update an existing article
// ============================================================
knowledgeArticleRouter.put('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.article:update', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = getStringParam(req.params.id) as string;
    const { title, categoryId, category, summary, body, tags, status } = req.body;

    // Check if article exists
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'Article not found');
    }

    // Validate
    if (title !== undefined && !title?.trim()) {
      throw new HttpError(400, 'Title cannot be blank');
    }

    // Get category name if categoryId is provided
    let categoryName = category;
    if (categoryId && categoryId !== existing.categoryId) {
      const cat = await prisma.knowledgeCategory.findUnique({ where: { id: categoryId } });
      if (cat) {
        categoryName = cat.name;
      }
    } else if (!categoryName) {
      categoryName = existing.category;
    }

    const clientIp = getClientIp(req);

    // Determine if publishing
    const isPublishing = status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    const isUnpublishing = status && status !== 'PUBLISHED' && existing.status === 'PUBLISHED';

    const article = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        title: title?.trim() || undefined,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        category: categoryName || undefined,
        summary: summary !== undefined ? (summary?.trim() || null) : undefined,
        body: body !== undefined ? body : undefined,
        tags: tags !== undefined ? (tags?.length ? JSON.stringify(tags) : null) : undefined,
        status: status || undefined,
        publishedAt: isPublishing ? new Date() : (isUnpublishing ? null : undefined),
        updatedBy: req.user?.id || null,
        updatedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'UPDATE',
        entityType: 'KnowledgeBaseArticle',
        entityId: article.id,
        oldValue: existing as any,
        newValue: article as any,
        ipAddress: clientIp
      }
    });

    logger.info({
      action: 'UPDATE_ARTICLE',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      articleId: id,
      updatedFields: Object.keys(req.body).filter(k => req.body[k] !== undefined)
    }, 'Updated knowledge article');

    res.json({
      ...article,
      categoryName,
      tags: tags || (article.tags ? JSON.parse(article.tags) : [])
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE /api/knowledge/articles/:id
// Delete an article
// ============================================================
knowledgeArticleRouter.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.article:delete', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = getStringParam(req.params.id) as string;

    // Check if article exists
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'Article not found');
    }

    const clientIp = getClientIp(req);

    await prisma.knowledgeBaseArticle.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        action: 'DELETE',
        entityType: 'KnowledgeBaseArticle',
        entityId: id,
        oldValue: existing as any,
        ipAddress: clientIp
      }
    });

    logger.info({
      action: 'DELETE_ARTICLE',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      articleId: id
    }, 'Deleted knowledge article');

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ATTACHMENT ENDPOINTS
// ============================================================

// IMPORTANT: More specific routes must come first to avoid conflicts

// ============================================================
// GET /api/knowledge/attachments/:attachmentId/download
// Download an attachment
// ============================================================
knowledgeArticleRouter.get('/attachments/:attachmentId/download', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const attachmentId = getStringParam(req.params.attachmentId) as string;

    const attachment = await prisma.knowledgeBaseAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      throw new HttpError(404, 'Attachment not found');
    }

    const filePath = getAttachmentFilePath(attachment.storedFileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'File not found on server');
    }

    logger.info({
      action: 'DOWNLOAD_ATTACHMENT',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      attachmentId,
      fileName: attachment.originalFileName
    }, 'Downloaded attachment');

    // Set headers for download
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalFileName)}"`);
    res.setHeader('Content-Length', attachment.fileSize);

    // Stream the file
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE /api/knowledge/attachments/:attachmentId
// Delete an attachment (Admin/Super Admin only)
// ============================================================
knowledgeArticleRouter.delete('/attachments/:attachmentId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    // Check permission - Admin or Super Admin only
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['kb:manage', 'admin:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const attachmentId = getStringParam(req.params.attachmentId) as string;

    const attachment = await prisma.knowledgeBaseAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      throw new HttpError(404, 'Attachment not found');
    }

    // Delete file from disk
    const filePath = getAttachmentFilePath(attachment.storedFileName);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might already be deleted, continue with DB deletion
      logger.warn({ filePath }, 'Attachment file not found on disk');
    }

    // Delete database record
    await prisma.knowledgeBaseAttachment.delete({
      where: { id: attachmentId }
    });

    logger.info({
      action: 'DELETE_ATTACHMENT',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      attachmentId,
      fileName: attachment.originalFileName
    }, 'Deleted attachment');

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/knowledge/articles/:articleId/attachments
// List all attachments for an article
// ============================================================
knowledgeArticleRouter.get('/:articleId/attachments', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const articleId = getStringParam(req.params.articleId) as string;

    // Verify article exists
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      select: { id: true, title: true }
    });

    if (!article) {
      throw new HttpError(404, 'Article not found');
    }

    // Get attachments
    const attachments = await prisma.knowledgeBaseAttachment.findMany({
      where: { articleId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        fileSize: true,
        uploadedBy: true,
        uploadedAt: true
      }
    });

    res.json({
      articleId,
      articleTitle: article.title,
      attachments,
      count: attachments.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/knowledge/articles/:articleId/attachments
// Upload attachment(s) to an article
// ============================================================
knowledgeArticleRouter.post('/:articleId/attachments', requireAuth, async (req: Request, res: Response, next) => {
  try {
    // Check permission
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['knowledge.article:create', 'knowledge.article:update', 'kb:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const articleId = getStringParam(req.params.articleId) as string;

    // Verify article exists
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      select: { id: true, title: true }
    });

    if (!article) {
      throw new HttpError(404, 'Article not found');
    }

    // Handle file upload
    uploadAttachment.array('files', 10)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new HttpError(400, `File too large. Maximum size is ${env.KB_MAX_FILE_SIZE_MB}MB`));
          }
          return next(new HttpError(400, err.message));
        }
        return next(new HttpError(400, err.message));
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return next(new HttpError(400, 'No files provided'));
      }

      // Create attachment records
      const attachments = await Promise.all(
        files.map(async (file) => {
          return prisma.knowledgeBaseAttachment.create({
            data: {
              articleId,
              originalFileName: file.originalname,
              storedFileName: file.filename,
              mimeType: file.mimetype,
              fileSize: file.size,
              uploadedBy: req.user?.email || null
            }
          });
        })
      );

      logger.info({
        action: 'UPLOAD_ATTACHMENT',
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        articleId,
        fileCount: attachments.length
      }, `Uploaded ${attachments.length} attachment(s) to article`);

      res.status(201).json({
        message: `${attachments.length} file(s) uploaded successfully`,
        attachments: attachments.map(a => ({
          id: a.id,
          originalFileName: a.originalFileName,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
          uploadedBy: a.uploadedBy,
          uploadedAt: a.uploadedAt
        }))
      });
    });
  } catch (error) {
    next(error);
  }
});
