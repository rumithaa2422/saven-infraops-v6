/**
 * AI Provider Factory
 * 
 * Routes AI requests to the appropriate provider based on configuration.
 * Current providers: Mock, OpenAI, Claude, Gemini, Private model
 */

import { env } from '../../../config/env.js';
import { runOpenAi } from './openai.js';
import { runGemini } from './gemini.js';

/**
 * Provider response interface
 */
export interface ProviderResponse {
  answer: string;
  raw?: unknown;
  metadata?: {
    model: string;
    provider: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
  };
}

/**
 * Main entry point for AI provider calls
 * Routes to the appropriate provider based on env.AI_PROVIDER
 */
export async function runAiProvider(question: string): Promise<ProviderResponse> {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return runOpenAi(question);
    case 'gemini':
      return runGemini(question);
    case 'claude':
      return runClaude(question);
    case 'private':
      return runPrivateModel(question);
    default:
      return { 
        answer: `Mock AI response: I received your question, "${question}". Connect a real provider from Settings and environment variables.` 
      };
  }
}

// Claude stub - to be implemented in Phase AI-2
async function runClaude(question: string): Promise<ProviderResponse> {
  if (!env.CLAUDE_API_KEY) {
    return { 
      answer: 'Claude provider is selected but CLAUDE_API_KEY is not configured. Please set the CLAUDE_API_KEY environment variable.',
      metadata: { model: env.CLAUDE_MODEL || 'unknown', provider: 'claude' }
    };
  }
  return { 
    answer: `Claude integration coming soon! Your question was: "${question}"`,
    metadata: { model: env.CLAUDE_MODEL || 'unknown', provider: 'claude' }
  };
}

// Private model stub - to be implemented later
async function runPrivateModel(question: string): Promise<ProviderResponse> {
  if (!env.PRIVATE_AI_BASE_URL) {
    return { 
      answer: 'Private model is selected but PRIVATE_AI_BASE_URL is not configured.',
      metadata: { model: env.PRIVATE_AI_MODEL || 'unknown', provider: 'private' }
    };
  }
  return { 
    answer: `Private model integration coming soon! Your question was: "${question}"`,
    metadata: { model: env.PRIVATE_AI_MODEL || 'unknown', provider: 'private' }
  };
}
