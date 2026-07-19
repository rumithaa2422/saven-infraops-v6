import { prisma } from '../common/prisma.js';

export const PROJECT_ACTIVITY_TYPES = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  PROJECT_PRIORITY_CHANGED: 'PROJECT_PRIORITY_CHANGED',
  PROJECT_MANAGER_CHANGED: 'PROJECT_MANAGER_CHANGED',
  TEAM_MEMBER_ADDED: 'TEAM_MEMBER_ADDED',
  TEAM_MEMBER_REMOVED: 'TEAM_MEMBER_REMOVED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED: 'DOCUMENT_DELETED'
} as const;

export type ProjectActivityType = typeof PROJECT_ACTIVITY_TYPES[keyof typeof PROJECT_ACTIVITY_TYPES];

export interface CreateActivityParams {
  projectId: string;
  activityType: ProjectActivityType;
  title: string;
  description?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}

export class ProjectActivityService {
  static async create(params: CreateActivityParams) {
    return prisma.projectActivity.create({
      data: {
        projectId: params.projectId,
        activityType: params.activityType,
        title: params.title,
        description: params.description,
        performedBy: params.performedBy,
        performedAt: new Date(),
        metadata: params.metadata || undefined
      }
    });
  }

  static async list(
    projectId: string,
    options: {
      search?: string;
      filter?: 'today' | 'this_week' | 'this_month' | 'all';
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ) {
    const { search, filter = 'all', sortBy = 'performedAt', sortOrder = 'desc' } = options;

    // Calculate date ranges
    const now = new Date();
    let startDate: Date | undefined;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = undefined;
        break;
    }

    // Build where clause
    const where: any = { projectId };

    if (startDate) {
      where.performedAt = { gte: startDate };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { activityType: { contains: search } },
        { performedBy: { contains: search } }
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'title') {
      orderBy.title = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'activityType') {
      orderBy.activityType = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'performedBy') {
      orderBy.performedBy = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.performedAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const activities = await prisma.projectActivity.findMany({
      where,
      orderBy,
      select: {
        id: true,
        projectId: true,
        activityType: true,
        title: true,
        description: true,
        performedBy: true,
        performedAt: true,
        metadata: true
      }
    });

    return { items: activities };
  }
}
