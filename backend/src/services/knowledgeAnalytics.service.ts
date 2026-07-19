import { prisma } from '../common/prisma.js';

export interface KbSummary {
  totalCategories: number;
  totalArticles: number;
  totalAttachments: number;
  totalViews: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number;
}

export interface CategoryArticleCount {
  categoryId: string;
  categoryName: string;
  articleCount: number;
}

export interface MonthlyArticleGrowth {
  month: string;
  created: number;
  published: number;
}

export interface TopArticle {
  id: string;
  title: string;
  viewCount: number;
  categoryName: string;
}

export interface TopAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  downloadCount: number;
  articleTitle: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy: string | null;
  performedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface KbAnalytics {
  summary: KbSummary;
  articlesByCategory: CategoryArticleCount[];
  articleGrowth: MonthlyArticleGrowth[];
  topViewedArticles: TopArticle[];
  recentArticles: TopArticle[];
  recentActivity: ActivityItem[];
}

function getMonthLabel(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getMonthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

export async function getKbAnalytics(): Promise<KbAnalytics> {
  const now = new Date();

  // Get summary statistics using aggregation
  const [categoryCount, articleStats, attachmentCount] = await Promise.all([
    prisma.knowledgeCategory.count({
      where: { isActive: true }
    }),
    prisma.knowledgeBaseArticle.aggregate({
      _count: { id: true },
      _sum: { viewCount: true },
    }),
    prisma.knowledgeBaseAttachment.count()
  ]);

  const totalArticles = articleStats._count.id;
  const totalViews = articleStats._sum.viewCount || 0;

  // Get article counts by status
  const statusCounts = await prisma.knowledgeBaseArticle.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const statusMap: Record<string, number> = statusCounts.reduce((acc: Record<string, number>, item: { status: string; _count: { id: number } }) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Get articles per category with aggregation
  const articlesByCategory = await prisma.knowledgeBaseArticle.groupBy({
    by: ['categoryId'],
    _count: { id: true },
    where: {
      categoryId: { not: null },
    },
  });

  // Get category names
  const categoryIds = articlesByCategory.map((a) => a.categoryId).filter((id): id is string => id !== null);
  const categories = await prisma.knowledgeCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true }
  });
  const categoryMap: Record<string, string> = categories.reduce((acc: Record<string, string>, cat: { id: string; name: string }) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  const articlesByCategoryResult: CategoryArticleCount[] = articlesByCategory
    .filter((a) => a.categoryId !== null)
    .map((a) => ({
      categoryId: a.categoryId as string,
      categoryName: categoryMap[a.categoryId as string] || 'Uncategorized',
      articleCount: a._count.id,
    }))
    .sort((a, b) => b.articleCount - a.articleCount);

  // Get monthly article growth for last 12 months
  const monthlyGrowth: MonthlyArticleGrowth[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = getMonthsAgo(i);
    const monthStart = getStartOfMonth(monthDate);
    const monthEnd = getEndOfMonth(monthDate);
    const monthLabel = getMonthLabel(monthDate);

    const [createdCount, publishedCount] = await Promise.all([
      prisma.knowledgeBaseArticle.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.knowledgeBaseArticle.count({
        where: {
          publishedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

    monthlyGrowth.push({
      month: monthLabel,
      created: createdCount,
      published: publishedCount,
    });
  }

  // Get top viewed articles
  const topViewedArticles = await prisma.knowledgeBaseArticle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { viewCount: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      viewCount: true,
      category: true,
    },
  });

  const topViewedResult: TopArticle[] = topViewedArticles.map((a: { id: string; title: string; viewCount: number; category: string }) => ({
    id: a.id,
    title: a.title,
    viewCount: a.viewCount,
    categoryName: a.category,
  }));

  // Get recent articles
  const recentArticlesData = await prisma.knowledgeBaseArticle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      viewCount: true,
      category: true,
    },
  });

  const recentResult: TopArticle[] = recentArticlesData.map((a: { id: string; title: string; viewCount: number; category: string }) => ({
    id: a.id,
    title: a.title,
    viewCount: a.viewCount,
    categoryName: a.category,
  }));

  // Get recent activity (articles and attachments)
  const [recentArticleActivity, recentAttachments] = await Promise.all([
    prisma.knowledgeBaseArticle.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.knowledgeBaseAttachment.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        originalFileName: true,
        uploadedAt: true,
        articleId: true,
      },
    }),
  ]);

  // Build activity timeline
  const activityItems: ActivityItem[] = [];

  // Add article activity
  for (const article of recentArticleActivity) {
    const isNew = Math.abs(article.createdAt.getTime() - article.updatedAt.getTime()) < 60000;
    const newActivity: ActivityItem = {
      id: `${article.id}-created`,
      action: isNew ? 'CREATED' : 'UPDATED',
      entityType: 'ARTICLE',
      entityId: article.id,
      entityName: article.title,
      performedBy: null,
      performedAt: isNew ? article.createdAt : article.updatedAt,
    };
    activityItems.push(newActivity);
  }

  // Add attachment activity
  for (const attachment of recentAttachments) {
    const newActivity: ActivityItem = {
      id: `${attachment.id}-attachment`,
      action: 'UPLOADED',
      entityType: 'ATTACHMENT',
      entityId: attachment.id,
      entityName: attachment.originalFileName,
      performedBy: null,
      performedAt: attachment.uploadedAt,
      metadata: { articleId: attachment.articleId },
    };
    activityItems.push(newActivity);
  }

  // Sort by date and take most recent 20
  const recentActivity = activityItems
    .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
    .slice(0, 20);

  return {
    summary: {
      totalCategories: categoryCount,
      totalArticles,
      totalAttachments: attachmentCount,
      totalViews,
      publishedArticles: statusMap['PUBLISHED'] || 0,
      draftArticles: statusMap['DRAFT'] || 0,
      archivedArticles: statusMap['ARCHIVED'] || 0,
    },
    articlesByCategory: articlesByCategoryResult,
    articleGrowth: monthlyGrowth,
    topViewedArticles: topViewedResult,
    recentArticles: recentResult,
    recentActivity,
  };
}

export async function getAttachmentStats(): Promise<{ total: number; byType: Record<string, number> }> {
  const attachments = await prisma.knowledgeBaseAttachment.findMany({
    select: { mimeType: true }
  });

  const byType: Record<string, number> = {};
  for (const attachment of attachments) {
    const type = attachment.mimeType.split('/')[0] || 'other';
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    total: attachments.length,
    byType,
  };
}
