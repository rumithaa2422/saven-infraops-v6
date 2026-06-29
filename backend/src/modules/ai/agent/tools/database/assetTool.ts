/**
 * Asset Tool
 * 
 * Provides query capabilities for IT Assets and Inventory.
 * Implements the Tool interface for database operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Assets
 */
export const assetTool: Tool = {
  name: 'query_assets',
  description: 'Query IT assets and inventory. Use when user asks about laptops, hardware, equipment, or inventory status.',
  category: 'database',
  requiredPermissions: ['inventory:view'],
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'array',
        description: 'Filter by asset status. Options: AVAILABLE, ASSIGNED, UNDER_REPAIR, DAMAGED, LOST, RETIRED, DISPOSED',
        items: { type: 'string' }
      },
      assetType: {
        type: 'string',
        description: 'Filter by asset type (e.g., Laptop, Server, Monitor)'
      },
      assignedToName: {
        type: 'string',
        description: 'Filter by assigned person name (partial match)'
      },
      location: {
        type: 'string',
        description: 'Filter by location (partial match)'
      },
      make: {
        type: 'string',
        description: 'Filter by manufacturer/make (partial match)'
      },
      model: {
        type: 'string',
        description: 'Filter by model name (partial match)'
      },
      warrantyExpiringWithin: {
        type: 'number',
        description: 'Filter assets with warranty expiring within N days'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 20,
        maximum: 100
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip',
        default: 0
      },
      orderBy: {
        type: 'string',
        description: 'Sort order. Options: createdAt, assetType, status',
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
      
      if (params.assetType && typeof params.assetType === 'string') {
        where.assetType = { contains: params.assetType };
      }
      
      if (params.assignedToName && typeof params.assignedToName === 'string') {
        where.assignedToName = { contains: params.assignedToName };
      }
      
      if (params.location && typeof params.location === 'string') {
        where.location = { contains: params.location };
      }
      
      if (params.make && typeof params.make === 'string') {
        where.make = { contains: params.make };
      }
      
      if (params.model && typeof params.model === 'string') {
        where.model = { contains: params.model };
      }
      
      // Warranty expiration filter
      if (params.warrantyExpiringWithin && typeof params.warrantyExpiringWithin === 'number') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (params.warrantyExpiringWithin as number));
        where.warrantyEndAt = {
          gte: new Date(),
          lte: futureDate
        };
      }
      
      // Build orderBy
      const orderByField = (params.orderBy as string) || 'createdAt';
      const orderDirection = (params.orderDirection as 'desc' | 'asc') || 'desc';
      const orderBy = { [orderByField]: orderDirection };
      
      // Pagination
      const limit = Math.min(Number(params.limit) || 20, 100);
      const offset = Number(params.offset) || 0;
      
      // Execute queries in parallel
      const [records, totalCount] = await Promise.all([
        prisma.asset.findMany({
          where: where as any,
          orderBy,
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.asset.count({ where: where as any })
      ]);
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.assetNo,
        value: item.status,
        description: `${item.assetType}${item.make ? ` - ${item.make}` : ''}`,
        href: '/inventory'
      }));
      
      // Build summary
      let answer = `Found ${totalCount} asset${totalCount !== 1 ? 's' : ''}`;
      if (totalCount > limit) {
        answer += ` (showing ${records.length})`;
      }
      
      return {
        success: true,
        data: records,
        count: totalCount,
        records: records as unknown as Record<string, unknown>[],
        cards,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_assets'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query assets',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_assets'
        }
      };
    }
  }
};
