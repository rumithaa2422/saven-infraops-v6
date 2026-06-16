import { env } from '../../../config/env.js';

export async function runAiProvider(question: string): Promise<{ answer: string; raw?: unknown }> {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return runOpenAi(question);
    case 'claude':
      return runClaude(question);
    case 'private':
      return runPrivateModel(question);
    default:
      return { answer: `Mock AI response: I received your question, "${question}". Connect a real provider from Settings and environment variables.` };
  }
}

async function runOpenAi(question: string) {
  if (!env.OPENAI_API_KEY) return { answer: 'OpenAI provider selected, but OPENAI_API_KEY is missing.' };
  return { answer: `OpenAI adapter placeholder ready for question: ${question}` };
}

async function runClaude(question: string) {
  if (!env.CLAUDE_API_KEY) return { answer: 'Claude provider selected, but CLAUDE_API_KEY is missing.' };
  return { answer: `Claude adapter placeholder ready for question: ${question}` };
}

async function runPrivateModel(question: string) {
  if (!env.PRIVATE_AI_BASE_URL) return { answer: 'Private model selected, but PRIVATE_AI_BASE_URL is missing.' };
  return { answer: `Private model adapter placeholder ready for question: ${question}` };
}
