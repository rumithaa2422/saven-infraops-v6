/**
 * Compliance Tool
 * 
 * Provides query capabilities for Compliance Documents.
 * Implements the Tool interface for database operations.
 * Compliance is now a PDF document repository.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Tool definition for Compliance Documents
 */
export const complianceTool: Tool = {
  name: 'query_compliance',
  description: 'Query compliance documents repository. Use when user asks about compliance documents, uploaded PDFs, or the document library.',
  category: 'database',
  requiredPermissions: ['compliance:view'],
  parameters: {
    type: 'object',
    properties: {
      uploadedBy: {
        type: 'string',
        description: 'Filter by uploader name (partial match)'
      },
      fileName: {
        type: 'string',
        description: 'Filter by file name (partial match)'
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
      
      if (params.uploadedBy && typeof params.uploadedBy === 'string') {
        where.uploadedBy = { contains: params.uploadedBy };
      }
      
      if (params.fileName && typeof params.fileName === 'string') {
        where.fileName = { contains: params.fileName };
      }
      
      // Pagination
      const limit = Math.min(Number(params.limit) || 20, 100);
      const offset = Number(params.offset) || 0;
      
      // Execute queries in parallel
      const [records, totalCount] = await Promise.all([
        prisma.complianceDocument.findMany({
          where: where as any,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset > 0 ? offset : undefined,
        }),
        prisma.complianceDocument.count({ where: where as any })
      ]);
      
      // Convert to cards
      const cards: AiCard[] = records.map((item) => ({
        title: item.fileName,
        value: `${(item.fileSize / 1024).toFixed(1)} KB`,
        description: `Uploaded by ${item.uploadedBy || 'Unknown'}`,
        href: '/compliance'
      }));
      
      // Build summary
      const answer = `Found ${totalCount} compliance document${totalCount !== 1 ? 's' : ''}`;
      
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
        error: error instanceof Error ? error.message : 'Failed to query compliance documents',
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_compliance'
        }
      };
    }
  }
};
