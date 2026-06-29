/**
 * Agent Orchestrator
 * 
 * Phase 6: LLM-Driven Orchestration System
 * 
 * Main entry point for the AI Agent system.
 * Uses LLM-based intent resolution instead of keyword matching.
 * 
 * Flow:
 * 1. LLM Intent Resolution (llmIntentResolver)
 * 2. Tool Execution based on intent
 * 3. Response Synthesis
 */

import { PrismaClient } from '@prisma/client';
import { 
  AgentInput, 
  AgentExecutionResult, 
  AgentOutput,
  ToolContext,
  ToolCallRecord
} from './types.js';
import { resolveIntent, LlmIntentResult } from './core/llmIntentResolver.js';
import { synthesizeResponse, aggregateCards } from './core/responseSynthesizer.js';
import { queryDatabaseTool } from './tools/database/queryDatabaseTool.js';

/**
 * Prisma client singleton
 */
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma instance
 */
function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Build tool context from agent input
 */
function buildToolContext(input: AgentInput): ToolContext {
  return {
    userId: input.userId,
    userPermissions: input.userPermissions,
    userRoles: input.userRoles,
    prisma: getPrisma()
  };
}

/**
 * Main agent orchestration function
 * 
 * Phase 6: LLM-driven orchestration
 * 
 * STEP 1: Call llmIntentResolver(question) → structured intent
 * STEP 2: Based on intent:
 *   - KNOWLEDGE → LLM only (no DB)
 *   - NAVIGATION → return navigation
 *   - DATABASE_QUERY → call query_database tool
 *   - MIXED → DB tool + navigation
 *   - ACTION → (future) call action tool
 * STEP 3: Synthesize response
 */
export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const toolCalls: ToolCallRecord[] = [];
  
  console.log('\n========================================');
  console.log('[AGENT] Phase 6 - LLM-Driven Orchestration');
  console.log('[AGENT] Question:', input.question.substring(0, 80));
  console.log('========================================\n');
  
  try {
    // ========================================
    // STEP 1: LLM INTENT RESOLUTION
    // ========================================
    console.log('[AGENT] Step 1: LLM Intent Resolution...');
    const llmIntent = await resolveIntent(input.question);
    
    console.log('\n--- LLM INTENT OUTPUT ---');
    console.log('Intent:', llmIntent.intent);
    console.log('Entity:', llmIntent.entity || 'none');
    console.log('Operation:', llmIntent.operation);
    console.log('Filters:', JSON.stringify(llmIntent.filters));
    console.log('Route:', llmIntent.route || 'none');
    console.log('Confidence:', llmIntent.confidence);
    console.log('Reasoning:', llmIntent.reasoning);
    console.log('--------------------------\n');
    
    // Build tool context
    const context = buildToolContext(input);
    
    // ========================================
    // STEP 2: ROUTE BASED ON INTENT
    // ========================================
    
    // KNOWLEDGE: LLM only, no database
    if (llmIntent.intent === 'KNOWLEDGE') {
      console.log('[AGENT] Intent is KNOWLEDGE → LLM only\n');
      
      const llmResult = await synthesizeResponse(
        input.question,
        [],
        'KNOWLEDGE'
      );
      
      return {
        answer: llmResult.answer,
        cards: [],
        provider: llmResult.provider,
        model: llmResult.model,
        metadata: {
          intent: 'KNOWLEDGE',
          entity: null,
          filters: {},
          toolsUsed: []
        }
      };
    }
    
    // NAVIGATION: Return navigation only
    if (llmIntent.intent === 'NAVIGATION') {
      console.log('[AGENT] Intent is NAVIGATION → Returning route\n');
      
      const llmResult = await synthesizeResponse(
        input.question,
        [],
        'NAVIGATION'
      );
      
      const navigation = llmIntent.route ? {
        route: llmIntent.route,
        label: 'Navigate',
        description: `Navigate to ${llmIntent.route}`
      } : undefined;
      
      return {
        answer: llmResult.answer,
        cards: [],
        navigation,
        provider: llmResult.provider,
        model: llmResult.model,
        metadata: {
          intent: 'NAVIGATION',
          entity: null,
          filters: {},
          toolsUsed: []
        }
      };
    }
    
    // DATABASE_QUERY: Execute unified database tool
    if (llmIntent.intent === 'DATABASE_QUERY' || llmIntent.intent === 'MIXED') {
      console.log('[AGENT] Intent is DATABASE_QUERY/MIXED → Executing query_database tool\n');
      
      // Prepare parameters for unified database tool
      const toolParams: Record<string, unknown> = {
        entity: llmIntent.entity,
        operation: llmIntent.operation,
        filters: llmIntent.filters,
        limit: 10,
        offset: 0,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      };
      
      console.log('\n--- TOOL EXECUTION ---');
      console.log('Tool: query_database');
      console.log('Parameters:', JSON.stringify(toolParams, null, 2));
      console.log('--------------------\n');
      
      // Execute the unified database tool
      const result = await queryDatabaseTool.execute(toolParams, context);
      
      const toolResult: ToolCallRecord = {
        toolName: 'query_database',
        result,
        executionTimeMs: result.metadata?.executionTimeMs || 0
      };
      
      console.log('\n--- TOOL RESULT ---');
      console.log('Success:', result.success);
      console.log('Count:', result.count || 0);
      console.log('Cards:', result.cards?.length || 0);
      if (result.error) {
        console.log('Error:', result.error);
      }
      console.log('-------------------\n');
      
      toolCalls.push(toolResult);
      
      // Check if tool succeeded
      if (!result.success) {
        console.log('[AGENT] Database query failed → Falling back to LLM\n');
        
        const llmResult = await synthesizeResponse(
          input.question,
          [toolResult],
          'DATABASE_QUERY'
        );
        
        return {
          answer: llmResult.answer,
          cards: [],
          provider: llmResult.provider,
          model: llmResult.model,
          metadata: {
            intent: llmIntent.intent,
            entity: llmIntent.entity,
            filters: llmIntent.filters,
            toolsUsed: ['query_database']
          }
        };
      }
      
      // Get cards from result
      const cards = result.cards || [];
      console.log(`[AGENT] Got ${cards.length} cards from database\n`);
      
      // Synthesize response with database results
      const synthesizedResponse = await synthesizeResponse(
        input.question,
        [toolResult],
        'DATABASE_QUERY'
      );
      
      // Handle MIXED intent: add navigation if present
      let navigation = undefined;
      if (llmIntent.intent === 'MIXED' && llmIntent.route) {
        navigation = {
          route: llmIntent.route,
          label: 'Navigate',
          description: `Navigate to ${llmIntent.route}`
        };
      }
      
      // Log conversation
      await logConversation(input, {
        answer: synthesizedResponse.answer,
        cards,
        navigation,
        toolCalls,
        provider: synthesizedResponse.provider,
        model: synthesizedResponse.model,
        intent: llmIntent.intent,
        executionTimeMs: Date.now() - startTime
      });
      
      console.log('\n========================================');
      console.log(`[AGENT] Complete! Execution time: ${Date.now() - startTime}ms`);
      console.log('========================================\n');
      
      return {
        answer: synthesizedResponse.answer,
        cards,
        navigation,
        provider: synthesizedResponse.provider,
        model: synthesizedResponse.model,
        metadata: {
          intent: llmIntent.intent,
          entity: llmIntent.entity,
          filters: llmIntent.filters,
          toolsUsed: ['query_database']
        }
      };
    }
    
    // ACTION: (Future implementation)
    if (llmIntent.intent === 'ACTION') {
      console.log('[AGENT] Intent is ACTION → Not yet implemented\n');
      
      const llmResult = await synthesizeResponse(
        input.question,
        [],
        'ACTION'
      );
      
      return {
        answer: 'Action handling is not yet implemented. Please use the platform UI for actions.',
        cards: [],
        provider: llmResult.provider,
        model: llmResult.model,
        metadata: {
          intent: 'ACTION',
          entity: llmIntent.entity,
          filters: {},
          toolsUsed: []
        }
      };
    }
    
    // UNKNOWN: LLM fallback
    console.log('[AGENT] Intent is UNKNOWN → LLM fallback\n');
    
    const llmResult = await synthesizeResponse(
      input.question,
      [],
      'UNKNOWN'
    );
    
    return {
      answer: llmResult.answer,
      cards: [],
      provider: llmResult.provider,
      model: llmResult.model,
      metadata: {
        intent: 'UNKNOWN',
        entity: null,
        filters: {},
        toolsUsed: []
      }
    };
    
  } catch (error) {
    console.error('[AGENT] Orchestrator error:', error);
    
    return {
      answer: 'I encountered an error processing your request. Please try again.',
      cards: [],
      provider: 'error',
      model: 'none',
      metadata: {
        intent: 'UNKNOWN',
        entity: null,
        filters: {},
        toolsUsed: []
      }
    };
  }
}

/**
 * Log conversation to database
 */
async function logConversation(
  input: AgentInput,
  result: AgentExecutionResult
): Promise<void> {
  try {
    const prisma = getPrisma();
    
    await prisma.aiConversation.create({
      data: {
        userId: input.userId || null,
        question: input.question,
        answer: result.answer,
        provider: result.provider,
        sourceJson: {
          intent: result.intent,
          toolsUsed: result.metadata?.toolsUsed || [],
          executionTimeMs: result.executionTimeMs
        } as any
      }
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[Agent] Failed to log conversation:', error);
  }
}

/**
 * Shutdown the agent (cleanup resources)
 */
export async function shutdownAgent(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
