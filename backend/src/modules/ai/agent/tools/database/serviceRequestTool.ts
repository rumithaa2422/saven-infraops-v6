/**
 * Service Request Tool
 * 
 * Provides query capabilities for Service Requests (Tickets).
 * Implements the Tool interface for database operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Service Requests
 */
export const serviceRequestTool: Tool = {
  name: 'query_tickets',
  description: 'Query service requests and tickets. Use when user asks about tickets, service requests, or request status. Returns count and list of tickets matching criteria.',
  category: 'database',
  requiredPermissions: ['tickets:view'],
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'array',
        description: 'Filter by status. Options: OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_USER, WAITING_FOR_VENDOR, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED',
        items: { type: 'string' }
      },
      priority: {
        type: 'array',
        description: 'Filter by priority. Options: LOW, MEDIUM, HIGH, CRITICAL',
        items: { type: 'string' }
      },
      category: {
        type: 'string',
        description: 'Filter by category (partial match)'
      },
      requesterId: {
        type: 'string',
        description: 'Filter by requester user ID'
      },
      assigneeId: {
        type: 'string',
        description: 'Filter by assignee user ID'
      },
      assigneeName: {
        type: 'string',
        description: 'Filter by assignee name (partial match)'
      },
      projectName: {
        type: 'string',
        description: 'Filter by project name'
      },
      includeBreached: {
        type: 'boolean',
        description: 'Include SLA breach information in response',
        default: false
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
        maximum: 100
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip',
        default: 0
      },
      orderBy: {
        type: 'string',
        description: 'Sort order. Options: createdAt, updatedAt, priority, dueAt',
        default: 'createdAt'
      },
      orderDirection: {
        type: 'string',
        description: 'Sort direction. Options: asc, desc',
        default: 'desc'
      }
    },
    required: []
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    const startTime = Date.now();
    
    try {
      const { prisma } = context;
      
      // Build where clause
      const where: Record<string, unknown> = {};
      
      if (params.status && Array.isArray(params.status) && params.status.length > 0) {
        where.status = { in: params.status };
      }
      
      if (params.priority && Array.isArray(params.priority) && params.priority.length > 0) {
        where.priority = { in: params.priority };
      }
      
      if (params.category && typeof params.category === 'string') {
        where.category = { contains: params.category };
      }
      
      if (params.requesterId) {
        where.requesterId = params.requesterId;
      }
      
      if (params.assigneeId) {
        where.assigneeId = params.assigneeId;
      }
      
      if (params.assigneeName && typeof params.assigneeName === 'string') {
        where.assigneeName = { contains: params.assigneeName };
      }
      
      if (params.projectName) {
        where.projectName = { contains: params.projectName as string };
      }
      
      // Build orderBy
      const orderByField = (params.orderBy as string) || 'createdAt';
      const orderDirection = (params.orderDirection as 'desc' | 'asc') || 'desc';
      const orderBy = { [orderByField]: orderDirection };
      
      // Pagination
      const limit = Math.min(Number(params.limit) || 10, 100);
      const offset = Number(params.offset) || 0;
      
      // Execute queries in parallel
      const [records, totalCount] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: where as any,
          orderBy,
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.serviceRequest.count({ where: where as any })
      ]);
      
      // Calculate SLA breaches if requested
      let breachedCount = 0;
      if (params.includeBreached === true) {
        breachedCount = await prisma.serviceRequest.count({
          where: {
            ...where,
            dueAt: { lt: new Date() },
            status: { notIn: ['CLOSED', 'RESOLVED'] }
          }
        });
      }
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.ticketNo,
        value: item.priority,
        description: item.title,
        href: '/service-requests'
      }));
      
      // Build summary message
      let answer = `Found ${totalCount} service request${totalCount !== 1 ? 's' : ''}`;
      if (totalCount > limit) {
        answer += ` (showing ${records.length})`;
      }
      if (params.includeBreached === true && breachedCount > 0) {
        answer += `. ${breachedCount} have breached SLA.`;
      }
      
      return {
        success: true,
        data: records,
        count: totalCount,
        records: records as unknown as Record<string, unknown>[],
        cards,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_tickets'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query service requests',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_tickets'
        }
      };
    }
  }
};
