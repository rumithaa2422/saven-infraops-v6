# AI Integration Audit Report

**Date:** 2026-06-24  
**Project:** Saven InfraOps Command Center  
**Version:** Phase 5C  
**Status:** 🟡 PARTIALLY IMPLEMENTED

---

## Table of Contents

1. [Current AI Architecture](#a-current-ai-architecture)
2. [Working Features](#b-working-features)
3. [Partially Implemented Features](#c-partially-implemented-features)
4. [Missing Features](#d-missing-features)
5. [Frontend AI Components](#e-frontend-ai-components)
6. [Backend AI Components](#f-backend-ai-components)
7. [Database Schema](#g-database-schema)
8. [Provider Audit](#h-provider-audit)
9. [Environment Variables](#i-environment-variables)
10. [OpenAI Integration Requirements](#j-openai-integration-requirements)
11. [Claude Integration Requirements](#k-claude-integration-requirements)
12. [Gemini Integration Requirements](#l-gemini-integration-requirements)
13. [RAG Audit](#m-rag-audit)
14. [Recommended Implementation Order](#n-recommended-implementation-order)
15. [Phased Roadmap](#o-phased-roadmap)

---

## A. Current AI Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐    ┌────────────────────────────┐    │
│  │   CommandBar.tsx     │    │   AssistantPanel.tsx      │    │
│  │   (Bottom bar)       │    │   (Right side panel)      │    │
│  │   - AI query input   │    │   - AI query input        │    │
│  │   - Status display   │    │   - Suggestion buttons    │    │
│  │   - Navigation cmds  │    │   - Answer display        │    │
│  │   - ai:ask guard    │    │   - Result cards          │    │
│  └──────────────────────┘    └────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AppShell.tsx (Integration)                  │  │
│  │   - Shows/hides AssistantPanel                          │  │
│  │   - Shows CommandBar based on ai:ask permission          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                             │  │
│  │                 POST /api/ai/ask                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                ai.routes.ts                               │  │
│  │   - POST /api/ai/ask                                     │  │
│  │   - RBAC: requiresPermission('ai:ask')                   │  │
│  │   - Request validation (Zod schema)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                ai.service.ts                             │  │
│  │   - askAi() function                                    │  │
│  │   - Keyword-based routing                                │  │
│  │   - Database queries for ITSM data                      │  │
│  │   - Conversation logging                                 │  │
│  │   - Fallback to AI provider                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            providers/providerFactory.ts                  │  │
│  │   - runAiProvider() - provider switcher                  │  │
│  │   - Mock provider (WORKING)                             │  │
│  │   - OpenAI stub                                         │  │
│  │   - Claude stub                                         │  │
│  │   - Private model stub                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Database (Prisma/MySQL)                   │  │
│  │   - AiConversation table (logs all queries)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Files Involved

| Category | Files |
|----------|-------|
| **Frontend Components** | `AssistantPanel.tsx`, `CommandBar.tsx`, `AppShell.tsx` |
| **Backend Routes** | `ai.routes.ts` |
| **Backend Services** | `ai.service.ts` |
| **Backend Providers** | `providers/providerFactory.ts` |
| **Configuration** | `backend/src/config/env.ts` |
| **Database** | `prisma/schema.prisma` |
| **Seed Data** | `prisma/seed.ts` |
| **Registration** | `app.ts` |

---

## B. Working Features

### Frontend Features

| Feature | File | Line | Status |
|---------|------|------|--------|
| Free-text input field | `AssistantPanel.tsx` | 77-87 | ✅ Working |
| Predefined suggestions (4 buttons) | `AssistantPanel.tsx` | 38-43 | ✅ Working |
| Enter key submission | `AssistantPanel.tsx` | 81-83 | ✅ Working |
| "Ask" button | `AssistantPanel.tsx` | 86 | ✅ Working |
| Loading state | `AssistantPanel.tsx` | 24 | ✅ Working |
| Error handling | `AssistantPanel.tsx` | 30-32 | ✅ Working |
| Answer display | `AssistantPanel.tsx` | 60 | ✅ Working |
| Result cards with links | `AssistantPanel.tsx` | 61-75 | ✅ Working |
| CommandBar input | `CommandBar.tsx` | 39-44 | ✅ Working |
| Navigation commands | `CommandBar.tsx` | 23-26 | ✅ Working |
| AI permission guard | `CommandBar.tsx` | 13-15 | ✅ Working |
| AI panel collapse toggle | `AppShell.tsx` | 28-29 | ✅ Working |

### Backend Features

| Feature | File | Line | Status |
|---------|------|------|--------|
| POST /api/ai/ask endpoint | `ai.routes.ts` | 11-19 | ✅ Working |
| RBAC permission check | `ai.routes.ts` | 11 | ✅ Working |
| Request validation (Zod) | `ai.routes.ts` | 9 | ✅ Working |
| Keyword routing (tickets) | `ai.service.ts` | 12-20 | ✅ Working |
| Keyword routing (incidents) | `ai.service.ts` | 21-26 | ✅ Working |
| Keyword routing (assets) | `ai.service.ts` | 27-32 | ✅ Working |
| Keyword routing (compliance) | `ai.service.ts` | 33-38 | ✅ Working |
| Conversation logging | `ai.service.ts` | 45-53 | ✅ Working |
| Mock provider | `providerFactory.ts` | 11-12 | ✅ Working |
| Provider selection switch | `providerFactory.ts` | 4-13 | ✅ Working |

### Database Features

| Feature | Schema | Status |
|---------|--------|--------|
| AiConversation table | `schema.prisma` | ✅ Working |
| Logging questions/answers | `ai.service.ts` | ✅ Working |
| Provider tracking | `ai.service.ts` | 50 |

---

## C. Partially Implemented Features

### 1. OpenAI Provider

| Aspect | Status | Details |
|--------|--------|---------|
| Provider factory switch case | ✅ | Line 5-6 in `providerFactory.ts` |
| API key configuration | ✅ | `env.OPENAI_API_KEY` check |
| **Actual API call** | ❌ Stub | Returns placeholder message |
| **SDK integration** | ❌ Missing | No `openai` npm package |
| **Error handling** | ⚠️ Basic | Only checks for API key |
| **Streaming** | ❌ Not implemented |
| **Model selection** | ⚠️ Config exists | `env.OPENAI_MODEL` |

**Current Implementation (Stub):**
```typescript
async function runOpenAi(question: string) {
  if (!env.OPENAI_API_KEY) return { answer: 'OpenAI provider selected, but OPENAI_API_KEY is missing.' };
  return { answer: `OpenAI adapter placeholder ready for question: ${question}` };
}
```

### 2. Claude Provider

| Aspect | Status | Details |
|--------|--------|---------|
| Provider factory switch case | ✅ | Line 7-8 in `providerFactory.ts` |
| API key configuration | ✅ | `env.CLAUDE_API_KEY` check |
| **Actual API call** | ❌ Stub | Returns placeholder message |
| **SDK integration** | ❌ Missing | No `@anthropic-ai/sdk` package |
| **Error handling** | ⚠️ Basic | Only checks for API key |
| **Streaming** | ❌ Not implemented |
| **Model selection** | ⚠️ Config exists | `env.CLAUDE_MODEL` |

**Current Implementation (Stub):**
```typescript
async function runClaude(question: string) {
  if (!env.CLAUDE_API_KEY) return { answer: 'Claude provider selected, but CLAUDE_API_KEY is missing.' };
  return { answer: `Claude adapter placeholder ready for question: ${question}` };
}
```

### 3. Private Model Provider

| Aspect | Status | Details |
|--------|--------|---------|
| Provider factory switch case | ✅ | Line 9-10 in `providerFactory.ts` |
| Base URL configuration | ✅ | `env.PRIVATE_AI_BASE_URL` check |
| **Actual API call** | ❌ Stub | Returns placeholder message |
| **HTTP client** | ❌ Missing | No axios/fetch implementation |
| **Authentication** | ⚠️ Config exists | `env.PRIVATE_AI_API_KEY` |
| **Model selection** | ⚠️ Config exists | `env.PRIVATE_AI_MODEL` |

**Current Implementation (Stub):**
```typescript
async function runPrivateModel(question: string) {
  if (!env.PRIVATE_AI_BASE_URL) return { answer: 'Private model selected, but PRIVATE_AI_BASE_URL is missing.' };
  return { answer: `Private model adapter placeholder ready for question: ${question}` };
}
```

---

## D. Missing Features

### Providers Not Integrated

| Provider | Status | Priority |
|----------|--------|----------|
| **Gemini (Google AI)** | ❌ Not available | High |
| **Azure OpenAI** | ❌ Not available | Enterprise |
| **OpenRouter** | ❌ Not available | Medium |
| **Local/Ollama** | ❌ Not available | Low |

### AI Features Not Implemented

| Feature | Status | Impact |
|---------|--------|--------|
| **RAG Pipeline** | ❌ Not available | High - AI lacks context |
| **Conversation Memory** | ⚠️ Logging only | Medium - No context in prompts |
| **Streaming Responses** | ❌ Not available | UX - No real-time feedback |
| **Embeddings** | ❌ Not available | High - No semantic search |
| **Vector Storage** | ❌ Not available | High - No embedding storage |
| **Knowledge Base Integration** | ❌ Not available | Medium |
| **AI Settings UI** | ❌ Not available | UX - No provider selection UI |
| **Prompt Templates** | ❌ Not available | Low |
| **Rate Limiting per User** | ⚠️ Global only | Security |

---

## E. Frontend AI Components

### 1. AssistantPanel.tsx

**Path:** `frontend/src/components/AssistantPanel.tsx`

**Purpose:** Right-side AI Assistant panel with chat interface

**Features:**
- Input field for free-text questions
- Predefined suggestion buttons
- Answer display card
- Result mini-cards with links
- Loading state
- Error handling

**Key Lines:**
```typescript
// Line 18: Initial state message
const [answer, setAnswer] = useState('Ask me about tickets, incidents, assets, compliance, access, or reports.');

// Lines 77-87: Input field
<div className="assistant-input">
  <input
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
    placeholder="Ask InfraOps..."
  />
  <button onClick={() => ask()} disabled={loading}>Ask</button>
</div>
```

**Status:** ✅ Fully Working

---

### 2. CommandBar.tsx

**Path:** `frontend/src/components/CommandBar.tsx`

**Purpose:** Bottom bar for quick AI queries and navigation

**Features:**
- Full-width command input
- Navigation commands (go to pages)
- AI query submission
- Status display
- Permission guard (ai:ask)

**Key Lines:**
```typescript
// Lines 12-15: Permission guard
if (!hasPermission('ai:ask')) {
  return null;
}

// Lines 22-26: Navigation commands
const lower = text.toLowerCase();
if (lower.includes('service request') || lower.includes('ticket')) navigate('/service-requests');
if (lower.includes('inventory') || lower.includes('asset')) navigate('/inventory');
// ...
```

**Status:** ✅ Fully Working

---

### 3. AppShell.tsx

**Path:** `frontend/src/layout/AppShell.tsx`

**Purpose:** Main application shell integrating AI components

**Features:**
- Shows/hides AssistantPanel based on collapse state
- Shows CommandBar (requires ai:ask permission)
- Toggle buttons for AI panel

**Key Lines:**
```typescript
// Line 38: CommandBar integration
<CommandBar />

// Lines 40-46: AssistantPanel integration
{assistantCollapsed ? (
  <button className="assistant-rail" onClick={() => setAssistantCollapsed(false)}>
    AI
  </button>
) : (
  <AssistantPanel onCollapse={() => setAssistantCollapsed(true)} />
)}
```

**Status:** ✅ Fully Working

---

## F. Backend AI Components

### 1. ai.routes.ts

**Path:** `backend/src/modules/ai/ai.routes.ts`

**Purpose:** Express router for AI endpoints

**Endpoints:**

| Method | Route | Permission | Status |
|--------|-------|------------|--------|
| POST | `/api/ai/ask` | `ai:ask` | ✅ Working |

**Code:**
```typescript
const askSchema = z.object({ question: z.string().min(2).max(1000) });

aiRouter.post('/ask', requireAuth, requirePermission('ai:ask'), async (req, res, next) => {
  try {
    const payload = askSchema.parse(req.body);
    const result = await askAi({ question: payload.question, userId: req.user?.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

---

### 2. ai.service.ts

**Path:** `backend/src/modules/ai/ai.service.ts`

**Purpose:** Business logic for AI queries

**Features:**
- Keyword-based routing
- Database queries for ITSM data
- Conversation logging
- Fallback to AI providers

**Query Routing:**
```typescript
// Line 12: Tickets
if (q.includes('service request') || q.includes('ticket')) {
  // Queries ServiceRequest table
}

// Line 21: Incidents  
if (q.includes('incident')) {
  // Queries Incident table
}

// Line 27: Assets
if (q.includes('asset') || q.includes('inventory') || q.includes('laptop')) {
  // Queries Asset table
}

// Line 33: Compliance
if (q.includes('compliance') || q.includes('audit')) {
  // Queries ComplianceControl table
}

// Line 39: AI Provider (fallback)
const providerAnswer = await runAiProvider(input.question);
```

**Status:** ✅ Fully Working

---

### 3. providers/providerFactory.ts

**Path:** `backend/src/modules/ai/providers/providerFactory.ts`

**Purpose:** Factory for switching between AI providers

**Providers:**

| Provider | Status | Switch Case |
|----------|--------|-------------|
| Mock | ✅ Working | `case 'mock':` |
| OpenAI | ⚠️ Stub | `case 'openai':` |
| Claude | ⚠️ Stub | `case 'claude':` |
| Private | ⚠️ Stub | `case 'private':` |
| Default | ✅ Working | Returns mock message |

**Code:**
```typescript
export async function runAiProvider(question: string): Promise<{ answer: string; raw?: unknown }> {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return runOpenAi(question);
    case 'claude':
      return runClaude(question);
    case 'private':
      return runPrivateModel(question);
    default:
      return { answer: `Mock AI response: I received your question, "${question}".` };
  }
}
```

---

## G. Database Schema

### AiConversation Table

**Model Location:** `backend/prisma/schema.prisma`

```prisma
model AiConversation {
  id         String   @id @default(cuid())
  userId     String?
  question   String   @db.Text
  answer     String   @db.Text
  provider   String
  sourceJson Json?
  createdAt  DateTime @default(now())
}
```

**Fields:**

| Field | Type | Nullable | Purpose |
|-------|------|----------|---------|
| id | String (cuid) | No | Primary key |
| userId | String | Yes | User who asked |
| question | Text | No | User's question |
| answer | Text | No | AI's response |
| provider | String | No | Provider used (mock/openai/claude/private) |
| sourceJson | JSON | Yes | Raw data from queries |
| createdAt | DateTime | No | Timestamp |

**Current Usage:**
- ✅ All AI conversations logged
- ✅ User tracking via userId
- ✅ Provider tracking
- ❌ No conversation threading (no parentId)
- ❌ No message type (user/assistant/system)
- ❌ No tokens/usage tracking
- ❌ No embedding storage

**Missing Fields for Production:**
```prisma
model AiConversation {
  // Existing fields...
  
  // Missing for conversation memory:
  conversationId String?   // Thread/group ID
  parentId       String?   // Parent message for threading
  role           String?   // 'user' | 'assistant' | 'system'
  
  // Missing for usage tracking:
  tokensUsed     Int?
  modelUsed      String?
  latencyMs      Int?
  costUsd        Float?
}
```

---

## H. Provider Audit

### OpenAI

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ✅ | `case 'openai':` |
| Environment variable | ✅ | `AI_PROVIDER=openai` |
| API key config | ✅ | `OPENAI_API_KEY` |
| Model config | ✅ | `OPENAI_MODEL=gpt-4.1-mini` |
| npm package | ❌ | No `openai` package installed |
| SDK integration | ❌ | No actual API call |
| Error handling | ⚠️ | Only checks API key presence |
| Streaming | ❌ | Not implemented |
| JSON mode | ❌ | Not implemented |

**Missing Implementation:**
```typescript
// What needs to be added:
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function runOpenAi(question: string) {
  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{ role: 'user', content: question }],
    // Optional: streaming, JSON mode, etc.
  });
  return { answer: completion.choices[0].message.content };
}
```

**Required npm packages:**
```bash
npm install openai
```

---

### Claude (Anthropic)

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ✅ | `case 'claude':` |
| Environment variable | ✅ | `AI_PROVIDER=claude` |
| API key config | ✅ | `CLAUDE_API_KEY` |
| Model config | ✅ | `CLAUDE_MODEL=claude-3-5-sonnet-latest` |
| npm package | ❌ | No `@anthropic-ai/sdk` package |
| SDK integration | ❌ | No actual API call |
| Error handling | ⚠️ | Only checks API key presence |
| Streaming | ❌ | Not implemented |

**Missing Implementation:**
```typescript
// What needs to be added:
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: env.CLAUDE_API_KEY });

async function runClaude(question: string) {
  const message = await anthropic.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: question }]
  });
  return { answer: message.content[0].text };
}
```

**Required npm packages:**
```bash
npm install @anthropic-ai/sdk
```

---

### Gemini (Google AI)

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ❌ | Not available |
| Environment variable | ❌ | Not configured |
| API key config | ❌ | Not configured |
| npm package | ❌ | Not installed |

**Needed for Implementation:**
- Environment variable: `GEMINI_API_KEY`
- Environment variable: `GEMINI_MODEL` (e.g., `gemini-1.5-pro`)
- npm package: `@google/generative-ai`
- Provider case in factory

---

### Azure OpenAI

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ❌ | Not available |
| Environment variables | ❌ | Not configured |
| npm package | ❌ | Not installed |

**Needed for Implementation:**
- Environment variable: `AZURE_OPENAI_API_KEY`
- Environment variable: `AZURE_OPENAI_ENDPOINT`
- Environment variable: `AZURE_OPENAI_DEPLOYMENT`
- Environment variable: `AZURE_OPENAI_API_VERSION`
- npm package: `openai` (Azure uses OpenAI SDK)
- Provider case in factory

---

### OpenRouter

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ❌ | Not available |
| Environment variables | ❌ | Not configured |
| npm package | ❌ | Not installed |

**Needed for Implementation:**
- Environment variable: `OPENROUTER_API_KEY`
- Environment variable: `OPENROUTER_MODEL`
- Environment variable: `OPENROUTER_BASE_URL` (optional)
- npm package: `openai` (OpenRouter uses OpenAI-compatible API)
- Provider case in factory

---

### Private Model / Ollama

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ✅ | `case 'private':` |
| Environment variable | ✅ | `AI_PROVIDER=private` |
| Base URL config | ✅ | `PRIVATE_AI_BASE_URL` |
| API key config | ✅ | `PRIVATE_AI_API_KEY` |
| Model config | ✅ | `PRIVATE_AI_MODEL` |
| HTTP implementation | ❌ | No actual HTTP call |

**Needed for Implementation:**
```typescript
async function runPrivateModel(question: string) {
  const response = await fetch(`${env.PRIVATE_AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.PRIVATE_AI_API_KEY && { 'Authorization': `Bearer ${env.PRIVATE_AI_API_KEY}` })
    },
    body: JSON.stringify({
      model: env.PRIVATE_AI_MODEL,
      messages: [{ role: 'user', content: question }]
    })
  });
  const data = await response.json();
  return { answer: data.choices[0].message.content };
}
```

---

### Ollama (Local)

| Aspect | Status | Details |
|--------|--------|---------|
| Provider case | ❌ | Not available |
| Environment variables | ❌ | Not configured |

**Needed for Implementation:**
- Could use `private` provider with `OLLAMA_BASE_URL` (e.g., `http://localhost:11434`)
- Environment variable: `OLLAMA_MODEL` (e.g., `llama3`)

---

## I. Environment Variables

### Currently Defined (backend/src/config/env.ts)

```typescript
AI_PROVIDER: z.enum(['mock', 'openai', 'claude', 'private']).default('mock'),
OPENAI_API_KEY: z.string().optional(),
OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
CLAUDE_API_KEY: z.string().optional(),
CLAUDE_MODEL: z.string().default('claude-3-5-sonnet-latest'),
PRIVATE_AI_BASE_URL: z.string().optional(),
PRIVATE_AI_API_KEY: z.string().optional(),
PRIVATE_AI_MODEL: z.string().default('saven-private-model'),
```

### Missing Environment Variables

**For Gemini:**
```typescript
GEMINI_API_KEY: z.string().optional(),
GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
```

**For Azure OpenAI:**
```typescript
AZURE_OPENAI_API_KEY: z.string().optional(),
AZURE_OPENAI_ENDPOINT: z.string().optional(),
AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
AZURE_OPENAI_API_VERSION: z.string().default('2024-02-01'),
```

**For OpenRouter:**
```typescript
OPENROUTER_API_KEY: z.string().optional(),
OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
```

**For Ollama:**
```typescript
OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
OLLAMA_MODEL: z.string().default('llama3'),
```

**For RAG (future):**
```typescript
VECTOR_DB_PROVIDER: z.enum(['none', 'pinecone', 'qdrant', 'chroma', 'pgvector']).default('none'),
PINECONE_API_KEY: z.string().optional(),
PINECONE_INDEX: z.string().optional(),
EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
```

---

## J. OpenAI Integration Requirements

### What Exists

| Component | Status |
|-----------|--------|
| Provider factory switch case | ✅ |
| Environment variable: `AI_PROVIDER` | ✅ |
| Environment variable: `OPENAI_API_KEY` | ✅ |
| Environment variable: `OPENAI_MODEL` | ✅ |
| Error message for missing API key | ✅ |

### What's Missing

| Component | Priority | Effort |
|----------|---------|--------|
| Install `openai` npm package | High | 5 min |
| Import OpenAI SDK | High | 2 min |
| Create OpenAI client | High | 2 min |
| Implement chat completion call | High | 15 min |
| Handle streaming responses | Medium | 30 min |
| Add JSON mode for structured output | Medium | 15 min |
| Add error handling for API errors | Medium | 15 min |
| Add token counting | Low | 10 min |
| Add cost tracking | Low | 10 min |

### Implementation Steps

1. **Install package:**
   ```bash
   cd backend && npm install openai
   ```

2. **Update providerFactory.ts:**
   ```typescript
   import OpenAI from 'openai';
   
   const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
   
   async function runOpenAi(question: string) {
     try {
       const completion = await openai.chat.completions.create({
         model: env.OPENAI_MODEL || 'gpt-4.1-mini',
         messages: [
           { 
             role: 'system', 
             content: 'You are an ITSM assistant for Saven InfraOps. Help users with tickets, incidents, assets, compliance, and access requests.' 
           },
           { role: 'user', content: question }
         ],
         max_tokens: 1000,
         temperature: 0.7
       });
       
       return { 
         answer: completion.choices[0].message.content || 'No response from OpenAI' 
       };
     } catch (error) {
       console.error('OpenAI error:', error);
       return { 
         answer: `OpenAI error: ${error instanceof Error ? error.message : 'Unknown error'}` 
       };
     }
   }
   ```

---

## K. Claude Integration Requirements

### What Exists

| Component | Status |
|-----------|--------|
| Provider factory switch case | ✅ |
| Environment variable: `AI_PROVIDER` | ✅ |
| Environment variable: `CLAUDE_API_KEY` | ✅ |
| Environment variable: `CLAUDE_MODEL` | ✅ |
| Error message for missing API key | ✅ |

### What's Missing

| Component | Priority | Effort |
|----------|---------|--------|
| Install `@anthropic-ai/sdk` npm package | High | 5 min |
| Import Anthropic SDK | High | 2 min |
| Create Anthropic client | High | 2 min |
| Implement messages API call | High | 15 min |
| Handle streaming responses | Medium | 30 min |
| Add error handling for API errors | Medium | 15 min |

### Implementation Steps

1. **Install package:**
   ```bash
   cd backend && npm install @anthropic-ai/sdk
   ```

2. **Update providerFactory.ts:**
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';
   
   const anthropic = new Anthropic({ apiKey: env.CLAUDE_API_KEY });
   
   async function runClaude(question: string) {
     try {
       const message = await anthropic.messages.create({
         model: env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
         max_tokens: 1024,
         messages: [
           { 
             role: 'user', 
             content: `You are an ITSM assistant for Saven InfraOps. Help users with tickets, incidents, assets, compliance, and access requests.\n\nUser question: ${question}` 
           }
         ]
       });
       
       const textContent = message.content.find(c => c.type === 'text');
       return { 
         answer: textContent?.text || 'No response from Claude' 
       };
     } catch (error) {
       console.error('Claude error:', error);
       return { 
         answer: `Claude error: ${error instanceof Error ? error.message : 'Unknown error'}` 
       };
     }
   }
   ```

---

## L. Gemini Integration Requirements

### What's Needed

| Component | Priority | Effort |
|-----------|---------|--------|
| Environment variable: `GEMINI_API_KEY` | High | 5 min |
| Environment variable: `GEMINI_MODEL` | High | 5 min |
| Install `@google/generative-ai` package | High | 5 min |
| Add provider case in factory | High | 5 min |
| Implement Gemini API call | High | 20 min |
| Error handling | Medium | 10 min |

### Implementation Steps

1. **Add environment variables to `env.ts`:**
   ```typescript
   GEMINI_API_KEY: z.string().optional(),
   GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
   ```

2. **Add to AI_PROVIDER enum:**
   ```typescript
   AI_PROVIDER: z.enum(['mock', 'openai', 'claude', 'private', 'gemini']).default('mock'),
   ```

3. **Install package:**
   ```bash
   cd backend && npm install @google/generative-ai
   ```

4. **Add provider case:**
   ```typescript
   case 'gemini':
     return runGemini(question);
   ```

5. **Implement function:**
   ```typescript
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
   
   async function runGemini(question: string) {
     try {
       const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-1.5-pro' });
       const result = await model.generateContent(question);
       const response = await result.response;
       return { answer: response.text() };
     } catch (error) {
       return { answer: `Gemini error: ${error instanceof Error ? error.message : 'Unknown error'}` };
     }
   }
   ```

---

## M. RAG Audit

### Current State

| Component | Status | Details |
|-----------|--------|---------|
| Knowledge Base table | ⚠️ Partial | KB articles exist but not integrated |
| Database queries | ✅ Working | Prisma queries for ITSM data |
| Context injection | ❌ Not implemented | No embedding of ITSM data |
| Embeddings | ❌ Not available | No embedding generation |
| Vector storage | ❌ Not available | No vector DB |
| Semantic search | ❌ Not available | Only keyword matching |

### What's Missing for RAG

| Component | Priority | Options |
|-----------|----------|---------|
| Embedding generation | High | OpenAI embeddings, Gemini embeddings |
| Vector database | Medium | Pinecone, Qdrant, ChromaDB, pgvector |
| Document chunking | Medium | Various strategies |
| Retrieval logic | Medium | Similarity search |
| Prompt context injection | High | Include retrieved docs in prompt |

### Recommended RAG Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Knowledge Base │───▶│  Chunking       │───▶│ Embedding   │ │
│  │  (KB Articles) │    │  (500 chars)    │    │ (OpenAI)    │ │
│  └─────────────────┘    └─────────────────┘    └──────┬──────┘ │
│                                                         │        │
│                                                         ▼        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   User Query    │───▶│  Query Embed   │───▶│  Vector DB  │  │
│  │                 │    │  (OpenAI)      │    │  (Search)   │  │
│  └─────────────────┘    └─────────────────┘    └──────┬──────┘  │
│                                                        │        │
│                                                        ▼        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  LLM Response   │◀───││  Prompt +      │◀───│  Retrieved  │  │
│  │                 │    ││  Context      │    │  Chunks     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## N. Recommended Implementation Order

### Phase 1: Production-Ready Basic AI

1. **OpenAI Integration** (2-3 hours)
   - Install openai package
   - Implement real API call
   - Add error handling
   - Test with sample queries

2. **Claude Integration** (2-3 hours)
   - Install Anthropic SDK
   - Implement messages API
   - Add error handling
   - Test with sample queries

### Phase 2: Enhanced UX

3. **Conversation Memory** (4-6 hours)
   - Add conversationId to track threads
   - Pass conversation history to AI
   - Enable follow-up questions

4. **Streaming Responses** (4-6 hours)
   - Implement SSE for real-time feedback
   - Update frontend for streaming
   - Add streaming toggle option

### Phase 3: Enterprise Features

5. **Azure OpenAI** (3-4 hours)
   - Add Azure provider case
   - Configure endpoint/deployment
   - Enterprise SSO integration

6. **OpenRouter** (2-3 hours)
   - Add OpenRouter provider case
   - Multi-model access
   - Cost tracking

### Phase 4: Intelligence

7. **Gemini Integration** (2-3 hours)
   - Add Gemini provider
   - Leverage Google's capabilities
   - Cost-effective option

8. **RAG Pipeline** (1-2 days)
   - Choose vector database
   - Implement embeddings
   - Build retrieval logic
   - Integrate with AI providers

---

## O. Phased Roadmap

### Phase AI-1: OpenAI Integration (2-3 hours)

**Objective:** Get OpenAI working in production

**Tasks:**
1. Install `openai` npm package
2. Implement `runOpenAi()` with real API call
3. Add proper error handling
4. Add request timeout
5. Test with sample queries
6. Document required environment variables

**Deliverables:**
- Working OpenAI provider
- Updated `providerFactory.ts`
- Documentation for setup

---

### Phase AI-2: Claude Integration (2-3 hours)

**Objective:** Add Anthropic Claude as alternative provider

**Tasks:**
1. Install `@anthropic-ai/sdk` npm package
2. Implement `runClaude()` with messages API
3. Add proper error handling
4. Test with sample queries
5. Compare responses with OpenAI

**Deliverables:**
- Working Claude provider
- Updated `providerFactory.ts`
- Provider comparison documentation

---

### Phase AI-3: Gemini Integration (2-3 hours)

**Objective:** Add Google Gemini as cost-effective option

**Tasks:**
1. Add environment variables to `env.ts`
2. Add `gemini` to AI_PROVIDER enum
3. Install `@google/generative-ai` package
4. Implement `runGemini()` 
5. Test with sample queries

**Deliverables:**
- Working Gemini provider
- Three working AI providers

---

### Phase AI-4: Conversation Memory (4-6 hours)

**Objective:** Enable context-aware AI conversations

**Tasks:**
1. Update `AiConversation` schema:
   - Add `conversationId` field
   - Add `role` field (user/assistant)
   - Add `parentId` for threading
2. Update `ai.service.ts`:
   - Load conversation history
   - Include in prompt context
3. Update frontend:
   - Pass conversation ID
   - Display conversation thread

**Deliverables:**
- Conversation threading
- Context-aware AI responses
- Follow-up question support

---

### Phase AI-5: RAG Integration (1-2 days)

**Objective:** Give AI access to Knowledge Base and ITSM data

**Tasks:**
1. Choose vector database (recommend: Pinecone or Qdrant)
2. Implement embedding generation:
   - Create chunking logic for KB articles
   - Generate embeddings using OpenAI
   - Store in vector DB
3. Implement retrieval:
   - Embed user query
   - Search vector DB for relevant chunks
   - Include in AI prompt
4. Update UI:
   - Show sources/references
   - Confidence indicators

**Deliverables:**
- Knowledge Base integration
- Semantic search capability
- Cited AI responses

---

### Phase AI-6: Streaming Responses (4-6 hours)

**Objective:** Real-time AI feedback for better UX

**Tasks:**
1. Backend:
   - Implement SSE (Server-Sent Events) endpoint
   - Stream AI token responses
   - Add streaming flag to config
2. Frontend:
   - Update AssistantPanel for streaming
   - Show tokens as they arrive
   - Handle stream completion

**Deliverables:**
- Real-time AI responses
- Progressive answer display
- Streaming toggle option

---

## Summary

### Current State

| Category | Status |
|----------|--------|
| Frontend UI | ✅ Fully working |
| Backend API | ✅ Fully working |
| Keyword routing | ✅ Working |
| Database logging | ✅ Working |
| OpenAI | ⚠️ Stub only |
| Claude | ⚠️ Stub only |
| Private model | ⚠️ Stub only |
| Gemini | ❌ Not available |
| Azure OpenAI | ❌ Not available |
| OpenRouter | ❌ Not available |
| Conversation memory | ⚠️ Logging only |
| RAG | ❌ Not available |
| Streaming | ❌ Not available |

### Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| AI-1: OpenAI | 2-3 hours | High |
| AI-2: Claude | 2-3 hours | High |
| AI-3: Gemini | 2-3 hours | Medium |
| AI-4: Memory | 4-6 hours | Medium |
| AI-5: RAG | 1-2 days | Low |
| AI-6: Streaming | 4-6 hours | Low |

---

**End of AI Integration Audit Report**
