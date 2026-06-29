/**
 * Intent Classifier
 * 
 * Classifies user input into intent types and extracts entities.
 * This is the first step in the agent pipeline.
 * 
 * CRITICAL FIX: Now uses entityResolver for LLM-based classification.
 * The old keyword-based system has been replaced.
 */

import { IntentType, IntentResult } from '../types.js';
import { resolveEntity, EntityResolution } from './entityResolver.js';

/**
 * Main intent classification function
 * Now delegates to entityResolver for LLM-powered classification
 */
export async function classifyIntent(question: string): Promise<IntentResult> {
  try {
    // Use LLM-based entity resolution
    const resolution = await resolveEntity(question);
    
    // Convert EntityResolution to IntentResult
    return convertToIntentResult(resolution);
  } catch (error) {
    console.error('[IntentClassifier] Classification failed:', error);
    
    // Fallback to safe response - no database access
    return {
      type: 'UNKNOWN',
      confidence: 0,
      entities: {
        primaryEntity: undefined,
        filters: {},
        modifiers: []
      },
      suggestedTools: [],
      parameters: {}
    };
  }
}

/**
 * Convert EntityResolution to IntentResult
 */
function convertToIntentResult(resolution: EntityResolution): IntentResult {
  // Map entity resolution intent to IntentType
  let type: IntentType;
  switch (resolution.intent) {
    case 'DATABASE_QUERY':
      type = 'DATABASE_QUERY';
      break;
    case 'NAVIGATION':
      type = 'NAVIGATION';
      break;
    case 'KNOWLEDGE':
      type = 'KNOWLEDGE';
      break;
    case 'MIXED':
      type = 'MIXED';
      break;
    default:
      type = 'UNKNOWN';
  }
  
  // Only suggest tools if we have a specific tool name
  const suggestedTools = resolution.toolName ? [resolution.toolName] : [];
  
  return {
    type,
    confidence: resolution.confidence,
    entities: {
      primaryEntity: resolution.toolName || undefined,
      filters: resolution.filters,
      modifiers: []
    },
    suggestedTools,
    parameters: resolution.filters
  };
}

/**
 * Synchronous version for backward compatibility
 * NOTE: This will use fallback heuristics only (no LLM call)
 */
export function classifyIntentSync(question: string): IntentResult {
  const resolution = resolveEntitySync(question);
  return convertToIntentResult(resolution);
}

/**
 * Synchronous fallback resolution (heuristic-based)
 */
function resolveEntitySync(question: string): EntityResolution {
  const lower = question.toLowerCase();
  
  // Knowledge patterns
  const knowledgePatterns = [
    'what is', 'what are', 'explain', 'define', 'how do', 'how does',
    'why is', 'why do', 'tell me about', 'describe', 'meaning of'
  ];
  
  const isKnowledge = knowledgePatterns.some(pattern => lower.includes(pattern));
  
  // Entity patterns - expanded coverage
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
    ['laptops', 'Asset'],
    ['hardware', 'Asset'],
    ['equipment', 'Asset'],
    ['compliance', 'ComplianceControl'],
    ['audit', 'ComplianceControl'],
    ['audits', 'ComplianceControl'],
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
  
  // Entity to tool mapping
  const entityToTool: Record<string, string> = {
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
    'Role': 'query_roles'
  };
  
  // Entity detection
  let detectedEntity: string | null = null;
  let detectedTool: string | null = null;
  
  for (const patternGroup of entityPatterns) {
    for (const pattern of patternGroup) {
      if (lower.includes(pattern)) {
        // Find entity name from pattern group
        if (patternGroup[0] === 'user' || patternGroup[0] === 'employee') {
          detectedEntity = 'User';
        } else if (patternGroup[0] === 'ticket' || patternGroup[0] === 'service request') {
          detectedEntity = 'ServiceRequest';
        } else if (patternGroup[0] === 'incident' || patternGroup[0] === 'outage') {
          detectedEntity = 'Incident';
        } else if (patternGroup[0] === 'asset' || patternGroup[0] === 'inventory') {
          detectedEntity = 'Asset';
        } else if (patternGroup[0] === 'compliance' || patternGroup[0] === 'audit') {
          detectedEntity = 'ComplianceControl';
        } else if (patternGroup[0] === 'problem') {
          detectedEntity = 'Problem';
        } else if (patternGroup[0] === 'change') {
          detectedEntity = 'ChangeRequest';
        } else if (patternGroup[0] === 'access') {
          detectedEntity = 'AccessRequest';
        } else if (patternGroup[0] === 'project' || patternGroup[0] === 'environment') {
          detectedEntity = 'ProjectEnvironment';
        } else if (patternGroup[0] === 'vendor' || patternGroup[0] === 'license') {
          detectedEntity = 'VendorLicense';
        } else if (patternGroup[0] === 'knowledge') {
          detectedEntity = 'KnowledgeBaseArticle';
        } else if (patternGroup[0] === 'audit') {
          detectedEntity = 'AuditLog';
        } else if (patternGroup[0] === 'role' || patternGroup[0] === 'permission') {
          detectedEntity = 'Role';
        }
        
        if (detectedEntity) {
          detectedTool = entityToTool[detectedEntity] || null;
        }
        break;
      }
    }
    if (detectedEntity) break;
  }
  
  // Determine intent
  let intent: EntityResolution['intent'] = 'UNKNOWN';
  
  if (isKnowledge && !detectedEntity) {
    intent = 'KNOWLEDGE';
  } else if (detectedEntity) {
    intent = 'DATABASE_QUERY';
  } else if (lower.match(/go to|navigate|open|show me|take me to/i)) {
    intent = 'NAVIGATION';
  }
  
  // Extract filters
  const filters: Record<string, unknown> = {};
  
  if (lower.includes('pending') || lower.includes('open')) {
    filters.status = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];
  }
  if (lower.includes('closed') || lower.includes('resolved')) {
    filters.status = ['CLOSED', 'RESOLVED'];
  }
  if (lower.includes('active')) {
    filters.status = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];
  }
  if (lower.includes('critical') || lower.includes('high priority')) {
    filters.priority = ['HIGH', 'CRITICAL'];
    filters.severity = ['SEV1', 'SEV2'];
  }
  if (lower.includes('sev1')) filters.severity = ['SEV1'];
  if (lower.includes('sev2')) filters.severity = ['SEV2'];
  if (lower.includes('available')) filters.status = ['AVAILABLE'];
  if (lower.includes('breach') || lower.includes('sla')) filters.includeBreached = true;
  if (lower.includes('my') || lower.includes('assigned to me')) filters.assignedToMe = true;
  if (lower.includes('overdue') || lower.includes('past due')) filters.overdue = true;
  
  return {
    intent,
    entity: detectedEntity,
    toolName: detectedTool,
    filters,
    route: null,
    confidence: detectedEntity ? 0.7 : 0.3,
    reasoning: 'Fallback heuristic resolution'
  };
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Extract filters from user input
 */
function extractFilters(text: string): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const lower = text.toLowerCase();
  
  // Status filters
  if (lower.includes('pending') || lower.includes('open')) {
    filters.status = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];
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
 * Extract parameters from question for a specific tool
 */
export function extractToolParameters(
  question: string,
  toolName: string
): Record<string, unknown> {
  const normalized = normalizeText(question);
  const params: Record<string, unknown> = {};
  
  // Get base filters
  Object.assign(params, extractFilters(normalized));
  
  // Set default limit
  params.limit = 10;
  
  // Tool-specific extractions
  switch (toolName) {
    case 'query_users':
      // Extract department
      const deptMatch = normalized.match(/(?:in|from)\s+(\w+)\s+department/);
      if (deptMatch) {
        params.department = deptMatch[1];
      }
      break;
      
    case 'query_tickets':
      // Extract category
      const categoryMatch = normalized.match(/(\w+)\s+(tickets?|requests?)/);
      if (categoryMatch) {
        params.category = categoryMatch[1];
      }
      break;
      
    case 'query_incidents':
      // Extract owner
      const ownerMatch = normalized.match(/assigned to (\w+)/);
      if (ownerMatch) {
        params.ownerName = ownerMatch[1];
      }
      break;
      
    case 'query_assets':
      // Extract asset type
      const assetTypes = ['laptop', 'desktop', 'server', 'monitor', 'keyboard', 'mouse'];
      for (const assetType of assetTypes) {
        if (normalized.includes(assetType)) {
          params.assetType = assetType.charAt(0).toUpperCase() + assetType.slice(1);
          break;
        }
      }
      break;
      
    case 'query_compliance':
      // Extract control area
      const controlMatch = normalized.match(/(security|network|access|data|compliance)\s+controls?/);
      if (controlMatch) {
        params.controlArea = controlMatch[1];
      }
      break;
  }
  
  return params;
}
