# AI Assistant Feature Audit Report

**Date:** 2026-06-24  
**Feature:** AI Assistant (Right-side Panel)  
**Status:** 🟡 PARTIALLY IMPLEMENTED

---

## 1. Component Tracing

### "Ask me about tickets, incidents, assets, compliance, access, or reports."

**Location:** `frontend/src/components/AssistantPanel.tsx`  
**Line:** 18

```typescript
const [answer, setAnswer] = useState('Ask me about tickets, incidents, assets, compliance, access, or reports.');
```

This is the initial state of the `answer` variable, displayed in the answer card when no query has been made.

---

## 2. Input Box Analysis

### Does an Input Box Exist?

✅ **YES** - An input box exists and is fully functional.

**Location:** `frontend/src/components/AssistantPanel.tsx` (lines 77-87)

```tsx
<div className="assistant-input">
  <input
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') ask();
    }}
    placeholder="Ask InfraOps..."
  />
  <button onClick={() => ask()} disabled={loading}>Ask</button>
</div>
```

### Is the Input Box Disabled?

✅ **NO** - The input box is **NOT disabled**.

### Was Free-Text Chat Planned but Not Implemented?

**NO** - Free-text chat is **FULLY IMPLEMENTED** in the frontend:
- User can type any question in the input field
- Pressing Enter or clicking "Ask" submits the query
- Results are displayed in the answer card

**HOWEVER**, the backend implementation is incomplete (see Section 5).

---

## 3. AI Provider Integration Status

### Supported Providers (Configured but Stubs)

| Provider | Status | Configuration | Notes |
|----------|--------|---------------|-------|
| **Mock** | ✅ Working | `AI_PROVIDER=mock` | Returns hardcoded responses |
| **OpenAI** | ⚠️ Stub | `AI_PROVIDER=openai` | Placeholder - needs real API call |
| **Claude** | ⚠️ Stub | `AI_PROVIDER=claude` | Placeholder - needs real API call |
| **Private Model** | ⚠️ Stub | `AI_PROVIDER=private` | Placeholder - needs real API call |

### Providers NOT Integrated

| Provider | Status |
|----------|--------|
| Gemini (Google) | ❌ Not available |
| Azure OpenAI | ❌ Not available |
| OpenRouter | ❌ Not available |
| Local/Ollama | ❌ Not available |

---

## 4. Frontend AI Features

### Working Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Input text field | ✅ Working | `AssistantPanel.tsx` lines 77-85 |
| Enter key submission | ✅ Working | `onKeyDown` handler |
| "Ask" button | ✅ Working | Submits query |
| Predefined suggestions | ✅ Working | 4 suggestion buttons |
| Loading state | ✅ Working | Shows "Checking records..." |
| Error handling | ✅ Working | Shows error message |
| Answer display | ✅ Working | Renders answer text |
| Result cards | ✅ Working | Shows mini-cards with links |
| Conversation history (DB) | ✅ Working | Saves to `aiConversation` table |

### Suggested Questions (Hardcoded)

```typescript
const suggestions = [
  'How many service requests are open?',
  'Show SLA breached tickets',
  'Summarize today incidents',
  'Show compliance due this month'
];
```

---

## 5. Backend AI Features

### API Endpoint

**POST `/api/ai/ask`**

**RBAC:** Requires `ai:ask` permission

**Request:**
```json
{ "question": "How many open tickets?" }
```

**Response:**
```json
{
  "answer": "There are 5 open service requests...",
  "cards": [{ "title": "SR-1005", "value": "HIGH", "description": "...", "href": "/service-requests" }],
  "provider": "mock"
}
```

### Smart Query Routing

The backend has **keyword-based routing** for natural queries:

| Keyword | Data Source | Working? |
|---------|-------------|----------|
| `ticket`, `service request` | Service Requests | ✅ Real data |
| `incident` | Incidents | ✅ Real data |
| `asset`, `inventory`, `laptop` | Assets | ✅ Real data |
| `compliance`, `audit` | Compliance | ✅ Real data |
| **Anything else** | AI Provider | ⚠️ Stub only |

### What's Working vs. What's Stub

| Component | Status | Details |
|-----------|--------|---------|
| Keyword detection | ✅ Working | Routes queries based on keywords |
| Database queries | ✅ Working | Real Prisma queries for tickets/incidents/etc |
| Response cards | ✅ Working | Creates mini-cards with links |
| Conversation logging | ✅ Working | Saves to `aiConversation` table |
| OpenAI adapter | ⚠️ Stub | Returns placeholder message |
| Claude adapter | ⚠️ Stub | Returns placeholder message |
| Private model adapter | ⚠️ Stub | Returns placeholder message |

---

## 6. Implementation Gaps

### Gap 1: AI Provider Adapters Are Stubs

The provider factory (`providerFactory.ts`) contains **placeholders**:

```typescript
async function runOpenAi(question: string) {
  if (!env.OPENAI_API_KEY) return { answer: 'OpenAI provider selected, but OPENAI_API_KEY is missing.' };
  return { answer: `OpenAI adapter placeholder ready for question: ${question}` };
}
```

**What it should do:** Actually call the OpenAI API with the question and context from the database.

### Gap 2: No RAG (Retrieval-Augmented Generation)

The system doesn't provide context from the database to the AI model. For proper AI assistance, it should:
1. Detect the intent
2. Query relevant database records
3. Include those records in the AI prompt
4. Return a natural language answer

### Gap 3: No Streaming Responses

The current implementation returns a complete response. No streaming/sSE support.

### Gap 4: Missing Azure OpenAI / OpenRouter

Neither Azure OpenAI Service nor OpenRouter are configured, limiting deployment options for enterprise environments.

---

## 7. Recommended Next Steps

### Immediate (Low Effort)

1. **Implement OpenAI adapter** - Add real OpenAI API calls
   ```typescript
   async function runOpenAi(question: string) {
     if (!env.OPENAI_API_KEY) return { answer: 'OpenAI API key missing' };
     // Add actual OpenAI API call here
   }
   ```

2. **Add Azure OpenAI support** - Enterprise requirement
   ```typescript
   case 'azure-openai':
     return runAzureOpenAi(question);
   ```

3. **Add OpenRouter support** - Multi-model access
   ```typescript
   case 'openrouter':
     return runOpenRouter(question);
   ```

### Medium Term (1-2 days)

4. **Implement RAG pipeline**
   - Query relevant records based on question
   - Include context in AI prompt
   - Generate helpful responses

5. **Add conversation context**
   - Pass conversation history to AI
   - Enable follow-up questions

### Long Term (1 week)

6. **Streaming responses**
   - Implement SSE for real-time feedback

7. **Add more AI providers**
   - Gemini
   - Local models (Ollama)

8. **Smarter intent detection**
   - Use embeddings for semantic matching
   - Better handling of ambiguous queries

---

## 8. Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| Free-text input | ✅ Working | User can type any question |
| Predefined prompts | ✅ Working | 4 suggestion buttons |
| Input disabled? | ❌ No | Fully functional |
| Backend API | ✅ Working | Routes to correct handler |
| Keyword detection | ✅ Working | Routes to DB queries |
| OpenAI integration | ⚠️ Stub | Needs implementation |
| Claude integration | ⚠️ Stub | Needs implementation |
| Private model | ⚠️ Stub | Needs implementation |
| Azure OpenAI | ❌ Not available | Enterprise gap |
| OpenRouter | ❌ Not available | Multi-model gap |
| RAG pipeline | ❌ Not available | Intelligence gap |
| Streaming | ❌ Not available | UX gap |

---

## 9. Files Involved

### Frontend
- `frontend/src/components/AssistantPanel.tsx` - Full UI component

### Backend
- `backend/src/modules/ai/ai.routes.ts` - API endpoint
- `backend/src/modules/ai/ai.service.ts` - Business logic
- `backend/src/modules/ai/providers/providerFactory.ts` - AI provider stubs
- `backend/src/config/env.ts` - Environment configuration

### Database
- `prisma/schema.prisma` - `aiConversation` model

---

## 10. Conclusion

The AI Assistant feature has a **working frontend** with free-text input capability. The backend has:

- ✅ **Working keyword-based routing** for common ITSM queries
- ✅ **Real database integration** for tickets, incidents, assets, compliance
- ⚠️ **Placeholder adapters** for OpenAI/Claude/Private models

**The "Ask me about..." text is an initial state message, not a limitation.** Users can type any question, but only the keyword-matched queries return real data. All other queries hit the stub AI providers.

**To make this feature production-ready:**
1. Implement real OpenAI/Claude API calls
2. Add Azure OpenAI for enterprise deployments
3. Consider adding OpenRouter for multi-model flexibility
