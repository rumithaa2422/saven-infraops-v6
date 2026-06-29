/**
 * Entity Resolver
 * 
 * LLM-powered intent and entity detection.
 * Replaces keyword-based entity extraction.
 * 
 * This is the ONLY source of truth for:
 * - Intent classification (DATABASE_QUERY, KNOWLEDGE, NAVIGATION)
 * - Entity extraction
 * - Filter extraction
 * - Navigation route detection
 */

import { runAiProvider } from '../../providers/providerFactory.js';

/**
 * Available entities that can be queried
 */
export const AVAILABLE_ENTITIES = [
  'User',
  'ServiceRequest',
  'Incident',
  'Asset',
  'ComplianceControl',
  'Problem',
  'ChangeRequest',
  'AccessRequest',
  'ProjectEnvironment',
  'VendorLicense',
  'KnowledgeBaseArticle',
  'AuditLog',
  'Role',
  'Permission'
];

/**
 * Entity to tool name mapping
 */
export const ENTITY_TO_TOOL: Record<string, string> = {
  'User': 'query_users',
  'ServiceRequest': 'query_tickets',
  'Incident': 'query_incidents',
  'Asset': 'query_assets',
  'ComplianceControl': 'query_compliance',
  'Problem': 'query_problems',
  'ChangeRequest': 'query_changes',
  'AccessRequest': 'query_access',
  'ProjectEnvironment': 'query_projects',
  'VendorLicense': 'query_vendors',
  'KnowledgeBaseArticle': 'query_knowledge',
  'AuditLog': 'query_audit',
  'Role': 'query_roles',
  'Permission': 'query_permissions'
};

/**
 * Route mapping for navigation intents
 */
export const ENTITY_TO_ROUTE: Record<string, string> = {
  'User': '/users-teams',
  'ServiceRequest': '/service-requests',
  'Incident': '/incidents',
  'Asset': '/inventory',
  'ComplianceControl': '/compliance',
  'Problem': '/problems',
  'ChangeRequest': '/changes',
  'AccessRequest': '/access-management',
  'ProjectEnvironment': '/projects-environments',
  'VendorLicense': '/vendors-licenses',
  'KnowledgeBaseArticle': '/knowledge-base',
  'Role': '/roles-permissions',
  'Permission': '/roles-permissions'
};

/**
 * Result from entity resolution
 */
export interface EntityResolution {
  intent: 'DATABASE_QUERY' | 'KNOWLEDGE' | 'NAVIGATION' | 'MIXED' | 'UNKNOWN';
  entity: string | null;
  toolName: string | null;
  filters: Record<string, unknown>;
  route: string | null;
  confidence: number;
  reasoning: string;
}

/**
 * System prompt for LLM-based entity resolution
 */
const SYSTEM_PROMPT = `You are an AI assistant intent classifier. Your job is to analyze user prompts and determine:

1. INTENT:
   - "DATABASE_QUERY" - User wants data from the database
   - "KNOWLEDGE" - User wants general knowledge or explanation (not from DB)
   - "NAVIGATION" - User wants to navigate to a page
   - "MIXED" - Multiple intents combined
   - "UNKNOWN" - Cannot be classified

2. ENTITY (for DATABASE_QUERY):
   - Map to one of these entities: ${AVAILABLE_ENTITIES.join(', ')}
   - If no specific entity, return null

3. FILTERS (for DATABASE_QUERY):
   - Extract status filters: pending, open, closed, active, etc.
   - Extract priority/severity: critical, high, medium, low, SEV1, etc.
   - Extract date filters if mentioned
   - Return empty object if no filters

4. ROUTE (for NAVIGATION):
   - Map entity to route path
   - If general navigation, return null

IMPORTANT RULES:
- If the question asks about users, employees, team members → User entity
- If the question asks about tickets, service requests, helpdesk → ServiceRequest entity
- If the question asks about incidents, outages, emergencies → Incident entity
- If the question asks about assets, inventory, hardware, equipment → Asset entity
- If the question asks about compliance, audits, controls, policies → ComplianceControl entity
- If the question asks about problems, known errors, RCA → Problem entity
- If the question asks about change requests, changes → ChangeRequest entity
- If the question asks about access requests, provisioning → AccessRequest entity
- If the question asks about projects, environments → ProjectEnvironment entity
- If the question asks about vendors, licenses → VendorLicense entity
- If the question asks about knowledge base, KB articles → KnowledgeBaseArticle entity
- If the question asks about audit logs, audit trail → AuditLog entity
- If the question asks about roles, permissions → Role entity

For KNOWLEDGE intent:
- "What is X?" where X is a concept/technology (ITIL, DevOps, etc.) → KNOWLEDGE
- "Explain Y" where Y is not a database entity → KNOWLEDGE
- "How do I..." → KNOWLEDGE

Return JSON format:
{
  "intent": "DATABASE_QUERY|KNOWLEDGE|NAVIGATION|MIXED|UNKNOWN",
  "entity": "EntityName|null",
  "filters": {"status": [...], "priority": [...], ...},
  "route": "/path|null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

/**
 * Extract filters from text for specific entities
 */
function extractFilters(text: string, entity: string): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const lower = text.toLowerCase();
  
  // Status filters
  if (lower.includes('pending') || lower.includes('open')) {
    if (entity === 'Asset') {
      filters.status = ['ASSIGNED', 'AVAILABLE'];
    } else if (entity === 'AccessRequest') {
      filters.status = ['REQUESTED', 'APPROVED'];
    } else {
      filters.status = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];
    }
  }
  if (lower.includes('closed') || lower.includes('resolved')) {
    filters.status = ['CLOSED', 'RESOLVED'];
  }
  if (lower.includes('active')) {
    filters.status = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];
  }
  
  // Priority/Severity filters
  if (lower.includes('critical') || lower.includes('high priority')) {
    filters.priority = ['HIGH', 'CRITICAL'];
    filters.severity = ['SEV1', 'SEV2'];
  }
  if (lower.includes('medium priority')) {
    filters.priority = ['MEDIUM'];
    filters.severity = ['SEV3'];
  }
  if (lower.includes('low priority')) {
    filters.priority = ['LOW'];
    filters.severity = ['SEV4'];
  }
  if (lower.includes('sev1')) {
    filters.severity = ['SEV1'];
  }
  if (lower.includes('sev2')) {
    filters.severity = ['SEV2'];
  }
  
  // SLA breach filter
  if (lower.includes('breach') || lower.includes('breached') || lower.includes('sla')) {
    filters.includeBreached = true;
  }
  
  // Assigned to me filter
  if (lower.includes('my') || lower.includes('assigned to me')) {
    filters.assignedToMe = true;
  }
  
  // Overdue filter
  if (lower.includes('overdue') || lower.includes('past due')) {
    filters.overdue = true;
  }
  
  // Available filter
  if (lower.includes('available')) {
    filters.status = ['AVAILABLE'];
  }
  
  return filters;
}

/**
 * Resolve entity from prompt using LLM
 */
export async function resolveEntity(question: string): Promise<EntityResolution> {
  const userPrompt = `Classify this prompt: "${question}"`;
  
  try {
    const result = await runAiProvider(userPrompt, SYSTEM_PROMPT);
    const response = result.answer.trim();
    
    // Try to parse as JSON
    let parsed: Partial<EntityResolution>;
    try {
      // Handle markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        response.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON parsing failed, use fallback heuristics
      return fallbackResolution(question);
    }
    
    // Map entity to tool name
    const entity = parsed.entity || null;
    const toolName = entity ? ENTITY_TO_TOOL[entity] || null : null;
    
    // Map entity to route
    const route = entity ? ENTITY_TO_ROUTE[entity] || null : null;
    
    // Extract filters
    const filters = extractFilters(question, entity || '');
    
    return {
      intent: parsed.intent || 'UNKNOWN',
      entity,
      toolName,
      filters: Object.keys(filters).length > 0 ? filters : (parsed.filters || {}),
      route: parsed.route || route,
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM classification'
    };
  } catch (error) {
    console.error('[EntityResolver] LLM call failed:', error);
    return fallbackResolution(question);
  }
}

/**
 * Fallback heuristic resolution when LLM fails
 */
function fallbackResolution(question: string): EntityResolution {
  const lower = question.toLowerCase();
  
  // Check for knowledge patterns first
  const knowledgePatterns = [
    'what is', 'what are', 'explain', 'define', 'how do', 'how does',
    'why is', 'why do', 'tell me about', 'describe', 'meaning of'
  ];
  
  const isKnowledge = knowledgePatterns.some(pattern => lower.includes(pattern));
  
  // Entity patterns - [keyword, entity]
  const entityPatterns: [string, string][] = [
    ['user', 'User'],
    ['users', 'User'],
    ['employee', 'User'],
    ['employees', 'User'],
    ['team member', 'User'],
    ['ticket', 'ServiceRequest'],
    ['tickets', 'ServiceRequest'],
    ['service request', 'ServiceRequest'],
    ['helpdesk', 'ServiceRequest'],
    ['incident', 'Incident'],
    ['incidents', 'Incident'],
    ['outage', 'Incident'],
    ['outages', 'Incident'],
    ['emergency', 'Incident'],
    ['emergencies', 'Incident'],
    ['asset', 'Asset'],
    ['assets', 'Asset'],
    ['inventory', 'Asset'],
    ['laptop', 'Asset'],
    ['hardware', 'Asset'],
    ['compliance', 'ComplianceControl'],
    ['audit', 'ComplianceControl'],
    ['control', 'ComplianceControl'],
    ['controls', 'ComplianceControl'],
    ['policy', 'ComplianceControl'],
    ['regulation', 'ComplianceControl'],
    ['problem', 'Problem'],
    ['problems', 'Problem'],
    ['change request', 'ChangeRequest'],
    ['change requests', 'ChangeRequest'],
    ['changes', 'ChangeRequest'],
    ['access request', 'AccessRequest'],
    ['access requests', 'AccessRequest'],
    ['project', 'ProjectEnvironment'],
    ['projects', 'ProjectEnvironment'],
    ['environment', 'ProjectEnvironment'],
    ['environments', 'ProjectEnvironment'],
    ['vendor', 'VendorLicense'],
    ['vendors', 'VendorLicense'],
    ['license', 'VendorLicense'],
    ['licenses', 'VendorLicense'],
    ['knowledge base', 'KnowledgeBaseArticle'],
    ['kb article', 'KnowledgeBaseArticle'],
    ['audit log', 'AuditLog'],
    ['audit logs', 'AuditLog'],
    ['audit trail', 'AuditLog'],
    ['role', 'Role'],
    ['roles', 'Role'],
    ['permission', 'Role'],
    ['permissions', 'Role']
  ];
  
  let detectedEntity: string | null = null;
  
  if (isKnowledge) {
    // Check if knowledge question also mentions an entity
    for (const [keyword, entity] of entityPatterns) {
      if (lower.includes(keyword)) {
        detectedEntity = entity;
        break;
      }
    }
  } else {
    // Check for entity keywords
    for (const [keyword, entity] of entityPatterns) {
      if (lower.includes(keyword)) {
        detectedEntity = entity;
        break;
      }
    }
  }
  
  // Determine intent
  let intent: EntityResolution['intent'] = 'DATABASE_QUERY';
  
  // Check for navigation patterns FIRST - navigation must NOT have entities
  const isNavigation = lower.match(/^(go to|navigate|open|show me|take me|go|show)\s+(me\s+)?(the\s+)?/);
  
  if (isNavigation) {
    // Navigation intents: NO entities, NO database tools
    intent = 'NAVIGATION';
    detectedEntity = null;
  } else if (isKnowledge && !detectedEntity) {
    intent = 'KNOWLEDGE';
  }
  
  const toolName = detectedEntity ? ENTITY_TO_TOOL[detectedEntity] || null : null;
  const route = detectedEntity ? ENTITY_TO_ROUTE[detectedEntity] || null : null;
  const filters = extractFilters(question, detectedEntity || '');
  
  return {
    intent,
    entity: detectedEntity,
    toolName,
    filters,
    route,
    confidence: detectedEntity ? 0.7 : 0.3,
    reasoning: 'Fallback heuristic resolution'
  };
}

/**
 * Get tool name for an entity
 */
export function getToolForEntity(entity: string): string | null {
  return ENTITY_TO_TOOL[entity] || null;
}

/**
 * Get route for an entity
 */
export function getRouteForEntity(entity: string): string | null {
  return ENTITY_TO_ROUTE[entity] || null;
}

/**
 * Check if entity is valid
 */
export function isValidEntity(entity: string): boolean {
  return AVAILABLE_ENTITIES.includes(entity);
}
