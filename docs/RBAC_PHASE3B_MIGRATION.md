# Phase 3B - Backend Endpoint Migration Report

**Date:** 2024  
**Branch:** feature/rbac-redesign  
**Status:** COMPLETED

---

## Executive Summary

This document details the changes made to backend API endpoints to support the new RBAC permission model while maintaining backward compatibility.

**Result:** ✅ All endpoints migrated successfully

---

## Changes Made

### 1. RBAC Middleware Enhancement

**File:** `backend/src/middleware/rbac.ts`

Added two new middleware functions:

```typescript
// OR logic - accepts any ONE of the provided permissions
requirePermissionOr(...permissions: string[])

// AND logic - requires ALL of the provided permissions
requirePermissionAnd(...permissions: string[])
```

---

## Endpoint Migration Matrix

### Generic Module Endpoints

| Endpoint | Method | Old Permission | New Permission | Compatibility |
|----------|--------|---------------|----------------|----------------|
| `/api/generic/:module` | GET | `module:read` | `module:view` | `module:read OR module:view` |
| `/api/generic/:module` | POST | `module:write` | `module:create` | `module:write OR module:create` |
| `/api/generic/:module/:id` | PATCH | `module:write` | `module:manage` | `module:write OR module:manage` |
| `/api/generic/roles` | GET | `users:read` | `roles:view` | `users:read OR roles:view` |

### Module-Specific Endpoints

| Endpoint | Method | Old Permission | New Permission | Compatibility |
|----------|--------|---------------|----------------|----------------|
| `/api/service-requests` | GET | `tickets:read` | `tickets:view` | `tickets:read OR tickets:view` |
| `/api/service-requests` | POST | `tickets:write` | `tickets:create` | `tickets:write OR tickets:create` |
| `/api/service-requests/:id` | PATCH | `tickets:write` | `tickets:manage` | `tickets:write OR tickets:manage` |
| `/api/dashboard/summary` | GET | `dashboard:read` | `dashboard:view` | `dashboard:read OR dashboard:view` |
| `/api/settings` | GET | `settings:read` | `settings:view` | `settings:read OR settings:view` |
| `/api/settings/:key` | PUT | `settings:write` | `settings:manage` | `settings:write OR settings:manage` |

### Role Management Endpoints

| Endpoint | Method | Old Permission | New Permission | Compatibility |
|----------|--------|---------------|----------------|----------------|
| `/api/roles` | GET | `users:read` | `roles:view` | `users:read OR roles:view` |
| `/api/roles/:id` | GET | `users:read` | `roles:view` | `users:read OR roles:view` |
| `/api/roles/permissions` | GET | `users:read` | `roles:view` | `users:read OR roles:view` |
| `/api/roles` | POST | `users:write` | `roles:create, roles:manage` | `users:write OR roles:create OR roles:manage` |
| `/api/roles/:id` | PATCH | `users:write` | `roles:manage` | `users:write OR roles:manage` |
| `/api/roles/:id/permissions` | PATCH | `users:write` | `roles:manage` | `users:write OR roles:manage` |
| `/api/roles/:id` | DELETE | `users:write` | `roles:delete` | `users:write OR roles:delete` |

### AI Endpoints

| Endpoint | Method | Old Permission | New Permission | Compatibility |
|----------|--------|---------------|----------------|----------------|
| `/api/ai/ask` | POST | `ai:ask` | `ai:ask` | N/A (unchanged) |

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/src/middleware/rbac.ts` | Added `requirePermissionOr` and `requirePermissionAnd` |
| `backend/src/modules/generic/generic.routes.ts` | Added new permission configs, updated all endpoints |
| `backend/src/modules/serviceRequests/serviceRequest.routes.ts` | Updated all endpoints with OR compatibility |
| `backend/src/modules/dashboard/dashboard.routes.ts` | Updated summary endpoint |
| `backend/src/modules/settings/settings.routes.ts` | Updated GET and PUT endpoints |
| `backend/src/modules/roles/roles.routes.ts` | Updated all endpoints |

---

## Compatibility Logic

### Example: View Permission Check

**Before (legacy only):**
```typescript
requirePermission('incidents:read')
```

**After (backward compatible):**
```typescript
requirePermissionOr('incidents:read', 'incidents:view')
```

This allows users with the OLD permission (`incidents:read`) OR the NEW permission (`incidents:view`) to access the endpoint.

### Example: Write Permission Check

**Before (legacy only):**
```typescript
requirePermission('incidents:write')
```

**After (backward compatible):**
```typescript
requirePermissionOr('incidents:write', 'incidents:create')
```

For PATCH endpoints:
```typescript
requirePermissionOr('incidents:write', 'incidents:manage')
```

---

## Backward Compatibility

All existing users with legacy permissions will continue to have access because:

1. **All roles have BOTH legacy and new permissions** (82 total from Phase 3A)
2. **Endpoints accept EITHER old OR new permissions**
3. **No endpoints were removed or changed to require-only-new permissions**

---

## Testing Checklist

- [ ] Login with user having only legacy permissions → should work
- [ ] Login with user having only new permissions → should work
- [ ] Login with user having both permissions → should work
- [ ] All CRUD operations work with legacy permissions
- [ ] All CRUD operations work with new permissions
- [ ] No 403 errors for properly authenticated users

---

## Rollback Instructions

If issues occur:

1. **Revert middleware changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Or manually revert `requirePermissionOr` to `requirePermission` in affected files**

---

## Next Phase

**Phase 3C:** Frontend Menu Guards - Update sidebar to use new permission names

---

*End of Phase 3B Migration Report*
