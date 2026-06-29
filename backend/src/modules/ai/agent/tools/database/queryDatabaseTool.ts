/**
 * Query Database Tool
 * 
 * Phase 6: Unified database query tool that handles ALL entities.
 * 
 * This tool replaces all entity-specific tools:
 * - query_users
 * - query_incidents
 * - query_tickets
 * - query_assets
 * - query_compliance
 * 
 * It dynamically maps entities to Prisma models and builds queries safely.
 * NO eval() - all queries are built using safe Prisma operations.
 */

import { Tool, ToolContext, ToolResult, AiCard } from '../../types.js';

/**
 * Entity to Prisma model mapping
 */
const ENTITY_MODELS: Record<string, string> = {
  'User': 'user',
  'ServiceRequest': 'serviceRequest',
  'Incident': 'incident',
  'Asset': 'asset',
  'ComplianceControl': 'complianceControl',
  'Problem': 'problem',
  'ChangeRequest': 'changeRequest',
  'AccessRequest': 'accessRequest',
  'ProjectEnvironment': 'projectEnvironment',
  'VendorLicense': 'vendorLicense',
  'KnowledgeBaseArticle': 'knowledgeBaseArticle',
  'AuditLog': 'auditLog',
  'Role': 'role'
};

/**
 * Entity display names
 */
const ENTITY_DISPLAY_NAMES: Record<string, string> = {
  'User': 'users',
  'ServiceRequest': 'service requests',
  'Incident': 'incidents',
  'Asset': 'assets',
  'ComplianceControl': 'compliance controls',
  'Problem': 'problems',
  'ChangeRequest': 'change requests',
  'AccessRequest': 'access requests',
  'ProjectEnvironment': 'projects',
  'VendorLicense': 'vendor licenses',
  'KnowledgeBaseArticle': 'knowledge articles',
  'AuditLog': 'audit logs',
  'Role': 'roles'
};

/**
 * Query parameters for the unified database tool
 */
interface QueryParams {
  entity: string;
  operation: 'count' | 'findMany' | 'aggregate';
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Unified database query tool
 */
export const queryDatabaseTool: Tool = {
  name: 'query_database',
  description: 'Query the database for any supported entity (User, Incident, ServiceRequest, Asset, ComplianceControl, etc.). Use when user asks for counts, lists, or summaries of any data.',
  category: 'database',
  requiredPermissions: [],
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'The entity to query: User, ServiceRequest, Incident, Asset, ComplianceControl, Problem, ChangeRequest, AccessRequest, ProjectEnvironment, VendorLicense, KnowledgeBaseArticle, AuditLog, Role'
      },
      operation: {
        type: 'string',
        description: 'Operation type: count, findMany, aggregate',
        enum: ['count', 'findMany', 'aggregate']
      },
      filters: {
        type: 'object',
        description: 'Filters to apply to the query'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results',
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
        description: 'Field to order by',
        default: 'createdAt'
      },
      orderDirection: {
        type: 'string',
        description: 'Sort direction: asc, desc',
        default: 'desc'
      }
    },
    required: ['entity', 'operation']
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    const startTime = Date.now();
    
    try {
      const queryParams = params as QueryParams;
      const { entity, operation, filters = {}, limit = 10, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = queryParams;
      
      // Validate entity
      if (!entity || !ENTITY_MODELS[entity]) {
        return {
          success: false,
          error: `Unsupported entity: ${entity}. Supported: ${Object.keys(ENTITY_MODELS).join(', ')}`,
          metadata: { executionTimeMs: Date.now() - startTime, toolName: 'query_database' }
        };
      }
      
      const modelName = ENTITY_MODELS[entity];
      const displayName = ENTITY_DISPLAY_NAMES[entity];
      
      // Build the Prisma query based on entity
      const result = await executeQuery(
        context.prisma,
        modelName,
        entity,
        operation,
        filters,
        limit,
        offset,
        orderBy,
        orderDirection
      );
      
      // Convert to cards
      const cards: AiCard[] = result.records.map(record => {
        return {
          title: extractTitle(entity, record),
          value: extractValue(entity, record),
          description: extractDescription(entity, record)
        };
      });
      
      return {
        success: true,
        data: result.records,
        count: result.count,
        cards,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          toolName: 'query_database',
          entity,
          operation
        }
      };
      
    } catch (error) {
      console.error('[QueryDatabaseTool] Error executing query:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
        metadata: { executionTimeMs: Date.now() - startTime, toolName: 'query_database' }
      };
    }
  }
};

/**
 * Execute query based on entity and operation
 */
async function executeQuery(
  prisma: any,
  modelName: string,
  entity: string,
  operation: string,
  filters: Record<string, unknown>,
  limit: number,
  offset: number,
  orderBy: string,
  orderDirection: 'asc' | 'desc'
): Promise<{ records: any[]; count: number }> {
  
  // Get the model from Prisma client
  const model = prisma[modelName];
  
  if (!model) {
    throw new Error(`Prisma model '${modelName}' not found`);
  }
  
  // Build the where clause from filters
  const where = buildWhereClause(entity, filters);
  
  // Build orderBy
  const orderByClause = { [orderBy]: orderDirection };
  
  switch (operation) {
    case 'count': {
      const count = await model.count({ where });
      return { records: [], count };
    }
    
    case 'aggregate': {
      // For aggregate, return count and some records
      const [records, count] = await Promise.all([
        model.findMany({ where, orderBy: orderByClause, take: Math.min(limit, 10) }),
        model.count({ where })
      ]);
      return { records, count };
    }
    
    case 'findMany':
    default: {
      const [records, count] = await Promise.all([
        model.findMany({ 
          where, 
          orderBy: orderByClause, 
          take: limit, 
          skip: offset > 0 ? offset : undefined 
        }),
        model.count({ where })
      ]);
      return { records, count };
    }
  }
}

/**
 * Build safe where clause from filters
 */
function buildWhereClause(entity: string, filters: Record<string, unknown>): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  
  // Handle common filter patterns
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Handle array values (IN clause)
    if (Array.isArray(value)) {
      where[key] = { in: value };
    }
    // Handle object with operators
    else if (typeof value === 'object') {
      where[key] = value;
    }
    // Simple equality
    else {
      where[key] = value;
    }
  }
  
  // Entity-specific filter mappings
  const filterMappings: Record<string, Record<string, string>> = {
    'User': {
      'status': 'status',
      'department': 'department'
    },
    'Incident': {
      'severity': 'severity',
      'status': 'status',
      'priority': 'priority'
    },
    'ServiceRequest': {
      'status': 'status',
      'category': 'category'
    },
    'Asset': {
      'status': 'status',
      'assetType': 'assetType'
    },
    'ComplianceControl': {
      'status': 'status',
      'controlArea': 'controlArea'
    }
  };
  
  // Apply entity-specific mappings
  const mappings = filterMappings[entity];
  if (mappings) {
    for (const [filterKey, modelKey] of Object.entries(mappings)) {
      if (filterKey in filters) {
        where[modelKey] = filters[filterKey];
      }
    }
  }
  
  return where;
}

/**
 * Extract title from record based on entity
 */
function extractTitle(entity: string, record: any): string {
  switch (entity) {
    case 'User':
      return record.name || record.email || 'Unknown User';
    case 'Incident':
      return record.incidentNo || record.title || 'Unknown Incident';
    case 'ServiceRequest':
      return record.ticketNo || record.title || 'Unknown Request';
    case 'Asset':
      return record.assetNo || record.name || 'Unknown Asset';
    case 'ComplianceControl':
      return record.controlNo || record.name || 'Unknown Control';
    case 'Problem':
      return record.problemNo || record.title || 'Unknown Problem';
    case 'ChangeRequest':
      return record.changeNo || record.title || 'Unknown Change';
    case 'AccessRequest':
      return record.requestNo || record.title || 'Unknown Request';
    case 'ProjectEnvironment':
      return record.name || 'Unknown Project';
    case 'VendorLicense':
      return record.licenseKey || record.name || 'Unknown License';
    case 'KnowledgeBaseArticle':
      return record.title || 'Unknown Article';
    case 'AuditLog':
      return record.action || 'Unknown Action';
    case 'Role':
      return record.name || 'Unknown Role';
    default:
      return record.name || record.title || 'Record';
  }
}

/**
 * Extract value from record based on entity
 */
function extractValue(entity: string, record: any): string | undefined {
  switch (entity) {
    case 'User':
      return record.email;
    case 'Incident':
      return record.status;
    case 'ServiceRequest':
      return record.status;
    case 'Asset':
      return record.status;
    case 'ComplianceControl':
      return record.status;
    default:
      return undefined;
  }
}

/**
 * Extract description from record based on entity
 */
function extractDescription(entity: string, record: any): string | undefined {
  const parts: string[] = [];
  
  switch (entity) {
    case 'User':
      if (record.department) parts.push(record.department);
      if (record.status) parts.push(record.status);
      break;
    case 'Incident':
      if (record.severity) parts.push(record.severity);
      if (record.priority) parts.push(record.priority);
      if (record.ownerName) parts.push(`Assigned: ${record.ownerName}`);
      break;
    case 'ServiceRequest':
      if (record.category) parts.push(record.category);
      if (record.priority) parts.push(record.priority);
      break;
    case 'Asset':
      if (record.assetType) parts.push(record.assetType);
      if (record.location) parts.push(record.location);
      break;
    case 'ComplianceControl':
      if (record.controlArea) parts.push(record.controlArea);
      if (record.category) parts.push(record.category);
      break;
    default:
      if (record.description) {
        const desc = String(record.description);
        parts.push(desc.length > 50 ? desc.slice(0, 50) + '...' : desc);
      }
  }
  
  return parts.length > 0 ? parts.join(' | ') : undefined;
}
