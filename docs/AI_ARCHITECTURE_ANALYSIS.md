# AI Architecture Analysis Report

**Document Version:** 1.0  
**Date:** 2026-06-24  
**Purpose:** Complete technical analysis of the current AI architecture in Saven InfraOps Command Center  
**Status:** READ-ONLY - No modifications made

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [End-to-End AI Request Flow](#2-end-to-end-ai-request-flow)
3. [All AI-Related Files and Responsibilities](#3-all-ai-related-files-and-responsibilities)
4. [Keyword Routing Logic](#4-keyword-routing-logic)
5. [LLM Provider Integration Flow](#5-llm-provider-integration-flow)
6. [Database Query Flow](#6-database-query-flow)
7. [Prisma Models Available for AI](#7-prisma-models-available-for-ai)
8. [Database Entities](#8-database-entities)
9. [Authentication Flow](#9-authentication-flow)
10. [REST Endpoints](#10-rest-endpoints)
11. [Navigation Integration](#11-navigation-integration)
12. [Parts to Remain Unchanged](#12-parts-to-remain-unchanged)
13. [Parts Needing Replacement for AI Agent](#13-parts-needing-replacement-for-ai-agent)
14. [Architecture Diagram](#14-architecture-diagram)
15. [Gap Analysis](#15-gap-analysis)
16. [Recommendations](#16-recommendations)

---

## 1. Executive Summary

### Current Architecture State

The current AI implementation is a **simple request-response pattern** with keyword-based routing:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT AI ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

   User Input
       │
       ▼
┌──────────────────┐
│  Frontend UI     │  AssistantPanel.tsx, CommandBar.tsx
│  - Question      │  → api.post('/ai/ask', { question })
└────────┬─────────┘
         │ HTTP POST /api/ai/ask
         ▼
┌──────────────────┐
│  Backend Route   │  ai.routes.ts
│  /api/ai/ask     │  → requireAuth + requirePermission('ai:ask')
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  ai.service.ts   │  KEYWORD ROUTING
│  askAi()         │  ┌─────────────────────────────────────────────┐
│                  │  │  if (q.includes('service request'))  ──────►│ Database
│                  │  │  else if (q.includes('incident'))   ──────►│ Database
│                  │  │  else if (q.includes('asset'))     ──────►│ Database
│                  │  │  else if (q.includes('compliance')) ──────►│ Database
│                  │  │  else                                          │
│                  │  │  ┌─────────────────────────────────────────│
│                  │  │  │      runAiProvider(question)            │
│                  │  │  │              │                           │
│                  │  │  │              ▼                           │
│                  │  │  │    providerFactory.ts                    │
│                  │  │  │              │                           │
│                  │  │  │    ┌──────────┴──────────┐                │
│                  │  │  │    │                     │                │
│                  │  │  │    ▼                     ▼                │
│                  │  │  │  openai.ts          gemini.ts            │
│                  │  │  │  claude.ts          (LLM providers)       │
│                  │  │  └─────────────────────────────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Response        │
│  { answer,       │
│    cards,        │
│    provider,     │
│    model }       │
└──────────────────┘
```

### Key Characteristics

| Aspect | Current State |
|--------|---------------|
| **Pattern** | Simple request-response |
| **Routing** | Keyword-based (if/else chains) |
| **Providers** | OpenAI, Gemini, Claude, Mock |
| **Context** | No conversation history |
| **Tool Use** | None (LLM has no database access) |
| **Agentic** | No |
| **Multi-step** | No |
| **Memory** | No conversation history |

---

## 2. End-to-End AI Request Flow

### 2.1 Frontend Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

1. User types question in AssistantPanel or CommandBar
                              │
                              ▼
2. AssistantPanel.ask() or CommandBar.submit()
   - Validates input is not empty
   - Sets loading state
                              │
                              ▼
3. API Call: POST /api/ai/ask
   Request: { question: "string" }
   Headers: { Authorization: "Bearer <JWT>" }
                              │
                              ▼
4. Response Handling:
   - setAnswer(response.data.answer)
   - setCards(response.data.cards || [])
   - Navigate to href links if cards are clicked
```

### 2.2 Backend Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

1. ai.routes.ts: POST /api/ai/ask
   ┌─────────────────────────────────────────────────────┐
   │ Middleware Chain:                                    │
   │   requireAuth → requirePermission('ai:ask')          │
   │                                                      │
   │ Validation: z.object({ question: z.string().min(2) })│
   └─────────────────────────┬───────────────────────────┘
                             │
                             ▼
2. ai.service.ts: askAi({ question, userId })
   ┌─────────────────────────────────────────────────────┐
   │ Step 1: Lowercase question for keyword matching      │
   │ const q = input.question.toLowerCase();              │
   │                                                      │
   │ Step 2: Keyword Routing (if/else)                    │
   │                                                      │
   │ Step 3: Either Database Query OR LLM Call             │
   │                                                      │
   │ Step 4: Log to AiConversation table                  │
   │                                                      │
   │ Step 5: Return { answer, cards, provider, model }    │
   └─────────────────────────┬───────────────────────────┘
                             │
                             ▼
3. Response sent to frontend
```

### 2.3 Complete Sequence Diagram

```
┌──────┐          ┌─────────────┐         ┌────────────┐         ┌───────────┐
│ User │          │  Frontend   │         │  Backend   │         │  Database │
└──┬───┘          └──────┬──────┘         └─────┬──────┘         └─────┬─────┘
   │                      │                       │                     │
   │  Type question       │                       │                     │
   │──────────────────────►                       │                     │
   │                      │                       │                     │
   │                      │  POST /api/ai/ask     │                     │
   │                      │  { question }         │                     │
   │                      │──────────────────────►│                     │
   │                      │                       │                     │
   │                      │                       │  requireAuth        │
   │                      │                       │  requirePermission   │
   │                      │                       │──────┐               │
   │                      │                       │      │ Auth Check     │
   │                      │                       │◄─────┘               │
   │                      │                       │                     │
   │                      │                       │  askAi()            │
   │                      │                       │──────┐               │
   │                      │                       │      │              │
   │                      │                       │      ▼              │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ Keyword     │      │
   │                      │                       │ │ Routing     │      │
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │        ▼             │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ If keyword  │      │
   │                      │                       │ │ match found │      │
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │        ▼             │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ Prisma      │      │
   │                      │                       │ │ Query       │      │
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │◄────────┘             │
   │                      │                       │        │             │
   │                      │                       │        │ OR           │
   │                      │                       │        ▼             │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ runAi       │      │
   │                      │                       │ │ Provider()  │      │
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │        ▼             │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ LLM Call    │────►│
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │◄────────┘             │
   │                      │                       │        │             │
   │                      │                       │        ▼             │
   │                      │                       │ ┌─────────────┐      │
   │                      │                       │ │ Log to      │      │
   │                      │                       │ │ AiConver-   │      │
   │                      │                       │ │ sation      │      │
   │                      │                       │ └──────┬──────┘      │
   │                      │                       │        │             │
   │                      │                       │◄────────┘             │
   │                      │                       │                     │
   │                      │  { answer, cards,     │                     │
   │                      │    provider, model }   │                     │
   │                      │◄──────────────────────│                     │
   │                      │                       │                     │
   │  Display answer      │                       │                     │
   │◄─────────────────────│                       │                     │
   │                      │                       │                     │
```

---

## 3. All AI-Related Files and Responsibilities

### 3.1 Backend Files

| File | Responsibility | Key Exports |
|------|---------------|-------------|
| `backend/src/modules/ai/ai.routes.ts` | REST endpoint definition | `aiRouter` |
| `backend/src/modules/ai/ai.service.ts` | Business logic, routing | `askAi()` |
| `backend/src/modules/ai/providers/providerFactory.ts` | Provider selection | `runAiProvider()` |
| `backend/src/modules/ai/providers/openai.ts` | OpenAI integration | `runOpenAi()` |
| `backend/src/modules/ai/providers/gemini.ts` | Gemini integration | `runGemini()` |
| `backend/src/modules/ai/providers/claude.ts` | Claude integration | `runClaude()` |
| `backend/src/middleware/auth.ts` | JWT authentication | `requireAuth()` |
| `backend/src/middleware/rbac.ts` | Permission checking | `requirePermission()` |
| `backend/src/config/env.ts` | Environment configuration | AI env vars |
| `backend/prisma/schema.prisma` | Database schema | All models |

### 3.2 Frontend Files

| File | Responsibility |
|------|---------------|
| `frontend/src/components/AssistantPanel.tsx` | Side panel AI interface |
| `frontend/src/components/CommandBar.tsx` | Top bar command interface |
| `frontend/src/auth/AuthContext.tsx` | Auth token management |
| `frontend/src/services/api.ts` | API client configuration |

### 3.3 File Dependency Graph

```
ai.routes.ts
    │
    ├── imports: requireAuth (middleware/auth.ts)
    ├── imports: requirePermission (middleware/rbac.ts)
    └── imports: askAi (ai.service.ts)
                     │
                     ├── imports: prisma (common/prisma.ts)
                     ├── imports: env (config/env.ts)
                     └── imports: runAiProvider (providers/providerFactory.ts)
                                        │
                                        ├── imports: env
                                        ├── imports: runOpenAi (openai.ts)
                                        ├── imports: runGemini (gemini.ts)
                                        └── imports: runClaude (claude.ts)
```

---

## 4. Keyword Routing Logic

### 4.1 Current Implementation

```typescript
// ai.service.ts - askAi() function

export async function askAi(input: { question: string; userId?: string }) {
  const q = input.question.toLowerCase();  // Normalize to lowercase

  // Route 1: Service Request / Ticket queries
  if (q.includes('service request') || q.includes('ticket')) {
    // Prisma queries:
    // - prisma.serviceRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } })
    // - prisma.serviceRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    // - prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() } } })
    provider = 'keyword';
    model = 'database';
  }
  
  // Route 2: Incident queries
  else if (q.includes('incident')) {
    // Prisma queries:
    // - prisma.incident.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } })
    // - prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    provider = 'keyword';
    model = 'database';
  }
  
  // Route 3: Asset/Inventory queries
  else if (q.includes('asset') || q.includes('inventory') || q.includes('laptop')) {
    // Prisma queries:
    // - prisma.asset.count({ where: { status: 'AVAILABLE' } })
    // - prisma.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    provider = 'keyword';
    model = 'database';
  }
  
  // Route 4: Compliance/Audit queries
  else if (q.includes('compliance') || q.includes('audit')) {
    // Prisma queries:
    // - prisma.complianceControl.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } })
    // - prisma.complianceControl.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    provider = 'keyword';
    model = 'database';
  }
  
  // Route 5: Everything else → LLM
  else {
    const providerAnswer = await runAiProvider(input.question);
    // Returns LLM response
  }
}
```

### 4.2 Keyword Table

| Keyword | Database Table | Query Type | Response Format |
|---------|---------------|------------|-----------------|
| `service request` | ServiceRequest | count + findMany | Cards with ticketNo, priority, title |
| `ticket` | ServiceRequest | count + findMany | Cards with ticketNo, priority, title |
| `incident` | Incident | count + findMany | Cards with incidentNo, severity, title |
| `asset` | Asset | count + findMany | Cards with assetNo, status, type |
| `inventory` | Asset | count + findMany | Cards with assetNo, status, type |
| `laptop` | Asset | count + findMany | Cards with assetNo, status, type |
| `compliance` | ComplianceControl | count + findMany | Cards with controlNo, riskRating, title |
| `audit` | ComplianceControl | count + findMany | Cards with controlNo, riskRating, title |
| *(everything else)* | *None* | LLM call | Text answer |

### 4.3 Limitations of Current Keyword Routing

1. **No multi-intent detection** - First match wins
2. **No fuzzy matching** - Exact substring required
3. **No entity extraction** - Cannot extract ticket numbers from questions
4. **No tool calling** - LLM cannot query database
5. **No context awareness** - No conversation history

---

## 5. LLM Provider Integration Flow

### 5.1 Provider Selection (providerFactory.ts)

```typescript
export async function runAiProvider(question: string): Promise<ProviderResponse> {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return runOpenAi(question);
    case 'gemini':
      return runGemini(question);
    case 'claude':
      return runClaude(question);
    case 'private':
      return runPrivateModel(question);  // Stub
    default:
      return { answer: 'Mock response...' };
  }
}
```

### 5.2 Common Response Interface

All providers implement the same interface:

```typescript
interface ProviderResponse {
  answer: string;           // The text response
  raw?: unknown;            // Raw API response
  metadata?: {
    model: string;          // e.g., 'gpt-4o-mini'
    provider: string;      // e.g., 'openai'
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
  };
}
```

### 5.3 Provider-Specific Details

| Provider | SDK | Default Model | API Type |
|----------|-----|---------------|----------|
| OpenAI | `openai` | `gpt-4o-mini` | Chat Completions |
| Gemini | `@google/genai` | `gemini-2.0-flash` | generateContent |
| Claude | `@anthropic-ai/sdk` | `claude-3-5-sonnet-latest` | messages.create |

### 5.4 OpenAI Flow (openai.ts)

```typescript
async function runOpenAi(question: string): Promise<AiProviderResponse> {
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });
  
  return {
    answer: completion.choices[0].message.content,
    raw: completion,
    metadata: { model, provider: 'openai', usage: completion.usage }
  };
}
```

### 5.5 Gemini Flow (gemini.ts)

```typescript
async function runGemini(question: string): Promise<GeminiProviderResponse> {
  const modelName = env.GEMINI_MODEL || 'gemini-2.0-flash';
  
  const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [createPartFromText(prompt)] }],
    config: { temperature: 0.7, maxOutputTokens: 2048 }
  });
  
  return {
    answer: response.candidates[0].content.parts[0].text,
    raw: response,
    metadata: { model: modelName, provider: 'gemini', usageMetadata }
  };
}
```

### 5.6 Claude Flow (claude.ts)

```typescript
async function runClaude(question: string): Promise<ClaudeProviderResponse> {
  const model = env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest';
  
  const client = new Anthropic({ apiKey: env.CLAUDE_API_KEY });
  
  const response = await client.messages.create({
    model,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
    temperature: 0.7,
    max_tokens: 4096
  });
  
  return {
    answer: response.content[0].text,
    raw: response,
    metadata: { model, provider: 'claude', usage: response.usage }
  };
}
```

### 5.7 System Prompt (All Providers)

```typescript
const SYSTEM_PROMPT = `You are an AI assistant for Saven InfraOps Command Center, 
an enterprise ITSM (IT Service Management) platform.

Your capabilities:
- Answer questions about service requests, incidents, assets, compliance, and access management
- Provide summaries of open tickets and their priorities
- Help users navigate the platform and understand ITSM workflows
- Explain ITSM concepts and best practices (ITIL framework)
- Assist with troubleshooting common IT issues

Guidelines:
- Be concise and helpful in your responses
- When providing counts or summaries, mention the data source
- If you don't know something, say so clearly
- Focus on actionable information
- Use professional tone appropriate for enterprise IT environments

Current date: ${new Date().toISOString().split('T')[0]}`;
```

---

## 6. Database Query Flow

### 6.1 When Database Queries Execute

Database queries execute when the question contains specific keywords (see Section 4.1).

### 6.2 Query Patterns

Each keyword route follows the same pattern:

```typescript
// 1. Count open items
const count = await prisma.<Model>.count({ 
  where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } 
});

// 2. Get latest items
const latest = await prisma.<Model>.findMany({ 
  orderBy: { createdAt: 'desc' }, 
  take: 5 
});

// 3. Optional: Count SLA breaches
const breached = await prisma.<Model>.count({ 
  where: { dueAt: { lt: new Date() }, status: { notIn: ['CLOSED', 'RESOLVED'] } } 
});
```

### 6.3 Response Transformation

```typescript
// Convert database records to UI cards
cards = latest.map((item) => ({
  title: item.ticketNo,           // Display identifier
  value: item.priority,           // Highlight value
  description: item.title,        // Description text
  href: '/service-requests'       // Navigation link
}));
```

---

## 7. Prisma Models Available for AI

### 7.1 AI-Specific Model

```prisma
model AiConversation {
  id         String   @id @default(cuid())
  userId     String?  // Optional - null for unauthenticated
  question   String   @db.Text
  answer     String   @db.Text
  provider   String   // 'openai', 'gemini', 'claude', 'keyword', 'mock'
  sourceJson Json?    // Additional metadata (cards, records, etc.)
  createdAt  DateTime @default(now())
}
```

### 7.2 Models Currently Queried by AI

| Model | Fields Used | Purpose |
|-------|-----------|---------|
| ServiceRequest | ticketNo, priority, title, status, createdAt, dueAt | Ticket counts |
| Incident | incidentNo, severity, title, status, createdAt | Incident counts |
| Asset | assetNo, status, assetType, make, createdAt | Asset counts |
| ComplianceControl | controlNo, riskRating, title, status, createdAt | Compliance counts |

### 7.3 Models NOT Currently Queried by AI

| Model | Potential AI Use Cases |
|-------|------------------------|
| User | "Who is the manager of Engineering?" |
| Role | "What permissions does the Admin role have?" |
| Permission | "List all permissions related to tickets" |
| Problem | "How many problems are open?" |
| ChangeRequest | "What changes are pending approval?" |
| AccessRequest | "Show pending access requests" |
| ProjectEnvironment | "List all production environments" |
| VendorLicense | "Which licenses expire next month?" |
| KnowledgeBaseArticle | "Find articles about network issues" |
| AuditLog | "Show recent changes by admin" |

---

## 8. Database Entities

### 8.1 Complete Entity List

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE ENTITIES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     User         │     │     Role         │     │   Permission     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ name             │◄────│ users (FK)       │◄────│ roles (FK)       │
│ email (UNIQUE)   │     │ name (UNIQUE)    │     │ code (UNIQUE)    │
│ phoneNumber      │     │ description      │     │ description      │
│ passwordHash     │     └──────────────────┘     └──────────────────┘
│ department       │              │
│ status           │              │ N:M
└──────────────────┘              │ via UserRole
                                 │ & RolePermission
┌──────────────────┐              │
│  ServiceRequest  │              │
├──────────────────┤              │
│ id (PK)          │              │
│ ticketNo (UNIQUE)│              │
│ title            │              │
│ description      │              │
│ category         │              │
│ priority         │              │
│ status           │              │
│ requesterId (FK) │──────────────┘
│ assigneeId (FK)  │
│ dueAt            │
│ createdAt        │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Incident      │     │    Problem       │     │  ChangeRequest   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ incidentNo (U)   │     │ problemNo (U)    │     │ changeNo (U)     │
│ title            │     │ title            │     │ title            │
│ severity         │     │ status           │     │ riskLevel        │
│ status           │     │ rootCause        │     │ status           │
│ impactedService  │     │ ownerName        │     │ changeWindow     │
│ ownerName        │     └──────────────────┘     │ rollbackPlan     │
└──────────────────┘                                └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Asset        │     │  AccessRequest   │     │ComplianceControl │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ assetNo (UNIQUE) │     │ requestNo (U)    │     │ controlNo (U)    │
│ assetType        │     │ requesterName    │     │ title            │
│ make             │     │ accessType       │     │ controlArea      │
│ model            │     │ systemName       │     │ ownerName        │
│ serialNo         │     │ status           │     │ frequency        │
│ status           │     │ justification    │     │ dueAt            │
│ location         │     │ expiryAt         │     │ status           │
└──────────────────┘     └──────────────────┘     │ riskRating       │
                                                  └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ProjectEnvironment│     │  VendorLicense   │     │KnowledgeBaseArticle│
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ projectName      │     │ vendorName       │     │ title            │
│ environmentName  │     │ licenseName      │     │ category         │
│ serviceName      │     │ licenseCount     │     │ body             │
│ serverName       │     │ assignedCount    │     │ status           │
│ databaseName     │     │ renewalAt        │     │ authorName       │
│ ownerName        │     │ cost             │     └──────────────────┘
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  SystemSetting   │     │    AuditLog      │     │  AiConversation  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ group            │     │ actorId          │     │ userId           │
│ key (UNIQUE)     │     │ actorEmail       │     │ question         │
│ value            │     │ action           │     │ answer           │
│ isSecret         │     │ entityType       │     │ provider         │
└──────────────────┘     │ entityId         │     │ sourceJson       │
                         │ oldValue (JSON)  │     └──────────────────┘
                         │ newValue (JSON)  │
                         └──────────────────┘
```

### 8.2 Entity Relationships

```
User 1───M UserRole M───1 Role 1───M RolePermission M───1 Permission
  │
  └───1 ServiceRequest (as requester)
  └───1 ServiceRequest (as assignee)

Incident: 1 entity, no relations
Problem: 1 entity, no relations  
ChangeRequest: 1 entity, no relations
Asset: 1 entity, no relations
AccessRequest: 1 entity, no relations
ComplianceControl: 1 entity, no relations
ProjectEnvironment: 1 entity, no relations
VendorLicense: 1 entity, no relations
KnowledgeBaseArticle: 1 entity, no relations
SystemSetting: 1 entity, no relations
AuditLog: 1 entity, no relations
AiConversation: 1 entity, no relations (userId is optional)
```

---

## 9. Authentication Flow

### 9.1 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐                    ┌─────────────────┐                    ┌────────┐
│ Frontend │                    │   Backend       │                    │ MySQL  │
└────┬─────┘                    └────────┬────────┘                    └───┬────┘
     │                                  │                                │
     │  1. Login Request                │                                │
     │  POST /auth/login                │                                │
     │  { email, password }             │                                │
     │──────────────────────────────────►                                │
     │                                  │                                │
     │                                  │  2. Query User                 │
     │                                  │  SELECT * FROM User           │
     │                                  │  WHERE email = ?              │
     │                                  │───────────────────────────────►│
     │                                  │                                │
     │                                  │  3. Verify Password            │
     │                                  │  bcrypt.compare(password)     │
     │                                  │                                │
     │  4. JWT Response                 │                                │
     │  { token, user }                 │                                │
     │◄──────────────────────────────────│                                │
     │                                  │                                │
     │  5. Store Token                  │                                │
     │  localStorage.setItem            │                                │
     │  ('infraops.token', token)       │                                │
     │                                  │                                │
     │  6. Subsequent Requests          │                                │
     │  Authorization: Bearer <token>   │                                │
     │──────────────────────────────────►│                                │
     │                                  │                                │
     │                                  │  7. Verify JWT                │
     │                                  │  jwt.verify(token, secret)    │
     │                                  │                                │
     │                                  │  8. Check Permissions         │
     │                                  │  requirePermission('ai:ask')  │
     │                                  │                                │
```

### 9.2 JWT Token Structure

```typescript
// Token payload
{
  id: string;           // User ID (cuid)
  email: string;        // User email
  roles: string[];      // Role names
  permissions: string[]; // Permission codes
}
```

### 9.3 Permission Requirements for AI

```typescript
// ai.routes.ts
aiRouter.post('/ask', 
  requireAuth,                    // Valid JWT required
  requirePermission('ai:ask'),    // Must have 'ai:ask' permission
  async (req, res, next) => { ... }
);
```

### 9.4 Middleware Implementation

**auth.ts - requireAuth:**
```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) 
    throw new HttpError(401, 'Missing bearer token');

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}
```

**rbac.ts - requirePermission:**
```typescript
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) 
      throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}
```

---

## 10. REST Endpoints

### 10.1 AI Endpoints

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/ai/ask` | Required | `ai:ask` | Submit AI question |

### 10.2 Endpoint Definition

```typescript
// ai.routes.ts
const askSchema = z.object({ 
  question: z.string().min(2).max(1000) 
});

aiRouter.post('/ask', 
  requireAuth,                    // JWT validation
  requirePermission('ai:ask'),   // Permission check
  async (req, res, next) => {
    const payload = askSchema.parse(req.body);
    const result = await askAi({ 
      question: payload.question, 
      userId: req.user?.id 
    });
    res.json(result);
  }
);
```

### 10.3 Request/Response Format

**Request:**
```json
POST /api/ai/ask
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "question": "How many open service requests?"
}
```

**Response:**
```json
{
  "answer": "There are 15 open service requests. SLA breached count is 3.",
  "cards": [
    {
      "title": "SR-00001",
      "value": "HIGH",
      "description": "Network connectivity issue",
      "href": "/service-requests"
    },
    ...
  ],
  "provider": "keyword",
  "model": "database"
}
```

---

## 11. Navigation Integration

### 11.1 Current Navigation in AssistantPanel

The AssistantPanel displays cards with `href` links:

```typescript
// AssistantPanel.tsx
{cards.map((card) => (
  card.href ? (
    <Link className="mini-card" to={card.href}>
      <span>{card.title}</span>
      <strong>{card.value}</strong>
      <small>{card.description}</small>
    </Link>
  ) : (
    <div className="mini-card">...</div>
  )
))}
```

### 11.2 Current Navigation in CommandBar

The CommandBar has hardcoded navigation based on keywords:

```typescript
// CommandBar.tsx
const lower = text.toLowerCase();
if (lower.includes('service request') || lower.includes('ticket')) 
  navigate('/service-requests');
if (lower.includes('inventory') || lower.includes('asset')) 
  navigate('/inventory');
if (lower.includes('compliance')) 
  navigate('/compliance');
if (lower.includes('incident')) 
  navigate('/incidents');
```

### 11.3 Navigation Opportunities

Currently NOT implemented:
- LLM-generated navigation suggestions
- Dynamic href generation from AI responses
- Natural language navigation ("take me to incidents")

### 11.4 Available Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | DashboardPage | Main dashboard |
| `/service-requests` | ServiceRequestsPage | Service request list |
| `/incidents` | ModulePage (incidents) | Incident list |
| `/problems` | ModulePage (problems) | Problem list |
| `/changes` | ModulePage (changes) | Change management |
| `/inventory` | ModulePage (inventory) | Asset inventory |
| `/access-management` | ModulePage (access-management) | Access requests |
| `/compliance` | ModulePage (compliance) | Compliance controls |
| `/projects-environments` | ModulePage (projects-environments) | Projects & envs |
| `/vendors-licenses` | ModulePage (vendors-licenses) | Vendors & licenses |
| `/reports-analytics` | ModulePage (reports-analytics) | Reports |
| `/knowledge-base` | ModulePage (knowledge-base) | Knowledge articles |
| `/users-teams` | ModulePage (users-teams) | User management |
| `/roles-permissions` | RolesPermissionsPage | Roles & permissions |
| `/settings` | SettingsPage | System settings |

---

## 12. Parts to Remain Unchanged

### 12.1 Authentication & Authorization

- ✅ `backend/src/middleware/auth.ts` - JWT verification
- ✅ `backend/src/middleware/rbac.ts` - Permission checking
- ✅ `frontend/src/auth/AuthContext.tsx` - Token management

**Rationale:** The current authentication system is secure and well-implemented. No changes needed for AI agent architecture.

### 12.2 API Transport Layer

- ✅ `frontend/src/services/api.ts` - Axios configuration
- ✅ `backend/src/modules/ai/ai.routes.ts` - REST endpoint

**Rationale:** The REST transport is simple and effective. Could be enhanced with WebSocket for streaming, but not required.

### 12.3 Provider Adapters

- ✅ `backend/src/modules/ai/providers/openai.ts`
- ✅ `backend/src/modules/ai/providers/gemini.ts`
- ✅ `backend/src/modules/ai/providers/claude.ts`
- ✅ `backend/src/modules/ai/providers/providerFactory.ts`

**Rationale:** These implementations follow a consistent interface and can be reused as the underlying LLM clients in an agent architecture.

### 12.4 Prisma Client

- ✅ `backend/src/common/prisma.ts` - Database client singleton

**Rationale:** The Prisma client is properly configured and can be reused for AI agent tool calls.

### 12.5 Frontend UI Components

- ✅ `frontend/src/components/AssistantPanel.tsx` - UI structure
- ✅ `frontend/src/components/CommandBar.tsx` - Command interface

**Rationale:** The UI provides a good foundation. Can be enhanced but doesn't need replacement.

---

## 13. Parts Needing Replacement for AI Agent

### 13.1 ai.service.ts (Major Changes Required)

**Current:**
- Simple keyword-based if/else routing
- Hardcoded database queries per keyword
- No conversation history
- No tool definitions
- No agentic behavior

**Required for Agent:**
- Dynamic intent classification
- Tool selection based on user intent
- Conversation history management
- Tool execution with results
- Response synthesis from tool outputs
- Error handling for tool failures

### 13.2 Database Query Layer (New Layer Needed)

**Current:**
- Hardcoded queries per entity type
- Fixed response card format

**Required for Agent:**
```typescript
// Tool definitions for each entity
interface Tool {
  name: string;           // e.g., "query_tickets"
  description: string;    // e.g., "Query open service requests"
  parameters: {...};      // JSON Schema for parameters
  execute: (params) => Promise<Result>;
}
```

**Tools needed:**
1. `query_tickets` - ServiceRequest queries with filters
2. `query_incidents` - Incident queries with filters
3. `query_assets` - Asset queries with filters
4. `query_compliance` - ComplianceControl queries
5. `query_problems` - Problem queries
6. `query_changes` - ChangeRequest queries
7. `query_access_requests` - AccessRequest queries
8. `query_environments` - ProjectEnvironment queries
9. `query_licenses` - VendorLicense queries
10. `query_knowledge` - KnowledgeBaseArticle queries
11. `query_users` - User queries
12. `query_roles` - Role queries
13. `navigate_to` - Frontend navigation

### 13.3 Conversation History (New Feature)

**Current:**
- No conversation storage
- Each request is independent

**Required for Agent:**
```typescript
interface ConversationContext {
  messages: Message[];      // Full conversation history
  recentToolCalls: ToolCall[];  // Tool execution history
  userPreferences?: {...};     // Learned preferences
}
```

### 13.4 Intent Classification (New Layer)

**Current:**
- Keyword matching with `includes()`

**Required for Agent:**
```typescript
interface Intent {
  type: 'query' | 'action' | 'navigation' | 'general';
  entities: {...};           // Extracted entities
  parameters: {...};         // Query parameters
  confidence: number;        // Classification confidence
}
```

### 13.5 Response Formatting (Enhanced)

**Current:**
```typescript
{ answer: string, cards: Card[], provider: string, model: string }
```

**Required for Agent:**
```typescript
interface AgentResponse {
  message: string;              // Natural language response
  toolCalls?: ToolCall[];       // What tools were called
  results?: ToolResult[];      // Tool execution results
  suggestions?: string[];       // Follow-up suggestions
  navigation?: NavigationHint;  // Optional navigation
  provider: string;
  model: string;
  tokens?: TokenUsage;
}
```

---

## 14. Architecture Diagram

### 14.1 Current Architecture (Mermaid)

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React)"]
        AP["AssistantPanel.tsx"]
        CB["CommandBar.tsx"]
        API["api.ts"]
        AUTH["AuthContext.tsx"]
    end

    subgraph Backend["Backend (Express/Node)"]
        subgraph Routes["Routes"]
            AI_ROUTE["POST /api/ai/ask"]
        end

        subgraph Middleware["Middleware"]
            AUTH_MW["requireAuth"]
            RBAC_MW["requirePermission"]
        end

        subgraph AI_Service["AI Service Layer"]
            AI_SVC["ai.service.ts"]
            KEYWORD["Keyword Router"]
            DB_QUERY["Database Queries"]
        end

        subgraph Providers["AI Providers"]
            FACTORY["providerFactory.ts"]
            OPENAI["openai.ts"]
            GEMINI["gemini.ts"]
            CLAUDE["claude.ts"]
        end

        subgraph External["External Services"]
            OPENAI_API["OpenAI API"]
            GEMINI_API["Google Gemini API"]
            CLAUDE_API["Anthropic Claude API"]
        end
    end

    subgraph Database["Database (MySQL/Prisma)"]
        PRISMA["Prisma Client"]
        CONV["AiConversation"]
        SR["ServiceRequest"]
        INC["Incident"]
        ASSET["Asset"]
        COMP["ComplianceControl"]
    end

    AP -->|"POST /ai/ask"| API
    CB -->|"POST /ai/ask"| API
    API -->|"Bearer Token"| AUTH_MW
    AUTH_MW --> RBAC_MW
    RBAC_MW --> AI_ROUTE
    AI_ROUTE --> AI_SVC

    AI_SVC --> KEYWORD
    KEYWORD -->|"Contains keyword"| DB_QUERY
    KEYWORD -->|"No keyword"| FACTORY

    DB_QUERY --> PRISMA
    PRISMA --> SR
    PRISMA --> INC
    PRISMA --> ASSET
    PRISMA --> COMP

    FACTORY --> OPENAI
    FACTORY --> GEMINI
    FACTORY --> CLAUDE

    OPENAI --> OPENAI_API
    GEMINI --> GEMINI_API
    CLAUDE --> CLAUDE_API

    AI_SVC -->|"Log conversation"| CONV
    CONV --> PRISMA

    style AI_SVC fill:#f9f,stroke:#333,stroke-width:2px
    style KEYWORD fill:#ff9,stroke:#333,stroke-width:2px
    style FACTORY fill:#9f9,stroke:#333,stroke-width:2px
```

### 14.2 Target Architecture (Mermaid)

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React)"]
        AP["AssistantPanel.tsx"]
        CB["CommandBar.tsx"]
        API["api.ts"]
        AUTH["AuthContext.tsx"]
    end

    subgraph Backend["Backend (Express/Node)"]
        subgraph Routes["Routes"]
            AI_ROUTE["POST /api/ai/ask"]
            STREAM_ROUTE["GET /api/ai/stream/:conversationId"]
        end

        subgraph Middleware["Middleware"]
            AUTH_MW["requireAuth"]
            RBAC_MW["requirePermission"]
        end

        subgraph AgentLayer["AI Agent Layer"]
            AGENT["Agent Orchestrator"]
            INTENT["Intent Classifier"]
            TOOL_SEL["Tool Selector"]
            EXECUTOR["Tool Executor"]
            SYNTH["Response Synthesizer"]
            MEMORY["Conversation Memory"]
        end

        subgraph Tools["Tool Registry"]
            TICKETS["query_tickets"]
            INCIDENTS["query_incidents"]
            ASSETS["query_assets"]
            COMPLIANCE["query_compliance"]
            PROBLEMS["query_problems"]
            CHANGES["query_changes"]
            NAVIGATE["navigate_to"]
            KNOWLEDGE["query_knowledge"]
        end

        subgraph Providers["AI Providers"]
            FACTORY["providerFactory.ts"]
            OPENAI["openai.ts"]
            GEMINI["gemini.ts"]
            CLAUDE["claude.ts"]
        end

        subgraph External["External Services"]
            OPENAI_API["OpenAI API"]
            GEMINI_API["Google Gemini API"]
            CLAUDE_API["Anthropic Claude API"]
        end
    end

    subgraph Database["Database (MySQL/Prisma)"]
        PRISMA["Prisma Client"]
        CONV_TABLE["AiConversation"]
        CONTEXT_TABLE["AiContext"]
    end

    AP -->|"POST /ai/ask"| API
    CB -->|"POST /ai/ask"| API
    API -->|"Bearer Token"| AUTH_MW
    AUTH_MW --> RBAC_MW
    RBAC_MW --> AI_ROUTE
    AI_ROUTE --> AGENT

    AGENT --> INTENT
    INTENT --> TOOL_SEL
    TOOL_SEL --> EXECUTOR
    EXECUTOR -->|"Tool Results"| SYNTH
    SYNTH -->|"LLM Synthesis"| FACTORY
    FACTORY --> OPENAI
    FACTORY --> GEMINI
    FACTORY --> CLAUDE

    EXECUTOR --> TICKETS
    EXECUTOR --> INCIDENTS
    EXECUTOR --> ASSETS
    EXECUTOR --> COMPLIANCE
    EXECUTOR --> PROBLEMS
    EXECUTOR --> CHANGES
    EXECUTOR --> KNOWLEDGE
    EXECUTOR --> NAVIGATE

    TICKETS --> PRISMA
    INCIDENTS --> PRISMA
    ASSETS --> PRISMA
    COMPLIANCE --> PRISMA
    PROBLEMS --> PRISMA
    CHANGES --> PRISMA
    KNOWLEDGE --> PRISMA

    AGENT --> MEMORY
    MEMORY --> CONV_TABLE
    MEMORY --> CONTEXT_TABLE

    style AGENT fill:#f9f,stroke:#333,stroke-width:4px
    style Tools fill:#9f9,stroke:#333,stroke-width:2px
    style AgentLayer fill:#ff9,stroke:#333,stroke-width:2px
```

---

## 15. Gap Analysis

### 15.1 Current vs. Required

| Capability | Current | Required | Gap |
|------------|---------|-----------|-----|
| **Intent Detection** | Keyword matching | LLM-based classification | Major |
| **Tool Use** | None | Function calling | Major |
| **Conversation History** | None | Full context | Major |
| **Multi-step Reasoning** | None | Chain of thought | Major |
| **Dynamic Queries** | Fixed queries | Parameterized | Moderate |
| **Error Handling** | Basic | Retry, fallbacks | Moderate |
| **Streaming** | None | Server-sent events | Moderate |
| **Context Windows** | Single message | Session-based | Major |

### 15.2 Effort Estimation

| Component | Effort | Complexity |
|-----------|--------|------------|
| Tool Registry | Medium | Low |
| Conversation Memory | Medium | Medium |
| Intent Classifier | High | High |
| Agent Orchestrator | High | High |
| Response Synthesizer | Medium | Medium |
| Streaming Support | Low | Low |
| Testing | High | Medium |

---

## 16. Recommendations

### 16.1 Short-term (Quick Wins)

1. **Remove Keyword Routing for LLM Queries**
   - Allow ALL questions to reach the LLM
   - LLM can decide whether to use tools

2. **Enhance Navigation Suggestions**
   - Parse LLM response for navigation hints
   - Add dynamic href generation

3. **Add Conversation History**
   - Store recent Q&A pairs
   - Pass context to LLM

### 16.2 Medium-term (Core Agent)

1. **Implement Tool Registry**
   - Define tools for each entity
   - Add schema validation
   - Add tool execution layer

2. **Enhance LLM Prompting**
   - Add tool descriptions to system prompt
   - Add conversation context
   - Add user permissions context

3. **Add Conversation Memory**
   - Store in database
   - Retrieve relevant history
   - Manage context window

### 16.3 Long-term (Full Agent)

1. **Implement Function Calling**
   - Use OpenAI/Gemini function calling
   - Automatic tool selection

2. **Add Multi-step Reasoning**
   - Chain of thought prompts
   - Sequential tool execution

3. **Add Streaming**
   - Server-sent events
   - Real-time token display

### 16.4 Architecture Principles

1. **Preserve Current Security**
   - Keep JWT authentication
   - Keep RBAC permission checks
   - Validate all tool inputs

2. **Incremental Migration**
   - Start with tool registry
   - Layer agent logic gradually

3. **Fallback Strategy**
   - Graceful degradation if LLM unavailable
   - Cached responses for common queries

4. **Observability**
   - Log all tool calls
   - Track conversation paths
   - Monitor token usage

---

## Appendix A: File Locations

| File | Path |
|------|------|
| AI Routes | `backend/src/modules/ai/ai.routes.ts` |
| AI Service | `backend/src/modules/ai/ai.service.ts` |
| Provider Factory | `backend/src/modules/ai/providers/providerFactory.ts` |
| OpenAI Provider | `backend/src/modules/ai/providers/openai.ts` |
| Gemini Provider | `backend/src/modules/ai/providers/gemini.ts` |
| Claude Provider | `backend/src/modules/ai/providers/claude.ts` |
| Auth Middleware | `backend/src/middleware/auth.ts` |
| RBAC Middleware | `backend/src/middleware/rbac.ts` |
| Prisma Schema | `backend/prisma/schema.prisma` |
| Env Config | `backend/src/config/env.ts` |
| Assistant Panel | `frontend/src/components/AssistantPanel.tsx` |
| Command Bar | `frontend/src/components/CommandBar.tsx` |
| API Service | `frontend/src/services/api.ts` |
| Auth Context | `frontend/src/auth/AuthContext.tsx` |

---

## Appendix B: Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `mock` | Provider: mock, openai, gemini, claude, private |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `OPENAI_TEMPERATURE` | `0.7` | OpenAI temperature |
| `OPENAI_MAX_TOKENS` | `2000` | Max tokens |
| `OPENAI_TIMEOUT` | `30000` | Timeout (ms) |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model |
| `GEMINI_TEMPERATURE` | `0.7` | Gemini temperature |
| `GEMINI_MAX_TOKENS` | `2048` | Max tokens |
| `CLAUDE_API_KEY` | - | Anthropic Claude API key |
| `CLAUDE_MODEL` | `claude-3-5-sonnet-latest` | Claude model |
| `CLAUDE_TEMPERATURE` | `0.7` | Claude temperature |
| `CLAUDE_MAX_TOKENS` | `4096` | Max tokens |

---

*End of Document*
