/**
 * Tool Registry
 * 
 * Phase 6: Unified tool system
 * 
 * Central registry for all available AI Agent tools.
 * 
 * NOTE: Phase 6 uses a single unified database tool (queryDatabaseTool)
 * that handles ALL entities. The old entity-specific tools are deprecated.
 */

import { Tool } from '../types.js';

// Import the unified database tool (Phase 6)
import { queryDatabaseTool } from './database/queryDatabaseTool.js';

/**
 * Database tools - unified query tool
 * Phase 6: Single tool handles all entities
 */
export const databaseTools: Tool[] = [
  queryDatabaseTool
];

/**
 * System tools - internal operations (not yet implemented)
 */
export const systemTools: Tool[] = [];

/**
 * Knowledge tools - use LLM for general questions (not used in Phase 6)
 */
export const knowledgeTools: Tool[] = [];

/**
 * Custom tools - business logic operations (not yet implemented)
 */
export const customTools: Tool[] = [];

/**
 * All registered tools
 */
export const allTools: Tool[] = [
  ...databaseTools,
  ...systemTools,
  ...knowledgeTools,
  ...customTools,
];

/**
 * Tool lookup map for O(1) access by name
 */
export const toolByName: Map<string, Tool> = new Map(
  allTools.map(tool => [tool.name, tool])
);

/**
 * Get a tool by name
 * @param name - The tool name
 * @returns The tool or undefined if not found
 */
export function getTool(name: string): Tool | undefined {
  return toolByName.get(name);
}

/**
 * Get all tools in a category
 * @param category - The tool category
 * @returns Array of tools in the category
 */
export function getToolsByCategory(category: string): Tool[] {
  return allTools.filter(tool => tool.category === category);
}

/**
 * Get tools that require a specific permission
 * @param permission - The permission to check
 * @returns Array of tools requiring this permission
 */
export function getToolsByPermission(permission: string): Tool[] {
  return allTools.filter(tool => 
    tool.requiredPermissions.includes(permission)
  );
}

/**
 * Get tool names for logging/debugging
 */
export function getToolNames(): string[] {
  return allTools.map(tool => tool.name);
}

/**
 * Get tool descriptions for LLM context
 * Returns a formatted string of all tool descriptions
 */
export function getToolDescriptions(): string {
  return allTools
    .map(tool => `- **${tool.name}**: ${tool.description}`)
    .join('\n');
}
