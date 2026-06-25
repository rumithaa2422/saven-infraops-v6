# Service Requests Module RBAC Audit Report

**Date:** 2026-06-24  
**Module:** Service Requests (Tickets)  
**Status:** 🔴 SECURITY ISSUE FOUND

---

## 1. All Actions Available in Service Requests

| # | Action | UI Location | Backend Endpoint | HTTP Method |
|---|--------|------------|------------------|-------------|
| 1 | View Service Requests | Table/List | `/service-requests` | GET |
| 2 | Create Service Request | Create Modal | `/service-requests` | POST |
| 3 | Update Ticket (Status/Priority) | Drawer Actions | `/service-requests/:id` | PATCH |
| 4 | Assign Ticket | Drawer Actions | `/service-requests/:id` | PATCH |
| 5 | Escalate Ticket | Drawer Actions | `/service-requests/:id` | PATCH |
| 6 | Wait for User | Drawer Actions | `/service-requests/:id` | PATCH |
| 7 | Close Ticket | Drawer Actions | `/service-requests/:id` | PATCH |
| 8 | Add Comment | Drawer Comment Box | `/service-requests/:id` | PATCH |
| 9 | Export CSV | Action Row | Client-side only | N/A |

---

## 2. Required Permission for Each Action

### Current Implementation (Backend)

| Action | Required Permission | Guard Function |
|--------|--------------------|----------------|
| View | `tickets:read` OR `tickets:view` | `requirePermissionOr()` |
| Create | `tickets:write` OR `tickets:create` | `requirePermissionOr()` |
| Update (any field) | `tickets:write` OR `tickets:manage` | `requirePermissionOr()` |

### Frontend Permission Checks

| Action | Frontend Permission | Guard |
|--------|-------------------|-------|
| View | (none - table always visible) | None |
| Create Button | `tickets:create` | `canCreate` |
| Export CSV | `tickets:create` | `canCreate` |
| Assign Button | `tickets:manage` AND `tickets:assign` | `canManage && canAssign` |
| Escalate/Close/Wait | `tickets:manage` | `canManage` |
| Add Comment | `tickets:manage` | `canManage` |

---

## 3. Which Actions Are Missing RBAC Guards

### Frontend Issues

| Action | Missing Guard? | Issue |
|--------|---------------|-------|
| View Table | ❌ No guard | Anyone can see the table |
| Export CSV | ⚠️ Uses wrong permission | Uses `tickets:create` instead of `tickets:view` |
| Reopen Ticket | ⚠️ No explicit button | Status 'REOPENED' exists in schema but no UI button |
| Delete Ticket | ✅ Not implemented | No delete functionality |

### Backend Issues

| Endpoint | Missing Guard? | Issue |
|----------|---------------|-------|
| PATCH `/service-requests/:id` | ⚠️ Over-permissive | Requires `tickets:manage` BUT allows ALL field updates including status changes that should be restricted |

---

## 4. Which API Endpoints Are Missing Permission Enforcement

| Endpoint | Current Guard | Issue |
|----------|---------------|-------|
| `GET /service-requests` | ✅ Has guard | `tickets:read` OR `tickets:view` |
| `GET /service-requests/:id` | ✅ Has guard | `tickets:read` OR `tickets:view` |
| `POST /service-requests` | ✅ Has guard | `tickets:write` OR `tickets:create` |
| `PATCH /service-requests/:id` | ⚠️ Inadequate | Requires `tickets:manage` BUT doesn't distinguish between updating status vs other fields |

**Key Finding:** The backend endpoint `PATCH /service-requests/:id` requires `tickets:manage` permission, but this permission should NOT be required for users with only `tickets:view` + `tickets:create`. The issue is that:

1. User with `tickets:view` + `tickets:create` should NOT be able to change ticket status
2. User with `tickets:manage` CAN change everything including status
3. User with `tickets:assign` CAN assign tickets

---

## 5. Root Cause Analysis

### The Bug: Why Users Without `tickets:manage` Can Change Status

Looking at the code flow:

**Frontend (ServiceRequestsPage.tsx:38-41):**
```typescript
const canCreate = hasPermission('tickets:create');
const canManage = hasPermission('tickets:manage');
const canAssign = hasPermission('tickets:assign');
```

**Frontend (ServiceRequestsPage.tsx:178-185):**
```typescript
{canManage && (
  <div className="drawer-actions">
    {canAssign && <button onClick={() => updateSelected({ status: 'ASSIGNED', ... })}>Assign</button>}
    <button onClick={() => updateSelected({ priority: 'CRITICAL', status: 'IN_PROGRESS' })}>Escalate</button>
    <button onClick={() => updateSelected({ status: 'WAITING_FOR_USER' })}>Wait for User</button>
    <button onClick={() => updateSelected({ status: 'CLOSED' })}>Close</button>
  </div>
)}
```

**Backend (serviceRequest.routes.ts:91):**
```typescript
serviceRequestRouter.patch('/:id', requireAuth, requirePermissionOr(['tickets:write', 'tickets:manage']), ...)
```

### Possible Causes for the Reported Issue

The user reports they have `tickets:view` + `tickets:create` but can still change status.

**Most Likely Cause:** The **backend's `tickets:write` legacy permission** grants full update access.

### Analysis of the Backend OR Condition

The backend has:
```typescript
requirePermissionOr(['tickets:write', 'tickets:manage'])
```

This means ANY of the following permissions will allow the PATCH:
- `tickets:write` (legacy)
- `tickets:manage`

**But `tickets:write` is the OLD permission code!** According to RBAC_PERMISSION_MAP.md:
- `tickets:read` (now `tickets:view`)
- `tickets:write` (legacy - grants too much access)
- `tickets:assign`

So if a user has `tickets:write` (the legacy code), they CAN update ANY field via the API!

### Other Possible Causes

1. **Browser cache issue** - Old JavaScript with incorrect permissions
2. **Auth context not updated** - User logged in before permissions changed
3. **Role has hidden permissions** - Database may have stale permissions

---

## 6. Remediation Plan

### Option A: Fix Backend - Split Endpoints (Recommended)

Split the PATCH endpoint into separate actions:

```typescript
// Status changes require tickets:manage or tickets:assign
serviceRequestRouter.patch('/:id/status', 
  requireAuth, 
  requirePermissionOr(['tickets:manage', 'tickets:assign']),
  async (req, res, next) => { ... }
);

// General updates still require tickets:manage
serviceRequestRouter.patch('/:id', 
  requireAuth, 
  requirePermission('tickets:manage'),
  async (req, res, next) => { ... }
);
```

**Pros:** Clear separation of concerns, true RBAC
**Cons:** Requires frontend changes to call different endpoints

### Option B: Fix Backend - Field-Level Permissions

Add logic to check which fields are being updated:

```typescript
serviceRequestRouter.patch('/:id', requireAuth, requirePermission('tickets:manage'), async (req, res, next) => {
  // If updating status, check for tickets:manage or tickets:assign
  if (req.body.status && !req.user.permissions.includes('tickets:manage')) {
    if (!req.user.permissions.includes('tickets:assign')) {
      throw new HttpError(403, 'Permission required: tickets:manage or tickets:assign');
    }
  }
  // ... rest of logic
});
```

**Pros:** Single endpoint, minimal frontend changes
**Cons:** More complex permission logic

### Option C: Fix Backend - Remove Legacy Permission (Quick Fix)

Remove `tickets:write` from the OR condition:

```typescript
// Only allow tickets:manage for updates
serviceRequestRouter.patch('/:id', 
  requireAuth, 
  requirePermission('tickets:manage'),
  async (req, res, next) => { ... }
);
```

⚠️ **Risk:** This breaks backward compatibility for users with the old `tickets:write` permission.

### Option D: Fix Frontend Only

1. Add `tickets:view` check for viewing the table
2. Change Export CSV to use `tickets:view`
3. Add explicit status change permission check in drawer

---

## 7. Recommended Fix (Priority Order)

### Immediate Fix (1-2 hours)
1. **Option C**: Remove `tickets:write` from PATCH endpoint OR
2. **Option B**: Add field-level permission checks

### Medium Term (1 day)
1. Audit all endpoints for legacy permission codes
2. Create migration path for old `tickets:write` → `tickets:manage`
3. Update frontend to use new permission checks

### Long Term (1 week)
1. Implement proper permission matrix in UI (Phase 5D)
2. Add audit logging for all permission checks
3. Create RBAC test suite

---

## 8. Summary Table

| Component | Finding | Severity |
|-----------|---------|----------|
| Frontend - View Table | No permission check | Low |
| Frontend - Export CSV | Uses wrong permission (`tickets:create` vs `tickets:view`) | Medium |
| Frontend - Drawer Actions | Correctly guarded by `canManage` | None |
| Backend - GET endpoints | Properly guarded | None |
| Backend - POST endpoint | Legacy permission OK | None |
| Backend - PATCH endpoint | **Over-permissive (legacy `tickets:write`)** | HIGH |
| Backend - Status changes | Allowable via `tickets:assign` | Medium |

---

## 9. Files Involved

### Frontend
- `frontend/src/pages/ServiceRequestsPage.tsx` - All UI actions
- `frontend/src/auth/AuthContext.tsx` - Permission checking

### Backend
- `backend/src/modules/serviceRequests/serviceRequest.routes.ts` - API endpoints
- `backend/src/middleware/rbac.ts` - Permission middleware

### Documentation
- `RBAC_PERMISSION_MAP.md` - Permission reference
- `RBAC_UI_ACTION_MATRIX.md` - UI action reference

---

**Reported Issue Analysis:** The user has `tickets:view` + `tickets:create` but can change status. This should NOT be possible via the frontend IF the frontend code is being executed correctly. The most likely cause is the **backend's `tickets:write` legacy permission** which grants full update access including status changes.

**Recommended Action:** Implement Option B (field-level permissions) for a quick fix, then plan Option A (split endpoints) for long-term proper RBAC.
