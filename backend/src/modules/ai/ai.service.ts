/**
 * AI Service
 * 
 * This module now delegates to the AI Agent Orchestrator.
 * The keyword-based routing has been replaced with intelligent intent classification
 * and tool execution.
 * 
 * The Agent Orchestrator:
 * 1. Classifies user intent
 * 2. Selects appropriate tools
 * 3. Executes tools with permission checking
 * 4. Synthesizes natural language responses
 */

import { runAgent } from './agent/agentOrchestrator.js';

export async function askAi(input: { 
  question: string; 
  userId?: string;
  userPermissions?: string[];
  userRoles?: string[];
}) {
  // Delegate to the Agent Orchestrator
  const result = await runAgent({
    question: input.question,
    userId: input.userId || '',
    userPermissions: input.userPermissions || [],
    userRoles: input.userRoles || []
  });

  // Return in the format expected by the frontend
  return {
    answer: result.answer,
    cards: result.cards,
    provider: result.provider,
    model: result.model
  };
}
