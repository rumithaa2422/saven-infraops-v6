/**
 * Incident Tool
 * 
 * Provides query capabilities for IT Incidents.
 * Implements the Tool interface for database operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Incidents
 */
export const incidentTool: Tool = {
  name: 'query_incidents',
  description: 'Query IT incidents and outages. Use when user asks about incidents, outages, or emergency issues. Returns count and list of incidents matching criteria.',
  category: 'database',
  requiredPermissions: ['incidents:view'],
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'array',
        description: 'Filter by status. Options: OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_USER, WAITING_FOR_VENDOR, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED',
        items: { type: 'string' }
      },
      severity: {
        type: 'array',
        description: 'Filter by severity. Options: SEV1, SEV2, SEV3, SEV4',
        items: { type: 'string' }
      },
      ownerName: {
        type: 'string',
        description: 'Filter by owner name (partial match)'
      },
      impactedService: {
        type: 'string',
        description: 'Filter by impacted service name (partial match)'
      },
      impactedProject: {
        type: 'string',
        description: 'Filter by impacted project name (partial match)'
      },
      createdAfter: {
        type: 'string',
        description: 'Filter by creation date (ISO date string)'
      },
      createdBefore: {
        type: 'string',
        description: 'Filter by creation date (ISO date string)'
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
        description: 'Sort order. Options: createdAt, updatedAt, severity',
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
      
      if (params.severity && Array.isArray(params.severity) && params.severity.length > 0) {
        where.severity = { in: params.severity };
      }
      
      if (params.ownerName && typeof params.ownerName === 'string') {
        where.ownerName = { contains: params.ownerName };
      }
      
      if (params.impactedService && typeof params.impactedService === 'string') {
        where.impactedService = { contains: params.impactedService };
      }
      
      if (params.impactedProject && typeof params.impactedProject === 'string') {
        where.impactedProject = { contains: params.impactedProject };
      }
      
      if (params.createdAfter) {
        where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(params.createdAfter as string) };
      }
      
      if (params.createdBefore) {
        where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(params.createdBefore as string) };
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
        prisma.incident.findMany({
          where: where as any,
          orderBy,
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.incident.count({ where: where as any })
      ]);
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.incidentNo,
        value: item.severity,
        description: item.title,
        href: '/incidents'
      }));
      
      // Build summary
      let answer = `Found ${totalCount} incident${totalCount !== 1 ? 's' : ''}`;
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
          toolName: 'query_incidents'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query incidents',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_incidents'
        }
      };
    }
  }
};
