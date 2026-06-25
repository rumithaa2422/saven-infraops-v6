/**
 * Anthropic Claude Provider Implementation
 * Phase AI-2: Claude Integration
 * 
 * Provides real AI responses using Anthropic's Claude API.
 * Integrates with the existing provider factory architecture.
 */

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../../config/env.js';

/**
 * Response interface matching the provider factory contract
 */
export interface ClaudeProviderResponse {
  answer: string;
  raw?: unknown;
  metadata?: {
    model: string;
    provider: 'claude';
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
  };
}

/**
 * Options for Claude requests
 */
export interface ClaudeOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * System prompt for ITSM context
 */
const SYSTEM_PROMPT = `You are an AI assistant for Saven InfraOps Command Center, an enterprise ITSM (IT Service Management) platform.

Your capabilities:
- Answer questions about service requests, incidents, assets, compliance, and access management
- Provide summaries of open tickets and their priorities
- Help users navigate the platform and understand ITSM workflows
- Explain ITSM concepts and best practices (ITIL framework)
- Assist with troubleshooting common IT issues

Guidelines:
- Be concise and helpful in your responses
- When providing counts or summaries, mention the data source
- If you don't know something, say so clearly
- Focus on actionable information
- Use professional tone appropriate for enterprise IT environments

Current date: ${new Date().toISOString().split('T')[0]}`;

/**
 * Execute a Claude messages API request
 * 
 * @param question - The user's question
 * @param options - Optional configuration (temperature, maxTokens)
 * @returns ClaudeProviderResponse with answer and metadata
 */
export async function runClaude(
  question: string,
  options?: ClaudeOptions
): Promise<ClaudeProviderResponse> {
  const model = env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest';
  const temperature = options?.temperature ?? env.CLAUDE_TEMPERATURE ?? 0.7;
  const maxTokens = options?.maxTokens ?? env.CLAUDE_MAX_TOKENS ?? 4096;

  // Validate API key
  if (!env.CLAUDE_API_KEY) {
    return {
      answer: 'Claude provider is selected but CLAUDE_API_KEY is not configured. Please set the CLAUDE_API_KEY environment variable.',
      metadata: {
        model,
        provider: 'claude',
      },
    };
  }

  // Initialize Claude client
  const client = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
  });

  const startTime = Date.now();

  try {
    // Create message using the Claude messages API
    const response = await client.messages.create({
      model,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const latencyMs = Date.now() - startTime;

    // Extract response text
    const content = response.content[0];
    const answer = content.type === 'text' ? content.text : 'No text response from Claude.';

    // Get token usage
    const usage = response.usage;

    return {
      answer,
      raw: response,
      metadata: {
        model,
        provider: 'claude',
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
        latencyMs,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Handle specific Claude errors
    if (error instanceof Anthropic.APIError) {
      console.error(`[Claude] API Error: ${error.status} - ${error.message}`);
      
      // Provide user-friendly error messages based on status code
      if (error.status === 401) {
        return {
          answer: 'Claude authentication failed. Please check your CLAUDE_API_KEY is valid.',
          metadata: { model, provider: 'claude', latencyMs },
        };
      }
      
      if (error instanceof Anthropic.RateLimitError) {
        return {
          answer: 'Claude rate limit exceeded. Please wait a moment and try again.',
          metadata: { model, provider: 'claude', latencyMs },
        };
      }
      
      if (error.status === 429) {
        return {
          answer: 'Claude rate limit exceeded. Please wait a moment and try again.',
          metadata: { model, provider: 'claude', latencyMs },
        };
      }
      
      if (error.status === 400) {
        return {
          answer: `Claude request rejected: ${error.message}`,
          metadata: { model, provider: 'claude', latencyMs },
        };
      }
      
      if (error.status === 500 || error.status === 503) {
        return {
          answer: 'Claude service is currently unavailable. Please try again later.',
          metadata: { model, provider: 'claude', latencyMs },
        };
      }

      return {
        answer: `Claude error (${error.status}): ${error.message}`,
        metadata: { model, provider: 'claude', latencyMs },
      };
    }

    // Handle connection errors
    if (error instanceof Anthropic.APIConnectionError) {
      console.error(`[Claude] Connection error: ${error.message}`);
      return {
        answer: 'Failed to connect to Claude. Please check your internet connection.',
        metadata: { model, provider: 'claude', latencyMs },
      };
    }

    // Handle timeout errors
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      console.error(`[Claude] Request timeout`);
      return {
        answer: 'Claude request timed out. Please try again or use a simpler question.',
        metadata: { model, provider: 'claude', latencyMs },
      };
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Claude] Unexpected error: ${errorMessage}`);

    return {
      answer: `Claude request failed: ${errorMessage}`,
      metadata: { model, provider: 'claude', latencyMs },
    };
  }
}

/**
 * Validate Claude configuration
 * Returns true if Claude is properly configured
 */
export function isClaudeConfigured(): boolean {
  return Boolean(env.CLAUDE_API_KEY && env.AI_PROVIDER === 'claude');
}
