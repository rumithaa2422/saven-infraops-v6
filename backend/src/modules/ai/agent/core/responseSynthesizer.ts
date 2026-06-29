/**
 * Response Synthesizer
 * 
 * Generates natural language responses from tool execution results.
 * Uses the LLM to synthesize a coherent response from multiple tool results.
 * 
 * This component:
 * 1. Aggregates results from all executed tools
 * 2. Formats data for the frontend (cards)
 * 3. Generates a natural language explanation
 * 4. Handles navigation actions
 */

import { AgentExecutionResult, ToolCallRecord, AiCard, NavigationAction } from '../types.js';
import { runAiProvider } from '../../providers/providerFactory.js';

/**
 * Synthesize a response from tool execution results
 */
export async function synthesizeResponse(
  question: string,
  toolResults: ToolCallRecord[],
  intent: string
): Promise<{ answer: string; provider: string; model: string }> {
  // Check if any tools were executed
  const hasResults = toolResults.length > 0 && 
    toolResults.some(r => r.result.success && r.result.data);
  
  if (!hasResults) {
    // No successful results, try LLM directly
    const llmResult = await runAiProvider(question);
    return {
      answer: llmResult.answer,
      provider: llmResult.metadata?.provider || 'unknown',
      model: llmResult.metadata?.model || 'unknown'
    };
  }
  
  // Build context from tool results
  const context = buildContext(question, toolResults);
  
  // Use LLM to synthesize response
  const synthesisPrompt = buildSynthesisPrompt(context, question);
  
  try {
    const llmResult = await runAiProvider(synthesisPrompt);
    return {
      answer: llmResult.answer,
      provider: llmResult.metadata?.provider || 'openai',
      model: llmResult.metadata?.model || 'unknown'
    };
  } catch (error) {
    // Fallback to generating a simple response
    return generateFallbackResponse(toolResults);
  }
}

/**
 * Build context string from tool results
 */
function buildContext(question: string, toolResults: ToolCallRecord[]): string {
  const parts: string[] = [];
  
  parts.push(`User Question: ${question}`);
  parts.push('');
  parts.push('Tool Results:');
  
  for (const record of toolResults) {
    const { toolName, result } = record;
    
    if (!result.success) {
      parts.push(`- ${toolName}: ERROR - ${result.error}`);
      continue;
    }
    
    parts.push(`- ${toolName}:`);
    
    if (result.count !== undefined) {
      parts.push(`  Count: ${result.count}`);
    }
    
    if (result.records && result.records.length > 0) {
      parts.push(`  Records (${result.records.length}):`);
      for (const record of result.records.slice(0, 5)) {
        const summary = formatRecordSummary(record);
        parts.push(`    - ${summary}`);
      }
      if (result.records.length > 5) {
        parts.push(`    ... and ${result.records.length - 5} more`);
      }
    }
    
    if (result.metadata?.executionTimeMs) {
      parts.push(`  (Execution time: ${result.metadata.executionTimeMs}ms)`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Build the synthesis prompt
 */
function buildSynthesisPrompt(context: string, originalQuestion: string): string {
  return `You are an AI assistant for Saven InfraOps, an enterprise ITSM platform.

Based on the user's question and the database query results, generate a natural language response.

${context}

Task:
1. Answer the user's question directly based on the results
2. Be concise but informative
3. Include specific numbers and details when available
4. If no results found, say so clearly
5. If there are many results, summarize the key findings

Response Guidelines:
- Start with a direct answer to the question
- Use natural language, not technical terms
- Highlight important numbers or statuses
- Suggest relevant actions if appropriate
- Do not mention "the database" or "tool results" to the user

Generate your response now:`;
}

/**
 * Format a record for summary display
 */
function formatRecordSummary(record: Record<string, unknown>): string {
  const parts: string[] = [];
  
  // Try to extract meaningful fields
  const fields = ['ticketNo', 'incidentNo', 'assetNo', 'controlNo', 'title', 'name', 'status', 'priority', 'severity'];
  
  for (const field of fields) {
    if (record[field] !== undefined && record[field] !== null) {
      const value = String(record[field]);
      // Truncate long values
      const truncated = value.length > 30 ? value.slice(0, 30) + '...' : value;
      parts.push(truncated);
      break;
    }
  }
  
  // Add secondary field if available
  const secondaryFields = ['description', 'category', 'ownerName', 'assignedToName'];
  for (const field of secondaryFields) {
    if (record[field] !== undefined && record[field] !== null) {
      const value = String(record[field]);
      const truncated = value.length > 40 ? value.slice(0, 40) + '...' : value;
      parts.push(`(${truncated})`);
      break;
    }
  }
  
  return parts.join(' ') || 'Record';
}

/**
 * Generate a fallback response when LLM fails
 */
function generateFallbackResponse(toolResults: ToolCallRecord[]): { 
  answer: string; 
  provider: string; 
  model: string 
} {
  const parts: string[] = [];
  
  for (const record of toolResults) {
    if (!record.result.success) {
      parts.push(`Error querying ${record.toolName}: ${record.result.error}`);
      continue;
    }
    
    if (record.result.count !== undefined) {
      const entityName = getEntityDisplayName(record.toolName);
      parts.push(`Found ${record.result.count} ${entityName}.`);
    }
  }
  
  if (parts.length === 0) {
    return {
      answer: 'I was able to query the database but could not generate a response. Please try rephrasing your question.',
      provider: 'fallback',
      model: 'none'
    };
  }
  
  return {
    answer: parts.join(' '),
    provider: 'fallback',
    model: 'simple'
  };
}

/**
 * Get human-readable entity name
 */
function getEntityDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    'query_tickets': 'service requests',
    'query_incidents': 'incidents',
    'query_assets': 'assets',
    'query_compliance': 'compliance controls',
    'query_users': 'users',
    'query_roles': 'roles',
    'query_problems': 'problems',
    'query_changes': 'change requests',
    'query_access_requests': 'access requests',
    'query_projects': 'projects',
    'query_vendors': 'vendor licenses',
    'query_knowledge': 'knowledge articles',
    'query_audit_logs': 'audit log entries'
  };
  
  return names[toolName] || toolName;
}

/**
 * Aggregate cards from all tool results
 */
export function aggregateCards(toolResults: ToolCallRecord[]): AiCard[] {
  const allCards: AiCard[] = [];
  
  for (const record of toolResults) {
    if (record.result.success && record.result.cards) {
      allCards.push(...record.result.cards);
    }
  }
  
  // Remove duplicates based on title
  const seen = new Set<string>();
  return allCards.filter(card => {
    if (seen.has(card.title)) return false;
    seen.add(card.title);
    return true;
  });
}

/**
 * Extract navigation from tool results
 * Returns the first navigation action found
 */
export function extractNavigation(toolResults: ToolCallRecord[]): NavigationAction | undefined {
  for (const record of toolResults) {
    if (record.result.success && record.result.navigation) {
      return record.result.navigation;
    }
  }
  return undefined;
}
