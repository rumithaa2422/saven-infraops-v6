/**
 * Knowledge Article Routes
 * 
 * Handles CRUD operations for knowledge base articles.
 * Provides endpoints for listing, creating, updating, and deleting articles.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import { logger } from '../../common/logger.js';
import { prisma } from '../../common/prisma.js';

export const knowledgeArticleRouter = Router();

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

// Helper to check if user is admin
function isUserAdmin(user: any): boolean {
  if (!user) return false;
  const roles = user.roles || [];
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
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
    const status = getStringParam(req.query.status as string | string[]);
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
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // For regular users, only show published articles
    // Admins and Super Admins see all articles (DRAFT, PUBLISHED, ARCHIVED)
    const user = req.user;
    const isAdmin = isUserAdmin(user);
    if (!isAdmin && !status) {
      // Regular users without status filter only see published
      where.status = 'PUBLISHED';
    }
    // If regular user specifies a status filter, only PUBLISHED is allowed
    if (!isAdmin && status && status !== 'PUBLISHED') {
      where.status = 'PUBLISHED'; // Force to published
    }

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { body: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'status', 'viewCount', 'authorName'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy: any = {};
    orderBy[orderByField] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get total count
    const total = await prisma.knowledgeBaseArticle.count({ where });

    // Get articles with category info
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        categoryInfo: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform to include category name
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      categoryName: article.categoryInfo?.name || article.category,
      tags: article.tags ? JSON.parse(article.tags) : []
    }));

    logger.info({
      action: 'LIST_ARTICLES',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      count: articles.length,
      filters: { categoryId, status, search },
      isAdmin
    }, 'Listed knowledge articles');

    res.json({
      articles: transformedArticles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      isAdmin
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

    // Admins see all stats, regular users only see published
    const user = req.user;
    const isAdmin = isUserAdmin(user);

    let total, published, draft, archived;

    if (isAdmin) {
      [total, published, draft, archived] = await Promise.all([
        prisma.knowledgeBaseArticle.count({ where }),
        prisma.knowledgeBaseArticle.count({ where: { ...where, status: 'PUBLISHED' } }),
        prisma.knowledgeBaseArticle.count({ where: { ...where, status: 'DRAFT' } }),
        prisma.knowledgeBaseArticle.count({ where: { ...where, status: 'ARCHIVED' } })
      ]);
    } else {
      // Regular users only see published
      published = await prisma.knowledgeBaseArticle.count({ where: { ...where, status: 'PUBLISHED' } });
      total = published;
      draft = 0;
      archived = 0;
    }

    res.json({
      total,
      published,
      draft,
      archived,
      isAdmin
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
        }
      }
    });

    if (!article) {
      throw new HttpError(404, 'Article not found');
    }

    // Check if user can view non-published articles
    const user = req.user;
    const admin = isUserAdmin(user);
    if (!admin && article.status !== 'PUBLISHED') {
      throw new HttpError(403, 'You do not have permission to view this article');
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
