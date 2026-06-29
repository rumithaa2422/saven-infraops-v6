/**
 * Tool Selector
 * 
 * Filters and selects tools based on:
 * - User permissions
 * - Intent result
 * - Tool availability
 * 
 * CRITICAL FIX: NO FALLBACK TO ALL TOOLS.
 * If no tools are suggested, no database tools are executed.
 * 
 * NAVIGATION INTENTS: Must NEVER select any database tools.
 */

import { Tool, IntentResult, ToolContext, IntentType } from '../types.js';
import { getTool, allTools } from '../tools/registry.js';

/**
 * Result of tool selection
 */
export interface ToolSelectionResult {
  selectedTools: Tool[];
  deniedTools: { tool: Tool; reason: string }[];
  allFiltered: boolean;
}

/**
 * Intent types that NEVER trigger database tools
 */
const NO_TOOL_INTENTS: IntentType[] = ['NAVIGATION', 'UNKNOWN'];

/**
 * Check if user has all required permissions for a tool
 */
function hasRequiredPermissions(
  tool: Tool,
  userPermissions: string[]
): { hasPermission: boolean; missingPermissions: string[] } {
  const missingPermissions = tool.requiredPermissions.filter(
    perm => !userPermissions.includes(perm)
  );
  
  return {
    hasPermission: missingPermissions.length === 0,
    missingPermissions
  };
}

/**
 * Select tools based on intent and permissions
 * 
 * CRITICAL RULES:
 * - NAVIGATION and UNKNOWN intents → NO tools selected
 * - If suggestedTools is empty → NO tools selected
 * - Only ONE tool is selected per entity (based on suggestedTools)
 * - Tools must pass permission check
 */
export function selectTools(
  intentResult: IntentResult,
  context: ToolContext,
  maxTools: number = 5
): ToolSelectionResult {
  // CRITICAL: Navigation intents must NEVER select database tools
  if (NO_TOOL_INTENTS.includes(intentResult.type)) {
    return {
      selectedTools: [],
      deniedTools: [],
      allFiltered: true
    };
  }
  
  const selectedTools: Tool[] = [];
  const deniedTools: { tool: Tool; reason: string }[] = [];
  
  // Get suggested tools from intent
  const suggestedToolNames = intentResult.suggestedTools;
  
  // CRITICAL: If NO tools suggested, return empty selection
  // NO FALLBACK TO ALL DATABASE TOOLS
  if (suggestedToolNames.length === 0) {
    return {
      selectedTools: [],
      deniedTools: [],
      allFiltered: false
    };
  }
  
  // Only check the suggested tools (usually just one)
  const toolsToCheck = suggestedToolNames
    .map(name => getTool(name))
    .filter((t): t is Tool => t !== undefined);
  
  // Check permissions for each tool
  for (const tool of toolsToCheck) {
    // Check permissions
    const permCheck = hasRequiredPermissions(tool, context.userPermissions);
    
    if (permCheck.hasPermission) {
      selectedTools.push(tool);
    } else {
      deniedTools.push({
        tool,
        reason: `Missing permissions: ${permCheck.missingPermissions.join(', ')}`
      });
    }
    
    // Respect max tools limit
    if (selectedTools.length >= maxTools) {
      break;
    }
  }
  
  return {
    selectedTools,
    deniedTools,
    allFiltered: selectedTools.length === 0 && deniedTools.length > 0
  };
}

/**
 * Filter tools by user permissions only
 * Used when we want all available tools but filtered
 */
export function filterToolsByPermission(
  tools: Tool[],
  userPermissions: string[]
): { allowed: Tool[]; denied: { tool: Tool; reason: string }[] } {
  const allowed: Tool[] = [];
  const denied: { tool: Tool; reason: string }[] = [];
  
  for (const tool of tools) {
    const permCheck = hasRequiredPermissions(tool, userPermissions);
    
    if (permCheck.hasPermission) {
      allowed.push(tool);
    } else {
      denied.push({
        tool,
        reason: `Missing permissions: ${permCheck.missingPermissions.join(', ')}`
      });
    }
  }
  
  return { allowed, denied };
}

/**
 * Get all tools user has access to
 */
export function getAccessibleTools(userPermissions: string[]): Tool[] {
  return allTools.filter(tool => {
    const permCheck = hasRequiredPermissions(tool, userPermissions);
    return permCheck.hasPermission;
  });
}

/**
 * Check if a specific tool is accessible
 */
export function isToolAccessible(
  toolName: string,
  userPermissions: string[]
): { accessible: boolean; reason?: string } {
  const tool = getTool(toolName);
  
  if (!tool) {
    return { accessible: false, reason: 'Tool not found' };
  }
  
  const permCheck = hasRequiredPermissions(tool, userPermissions);
  
  if (!permCheck.hasPermission) {
    return {
      accessible: false,
      reason: `Missing permissions: ${permCheck.missingPermissions.join(', ')}`
    };
  }
  
  return { accessible: true };
}
