/**
 * Direct AI Agent Test
 * Phase 6 - LLM-Driven Orchestration
 * Runs the agent pipeline directly without HTTP server
 */

import { runAgent } from './src/modules/ai/agent/agentOrchestrator.ts';

async function test() {
  const testCases = [
    { question: 'How many users exist in the system?', expected: 'DATABASE_QUERY' },
    { question: 'How many SEV1 incidents?', expected: 'DATABASE_QUERY' },
    { question: 'Go to incidents page', expected: 'NAVIGATION' },
    { question: 'What is DevOps?', expected: 'KNOWLEDGE' },
    { question: 'Show users and go to dashboard', expected: 'MIXED' }
  ];
  
  for (const tc of testCases) {
    console.log('\n\n' + '='.repeat(60));
    console.log(`TEST: "${tc.question}"`);
    console.log(`EXPECTED: ${tc.expected}`);
    console.log('='.repeat(60) + '\n');
    
    const result = await runAgent({
      question: tc.question,
      userId: 'test-user',
      userPermissions: ['users:view', 'tickets:view', 'incidents:view', 'assets:view', 'compliance:view'],
      userRoles: ['admin']
    });
    
    console.log('\n📤 FINAL RESPONSE:');
    console.log('Intent:', result.metadata?.intent);
    console.log('Entity:', result.metadata?.entity || 'none');
    console.log('Tools Used:', result.metadata?.toolsUsed?.join(', ') || 'none');
    console.log('Navigation:', result.navigation ? result.navigation.route : 'none');
    console.log('Answer:', result.answer.substring(0, 100) + '...');
  }
}

test().catch(console.error);
