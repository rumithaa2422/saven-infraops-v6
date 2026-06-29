/**
 * Compliance Tool
 * 
 * Provides query capabilities for Compliance Controls.
 * Implements the Tool interface for database operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Compliance Controls
 */
export const complianceTool: Tool = {
  name: 'query_compliance',
  description: 'Query compliance controls, audits, and regulatory items. Use when user asks about compliance, audits, controls, or regulatory requirements.',
  category: 'database',
  requiredPermissions: ['compliance:view'],
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'array',
        description: 'Filter by compliance status. Options: OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_USER, WAITING_FOR_VENDOR, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED',
        items: { type: 'string' }
      },
      riskRating: {
        type: 'array',
        description: 'Filter by risk rating. Options: LOW, MEDIUM, HIGH, CRITICAL',
        items: { type: 'string' }
      },
      controlArea: {
        type: 'string',
        description: 'Filter by control area (partial match)'
      },
      ownerName: {
        type: 'string',
        description: 'Filter by owner name (partial match)'
      },
      dueWithinDays: {
        type: 'number',
        description: 'Filter controls due within N days'
      },
      overdue: {
        type: 'boolean',
        description: 'Filter only overdue controls',
        default: false
      },
      hasEvidence: {
        type: 'boolean',
        description: 'Filter controls with evidence uploaded'
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
        description: 'Sort order. Options: createdAt, dueAt, riskRating',
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
      
      if (params.riskRating && Array.isArray(params.riskRating) && params.riskRating.length > 0) {
        where.riskRating = { in: params.riskRating };
      }
      
      if (params.controlArea && typeof params.controlArea === 'string') {
        where.controlArea = { contains: params.controlArea };
      }
      
      if (params.ownerName && typeof params.ownerName === 'string') {
        where.ownerName = { contains: params.ownerName };
      }
      
      // Due date filters
      if (params.overdue === true) {
        where.dueAt = { lt: new Date() };
        // Exclude closed/resolved from overdue
        if (!params.status) {
          where.status = { notIn: ['CLOSED', 'RESOLVED'] };
        }
      } else if (params.dueWithinDays && typeof params.dueWithinDays === 'number') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (params.dueWithinDays as number));
        where.dueAt = {
          gte: new Date(),
          lte: futureDate
        };
      }
      
      // Evidence filter
      if (params.hasEvidence === true) {
        where.evidenceUrl = { not: null };
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
        prisma.complianceControl.findMany({
          where: where as any,
          orderBy,
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.complianceControl.count({ where: where as any })
      ]);
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.controlNo,
        value: item.riskRating,
        description: item.title,
        href: '/compliance'
      }));
      
      // Build summary
      let answer = `Found ${totalCount} compliance control${totalCount !== 1 ? 's' : ''}`;
      if (totalCount > limit) {
        answer += ` (showing ${records.length})`;
      }
      if (params.overdue === true) {
        answer += ' that are overdue.';
      }
      
      return {
        success: true,
        data: records,
        count: totalCount,
        records: records as unknown as Record<string, unknown>[],
        cards,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_compliance'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query compliance controls',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_compliance'
        }
      };
    }
  }
};
