# Phase 4C - Users & Teams Action-Level RBAC Implementation

**Date:** 2024  
**Branch:** feature/rbac-redesign  
**Status:** COMPLETED

---

## Executive Summary

Implemented action-level RBAC for the Users & Teams module only, with granular permissions for each UI action.

---

## Files Changed

| File | Changes |
|------|---------|
| `frontend/src/pages/ModulePage.tsx` | Extended type, updated config, updated button guards |

---

## Permission Mapping

### Old → New Permissions

| Action | Old Permission | New Permission | Backend |
|--------|---------------|----------------|---------|
| View user list | `users:read` | `users:view` | ✅ |
| Open drawer | None | `users:view` | ✅ |
| Create user button | `users:write` | `users:create` | ✅ |
| Edit/Manage actions | `users:write` | `users:manage` | ✅ |
| Delete user button | `users:delete` | `users:delete` | ✅ |
| Export button | `users:write` | `users:export` | ✅ |

---

## Action-Level Permission Details

### 1. View Users (`users:view`)

| Aspect | Details |
|--------|---------|
| **Permission** | `users:view` |
| **UI Element** | Open button in table |
| **Current State** | ✅ Implemented |
| **Backend Endpoint** | `GET /api/generic/users-teams` |
| **Backend Permission** | `requirePermissionOr(['users:read', 'users:view'])` |

### 2. Create User (`users:create`)

| Aspect | Details |
|--------|---------|
| **Permission** | `users:create` |
| **UI Element** | Create button, Create modal |
| **Current State** | ✅ Implemented |
| **Backend Endpoint** | `POST /api/generic/users-teams` |
| **Backend Permission** | `requirePermissionOr(['users:write', 'users:create'])` |

### 3. Manage User (`users:manage`)

| Aspect | Details |
|--------|---------|
| **Permission** | `users:manage` |
| **UI Elements** | Status actions (Enable/Disable), Role changes |
| **Current State** | ✅ Implemented |
| **Backend Endpoint** | `PATCH /api/generic/users-teams/:id` |
| **Backend Permission** | `requirePermissionOr(['users:write', 'users:manage'])` |

### 4. Delete User (`users:delete`)

| Aspect | Details |
|--------|---------|
| **Permission** | `users:delete` |
| **UI Element** | Delete button |
| **Current State** | ✅ Implemented |
| **Backend Endpoint** | `DELETE /api/users-teams/:id` |
| **Backend Permission** | `requirePermission('users:delete')` |

### 5. Export Users (`users:export`)

| Aspect | Details |
|--------|---------|
| **Permission** | `users:export` |
| **UI Element** | Export CSV button |
| **Current State** | ✅ Implemented |
| **Backend Endpoint** | N/A (client-side export) |

---

## Configuration Changes

### ModuleConfig Type Extended

```typescript
permissions: {
  view?: string;      // NEW: View/Drawer permission
  create?: string;   // Create button and modal
  write?: string;    // Edit/Manage actions
  export?: string;   // NEW: Export permission
};
```

### Users & Teams Config

```typescript
'users-teams': {
  // ...
  permissions: {
    view: 'users:view',      // View user details in drawer
    create: 'users:create',  // Create user button/modal
    write: 'users:manage',   // Edit/Enable/Disable/Reset Password
    export: 'users:export'  // Export users button
  }
}
```

---

## Button Guard Implementation

### Export Button

```tsx
{config.permissions.export && hasPermission(config.permissions.export) && (
  <button className="secondary" onClick={exportCsv}>Export CSV</button>
)}
```

### Open Button

```tsx
{hasPermission((config.permissions.view || config.permissions.create) || '') && (
  <button className="link-button" onClick={...}>Open</button>
)}
```

### Create Button (unchanged)

```tsx
{config.permissions.create && hasPermission(config.permissions.create) && (
  <button className="primary" onClick={() => setCreateOpen(true)}>Create</button>
)}
```

### Status Actions (unchanged)

```tsx
{config.permissions.write && hasPermission(config.permissions.write) && (
  <div className="drawer-actions">
    {/* Status buttons */}
  </div>
)}
```

### Delete Button (unchanged)

```tsx
{moduleKey === 'users-teams' && hasPermission('users:delete') && (
  <button className="btn-delete" onClick={...}>Delete</button>
)}
```

---

## Backend Compatibility

All backend endpoints already support OR compatibility:

| Endpoint | Permission Check |
|----------|------------------|
| `GET /api/generic/users-teams` | `requirePermissionOr(['users:read', 'users:view'])` |
| `POST /api/generic/users-teams` | `requirePermissionOr(['users:write', 'users:create'])` |
| `PATCH /api/generic/users-teams/:id` | `requirePermissionOr(['users:write', 'users:manage'])` |
| `DELETE /api/users-teams/:id` | `requirePermission('users:delete')` |

---

## Backward Compatibility

✅ All roles have BOTH legacy and new permissions seeded:
- `users:read` AND `users:view`
- `users:write` AND `users:create` AND `users:manage`
- `users:delete` (unchanged)
- `users:export` (new, only in Admin role)

---

## Build Status

| Check | Status |
|-------|--------|
| TypeScript compilation | ✅ Pass |
| ModulePage.tsx errors | ✅ None |
| Pre-existing errors | ⚠️ main.tsx, api.ts (unrelated) |

---

## Next Phase

**Phase 4D:** Implement action-level RBAC for other high-priority modules (Service Requests, Incidents)

---

*End of Phase 4C Implementation*
