/**
 * AI Agent Module
 * 
 * This module exports all AI Agent components for easy importing.
 */

// Main orchestrator
export { runAgent, shutdownAgent } from './agentOrchestrator.js';

// Types
export * from './types.js';

// Tools
export { 
  allTools, 
  databaseTools, 
  systemTools, 
  knowledgeTools,
  customTools,
  getTool, 
  getToolsByCategory,
  getToolsByPermission,
  getToolNames,
  getToolDescriptions
} from './tools/registry.js';

// Core components (for testing/debugging)
export { classifyIntent, extractToolParameters } from './core/intentClassifier.js';
export { selectTools, filterToolsByPermission, getAccessibleTools } from './core/toolSelector.js';
export { executeTool, executeToolsParallel, executeToolsSequential } from './core/toolExecutor.js';
export { synthesizeResponse, aggregateCards, extractNavigation } from './core/responseSynthesizer.js';
