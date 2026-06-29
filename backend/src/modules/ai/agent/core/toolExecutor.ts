/**
 * Tool Executor
 * 
 * Executes tools with proper error handling and timeout management.
 * Handles the execution of database tools and other tool types.
 */

import { Tool, ToolContext, ToolResult, ToolCallRecord } from '../types.js';

/**
 * Execute a single tool
 */
export async function executeTool(
  tool: Tool,
  parameters: Record<string, unknown>,
  context: ToolContext,
  timeoutMs: number = 30000
): Promise<ToolResult> {
  const startTime = Date.now();
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    // Execute tool with timeout
    const result = await Promise.race([
      tool.execute(parameters, context),
      timeoutPromise
    ]);
    
    // Add execution metadata
    return {
      ...result,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        toolName: tool.name
      }
    };
  } catch (error) {
    console.error(`[ToolExecutor] Error executing tool ${tool.name}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : `Tool execution failed: ${tool.name}`,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        toolName: tool.name
      }
    };
  }
}

/**
 * Execute multiple tools in parallel
 */
export async function executeToolsParallel(
  tools: { tool: Tool; parameters: Record<string, unknown> }[],
  context: ToolContext,
  timeoutMs: number = 30000
): Promise<ToolCallRecord[]> {
  // Execute all tools in parallel
  const results = await Promise.all(
    tools.map(async ({ tool, parameters }) => {
      const result = await executeTool(tool, parameters, context, timeoutMs);
      return {
        toolName: tool.name,
        parameters,
        result,
        executionTimeMs: result.metadata?.executionTimeMs || 0
      } as ToolCallRecord;
    })
  );
  
  return results;
}

/**
 * Execute tools sequentially (for dependent operations)
 */
export async function executeToolsSequential(
  tools: { tool: Tool; parameters: Record<string, unknown> }[],
  context: ToolContext,
  timeoutMs: number = 30000
): Promise<ToolCallRecord[]> {
  const results: ToolCallRecord[] = [];
  
  for (const { tool, parameters } of tools) {
    const result = await executeTool(tool, parameters, context, timeoutMs);
    results.push({
      toolName: tool.name,
      parameters,
      result,
      executionTimeMs: result.metadata?.executionTimeMs || 0
    });
    
    // If a tool fails, we might want to stop
    // For now, continue executing
  }
  
  return results;
}

/**
 * Execute tools with fallback
 * If primary tool fails, try fallback
 */
export async function executeWithFallback(
  primary: { tool: Tool; parameters: Record<string, unknown> },
  fallbacks: { tool: Tool; parameters: Record<string, unknown> }[],
  context: ToolContext,
  timeoutMs: number = 30000
): Promise<ToolCallRecord> {
  // Try primary
  try {
    const result = await executeTool(primary.tool, primary.parameters, context, timeoutMs);
    
    if (result.success) {
      return {
        toolName: primary.tool.name,
        parameters: primary.parameters,
        result,
        executionTimeMs: result.metadata?.executionTimeMs || 0
      };
    }
  } catch (error) {
    console.warn(`[ToolExecutor] Primary tool ${primary.tool.name} failed, trying fallbacks`);
  }
  
  // Try fallbacks
  for (const fallback of fallbacks) {
    try {
      const result = await executeTool(fallback.tool, fallback.parameters, context, timeoutMs);
      
      if (result.success) {
        console.log(`[ToolExecutor] Fallback tool ${fallback.tool.name} succeeded`);
        return {
          toolName: fallback.tool.name,
          parameters: fallback.parameters,
          result,
          executionTimeMs: result.metadata?.executionTimeMs || 0
        };
      }
    } catch (error) {
      console.warn(`[ToolExecutor] Fallback tool ${fallback.tool.name} also failed`);
    }
  }
  
  // All failed
  return {
    toolName: primary.tool.name,
    parameters: primary.parameters,
    result: {
      success: false,
      error: 'All tools failed'
    },
    executionTimeMs: 0
  };
}
