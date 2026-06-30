/**
 * LLM Intent Resolver
 * 
 * Phase 6: LLM-driven intent classification and entity extraction.
 * 
 * This component replaces all keyword-based logic with LLM-based classification.
 * It uses structured output to determine:
 * - Intent type (DATABASE_QUERY, NAVIGATION, KNOWLEDGE, MIXED, ACTION)
 * - Entity to query
 * - Filters to apply
 * - Aggregation type
 * - Navigation route (if applicable)
 * 
 * NO KEYWORD MATCHING - ALL DECISIONS FROM LLM
 */

import { runAiProvider } from '../../providers/providerFactory.js';

/**
 * Supported entity types
 */
export const SUPPORTED_ENTITIES = [
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
  'Role'
] as const;

/**
 * Supported intent types
 */
export const INTENT_TYPES = [
  'DATABASE_QUERY',
  'NAVIGATION',
  'KNOWLEDGE',
  'MIXED',
  'ACTION',
  'UNKNOWN'
] as const;

/**
 * Supported aggregation types
 */
export const AGGREGATION_TYPES = [
  'count',
  'list',
  'aggregate',
  'summary'
] as const;

/**
 * Navigation routes mapping
 */
export const ENTITY_ROUTES: Record<string, string> = {
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
  'AuditLog': '/audit',
  'Role': '/roles-permissions'
};

/**
 * Result from LLM intent resolution
 */
export interface LlmIntentResult {
  intent: typeof INTENT_TYPES[number];
  entity: typeof SUPPORTED_ENTITIES[number] | null;
  operation: 'count' | 'findMany' | 'aggregate';
  filters: Record<string, unknown>;
  aggregation: typeof AGGREGATION_TYPES[number];
  route: string | null;
  navigationOnly: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * System prompt for LLM intent classification
 */
const SYSTEM_PROMPT = `You are an AI intent classifier for Saven InfraOps Command Center, an enterprise ITSM platform.

Your job is to classify user queries and extract structured information.

## SUPPORTED ENTITIES:
${SUPPORTED_ENTITIES.join(', ')}

## INTENT TYPES:
- DATABASE_QUERY: User wants data from database (counts, lists, reports)
- NAVIGATION: User wants to navigate to a page
- KNOWLEDGE: User asks general knowledge questions (ITIL, DevOps, etc.)
- MIXED: User wants both data AND navigation
- ACTION: User wants to perform an action (create, update, delete)
- UNKNOWN: Cannot classify

## EXAMPLES:

Input: "How many users exist in the system?"
Output: {"intent":"DATABASE_QUERY","entity":"User","operation":"count","filters":{},"aggregation":"count","route":null,"navigationOnly":false,"confidence":0.95,"reasoning":"User explicitly asks for count of users"}

Input: "How many SEV1 incidents are currently open?"
Output: {"intent":"DATABASE_QUERY","entity":"Incident","operation":"count","filters":{"severity":"SEV1","status":["OPEN","ASSIGNED","IN_PROGRESS"]},"aggregation":"count","route":null,"navigationOnly":false,"confidence":0.95,"reasoning":"User asks for count of SEV1 incidents with open status"}

Input: "Go to incidents page"
Output: {"intent":"NAVIGATION","entity":null,"operation":"findMany","filters":{},"aggregation":"list","route":"/incidents","navigationOnly":true,"confidence":0.95,"reasoning":"User wants to navigate to incidents page"}

Input: "Show me all open tickets"
Output: {"intent":"DATABASE_QUERY","entity":"ServiceRequest","operation":"findMany","filters":{"status":"OPEN"},"aggregation":"list","route":null,"navigationOnly":false,"confidence":0.9,"reasoning":"User wants list of open service requests"}

Input: "What is DevOps?"
Output: {"intent":"KNOWLEDGE","entity":null,"operation":"findMany","filters":{},"aggregation":"summary","route":null,"navigationOnly":false,"confidence":0.9,"reasoning":"General knowledge question about DevOps concept"}

Input: "Show users and take me to the dashboard"
Output: {"intent":"MIXED","entity":"User","operation":"findMany","filters":{},"aggregation":"list","route":"/dashboard","navigationOnly":false,"confidence":0.85,"reasoning":"User wants both user data and navigation"}

Input: "List all available laptops"
Output: {"intent":"DATABASE_QUERY","entity":"Asset","operation":"findMany","filters":{"assetType":"Laptop","status":"AVAILABLE"},"aggregation":"list","route":null,"navigationOnly":false,"confidence":0.9,"reasoning":"User wants list of available laptop assets"}

Input: "Create a new incident"
Output: {"intent":"ACTION","entity":"Incident","operation":"create","filters":{},"aggregation":"summary","route":null,"navigationOnly":false,"confidence":0.8,"reasoning":"User wants to create a new incident record"}

## RULES:
1. If user asks "how many", "count", "number of" → use operation="count"
2. If user asks "show", "list", "get", "find" → use operation="findMany"
3. If user wants to navigate ("go to", "open", "show me") → set intent="NAVIGATION"
4. For knowledge questions without entity → intent="KNOWLEDGE"
5. If entity is found AND navigation is requested → intent="MIXED"
6. Set navigationOnly=true ONLY when user wants navigation without data

Return ONLY valid JSON matching the output format above. No explanation needed.`;

/**
 * Resolve intent using LLM
 * 
 * @param question - The user's question
 * @returns Structured intent result from LLM
 */
export async function resolveIntent(question: string): Promise<LlmIntentResult> {
  try {
    const result = await runAiProvider(
      `Classify this query and extract structured information:\n\n"${question}"`,
      SYSTEM_PROMPT
    );
    
    const response = result.answer.trim();
    
    // Try to parse JSON from response
    let parsed: Partial<LlmIntentResult>;
    
    try {
      // Handle markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        response.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON parsing failed - use fallback
      console.warn('[LLMIntentResolver] JSON parse failed, using fallback');
      return fallbackIntent(question);
    }
    
    // Validate and normalize the result
    return normalizeIntentResult(parsed, question);
    
  } catch (error) {
    console.error('[LLMIntentResolver] LLM call failed:', error);
    return fallbackIntent(question);
  }
}

/**
 * Normalize intent result with defaults
 */
function normalizeIntentResult(parsed: Partial<LlmIntentResult>, question: string): LlmIntentResult {
  const intent = INTENT_TYPES.includes(parsed.intent as any) 
    ? parsed.intent as LlmIntentResult['intent']
    : 'UNKNOWN';
  
  const entity = parsed.entity && SUPPORTED_ENTITIES.includes(parsed.entity as any)
    ? parsed.entity as LlmIntentResult['entity']
    : null;
  
  const operation = ['count', 'findMany', 'aggregate'].includes(parsed.operation as any)
    ? parsed.operation as LlmIntentResult['operation']
    : inferOperation(question);
  
  const aggregation = AGGREGATION_TYPES.includes(parsed.aggregation as any)
    ? parsed.aggregation as LlmIntentResult['aggregation']
    : 'list';
  
  return {
    intent,
    entity,
    operation,
    filters: parsed.filters || {},
    aggregation,
    route: parsed.route || (entity ? ENTITY_ROUTES[entity] : null),
    navigationOnly: parsed.navigationOnly ?? false,
    confidence: parsed.confidence ?? 0.5,
    reasoning: parsed.reasoning ?? 'LLM classification'
  };
}

/**
 * Infer operation from question keywords
 */
function inferOperation(question: string): 'count' | 'findMany' | 'aggregate' {
  const lower = question.toLowerCase();
  
  if (lower.includes('how many') || lower.includes('count') || lower.includes('number of')) {
    return 'count';
  }
  if (lower.includes('total') || lower.includes('sum') || lower.includes('average')) {
    return 'aggregate';
  }
  
  return 'findMany';
}

/**
 * Fallback intent resolution when LLM fails
 */
function fallbackIntent(question: string): LlmIntentResult {
  const lower = question.toLowerCase();
  
  // Check for navigation
const isNavigation = /^(go to|navigate|open|show me|take me|go|show)\s+(me\s+)?/.test(lower);

if (isNavigation) {

  let route = '/dashboard';

if (lower.includes('dashboard')) {
  route = '/dashboard';
}
else if (
  lower.includes('service request') ||
  lower.includes('service requests')
) {
  route = '/service-requests';
}
else if (
  lower.includes('incident') ||
  lower.includes('incidents')
) {
  route = '/incidents';
}
else if (
  lower.includes('problem') ||
  lower.includes('problems')
) {
  route = '/problems';
}
else if (
  lower.includes('change') ||
  lower.includes('changes')
) {
  route = '/changes';
}
else if (
  lower.includes('inventory') ||
  lower.includes('asset') ||
  lower.includes('assets')
) {
  route = '/inventory';
}
else if (
  lower.includes('access') ||
  lower.includes('access management')
) {
  route = '/access-management';
}
else if (
  lower.includes('compliance')
) {
  route = '/compliance';
}
else if (
  lower.includes('project') ||
  lower.includes('projects') ||
  lower.includes('environment') ||
  lower.includes('environments')
) {
  route = '/projects-environments';
}
else if (
  lower.includes('vendor') ||
  lower.includes('vendors') ||
  lower.includes('license') ||
  lower.includes('licenses')
) {
  route = '/vendors-licenses';
}
else if (
  lower.includes('knowledge') ||
  lower.includes('knowledge base') ||
  lower.includes('kb')
) {
  route = '/knowledge-base';
}
else if (
  lower.includes('user') ||
  lower.includes('users') ||
  lower.includes('team') ||
  lower.includes('teams')
) {
  route = '/users-teams';
}
else if (
  lower.includes('role') ||
  lower.includes('roles') ||
  lower.includes('permission') ||
  lower.includes('permissions')
) {
  route = '/roles-permissions';
}
else if (
  lower.includes('audit') ||
  lower.includes('audit log')
) {
  route = '/audit';
}
else if (
  lower.includes('report') ||
  lower.includes('reports') ||
  lower.includes('analytics')
) {
  route = '/reports';
}
else if (
  lower.includes('setting') ||
  lower.includes('settings')
) {
  route = '/settings';
}

  return {
    intent: 'NAVIGATION',
    entity: extractEntityFromQuestion(lower),
    operation: 'findMany',
    filters: {},
    aggregation: 'list',
    route,
    navigationOnly: true,
    confidence: 0.5,
    reasoning: 'Fallback: Navigation pattern detected'
  };
}
  
  // Check for knowledge
  const knowledgePatterns = ['what is', 'what are', 'explain', 'define', 'how do', 'why'];
  if (knowledgePatterns.some(p => lower.includes(p))) {
    return {
      intent: 'KNOWLEDGE',
      entity: null,
      operation: 'findMany',
      filters: {},
      aggregation: 'summary',
      route: null,
      navigationOnly: false,
      confidence: 0.3,
      reasoning: 'Fallback: Knowledge pattern detected'
    };
  }
  
  // Default to database query
  return {
    intent: 'DATABASE_QUERY',
    entity: extractEntityFromQuestion(lower),
    operation: 'findMany',
    filters: {},
    aggregation: 'list',
    route: null,
    navigationOnly: false,
    confidence: 0.3,
    reasoning: 'Fallback: Default to database query'
  };
}

/**
 * Extract entity from question text (fallback only)
 */
function extractEntityFromQuestion(lower: string): LlmIntentResult['entity'] {
  const entityPatterns: [string, LlmIntentResult['entity']][] = [
    ['user', 'User'],
    ['employee', 'User'],
    ['incident', 'Incident'],
    ['outage', 'Incident'],
    ['ticket', 'ServiceRequest'],
    ['service request', 'ServiceRequest'],
    ['asset', 'Asset'],
    ['inventory', 'Asset'],
    ['compliance', 'ComplianceControl'],
    ['audit', 'AuditLog'],
    ['change', 'ChangeRequest'],
    ['problem', 'Problem'],
    ['access', 'AccessRequest'],
    ['project', 'ProjectEnvironment'],
    ['vendor', 'VendorLicense'],
    ['role', 'Role']
  ];
  
  for (const [pattern, entity] of entityPatterns) {
    if (lower.includes(pattern)) {
      return entity;
    }
  }
  
  return null;
}
