import { prisma } from '../common/prisma.js';

export interface CreateKnowledgeBaseArticleInput {
  title: string;
  category: string;
  body?: string;
  authorName?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createKnowledgeBaseArticle(data: CreateKnowledgeBaseArticleInput) {
  const item = await prisma.knowledgeBaseArticle.create({
    data: {
      title: data.title,
      category: data.category,
      body: data.body || '',
      authorName: data.authorName || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'KnowledgeBaseArticle',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateKnowledgeBaseArticle(
  id: string,
  data: Partial<CreateKnowledgeBaseArticleInput>
) {
  const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Knowledge base article not found');
  }

  const item = await prisma.knowledgeBaseArticle.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      body: data.body,
      authorName: data.authorName !== undefined ? (data.authorName || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'KnowledgeBaseArticle',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
