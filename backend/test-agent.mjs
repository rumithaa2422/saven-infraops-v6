/**
 * Direct AI Agent Test
 * Phase 6 - LLM-Driven Orchestration
 * Runs the agent pipeline directly without HTTP server
 */

import { runAgent } from './src/modules/ai/agent/agentOrchestrator.ts';

async function test() {
  const testCases = [
    { question: 'Go to incidents page', expected: 'NAVIGATION' },
    { question: 'How many users exist in the system?', expected: 'DATABASE_QUERY' },
    { question: 'What is DevOps?', expected: 'KNOWLEDGE' }
  ];
  
  for (const tc of testCases) {
    console.log('\n\n' + '='.repeat(60));
    console.log(`TEST: "${tc.question}"`);
    console.log('='.repeat(60));
    
    const result = await runAgent({
      question: tc.question,
      userId: 'test-user',
      userPermissions: ['users:view', 'tickets:view', 'incidents:view', 'assets:view', 'compliance:view'],
      userRoles: ['admin']
    });
    
    console.log('\n📤 FULL RESPONSE:');
    console.log(JSON.stringify({
      answer: result.answer,
      navigation: result.navigation,
      metadata: result.metadata
    }, null, 2));
  }
}

test().catch(console.error);
