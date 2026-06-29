/**
 * User Tool
 * 
 * Provides query capabilities for Users.
 * Implements the Tool interface for database operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Users
 */
export const userTool: Tool = {
  name: 'query_users',
  description: 'Query user accounts and personnel. Use when user asks about users, employees, team members, or user status. Returns count and list of users matching criteria.',
  category: 'database',
  requiredPermissions: ['users:view'],
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'array',
        description: 'Filter by user status. Options: PENDING_ACTIVATION, ACTIVE, DISABLED, LOCKED',
        items: { type: 'string' }
      },
      department: {
        type: 'string',
        description: 'Filter by department name (partial match)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
        maximum: 100
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip for pagination',
        default: 0
      },
      orderBy: {
        type: 'string',
        description: 'Field to order by. Options: name, email, department, createdAt',
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
      
      // Build where clause from parameters
      const where: Record<string, unknown> = {};
      
      if (params.status) {
        where.status = { in: params.status as string[] };
      }
      
      if (params.department) {
        where.department = { contains: params.department as string };
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
        prisma.user.findMany({
          where: where as any,
          orderBy,
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.user.count({ where: where as any })
      ]);
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.name,
        value: item.email,
        description: `${item.department || 'No department'} | ${item.status}`,
      }));
      
      return {
        success: true,
        data: records,
        count: totalCount,
        cards,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_users'
        }
      };
    } catch (error) {
      console.error('[UserTool] Error executing query:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query users',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_users'
        }
      };
    }
  }
};
