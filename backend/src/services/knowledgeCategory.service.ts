import { prisma } from '../common/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export interface CategoryWithArticleCount {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  articleCount: number;
}

/**
 * List all active knowledge categories sorted by displayOrder then name
 */
export async function listCategories(): Promise<CategoryWithArticleCount[]> {
  const categories = await prisma.knowledgeCategory.findMany({
    where: { isActive: true },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ],
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  return categories.map(category => ({
    ...category,
    articleCount: category._count.articles
  }));
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<CategoryWithArticleCount | null> {
  const category = await prisma.knowledgeCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  if (!category) {
    return null;
  }

  return {
    ...category,
    articleCount: category._count.articles
  };
}

/**
 * Create a new knowledge category
 */
export async function createCategory(data: CreateCategoryInput): Promise<CategoryWithArticleCount> {
  const category = await prisma.knowledgeCategory.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color || '#5468ff',
      icon: data.icon?.trim() || null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      createdBy: data.actorEmail || null,
      updatedBy: data.actorEmail || null
    },
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'KnowledgeCategory',
      entityId: category.id,
      newValue: category as any,
      ipAddress: data.ipAddress || null
    }
  });

  return {
    ...category,
    articleCount: category._count.articles
  };
}

/**
 * Update an existing knowledge category
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryInput
): Promise<CategoryWithArticleCount> {
  const existing = await prisma.knowledgeCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Category not found');
  }

  const updateData: Prisma.KnowledgeCategoryUpdateInput = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }
  if (data.color !== undefined) {
    updateData.color = data.color || '#5468ff';
  }
  if (data.icon !== undefined) {
    updateData.icon = data.icon?.trim() || null;
  }
  if (data.displayOrder !== undefined) {
    updateData.displayOrder = data.displayOrder;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  updateData.updatedBy = data.actorEmail || null;

  const category = await prisma.knowledgeCategory.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'KnowledgeCategory',
      entityId: category.id,
      oldValue: existing as any,
      newValue: category as any,
      ipAddress: data.ipAddress || null
    }
  });

  return {
    ...category,
    articleCount: category._count.articles
  };
}

/**
 * Delete a knowledge category
 * Returns article count if deletion is blocked due to existing articles
 */
export async function deleteCategory(
  id: string,
  actorId?: string | null,
  actorEmail?: string | null,
  ipAddress?: string | null
): Promise<{ deleted: boolean; articleCount?: number }> {
  const category = await prisma.knowledgeCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category._count.articles > 0) {
    return {
      deleted: false,
      articleCount: category._count.articles
    };
  }

  // Audit log before deletion
  await prisma.auditLog.create({
    data: {
      actorId: actorId || null,
      actorEmail: actorEmail || null,
      action: 'DELETE',
      entityType: 'KnowledgeCategory',
      entityId: id,
      oldValue: category as any,
      ipAddress: ipAddress || null
    }
  });

  await prisma.knowledgeCategory.delete({ where: { id } });

  return { deleted: true };
}

/**
 * Check if a category name already exists (excluding specific ID for updates)
 */
export async function categoryNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  if (excludeId) {
    const existing = await prisma.knowledgeCategory.findFirst({
      where: {
        name: name.trim(),
        id: { not: excludeId }
      }
    });
    return existing !== null;
  }

  try {
    const existing = await prisma.knowledgeCategory.findUnique({ where: { name: name.trim() } });
    return existing !== null;
  } catch {
    return false;
  }
}
