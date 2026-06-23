# Phase 3D - Frontend Button and Action Guard Audit

**Date:** 2024  
**Branch:** feature/rbac-redesign  
**Status:** AUDIT REPORT (No Code Changes)

---

## Executive Summary

This document audits all UI actions (buttons, drawers, modals) that require RBAC permissions across the frontend application.

**Files Audited:**
- `frontend/src/pages/ModulePage.tsx` (generic module pages)
- `frontend/src/pages/ServiceRequestsPage.tsx` (dedicated service requests page)
- `frontend/src/pages/RolesPermissionsPage.tsx` (role management)
- `frontend/src/components/CommandBar.tsx` (AI command bar)

---

## ModulePage.tsx - Generic Module Permissions

### Module Configuration (Lines 35-260)

| Module | Create Permission | Manage Permission | Backend Route |
|--------|-----------------|-----------------|--------------|
| incidents | `incidents:write` | `incidents:write` | `POST/PATCH /api/generic/incidents` |
| problems | `incidents:write` | `incidents:write` | `POST/PATCH /api/generic/problems` |
| changes | `changes:approve` | `changes:approve` | `POST/PATCH /api/generic/changes` |
| inventory | `inventory:write` | `inventory:write` | `POST/PATCH /api/generic/inventory` |
| access-management | `access:approve` | `access:approve` | `POST/PATCH /api/generic/access-management` |
| compliance | `compliance:write` | `compliance:write` | `POST/PATCH /api/generic/compliance` |
| projects-environments | `settings:write` | `settings:write` | `POST/PATCH /api/generic/projects-environments` |
| vendors-licenses | `settings:write` | `settings:write` | `POST/PATCH /api/generic/vendors-licenses` |
| knowledge-base | `settings:write` | `settings:write` | `POST/PATCH /api/generic/knowledge-base` |
| reports-analytics | `settings:write` | `settings:write` | `POST/PATCH /api/generic/reports-analytics` |
| users-teams | `users:write` | `users:write` | `POST/PATCH /api/generic/users-teams` |

### Action Guard Analysis

| Action | Component Location | Current Permission | New Permission | Frontend Guard | Backend Guard |
|--------|-------------------|-------------------|---------------|---------------|--------------|
| **Create Button** | Line 254 | `config.permissions.create` | `*:create` | ✅ Yes | ✅ Yes |
| **Export Button** | Line 253 | `config.permissions.create` | `*:export` | ⚠️ Wrong | ⚠️ Wrong |
| **Open Button** | Line 280 | None | `*:view` | ❌ Missing | ✅ Yes |
| **Delete Button** | Lines 281-287 | `users:delete` | `users:delete` | ✅ Yes (users only) | ✅ Yes |
| **Status Actions** | Line 357 | `config.permissions.write` | `*:manage` | ✅ Yes | ✅ Yes |
| **Refresh Button** | Line 252 | None | None | ❌ None needed | N/A |

### Recommended Changes for ModulePage

#### 1. Export Button (Line 253)

**Current:**
```typescript
{config.permissions.create && <button onClick={exportCsv}>Export CSV</button>}
```

**Issue:** Export uses create permission instead of export permission.

**New:**
```typescript
// Add to config: exportPermission?: string;
// And update line 253:
{(config.permissions.create || config.permissions.export) && <button onClick={exportCsv}>Export CSV</button>}
```

**Backend:** Add `exportPermission` field to moduleMap config.

#### 2. Open Button (Line 280)

**Current:** No permission check.

**Recommended:** Add view permission check.

---

## ServiceRequestsPage.tsx - Dedicated Page

### Permission Checks (Lines 38-41)

```typescript
const canCreate = hasPermission('tickets:write');
const canManage = hasPermission('tickets:write');
const canAssign = hasPermission('tickets:assign');
```

### Action Guard Analysis

| Action | Line | Current Permission | New Permission | Frontend Guard | Backend Guard |
|--------|------|-------------------|---------------|---------------|--------------|
| **Refresh Button** | 102 | None | None | ❌ None | N/A |
| **Export Button** | 103 | `tickets:write` | `tickets:export` | ⚠️ Wrong | ⚠️ Missing |
| **Create Button** | 104 | `tickets:write` | `tickets:create` | ✅ Yes | ✅ Yes |
| **Assign Button** | 180 | `tickets:assign` | `tickets:assign` | ✅ Yes | ✅ Yes |
| **Escalate Button** | 181 | `tickets:write` | `tickets:manage` | ✅ Yes | ✅ Yes |
| **Wait for User** | 182 | `tickets:write` | `tickets:manage` | ✅ Yes | ✅ Yes |
| **Close Button** | 183 | `tickets:write` | `tickets:manage` | ✅ Yes | ✅ Yes |
| **Comment Box** | 186-189 | `tickets:write` | `tickets:comment` | ✅ Yes | ✅ Yes |
| **Open Drawer** | 134 | None | `tickets:view` | ❌ Missing | ✅ Yes |

### Recommended Changes

| Action | Current | New | Line |
|--------|---------|-----|------|
| Export Button | `canCreate` | `hasPermission('tickets:export')` | 103 |
| Open Button | None | Add guard | 134 |
| Manage Comments | `tickets:write` | `tickets:manage` | 186 |
| Comment Box | `tickets:write` | `tickets:comment` | 189 |

---

## RolesPermissionsPage.tsx - Role Management

### Module Config (Lines 20-81)

| Module | Current Permissions | Recommended Permissions |
|--------|-------------------|------------------------|
| Dashboard | `dashboard:read` | `dashboard:view` |
| Service Requests | `tickets:read`, `tickets:write`, `tickets:assign` | `tickets:view`, `tickets:create`, `tickets:manage`, `tickets:assign`, `tickets:comment`, `tickets:export` |
| Incidents | `incidents:read`, `incidents:write` | `incidents:view`, `incidents:create`, `incidents:manage`, `incidents:export` |
| Changes | `changes:read`, `changes:approve` | `changes:view`, `changes:create`, `changes:approve`, `changes:manage`, `changes:export` |
| Inventory | `inventory:read`, `inventory:write` | `inventory:view`, `inventory:create`, `inventory:manage`, `inventory:delete`, `inventory:export` |
| Access Management | `access:read`, `access:approve` | `access:view`, `access:request`, `access:approve`, `access:provision`, `access:revoke`, `access:export` |
| Compliance | `compliance:read`, `compliance:write` | `compliance:view`, `compliance:create`, `compliance:manage`, `compliance:audit`, `compliance:export` |
| Projects & Environments | `settings:read` | `projects:view`, `projects:create`, `projects:manage`, `projects:delete`, `projects:export` |
| Vendors & Licenses | `settings:read` | `vendors:view`, `vendors:create`, `vendors:manage`, `vendors:delete`, `vendors:export` |
| Reports & Analytics | `dashboard:read` | `reports:view`, `reports:create`, `reports:export` |
| Knowledge Base | `dashboard:read` | `kb:view`, `kb:create`, `kb:publish`, `kb:manage`, `kb:archive`, `kb:export` |
| Users & Teams | `users:read`, `users:write` | `users:view`, `users:create`, `users:manage`, `users:delete`, `users:export` |
| Roles & Permissions | `users:read` | `roles:view`, `roles:create`, `roles:manage`, `roles:delete` |
| Settings | `settings:read`, `settings:write` | `settings:view`, `settings:manage` |
| AI Assistant | `ai:ask` | `ai:ask` |

### Action Guard Analysis

| Action | Line | Current Permission | New Permission | Frontend Guard | Backend Guard |
|--------|------|-------------------|---------------|---------------|--------------|
| **Refresh Button** | 273 | None | None | N/A | N/A |
| **Create Role Button** | 276-279 | `users:write` | `roles:create` | ✅ Yes | ✅ Yes |
| **Edit Button** | 324-328 | `users:write` | `roles:manage` | ✅ Yes | ✅ Yes |
| **Delete Button** | 329-335 | `users:write` | `roles:delete` | ⚠️ Uses write | ✅ Yes |

---

## CommandBar.tsx - AI Assistant

### Action Guard Analysis

| Action | Current Permission | New Permission | Frontend Guard | Backend Guard |
|--------|-------------------|---------------|---------------|--------------|
| **Command Bar Input** | `ai:ask` | `ai:ask` | ✅ Yes | ✅ Yes |

---

## Summary Table: All Actions

### Create Actions

| Page | Line | Current | Recommended | Frontend | Backend |
|------|------|---------|-------------|----------|--------|
| ModulePage (generic) | 254 | `*:write` | `*:create` | ✅ | ✅ |
| ServiceRequestsPage | 104 | `tickets:write` | `tickets:create` | ✅ | ✅ |
| RolesPermissionsPage | 276 | `users:write` | `roles:create` | ✅ | ✅ |

### Edit/Update Actions

| Page | Line | Current | Recommended | Frontend | Backend |
|------|------|---------|-------------|----------|--------|
| ModulePage Status | 357 | `*:write` | `*:manage` | ✅ | ✅ |
| ServiceRequestsPage Escalate | 181 | `tickets:write` | `tickets:manage` | ✅ | ✅ |
| ServiceRequestsPage Close | 183 | `tickets:write` | `tickets:manage` | ✅ | ✅ |
| ServiceRequestsPage Wait | 182 | `tickets:write` | `tickets:manage` | ✅ | ✅ |
| ServiceRequestsPage Assign | 180 | `tickets:assign` | `tickets:assign` | ✅ | ✅ |
| ServiceRequestsPage Comment | 189 | `tickets:write` | `tickets:manage` | ✅ | ✅ |
| RolesPermissionsPage Edit | 324 | `users:write` | `roles:manage` | ✅ | ✅ |

### Delete Actions

| Page | Line | Current | Recommended | Frontend | Backend |
|------|------|---------|-------------|----------|--------|
| ModulePage (users) | 281 | `users:delete` | `users:delete` | ✅ | ✅ |
| RolesPermissionsPage | 329 | `users:write` | `roles:delete` | ⚠️ Wrong | ✅ |

### Export Actions

| Page | Line | Current | Recommended | Frontend | Backend |
|------|------|---------|-------------|----------|--------|
| ModulePage | 253 | `*:create` | `*:export` | ⚠️ Wrong | ⚠️ Missing |
| ServiceRequestsPage | 103 | `tickets:write` | `tickets:export` | ⚠️ Wrong | ⚠️ Missing |

### View/Drawer Actions

| Page | Line | Current | Recommended | Frontend | Backend |
|------|------|---------|-------------|----------|--------|
| ModulePage Open | 280 | None | `*:view` | ❌ Missing | ✅ |
| ServiceRequestsPage Open | 134 | None | `tickets:view` | ❌ Missing | ✅ |

---

## Issues Found

### Critical Issues

| ID | Issue | Page | Impact |
|----|-------|------|--------|
| I-1 | Export uses wrong permission | ModulePage, ServiceRequestsPage | Export accessible to creators only |
| I-2 | Open buttons lack permission guard | ModulePage, ServiceRequestsPage | View access not enforced on client |

### Medium Issues

| ID | Issue | Page | Impact |
|----|-------|------|--------|
| I-3 | Delete uses write instead of delete permission | RolesPermissionsPage | Delete accessible to editors |
| I-4 | ModuleConfig permissions outdated | RolesPermissionsPage | Won't show new permissions in grid |

### Low Issues

| ID | Issue | Page | Impact |
|----|-------|------|--------|
| I-5 | Comments use manage instead of comment permission | ServiceRequestsPage | Fine-grained control not enforced |

---

## Migration Plan

### Phase 3D-1: Fix Export Permissions

1. **ModulePage.tsx** - Add `exportPermission` to config:
```typescript
permissions: { 
  create: '*:create', 
  write: '*:manage',
  export: '*:export'  // NEW
}
```

2. **ServiceRequestsPage.tsx** - Add export permission:
```typescript
const canExport = hasPermission('tickets:export');
// Line 103: Change to canExport
```

### Phase 3D-2: Add View Permission Guards

1. **ModulePage.tsx** - Open button:
```typescript
{hasPermission(config.permissions.view || config.permissions.create) && (
  <button onClick={() => setSelected(item)}>Open</button>
)}
```

2. **ServiceRequestsPage.tsx** - Open button:
```typescript
{hasPermission('tickets:view') && (
  <button onClick={() => setSelected(item)}>Open</button>
)}
```

### Phase 3D-3: Update ModuleConfig

Update `frontend/src/pages/RolesPermissionsPage.tsx` moduleConfig array (lines 20-81) to include all new permissions from RBAC catalog.

### Phase 3D-4: Fix Delete Permission

**RolesPermissionsPage.tsx** line 329:
```typescript
{hasPermission('roles:delete') && (
  <button onClick={() => deleteRole(role)}>Delete</button>
)}
```

---

## Code Change Summary

| File | Line(s) | Change Type | Permission Change |
|------|---------|------------|-------------------|
| `ModulePage.tsx` | 253 | Fix | Export: `*:create` → `*:export` |
| `ModulePage.tsx` | 280 | Add | Open: None → `*:view` |
| `ModulePage.tsx` | 35-260 | Add | Config: Add `viewPermission` |
| `ServiceRequestsPage.tsx` | 103 | Fix | Export: `canCreate` → `canExport` |
| `ServiceRequestsPage.tsx` | 134 | Add | Open: None → `tickets:view` |
| `RolesPermissionsPage.tsx` | 20-81 | Update | Config: Full permission list |
| `RolesPermissionsPage.tsx` | 329 | Fix | Delete: `users:write` → `roles:delete` |

---

## Backward Compatibility Notes

Since all roles have both legacy and new permissions seeded:
- Users with `*:write` can still perform create/update actions
- Export will become available to users with `*:export`
- Open buttons will show for users with `*:view` or `*:create`

---

## Next Phase

**Phase 3E:** Role Redesign - Create meaningful role definitions with granular permissions

---

*End of Phase 3D Action Guard Audit*
