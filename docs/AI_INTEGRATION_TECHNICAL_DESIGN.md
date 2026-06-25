# AI Integration Technical Design Document

**Date:** 2026-06-24  
**Project:** Saven InfraOps Command Center  
**Version:** Phase AI-DESIGN  
**Status:** DESIGN REVIEW

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Current AI Request Flow](#3-current-ai-request-flow)
4. [Files Involved in AI Processing](#4-files-involved-in-ai-processing)
5. [Implementation Status Matrix](#5-implementation-status-matrix)
6. [Recommended Production Architecture](#6-recommended-production-architecture)
7. [OpenAI Integration Design](#7-openai-integration-design)
8. [Claude Integration Design](#8-claude-integration-design)
9. [Gemini Integration Design](#9-gemini-integration-design)
10. [Azure OpenAI Analysis](#10-azure-openai-analysis)
11. [OpenRouter Analysis](#11-openrouter-analysis)
12. [RAG Implementation Analysis](#12-rag-implementation-analysis)
13. [Knowledge Base Connection Analysis](#13-knowledge-base-connection-analysis)
14. [Database Schema Changes](#14-database-schema-changes)
15. [Security Considerations](#15-security-considerations)
16. [Cost Optimization Recommendations](#16-cost-optimization-recommendations)
17. [Phased Implementation Plan](#17-phased-implementation-plan)

---

## 1. Executive Summary

### Purpose
This document provides a comprehensive technical design for integrating real AI providers into the Saven InfraOps Command Center enterprise ITSM platform.

### Current State
The project has a solid foundation with working frontend UI components, backend API, and keyword-based routing. However, the AI provider integrations are stubs that need real implementation.

### Key Recommendations

| Provider | Recommendation | Priority |
|----------|----------------|---------|
| OpenAI | **IMPLEMENT FIRST** | Critical |
| Claude | Implement second | High |
| Gemini | Implement third | Medium |
| Azure OpenAI | Implement for enterprise | High |
| OpenRouter | Optional - consider later | Low |
| RAG | Implement post-basic integration | Medium |
| Knowledge Base | Connect during RAG phase | Medium |

### Estimated Timeline
- **Phase 1 (Week 1):** OpenAI + Claude integration
- **Phase 2 (Week 2):** Gemini + Azure OpenAI
- **Phase 3 (Week 3):** Conversation Memory + RAG foundation
- **Phase 4 (Week 4):** Streaming + Advanced RAG

---

## 2. Current State Analysis

### What's Working
1. **Frontend UI:** AssistantPanel and CommandBar are fully functional
2. **Backend API:** `/api/ai/ask` endpoint with RBAC
3. **Keyword Routing:** Real database queries for tickets, incidents, assets, compliance
4. **Conversation Logging:** All queries saved to `AiConversation` table
5. **Provider Factory:** Switch-based architecture ready for extensions

### What's Stubbed
1. **OpenAI Provider:** Switch case exists, no actual API call
2. **Claude Provider:** Switch case exists, no actual API call
3. **Private Model:** Switch case exists, no actual HTTP call

### What's Missing
1. Real provider SDK integration
2. Conversation memory (context in prompts)
3. RAG pipeline (Knowledge Base integration)
4. Streaming responses
5. Enterprise provider support (Azure OpenAI)
6. Multi-model access (OpenRouter)
7. Usage tracking and cost monitoring

---

## 3. Current AI Request Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT AI REQUEST FLOW                            │
└──────────────────────────────────────────────────────────────────────────────┘

USER INTERFACE                    FRONTEND                    BACKEND
     │                               │                          │
     │  1. Type question             │                          │
     │──────────────────────────────>│                          │
     │                               │                          │
     │                               │  2. POST /api/ai/ask     │
     │                               │─────────────────────────>│
     │                               │                          │
     │                               │                          │  3. Validate JWT
     │                               │                          │     Check ai:ask permission
     │                               │                          │
     │                               │                          │  4. Parse request
     │                               │                          │     Validate with Zod
     │                               │                          │
     │                               │                          │  5. ai.service.ts
     │                               │                          │     ┌─────────────────────┐
     │                               │                          │     │ Check keywords:      │
     │                               │                          │     │ - "ticket"          │
     │                               │                          │     │ - "incident"         │
     │                               │                          │     │ - "asset"           │
     │                               │                          │     │ - "compliance"       │
     │                               │                          │     │ - (fallback) AI     │
     │                               │                          │     └──────────┬──────────┘
     │                               │                          │                │
     │                               │                          │     ┌─────────▼─────────┐
     │                               │                          │     │ If ITSM keyword:   │
     │                               │                          │     │ Query database     │
     │                               │                          │     │ Return structured  │
     │                               │                          │     │ answer + cards     │
     │                               │                          │     └─────────────────┘
     │                               │                          │                │
     │                               │                          │     ┌─────────▼─────────┐
     │                               │                          │     │ If fallback:       │
     │                               │                          │     │ providerFactory    │
     │                               │                          │     │ ⚠️ STUB ONLY       │
     │                               │                          │     └─────────────────┘
     │                               │                          │
     │                               │  6. Save to database      │
     │                               │     AiConversation table │
     │                               │─────────────────────────>│
     │                               │                          │
     │                               │  7. Return response      │
     │                               │<─────────────────────────│
     │                               │     { answer, cards,    │
     │                               │       provider }         │
     │                               │                          │
     │  8. Display answer + cards    │                          │
     │<──────────────────────────────│                          │
     │                               │                          │

```

### Flow Description

1. **User Input:** User types a question in AssistantPanel or CommandBar
2. **API Call:** Frontend sends POST to `/api/ai/ask` with `{ question }`
3. **Authentication:** Backend validates JWT token
4. **Authorization:** Backend checks `ai:ask` permission
5. **Service Logic:** `ai.service.ts` processes the request:
   - Checks for ITSM keywords (ticket, incident, asset, compliance)
   - If keyword found → Query database directly
   - If no keyword → Call AI provider (currently stub)
6. **Logging:** Save conversation to `AiConversation` table
7. **Response:** Return `{ answer, cards, provider }` to frontend
8. **Display:** Frontend renders answer text and result cards

---

## 4. Files Involved in AI Processing

### Frontend Files

| File | Purpose | Lines |
|------|---------|-------|
| `AssistantPanel.tsx` | Right-side AI panel with chat interface | 90 |
| `CommandBar.tsx` | Bottom bar for quick AI queries | 48 |
| `AppShell.tsx` | Main layout integrating AI components | 49 |
| `api.ts` | API client for `/api/ai/ask` calls | - |

### Backend Files

| File | Purpose | Status |
|------|---------|--------|
| `ai.routes.ts` | Express router, endpoint definitions | ✅ Working |
| `ai.service.ts` | Business logic, keyword routing | ✅ Working |
| `providerFactory.ts` | Provider switch factory | ⚠️ Stubs |
| `env.ts` | Environment configuration | ⚠️ Partial |
| `auth.ts` | JWT authentication middleware | ✅ Working |
| `rbac.ts` | Permission checking (`ai:ask`) | ✅ Working |

### Database Files

| File | Purpose |
|------|---------|
| `schema.prisma` | AiConversation model |
| `seed.ts` | AI permission (`ai:ask`) |

### Files Needing Changes

| File | Changes Required |
|------|------------------|
| `providerFactory.ts` | Implement real API calls |
| `env.ts` | Add missing env vars |
| `schema.prisma` | Add conversation memory fields |
| `ai.service.ts` | Add conversation context |
| `AssistantPanel.tsx` | Add streaming support (future) |

---

## 5. Implementation Status Matrix

| Component | File | Current Status | Required Changes |
|-----------|------|-----------------|------------------|
| **Frontend** |
| AI Panel UI | AssistantPanel.tsx | ✅ Complete | Streaming support (future) |
| Command Bar | CommandBar.tsx | ✅ Complete | None |
| Layout Integration | AppShell.tsx | ✅ Complete | None |
| **Backend** |
| Route Handler | ai.routes.ts | ✅ Complete | None |
| Service Logic | ai.service.ts | ✅ Complete | Conversation context |
| Provider Factory | providerFactory.ts | ⚠️ Stub | Real implementations |
| OpenAI Adapter | providerFactory.ts | ❌ Stub | Full implementation |
| Claude Adapter | providerFactory.ts | ❌ Stub | Full implementation |
| Private Adapter | providerFactory.ts | ❌ Stub | HTTP client |
| Gemini Adapter | providerFactory.ts | ❌ Missing | New file/function |
| Azure Adapter | providerFactory.ts | ❌ Missing | New file/function |
| **Configuration** |
| Env Schema | env.ts | ⚠️ Partial | Add missing vars |
| **Database** |
| Conversation Table | schema.prisma | ⚠️ Basic | Add memory fields |
| Permission Seed | seed.ts | ✅ Complete | None |

---

## 6. Recommended Production Architecture

### Proposed Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        RECOMMENDED PRODUCTION ARCHITECTURE                      │
└────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────────┐
                                    │   User Input         │
                                    │   (AssistantPanel /   │
                                    │    CommandBar)        │
                                    └──────────┬───────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AssistantPanel.tsx                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │ • Question input (text field)                                   │   │ │
│  │  │ • Suggestion buttons (predefined queries)                       │   │ │
│  │  │ • Answer display (markdown support)                             │   │ │
│  │  │ • Result cards (linked to modules)                               │   │ │
│  │  │ • Streaming indicator (future)                                  │   │ │
│  │  │ • Conversation thread (future)                                 │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                         │
│                                      │ POST /api/ai/ask                       │
│                                      ▼                                         │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Express)                                 │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  ai.routes.ts                                                           │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ POST /api/ai/ask                                                   │ │  │
│  │  │ • requireAuth (JWT validation)                                     │ │  │
│  │  │ • requirePermission('ai:ask')                                     │ │  │
│  │  │ • Rate limiting (per-user)                                        │ │  │
│  │  │ • Request validation (Zod)                                        │ │  │
│  │  │ • Timeout handling                                                │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                           │
│                                      ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  ai.service.ts                                                         │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ askAi({ question, userId, conversationId? })                      │ │  │
│  │  │                                                                     │ │  │
│  │  │ 1. Intent Detection                                                │ │  │
│  │  │    ├─ ITSM Queries (tickets, incidents, assets, compliance)         │ │  │
│  │  │    └─ General AI Queries (fallback to provider)                    │ │  │
│  │  │                                                                     │ │  │
│  │  │ 2. Context Building (for AI queries)                               │ │  │
│  │  │    ├─ Load conversation history                                    │ │  │
│  │  │    ├─ Load relevant ITSM data (RAG - future)                       │ │  │
│  │  │    └─ Build prompt with system context                              │ │  │
│  │  │                                                                     │ │  │
│  │  │ 3. Provider Selection                                              │ │  │
│  │  │    ├─ User preference (per-conversation)                           │ │  │
│  │  │    ├─ System default (env.AI_PROVIDER)                            │ │  │
│  │  │    └─ Fallback chain                                              │ │  │
│  │  │                                                                     │ │  │
│  │  │ 4. AI Provider Call                                                │ │  │
│  │  │    └─ Call selected provider via providerFactory                    │ │  │
│  │  │                                                                     │ │  │
│  │  │ 5. Response Processing                                             │ │  │
│  │  │    ├─ Parse structured responses                                   │ │  │
│  │  │    ├─ Generate cards from structured data                          │ │  │
│  │  │    └─ Handle errors gracefully                                     │ │  │
│  │  │                                                                     │ │  │
│  │  │ 6. Logging & Tracking                                              │ │  │
│  │  │    ├─ Save to AiConversation                                      │ │  │
│  │  │    ├─ Update usage metrics                                        │ │  │
│  │  │    └─ Log errors for monitoring                                   │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                           │
│                                      ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  providers/                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ providerFactory.ts - Main switch                                    │ │  │
│  │  │ • Selects provider based on configuration                          │ │  │
│  │  │ • Handles fallback logic                                           │ │  │
│  │  │ • Standardizes response format                                     │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │ openai.ts   │  │ claude.ts   │  │ gemini.ts   │  │ azure.ts    │     │  │
│  │  │             │  │             │  │             │  │             │     │  │
│  │  │ • OpenAI    │  │ • Claude    │  │ • Gemini    │  │ • Azure     │     │  │
│  │  │   SDK       │  │   SDK       │  │   SDK       │  │   OpenAI    │     │  │
│  │  │ • Chat      │  │ • Messages  │  │ • Generate  │  │ • Chat      │     │  │
│  │  │   Completions│  │   API       │  │   Content   │  │   Completions│    │  │
│  │  │ • Streaming │  │ • Streaming │  │             │  │             │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │                                                                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │ openrouter  │  │ ollama.ts   │  │ prompts/                        │ │  │
│  │  │ .ts         │  │             │  │ • systemPrompt.ts               │ │  │
│  │  │             │  │ • Local     │  │ • itsmPrompt.ts                 │ │  │
│  │  │ • OpenAI-   │  │   models    │  │ • conversationContext.ts        │ │  │
│  │  │   compatible│  │ • Ollama    │  │                                 │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                         │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  MySQL (via Prisma)                                                      │  │
│  │                                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ AiConversation                                                      │ │  │
│  │  │ • id (PK)                                                          │ │  │
│  │  │ • userId                                                           │ │  │
│  │  │ • conversationId (thread grouping)                                  │ │  │
│  │  │ • parentId (message threading)                                      │ │  │
│  │  │ • role (user/assistant/system)                                    │ │  │
│  │  │ • question / answer                                                │ │  │
│  │  │ • provider / model                                                 │ │  │
│  │  │ • tokensUsed / latencyMs / costUsd                                 │ │  │
│  │  │ • metadata (JSON)                                                  │ │  │
│  │  │ • createdAt                                                        │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ AiUsageLog (future)                                                 │ │  │
│  │  │ • Aggregate usage by user/org                                       │ │  │
│  │  │ • Cost tracking                                                    │ │  │
│  │  │ • Model performance                                                 │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Vector Database (future - RAG)                                         │  │
│  │                                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Pinecone / Qdrant / ChromaDB                                       │ │  │
│  │  │ • Knowledge Base embeddings                                         │ │  │
│  │  │ • ITSM data embeddings                                            │ │  │
│  │  │ • Semantic search                                                  │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘

```

### Architecture Decisions

1. **Provider Per-Conversation:** Allow users to select their preferred provider per conversation
2. **Fallback Chain:** If primary provider fails, automatically try backup providers
3. **Unified Response Format:** All providers return standardized `{ answer, cards, metadata }`
4. **Separation of Concerns:** Each provider in its own file, shared prompts in `/prompts`
5. **RAG-Ready:** Architecture supports future Knowledge Base integration without major refactoring

---

## 7. OpenAI Integration Design

### Should Implement: **YES - CRITICAL**

OpenAI is the industry standard and should be the first provider implemented.

### Integration Design

```typescript
// File: backend/src/modules/ai/providers/openai.ts

import OpenAI from 'openai';
import { env } from '../../../config/env.js';

export interface AiResponse {
  answer: string;
  raw?: unknown;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function runOpenAi(
  question: string,
  options?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    model?: string;
    temperature?: number;
  }
): Promise<AiResponse> {
  const {
    conversationHistory = [],
    model = env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature = 0.7
  } = options || {};

  // Validate API key
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Initialize client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: 30000, // 30 second timeout
    maxRetries: 3,
  });

  // Build messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt(),
    },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: question,
    },
  ];

  try {
    // Make API call
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 2000,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    // Extract response
    const choice = completion.choices[0];
    const answer = choice.message.content || 'No response generated';

    return {
      answer,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error(`OpenAI API Error: ${error.status} - ${error.message}`);
      throw new Error(`OpenAI error: ${error.message}`);
    }
    throw error;
  }
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for Saven InfraOps Command Center, an enterprise ITSM platform.

Your capabilities:
- Answer questions about service requests, incidents, assets, compliance, and access management
- Provide summaries of open tickets and their priorities
- Help users navigate the platform
- Explain ITSM concepts and best practices

Guidelines:
- Be concise and helpful
- When providing counts or summaries, mention the source
- If you don't know something, say so
- Focus on actionable information

The current date is ${new Date().toISOString().split('T')[0]}.`;
}
```

### Environment Variables Required

```typescript
// Add to env.ts
OPENAI_API_KEY: z.string(),
OPENAI_MODEL: z.string().default('gpt-4o-mini'),
OPENAI_TEMPERATURE: z.number().default(0.7),
OPENAI_MAX_TOKENS: z.number().default(2000),
OPENAI_TIMEOUT: z.number().default(30000),
```

### Required npm Package

```bash
npm install openai
```

### Error Handling

| Error Type | Handling |
|-----------|----------|
| Missing API Key | Return clear error message |
| Rate Limited | Retry with exponential backoff |
| Timeout | Return timeout error, suggest retry |
| Invalid Request | Return validation error details |
| Server Error | Return generic error, log details |

### Streaming Support (Future)

```typescript
// Streaming version for future implementation
export async function* runOpenAiStream(
  question: string,
  options?: StreamOptions
): AsyncGenerator<string> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  
  const stream = await openai.chat.completions.create({
    model: options?.model || env.OPENAI_MODEL,
    messages: [...],
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
```

---

## 8. Claude Integration Design

### Should Implement: **YES - HIGH**

Claude provides excellent reasoning and is a strong alternative to OpenAI.

### Integration Design

```typescript
// File: backend/src/modules/ai/providers/claude.ts

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../../config/env.js';

export interface AiResponse {
  answer: string;
  raw?: unknown;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function runClaude(
  question: string,
  options?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    model?: string;
    temperature?: number;
  }
): Promise<AiResponse> {
  const {
    conversationHistory = [],
    model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    temperature = 0.7
  } = options || {};

  // Validate API key
  if (!env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY environment variable is not set');
  }

  // Initialize client
  const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
    timeout: 30000,
  });

  // Build messages (Claude uses different format)
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    {
      role: 'user',
      content: question,
    },
  ];

  try {
    // Make API call
    const response = await anthropic.messages.create({
      model,
      messages,
      temperature,
      max_tokens: 2000,
      system: buildSystemPrompt(),
    });

    // Extract response
    const textContent = response.content.find(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock | undefined;
    
    const answer = textContent?.text || 'No response generated';

    return {
      answer,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API Error: ${error.status} - ${error.message}`);
      throw new Error(`Claude error: ${error.message}`);
    }
    throw error;
  }
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for Saven InfraOps Command Center, an enterprise ITSM platform.

Your capabilities:
- Answer questions about service requests, incidents, assets, compliance, and access management
- Provide summaries of open tickets and their priorities
- Help users navigate the platform
- Explain ITSM concepts and best practices

Guidelines:
- Be concise and helpful
- When providing counts or summaries, mention the source
- If you don't know something, say so
- Focus on actionable information`;
}
```

### Environment Variables Required

```typescript
// Add to env.ts
CLAUDE_API_KEY: z.string(),
CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
CLAUDE_TEMPERATURE: z.number().default(0.7),
CLAUDE_MAX_TOKENS: z.number().default(2000),
```

### Required npm Package

```bash
npm install @anthropic-ai/sdk
```

### Key Differences from OpenAI

| Aspect | OpenAI | Claude |
|--------|--------|--------|
| Message Format | `role` + `content` | Same |
| System Prompt | First message in array | Separate `system` parameter |
| Token Counting | `total_tokens` | `input_tokens` + `output_tokens` |
| SDK Name | `openai` | `@anthropic-ai/sdk` |
| Default Model | `gpt-4o-mini` | `claude-sonnet-4-20250514` |

---

## 9. Gemini Integration Design

### Should Implement: **YES - MEDIUM**

Gemini provides a cost-effective option with strong multimodal capabilities.

### Integration Design

```typescript
// File: backend/src/modules/ai/providers/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../config/env.js';

export interface AiResponse {
  answer: string;
  raw?: unknown;
  usage?: {
    totalTokens: number;
  };
}

export async function runGemini(
  question: string,
  options?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    model?: string;
    temperature?: number;
  }
): Promise<AiResponse> {
  const {
    conversationHistory = [],
    model = env.GEMINI_MODEL || 'gemini-1.5-flash',
    temperature = 0.7
  } = options || {};

  // Validate API key
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Initialize client
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  // Build prompt with history
  let prompt = buildSystemPrompt() + '\n\n';
  
  for (const msg of conversationHistory) {
    prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
  }
  prompt += `Human: ${question}\nAssistant:`;

  try {
    // Get model
    const generativeModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: 2000,
        topP: 0.9,
        topK: 40,
      },
    });

    // Generate content
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    
    const answer = response.text() || 'No response generated';

    return {
      answer,
      usage: {
        totalTokens: Number(response.usageMetadata?.totalTokenCount || 0),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Gemini API Error: ${error.message}`);
      throw new Error(`Gemini error: ${error.message}`);
    }
    throw error;
  }
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for Saven InfraOps Command Center, an enterprise ITSM platform.

Your capabilities:
- Answer questions about service requests, incidents, assets, compliance, and access management
- Provide summaries of open tickets and their priorities
- Help users navigate the platform
- Explain ITSM concepts and best practices

Guidelines:
- Be concise and helpful
- When providing counts or summaries, mention the source
- If you don't know something, say so
- Focus on actionable information

The current date is ${new Date().toISOString().split('T')[0]}.`;
}
```

### Environment Variables Required

```typescript
// Add to env.ts
GEMINI_API_KEY: z.string(),
GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
GEMINI_TEMPERATURE: z.number().default(0.7),
```

### Required npm Package

```bash
npm install @google/generative-ai
```

### Provider Factory Update

```typescript
// Add to providerFactory.ts
import { runOpenAi } from './openai.js';
import { runClaude } from './claude.js';
import { runGemini } from './gemini.js';

export async function runAiProvider(
  question: string,
  options?: ProviderOptions
): Promise<AiResponse> {
  const provider = options?.provider || env.AI_PROVIDER;

  switch (provider) {
    case 'openai':
      return runOpenAi(question, options);
    case 'claude':
      return runClaude(question, options);
    case 'gemini':
      return runGemini(question, options);
    case 'private':
      return runPrivateModel(question, options);
    default:
      return { 
        answer: 'AI provider not configured. Set AI_PROVIDER environment variable.' 
      };
  }
}
```

---

## 10. Azure OpenAI Analysis

### Should Implement: **YES - HIGH (for Enterprise)**

Azure OpenAI is essential for enterprise deployments due to data privacy requirements.

### Analysis

| Factor | Assessment |
|--------|------------|
| Enterprise Need | **HIGH** - Many enterprises require data to stay within their cloud |
| Compliance | Required for SOC2, HIPAA, GDPR compliance in regulated industries |
| Cost | Similar to OpenAI Direct, plus Azure infrastructure costs |
| Integration Effort | **LOW** - Uses same API as OpenAI with different endpoint |

### Integration Design

```typescript
// File: backend/src/modules/ai/providers/azure.ts

import OpenAI from 'openai';
import { AzureOpenAI } from 'openai';
import { env } from '../../../config/env.js';

export interface AiResponse {
  answer: string;
  raw?: unknown;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function runAzureOpenAi(
  question: string,
  options?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    deployment?: string;
    temperature?: number;
  }
): Promise<AiResponse> {
  const {
    conversationHistory = [],
    deployment = env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
    temperature = 0.7
  } = options || {};

  // Validate configuration
  if (!env.AZURE_OPENAI_ENDPOINT) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is not set');
  }
  if (!env.AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY environment variable is not set');
  }

  // Initialize Azure OpenAI client
  const client = new AzureOpenAI({
    endpoint: env.AZURE_OPENAI_ENDPOINT,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.AZURE_OPENAI_API_VERSION || '2024-02-01',
    duration: 30000,
  });

  // Build messages
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: question },
  ];

  try {
    const completion = await client.chat.completions.create({
      deployment,
      model: deployment, // Azure uses deployment name
      messages,
      temperature,
      max_tokens: 2000,
    });

    const choice = completion.choices[0];
    const answer = choice.message.content || 'No response generated';

    return {
      answer,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Azure OpenAI Error: ${error.message}`);
      throw new Error(`Azure OpenAI error: ${error.message}`);
    }
    throw error;
  }
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for Saven InfraOps Command Center.`;
}
```

### Environment Variables Required

```typescript
// Add to env.ts
AZURE_OPENAI_ENDPOINT: z.string().url(),
AZURE_OPENAI_API_KEY: z.string(),
AZURE_OPENAI_DEPLOYMENT: z.string(),
AZURE_OPENAI_API_VERSION: z.string().default('2024-02-01'),
```

### When to Use Azure vs OpenAI

| Scenario | Recommended |
|----------|-------------|
| Startup / Small Business | OpenAI Direct |
| Enterprise with data residency | Azure OpenAI |
| Healthcare / HIPAA | Azure OpenAI |
| Financial services | Azure OpenAI |
| General SaaS | Either (cost-driven) |

---

## 11. OpenRouter Analysis

### Should Implement: **OPTIONAL - LOW Priority**

OpenRouter provides access to multiple models through a single API.

### Analysis

| Factor | Assessment |
|--------|------------|
| Use Case | Access to many models (Llama, Mistral, etc.) |
| Cost | Pay-per-use, can be cheaper for some models |
| Complexity | **MEDIUM** - Needs model selection UI |
| Enterprise Fit | **LOW** - Less common in enterprise |
| Integration Effort | **LOW** - OpenAI-compatible API |

### Recommendation

**IMPLEMENT LATER** if there is a specific need for:
- Access to open-source models (Llama, Mistral)
- Model cost comparison
- Automatic model selection based on query type

### Integration Design (For Future)

```typescript
// File: backend/src/modules/ai/providers/openrouter.ts

import OpenAI from 'openai';

export async function runOpenRouter(
  question: string,
  options?: {
    model?: string; // e.g., 'anthropic/claude-3.5-sonnet'
  }
): Promise<AiResponse> {
  const model = options?.model || env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model, // OpenRouter model string
    messages: [...],
  });

  return { answer: completion.choices[0].message.content || '' };
}
```

---

## 12. RAG Implementation Analysis

### Should Implement: **YES - MEDIUM Priority (Post-Basic Integration)**

RAG (Retrieval-Augmented Generation) will significantly improve AI responses by providing context.

### Analysis

| Factor | Assessment |
|--------|------------|
| Value Add | **HIGH** - AI can answer questions about specific tickets/data |
| Complexity | **HIGH** - Requires vector DB, embeddings, retrieval logic |
| Priority | Implement after basic AI providers work |
| Data Sources | Knowledge Base, ITSM tickets, policies |

### RAG Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              RAG PIPELINE                                      │
└────────────────────────────────────────────────────────────────────────────────┘

INGESTION (Offline / Periodic)
─────────────────────────────────────────────────────────────────────────────────

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Knowledge Base  │    │   ITSM Tickets  │    │    Policies     │
│   (Articles)    │    │  (Historical)   │    │   (Documents)   │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHUNKING LAYER                                      │
│  • Split documents into chunks (500-1000 tokens)                           │
│  • Preserve context with overlap                                             │
│  • Add metadata (source, date, category)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMBEDDING LAYER                                      │
│  • Generate embeddings using OpenAI (text-embedding-3-small)                │
│  • Store in vector database                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VECTOR DATABASE                                       │
│  • Pinecone / Qdrant / ChromaDB / pgvector                                  │
│  • Index by category (KB, tickets, policies)                                │
│  • Metadata filtering                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

RETRIEVAL (Per Query)
─────────────────────────────────────────────────────────────────────────────────

┌──────────────────┐
│   User Query     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMBED USER QUERY                                      │
│  • Generate embedding using same model (text-embedding-3-small)            │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SEMANTIC SEARCH                                        │
│  • Query vector DB for relevant chunks                                      │
│  • Filter by metadata (date range, category)                                │
│  • Return top-k results                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BUILD CONTEXT                                            │
│  • Combine retrieved chunks into context string                              │
│  • Include source citations                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI PROVIDER                                          │
│  • Include context in prompt                                                 │
│  • Generate response with citations                                          │
└─────────────────────────────────────────────────────────────────────────────┘

```

### Implementation Decision Tree

```
Should we implement RAG?
│
├─── Are users asking questions about specific tickets/data?
│    └─── YES → RAG provides high value
│
├─── Is response accuracy critical?
│    └─── YES → RAG reduces hallucinations
│
├─── Do we have vector database infrastructure?
│    └─── NO → Consider managed service (Pinecone, Qdrant Cloud)
│
└─── Priority compared to basic AI?
    └─── Basic AI first, then RAG
```

### Recommended Approach

1. **Start Simple:** Use existing keyword routing + AI providers
2. **Add RAG Later:** After basic integration is stable
3. **Choose Managed Service:** Pinecone or Qdrant Cloud for easier ops
4. **Start with Knowledge Base:** Embed KB articles first

---

## 13. Knowledge Base Connection Analysis

### Should Connect: **YES - MEDIUM Priority**

The Knowledge Base should be connected to the AI for context-aware responses.

### Analysis

| Factor | Assessment |
|--------|------------|
| Current State | Knowledge Base exists as module |
| AI Integration | Not connected yet |
| Value Add | **HIGH** - AI can reference KB articles |
| Effort | **MEDIUM** - Needs embedding pipeline |

### Integration Options

| Option | Pros | Cons |
|--------|------|------|
| **RAG (Recommended)** | Full semantic search | Complex setup |
| **Simple Lookup** | Quick to implement | Keyword only |
| **Hybrid** | Best of both | Moderate complexity |

### Recommended Integration Path

1. **Phase 1:** Use existing keyword routing
2. **Phase 2:** Add KB articles as RAG source
3. **Phase 3:** Add ITSM historical data as RAG source

---

## 14. Database Schema Changes

### Required Changes to AiConversation

```prisma
// Current schema
model AiConversation {
  id         String   @id @default(cuid())
  userId     String?
  question   String   @db.Text
  answer     String   @db.Text
  provider   String
  sourceJson Json?
  createdAt  DateTime @default(now())
}

// Proposed enhanced schema
model AiConversation {
  id             String   @id @default(cuid())
  
  // Threading
  conversationId String?  // Groups messages into conversations
  parentId      String?  // For reply threading
  
  // Roles
  role          String   @default("user")  // 'user' | 'assistant' | 'system'
  
  // Content
  userId        String?
  question      String?  @db.Text  // User message
  answer        String?  @db.Text  // Assistant response
  
  // Provider info
  provider      String?
  model         String?  // e.g., 'gpt-4o-mini'
  
  // Usage tracking
  promptTokens  Int?
  outputTokens  Int?
  totalTokens   Int?
  latencyMs     Int?
  costUsd       Float?
  
  // Metadata
  sourceJson    Json?   // Raw data from queries
  metadata       Json?   // Additional metadata
  
  // Timestamps
  createdAt     DateTime @default(now())
  
  // Relations
  user          User?    @relation(fields: [userId], references: [id])
  parent        AiConversation? @relation("ConversationThread", fields: [parentId], references: [id])
  replies       AiConversation[] @relation("ConversationThread")
}

// New model for aggregated usage
model AiUsageLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime @db.Date
  provider    String
  model       String
  requests    Int      @default(0)
  promptTokens Int     @default(0)
  outputTokens Int     @default(0)
  totalTokens Int      @default(0)
  costUsd     Float    @default(0)
  
  @@unique([userId, date, provider, model])
  @@index([date])
  @@index([userId])
}
```

### Migration Steps

1. **Backup existing data**
2. **Create migration for new schema**
3. **Update application code**
4. **Test with existing data**
5. **Deploy**

---

## 15. Security Considerations

### 15.1 API Key Management

| Provider | Storage | Rotation |
|----------|---------|----------|
| OpenAI | Environment variable | Manual |
| Claude | Environment variable | Manual |
| Gemini | Environment variable | Manual |
| Azure | Azure Key Vault (recommended) | Automated |

### Recommended: Environment Variables with Secrets Manager

```typescript
// For production, use secrets manager
// Example: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager

// Development
OPENAI_API_KEY=sk-...

// Production (recommended)
AZURE_OPENAI_KEY_VAULT_URL=https://...
AZURE_OPENAI_KEY_SECRET_NAME=openai-api-key
```

### 15.2 Data Privacy

| Concern | Mitigation |
|---------|-----------|
| User queries sent to AI | Use enterprise providers (Azure) for sensitive data |
| Conversation logging | Anonymize PII before storage |
| Token usage visibility | Aggregate in usage dashboard |
| Prompt injection | Sanitize user input |

### 15.3 Rate Limiting

```typescript
// Current: Global rate limit (120 requests/minute)
// Recommended: Per-user rate limits

// ai.routes.ts enhancement
const aiLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 30, // 30 requests per minute per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Too many AI requests. Please wait.',
});

// Apply to AI routes
app.use('/api/ai', aiLimiter, aiRouter);
```

### 15.4 Input Validation

```typescript
// Strict validation
const askSchema = z.object({
  question: z.string()
    .min(2, 'Question too short')
    .max(500, 'Question too long (max 500 characters)')
    .regex(/^[^\x00-\x1F\x7F]*$/, 'Invalid characters'),
  conversationId: z.string().cuid().optional(),
  provider: z.enum(['openai', 'claude', 'gemini', 'azure']).optional(),
});
```

### 15.5 Output Sanitization

```typescript
// Sanitize AI responses
function sanitizeResponse(text: string): string {
  return text
    .replace(/\[.*?\]\(https?:\/\/.*?\)/g, '[link]') // Sanitize external links
    .replace(/\b\d{10,}\b/g, '[id]') // Sanitize long numbers (potential IDs)
    .slice(0, 10000); // Limit response length
}
```

### 15.6 Audit Logging

```typescript
// Log all AI interactions for compliance
await prisma.auditLog.create({
  data: {
    actorId: req.user?.id,
    action: 'AI_QUERY',
    entityType: 'AiConversation',
    entityId: conversation.id,
    newValue: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.usage?.totalTokens,
      costUsd: calculateCost(result.provider, result.usage),
    },
    ipAddress: req.ip,
  }
});
```

---

## 16. Cost Optimization Recommendations

### 16.1 Model Selection

| Use Case | Recommended Model | Cost Tier |
|----------|------------------|-----------|
| Simple Q&A | gpt-4o-mini / claude-haiku | Low |
| Complex Reasoning | gpt-4o / claude-sonnet | Medium |
| Long Context | gpt-4-turbo / claude-3-opus | High |
| Fast Responses | gpt-4o-mini / gemini-1.5-flash | Low |

### 16.2 Cost-Saving Strategies

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| Use mini models | Set default to gpt-4o-mini | ~80% |
| Cache responses | Hash questions, reuse answers | ~30% |
| Limit context | Truncate conversation history | ~40% |
| Batch requests | Not applicable (real-time) | - |
| Use open-source | OpenRouter with Llama | Variable |

### 16.3 Response Caching

```typescript
// Simple cache for identical questions
const responseCache = new Map<string, { answer: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function getCachedResponse(question: string): string | null {
  const cached = responseCache.get(hashQuestion(question));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.answer;
  }
  return null;
}

export function cacheResponse(question: string, answer: string): void {
  responseCache.set(hashQuestion(question), {
    answer,
    timestamp: Date.now(),
  });
}
```

### 16.4 Usage Monitoring

```typescript
// Track usage by user/provider
interface UsageMetrics {
  userId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  timestamp: Date;
}

// Cost calculation (approximate)
function calculateCost(provider: string, tokens: { promptTokens: number; completionTokens: number }): number {
  const rates = {
    'openai:gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 }, // $0.15/1M, $0.60/1M
    'openai:gpt-4o': { prompt: 0.005, completion: 0.015 },
    'claude:claude-haiku': { prompt: 0.00025, completion: 0.00125 },
    'claude:claude-sonnet': { prompt: 0.003, completion: 0.015 },
    'gemini:1.5-flash': { prompt: 0.000075, completion: 0.0003 },
  };
  
  const rate = rates[`${provider}:${tokens.model}`] || { prompt: 0, completion: 0 };
  return (tokens.promptTokens / 1_000_000 * rate.prompt) +
         (tokens.completionTokens / 1_000_000 * rate.completion);
}
```

---

## 17. Phased Implementation Plan

### Phase AI-1: OpenAI Integration (Week 1)

**Objective:** Get OpenAI working in production

| Task | Effort | Deliverable |
|------|--------|-------------|
| Install `openai` package | 5 min | Package in package.json |
| Create `openai.ts` provider | 2 hrs | Working provider |
| Update `providerFactory.ts` | 30 min | Provider switch |
| Add environment variables | 15 min | .env.example update |
| Add error handling | 1 hr | Robust error messages |
| Test with sample queries | 1 hr | Verified functionality |
| Documentation | 30 min | Setup guide |

**Acceptance Criteria:**
- [ ] User can ask free-text questions
- [ ] OpenAI returns coherent responses
- [ ] Errors are handled gracefully
- [ ] Usage is logged

---

### Phase AI-2: Claude Integration (Week 1)

**Objective:** Add Claude as second provider

| Task | Effort | Deliverable |
|------|--------|-------------|
| Install `@anthropic-ai/sdk` | 5 min | Package in package.json |
| Create `claude.ts` provider | 2 hrs | Working provider |
| Update `providerFactory.ts` | 30 min | Provider switch |
| Add environment variables | 15 min | .env.example update |
| Test and compare responses | 2 hrs | Verified functionality |
| Performance benchmark | 1 hr | Response time data |

**Acceptance Criteria:**
- [ ] Claude responses match quality expectations
- [ ] Both providers can be selected via env
- [ ] Response times are acceptable

---

### Phase AI-3: Gemini + Azure OpenAI (Week 2)

**Objective:** Add enterprise and cost-effective options

| Task | Effort | Deliverable |
|------|--------|-------------|
| Install `@google/generative-ai` | 5 min | Package in package.json |
| Create `gemini.ts` provider | 2 hrs | Working provider |
| Create `azure.ts` provider | 2 hrs | Working provider |
| Add environment variables | 30 min | Full env config |
| Test all providers | 2 hrs | Verified functionality |
| Create provider selection UI | 4 hrs | Settings page enhancement |

**Acceptance Criteria:**
- [ ] Gemini provides cost-effective option
- [ ] Azure OpenAI works for enterprise
- [ ] Provider can be configured per-deployment

---

### Phase AI-4: Conversation Memory (Week 2-3)

**Objective:** Enable context-aware conversations

| Task | Effort | Deliverable |
|------|--------|-------------|
| Update database schema | 2 hrs | New migration |
| Modify `ai.service.ts` | 3 hrs | Load/save history |
| Update frontend | 4 hrs | Show conversation thread |
| Add conversation grouping | 2 hrs | conversationId logic |
| Test follow-up questions | 2 hrs | Verified functionality |

**Acceptance Criteria:**
- [ ] User can ask follow-up questions
- [ ] AI remembers previous context
- [ ] Conversation history persists

---

### Phase AI-5: RAG Foundation (Week 3-4)

**Objective:** Connect Knowledge Base to AI

| Task | Effort | Deliverable |
|------|--------|-------------|
| Choose vector DB | 1 hr | Decision document |
| Set up vector DB | 2 hrs | Cloud instance |
| Create embedding pipeline | 4 hrs | KB → embeddings |
| Implement retrieval | 4 hrs | Semantic search |
| Integrate with AI providers | 3 hrs | Context injection |
| Test with KB articles | 3 hrs | Verified functionality |

**Acceptance Criteria:**
- [ ] AI can reference KB articles
- [ ] Responses include citations
- [ ] Retrieval is accurate

---

### Phase AI-6: Streaming + Polish (Week 4)

**Objective:** Improve UX with real-time responses

| Task | Effort | Deliverable |
|------|--------|-------------|
| Implement SSE endpoint | 3 hrs | Streaming API |
| Update frontend | 4 hrs | Streaming UI |
| Add loading indicators | 2 hrs | Better UX |
| Add usage dashboard | 4 hrs | Cost tracking |
| Performance optimization | 3 hrs | Caching, limits |
| Security audit | 2 hrs | Penetration testing |

**Acceptance Criteria:**
- [ ] Responses stream in real-time
- [ ] Users see usage/cost dashboard
- [ ] Rate limits enforced

---

## Summary

### Implementation Priority

| Priority | Provider/Feature | Rationale |
|----------|------------------|-----------|
| 1 | OpenAI | Industry standard, quick to implement |
| 2 | Claude | Strong alternative, good reasoning |
| 3 | Azure OpenAI | Enterprise requirement |
| 4 | Gemini | Cost-effective option |
| 5 | Conversation Memory | Improves UX significantly |
| 6 | RAG | High value but complex |
| 7 | Streaming | Nice-to-have UX feature |

### Estimated Total Effort

| Phase | Weeks | Total Hours |
|-------|-------|-------------|
| AI-1: OpenAI | 1 | 8 hours |
| AI-2: Claude | 1 | 8 hours |
| AI-3: Gemini + Azure | 2 | 16 hours |
| AI-4: Memory | 2 | 16 hours |
| AI-5: RAG | 2 | 24 hours |
| AI-6: Polish | 1 | 16 hours |
| **Total** | **9 weeks** | **~88 hours** |

### Recommended Quick Start

1. **Week 1:** OpenAI + Claude (basic integration)
2. **Week 2-3:** Azure + Gemini + Memory
3. **Week 4+:** RAG and polish as needed

---

**End of Technical Design Document**
