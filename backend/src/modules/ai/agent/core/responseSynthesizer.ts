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

import { AiCard, NavigationAction, ToolResult } from '../types.js';
import { runAiProvider } from '../../providers/providerFactory.js';

/**
 * Synthesize a response from tool execution results
 */
export async function synthesizeResponse(
  question: string,
  toolResults: ToolResult[],
  intent: string
): Promise<{ answer: string; provider: string; model: string }> {
  // Check if any tools were executed
  const hasResults = toolResults.length > 0 && 
    toolResults.some(r => r.success && r.data);
  
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
function buildContext(question: string, toolResults: ToolResult[]): string {
  const parts: string[] = [];
  
  parts.push(`User Question: ${question}`);
  parts.push('');
  parts.push('Database Query Results:');
  
  for (const result of toolResults) {
    if (!result.success) {
      parts.push(`- Query: ERROR - ${result.error}`);
      continue;
    }
    
    if (result.count !== undefined) {
      parts.push(`Count: ${result.count}`);
    }
    
    if (result.records && result.records.length > 0) {
      parts.push(`Records (${result.records.length}):`);
      for (const record of result.records.slice(0, 5)) {
        const summary = formatRecordSummary(record);
        parts.push(`  - ${summary}`);
      }
      if (result.records.length > 5) {
        parts.push(`  ... and ${result.records.length - 5} more`);
      }
    }
    
    if (result.metadata?.executionTimeMs) {
      parts.push(`(Query time: ${result.metadata.executionTimeMs}ms)`);
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
function generateFallbackResponse(toolResults: ToolResult[]): { 
  answer: string; 
  provider: string; 
  model: string 
} {
  const parts: string[] = [];
  
  for (const result of toolResults) {
    if (!result.success) {
      parts.push(`Error: ${result.error}`);
      continue;
    }
    
    if (result.count !== undefined) {
      parts.push(`Found ${result.count} records.`);
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
 * Aggregate cards from all tool results
 */
export function aggregateCards(toolResults: ToolResult[]): AiCard[] {
  const allCards: AiCard[] = [];
  
  for (const result of toolResults) {
    if (result.success && result.cards) {
      allCards.push(...result.cards);
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
export function extractNavigation(toolResults: ToolResult[]): NavigationAction | undefined {
  for (const result of toolResults) {
    if (result.success && result.navigation) {
      return result.navigation;
    }
  }
  return undefined;
}
