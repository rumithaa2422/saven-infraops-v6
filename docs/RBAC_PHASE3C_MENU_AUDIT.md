# Phase 3C - Frontend Menu Guard Audit

**Date:** 2024  
**Branch:** feature/rbac-redesign  
**Status:** AUDIT REPORT (No Code Changes)

---

## Executive Summary

This document audits all sidebar/menu items in the frontend and provides the exact code changes required to migrate to the new RBAC permission model.

**File Audited:** `frontend/src/layout/Sidebar.tsx`  
**Permission Map Location:** Lines 5-21

---

## Menu Item Audit Table

| # | Menu Label | Route | Current Permission | New Permission | Seeded? | Code Change |
|---|------------|-------|-------------------|---------------|---------|-------------|
| 1 | Dashboard | `/` | `dashboard:read` | `dashboard:view` | ✅ Yes | Line 6: `'dashboard:view'` |
| 2 | Service Requests | `/service-requests` | `tickets:read` | `tickets:view` | ✅ Yes | Line 7: `'tickets:view'` |
| 3 | Incidents | `/incidents` | `incidents:read` | `incidents:view` | ✅ Yes | Line 8: `'incidents:view'` |
| 4 | Problems | `/problems` | `incidents:read` | `problems:view` | ✅ Yes | Line 9: `'problems:view'` |
| 5 | Changes | `/changes` | `changes:read` | `changes:view` | ✅ Yes | Line 10: `'changes:view'` |
| 6 | Inventory | `/inventory` | `inventory:read` | `inventory:view` | ✅ Yes | Line 11: `'inventory:view'` |
| 7 | Access Management | `/access-management` | `access:read` | `access:view` | ✅ Yes | Line 12: `'access:view'` |
| 8 | Compliance | `/compliance` | `compliance:read` | `compliance:view` | ✅ Yes | Line 13: `'compliance:view'` |
| 9 | Projects & Environments | `/projects-environments` | `settings:read` | `projects:view` | ✅ Yes | Line 14: `'projects:view'` |
| 10 | Vendors & Licenses | `/vendors-licenses` | `settings:read` | `vendors:view` | ✅ Yes | Line 15: `'vendors:view'` |
| 11 | Reports & Analytics | `/reports-analytics` | `dashboard:read` | `reports:view` | ✅ Yes | Line 16: `'reports:view'` |
| 12 | Knowledge Base | `/knowledge-base` | `dashboard:read` | `kb:view` | ✅ Yes | Line 17: `'kb:view'` |
| 13 | Users & Teams | `/users-teams` | `users:read` | `users:view` | ✅ Yes | Line 18: `'users:view'` |
| 14 | Roles & Permissions | `/roles-permissions` | `users:read` | `roles:view` | ✅ Yes | Line 19: `'roles:view'` |
| 15 | Settings | `/settings` | `settings:read` | `settings:view` | ✅ Yes | Line 20: `'settings:view'` |

---

## Detailed Menu Item Analysis

### 1. Dashboard

| Field | Value |
|-------|-------|
| **Route** | `/` |
| **Current Permission** | `dashboard:read` |
| **New Permission** | `dashboard:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 6 |
| **Current Code** | `'/: 'dashboard:read'` |
| **New Code** | `'/: 'dashboard:view'` |

### 2. Service Requests

| Field | Value |
|-------|-------|
| **Route** | `/service-requests` |
| **Current Permission** | `tickets:read` |
| **New Permission** | `tickets:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 7 |
| **Current Code** | `'/service-requests': 'tickets:read'` |
| **New Code** | `'/service-requests': 'tickets:view'` |

### 3. Incidents

| Field | Value |
|-------|-------|
| **Route** | `/incidents` |
| **Current Permission** | `incidents:read` |
| **New Permission** | `incidents:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 8 |
| **Current Code** | `'/incidents': 'incidents:read'` |
| **New Code** | `'/incidents': 'incidents:view'` |

### 4. Problems (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/problems` |
| **Current Permission** | `incidents:read` |
| **New Permission** | `problems:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 9 |
| **Current Code** | `'/problems': 'incidents:read'` |
| **New Code** | `'/problems': 'problems:view'` |
| **Note** | Problems now has its own namespace instead of sharing with Incidents |

### 5. Changes

| Field | Value |
|-------|-------|
| **Route** | `/changes` |
| **Current Permission** | `changes:read` |
| **New Permission** | `changes:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 10 |
| **Current Code** | `'/changes': 'changes:read'` |
| **New Code** | `'/changes': 'changes:view'` |

### 6. Inventory

| Field | Value |
|-------|-------|
| **Route** | `/inventory` |
| **Current Permission** | `inventory:read` |
| **New Permission** | `inventory:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 11 |
| **Current Code** | `'/inventory': 'inventory:read'` |
| **New Code** | `'/inventory': 'inventory:view'` |

### 7. Access Management

| Field | Value |
|-------|-------|
| **Route** | `/access-management` |
| **Current Permission** | `access:read` |
| **New Permission** | `access:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 12 |
| **Current Code** | `'/access-management': 'access:read'` |
| **New Code** | `'/access-management': 'access:view'` |

### 8. Compliance

| Field | Value |
|-------|-------|
| **Route** | `/compliance` |
| **Current Permission** | `compliance:read` |
| **New Permission** | `compliance:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 13 |
| **Current Code** | `'/compliance': 'compliance:read'` |
| **New Code** | `'/compliance': 'compliance:view'` |

### 9. Projects & Environments (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/projects-environments` |
| **Current Permission** | `settings:read` |
| **New Permission** | `projects:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 14 |
| **Current Code** | `'/projects-environments': 'settings:read'` |
| **New Code** | `'/projects-environments': 'projects:view'` |
| **Note** | Projects now has its own namespace |

### 10. Vendors & Licenses (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/vendors-licenses` |
| **Current Permission** | `settings:read` |
| **New Permission** | `vendors:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 15 |
| **Current Code** | `'/vendors-licenses': 'settings:read'` |
| **New Code** | `'/vendors-licenses': 'vendors:view'` |
| **Note** | Vendors now has its own namespace |

### 11. Reports & Analytics (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/reports-analytics` |
| **Current Permission** | `dashboard:read` |
| **New Permission** | `reports:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 16 |
| **Current Code** | `'/reports-analytics': 'dashboard:read'` |
| **New Code** | `'/reports-analytics': 'reports:view'` |
| **Note** | Reports now has its own namespace |

### 12. Knowledge Base (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/knowledge-base` |
| **Current Permission** | `dashboard:read` |
| **New Permission** | `kb:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 17 |
| **Current Code** | `'/knowledge-base': 'dashboard:read'` |
| **New Code** | `'/knowledge-base': 'kb:view'` |
| **Note** | KB now has its own namespace |

### 13. Users & Teams

| Field | Value |
|-------|-------|
| **Route** | `/users-teams` |
| **Current Permission** | `users:read` |
| **New Permission** | `users:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 18 |
| **Current Code** | `'/users-teams': 'users:read'` |
| **New Code** | `'/users-teams': 'users:view'` |

### 14. Roles & Permissions (NAMESPACE CHANGE)

| Field | Value |
|-------|-------|
| **Route** | `/roles-permissions` |
| **Current Permission** | `users:read` |
| **New Permission** | `roles:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 19 |
| **Current Code** | `'/roles-permissions': 'users:read'` |
| **New Code** | `'/roles-permissions': 'roles:view'` |
| **Note** | Roles now has its own namespace |

### 15. Settings

| Field | Value |
|-------|-------|
| **Route** | `/settings` |
| **Current Permission** | `settings:read` |
| **New Permission** | `settings:view` |
| **Seeded?** | ✅ Yes |
| **File** | `frontend/src/layout/Sidebar.tsx` |
| **Line** | 20 |
| **Current Code** | `'/settings': 'settings:read'` |
| **New Code** | `'/settings': 'settings:view'` |

---

## Permission Migration Summary

### Simple Rename (`:read` → `:view`)

| Current | New | Count |
|---------|-----|-------|
| `dashboard:read` | `dashboard:view` | 1 |
| `tickets:read` | `tickets:view` | 1 |
| `incidents:read` | `incidents:view` | 1 |
| `changes:read` | `changes:view` | 1 |
| `inventory:read` | `inventory:view` | 1 |
| `access:read` | `access:view` | 1 |
| `compliance:read` | `compliance:view` | 1 |
| `settings:read` | `settings:view` | 1 |

### Namespace Separation (6 items)

| Current | New | Modules |
|---------|-----|---------|
| `incidents:read` | `problems:view` | Problems |
| `settings:read` | `projects:view` | Projects & Environments |
| `settings:read` | `vendors:view` | Vendors & Licenses |
| `dashboard:read` | `reports:view` | Reports & Analytics |
| `dashboard:read` | `kb:view` | Knowledge Base |
| `users:read` | `roles:view` | Roles & Permissions |

---

## Migration Plan

### Step 1: Update Permission Map (Lines 5-21)

Replace the entire `menuPermissionMap` object:

**Current:**
```typescript
const menuPermissionMap: Record<string, string> = {
  '/': 'dashboard:read',
  '/service-requests': 'tickets:read',
  '/incidents': 'incidents:read',
  '/problems': 'incidents:read',
  '/changes': 'changes:read',
  '/inventory': 'inventory:read',
  '/access-management': 'access:read',
  '/compliance': 'compliance:read',
  '/projects-environments': 'settings:read',
  '/vendors-licenses': 'settings:read',
  '/reports-analytics': 'dashboard:read',
  '/knowledge-base': 'dashboard:read',
  '/users-teams': 'users:read',
  '/roles-permissions': 'users:read',
  '/settings': 'settings:read'
};
```

**New:**
```typescript
const menuPermissionMap: Record<string, string> = {
  '/': 'dashboard:view',
  '/service-requests': 'tickets:view',
  '/incidents': 'incidents:view',
  '/problems': 'problems:view',
  '/changes': 'changes:view',
  '/inventory': 'inventory:view',
  '/access-management': 'access:view',
  '/compliance': 'compliance:view',
  '/projects-environments': 'projects:view',
  '/vendors-licenses': 'vendors:view',
  '/reports-analytics': 'reports:view',
  '/knowledge-base': 'kb:view',
  '/users-teams': 'users:view',
  '/roles-permissions': 'roles:view',
  '/settings': 'settings:view'
};
```

---

## Verification Checklist

After migration, verify:

- [ ] All 15 menu items render correctly for Super Admin
- [ ] All 15 menu items render correctly for Admin
- [ ] All 15 menu items render correctly for Employee (all have permissions during migration)
- [ ] No 403 errors when accessing any menu item
- [ ] Menu filter logic works with new permissions

---

## Backward Compatibility

Since all roles have BOTH legacy and new permissions seeded (Phase 3A), this migration is safe:

1. **Before migration:** Menu items require `*:read` permissions
2. **After migration:** Menu items require `*:view` permissions
3. **All roles have both:** So no access is lost during transition

---

## Next Phase

**Phase 3D:** Frontend Button Guards - Update ModulePage and other components

---

*End of Phase 3C Menu Guard Audit*
