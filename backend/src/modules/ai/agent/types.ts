/**
 * AI Agent Core Types
 * 
 * This module defines all the core types and interfaces used by the AI Agent system.
 * These types provide the foundation for:
 * - Tool definitions and execution
 * - Intent classification
 * - Agent orchestration
 * - Response synthesis
 * 
 * Note: Conversation history is handled entirely on the frontend.
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Tool category classification
 */
export type ToolCategory = 'database' | 'navigation' | 'knowledge' | 'system' | 'custom';

/**
 * Parameter schema for tool inputs
 */
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  default?: unknown;
  maximum?: number;
  minimum?: number;
  items?: { type: string };
}

/**
 * Schema for tool parameters
 */
export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

/**
 * Execution context passed to all tools
 * Contains user information and database access
 */
export interface ToolContext {
  userId: string;
  userPermissions: string[];
  userRoles: string[];
  prisma: PrismaClient;
}

/**
 * Result returned by tool execution
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  count?: number;
  records?: Record<string, unknown>[];
  cards?: AiCard[];
  navigation?: NavigationAction;
  error?: string;
  metadata?: {
    executionTimeMs: number;
    toolName: string;
  };
}

/**
 * Card format for UI display
 */
export interface AiCard {
  title: string;
  value?: string;
  description?: string;
  href?: string;
}

/**
 * Navigation action for frontend
 */
export interface NavigationAction {
  route: string;
  label: string;
  description?: string;
  context?: {
    filters?: Record<string, string>;
    selectedId?: string;
    tab?: string;
    modalAction?: 'create' | 'edit' | 'view';
  };
}

/**
 * Tool executor function signature
 */
export type ToolExecutor = (
  params: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

/**
 * Main Tool interface
 * All tools must implement this interface
 */
export interface Tool {
  name: string;
  description: string;
  category: ToolCategory;
  requiredPermissions: string[];
  parameters: ToolParameterSchema;
  execute: ToolExecutor;
}

// ============================================================================
// Intent Types
// ============================================================================

/**
 * Supported intent types
 */
export type IntentType = 
  | 'DATABASE_QUERY'    // Querying database entities
  | 'NAVIGATION'        // Navigating to pages
  | 'KNOWLEDGE'         // General knowledge questions
  | 'MIXED'            // Multiple intents combined
  | 'UNKNOWN';         // Unclassified intent

/**
 * Extracted entities from user input
 */
export interface ExtractedEntities {
  primaryEntity?: string;
  filters: Record<string, unknown>;
  modifiers: string[];
}

/**
 * Intent classification result
 */
export interface IntentResult {
  type: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  suggestedTools: string[];
  parameters: Record<string, unknown>;
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent request input
 */
export interface AgentInput {
  question: string;
  userId: string;
  userPermissions: string[];
  userRoles: string[];
}

/**
 * Agent response output (compatible with frontend)
 */
export interface AgentOutput {
  answer: string;
  cards: AiCard[];
  provider: string;
  model: string;
  navigation?: NavigationAction;
  metadata?: {
    intent?: IntentType;
    toolsUsed?: string[];
    executionTimeMs?: number;
  };
}
