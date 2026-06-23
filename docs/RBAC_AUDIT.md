# RBAC Architecture Audit

**Document Version:** 1.0  
**Date:** 2024  
**Repository:** Saven InfraOps Enterprise V6  
**Branch:** feature/rbac-redesign

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Backend Authorization Flow](#backend-authorization-flow)
5. [Frontend Authorization Flow](#frontend-authorization-flow)
6. [Current Permission Namespaces](#current-permission-namespaces)
7. [Modules Using Each Namespace](#modules-using-each-namespace)
8. [Technical Debt Inventory](#technical-debt-inventory)
9. [Recommended Migration Order](#recommended-migration-order)
10. [Appendix: Permission Matrix](#appendix-permission-matrix)

---

## Executive Summary

The Saven InfraOps Enterprise V6 application implements a Role-Based Access Control (RBAC) system using a many-to-many relationship between Users, Roles, and Permissions. This audit identifies architectural components, technical debt, and provides a recommended migration path for RBAC redesign.

### Key Findings

| Area | Status | Notes |
|------|--------|-------|
| Database Schema | ✅ Solid | Proper many-to-many with join tables |
| Backend Middleware | ✅ Functional | `requirePermission()` middleware working |
| Frontend Helpers | ✅ Present | `hasPermission()` hook in AuthContext |
| Menu Filtering | ✅ Implemented | Sidebar filters based on permissions |
| Page Guards | ⚠️ Partial | Some pages lack explicit guards |
| Button Guards | ⚠️ Mixed | Not all buttons guarded consistently |
| API Guards | ✅ Complete | All endpoints protected |

### Critical Issues Identified

1. **Shared Permission Namespaces** - Multiple modules share `dashboard:read` and `settings:write`
2. **Missing Delete Permissions** - Delete operations use write permissions
3. **Inconsistent Export Permissions** - Export buttons use write permissions instead of export
4. **No Super Admin Protection** - Backend lacks Super Admin role checks

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  Sidebar     │     │   Pages      │     │  Components      │   │
│  │  (Menu)      │     │              │     │  (Buttons/Forms) │   │
│  │              │     │              │     │                  │   │
│  │ Filters menu │     │ Page guards  │     │ Permission checks│   │
│  │ items based  │     │ on render    │     │ before actions   │   │
│  │ on perm      │     │              │     │                  │   │
│  └──────┬───────┘     └──────┬───────┘     └────────┬─────────┘   │
│         │                    │                      │              │
│         └────────────────────┼──────────────────────┘              │
│                            │                                       │
│                    ┌───────▼────────┐                             │
│                    │   AuthContext  │                             │
│                    │                 │                             │
│                    │ hasPermission() │                             │
│                    │ permissions[]   │                             │
│                    └───────┬─────────┘                             │
└────────────────────────────┼──────────────────────────────────────┘
                             │ Bearer Token
                             │ (JWT with permissions array)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER (Node.js)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Request Pipeline                          │   │
│  │                                                             │   │
│  │  Request → Auth Middleware → RBAC Middleware → Route Handler│   │
│  │              (JWT Verify)      (requirePermission)           │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  Auth        │     │   RBAC       │     │  Routes          │   │
│  │  Middleware  │     │   Middleware │     │                  │   │
│  │              │     │              │     │                  │   │
│  │ Decodes JWT  │     │ Checks       │     │ Business Logic   │   │
│  │ Sets req.user│     │ permissions[]│     │ Database Ops     │   │
│  └──────────────┘     └──────────────┘     └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE (MySQL 8)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────┐      ┌──────────┐      ┌────────────┐                 │
│  │  User  │──1:N─│ UserRole │─N:1─│    Role     │                 │
│  │        │      │          │      │             │                 │
│  └────────┘      └──────────┘      └──────┬──────┘                 │
│                                           │                         │
│                                   ┌───────┴────────┐                │
│                                   │  RolePermission│─N:1           │
│                                   └───────┬────────┘                │
│                                           │ 1:N                      │
│                                   ┌───────▼────────┐                │
│                                   │   Permission   │                │
│                                   │                │                │
│                                   └────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │    UserRole      │         │      Role       │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────1:N──│ userId (FK)     │──N:1───►│ id (PK)         │
│ name            │         │ roleId (FK)     │         │ name            │
│ email (UNIQUE)  │         │ @@id([userId,   │         │ description     │
│ phoneNumber      │         │        roleId]) │         │                 │
│ passwordHash     │         └─────────────────┘         └────────┬────────┘
│ department       │                                              │
│ status          │          ┌─────────────────┐                   │
│ createdAt       │          │  RolePermission │◄──────────────────┘
│ updatedAt       │          ├─────────────────┤
└─────────────────┘          │ roleId (FK)     │◄─────────────N:1
                             │ permissionId(FK) │
                             │ @@id([roleId,   │
                             │        permId]) │
                             └────────┬────────┘
                                      │
                                      │ N:1
                             ┌────────▼────────┐
                             │   Permission    │
                             ├─────────────────┤
                             │ id (PK)         │
                             │ code (UNIQUE)   │
                             │ description     │
                             └─────────────────┘
```

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `User` | System users | id, name, email, passwordHash, status |
| `Role` | Role definitions | id, name, description |
| `Permission` | Permission catalog | id, code, description |
| `UserRole` | User-to-Role mapping | userId, roleId (composite PK) |
| `RolePermission` | Role-to-Permission mapping | roleId, permissionId (composite PK) |

### Seeded Permissions (from seed.ts)

```typescript
const permissions = [
  // Dashboard
  'dashboard:read',
  
  // Service Requests / Tickets
  'tickets:read', 'tickets:write', 'tickets:assign',
  
  // Incidents
  'incidents:read', 'incidents:write',
  
  // Changes
  'changes:read', 'changes:approve',
  
  // Inventory / Assets
  'inventory:read', 'inventory:write',
  
  // Access Management
  'access:read', 'access:approve',
  
  // Compliance
  'compliance:read', 'compliance:write',
  
  // Settings
  'settings:read', 'settings:write',
  
  // User Management
  'users:read', 'users:write', 'users:delete',
  
  // AI
  'ai:ask'
];
```

### Seeded Roles

| Role | Permissions | Purpose |
|------|-------------|---------|
| Super Admin | All | Full system access |
| Admin | All | Full system access |
| Employee | All | Full system access |

**Note:** Currently all roles have identical (all) permissions - this is technical debt.

---

## Backend Authorization Flow

### Request Lifecycle

```
1. Client Request
   ↓
2. Auth Middleware (auth.ts)
   ├─ Extracts Bearer token from header
   ├─ Verifies JWT signature using JWT_SECRET
   ├─ Decodes payload containing: { id, email, roles, permissions }
   └─ Sets req.user object
   ↓ (if token valid)
3. RBAC Middleware (rbac.ts)
   ├─ Checks req.user exists (authentication)
   └─ Checks req.user.permissions includes required permission
   ↓ (if authorized)
4. Route Handler
   └─ Executes business logic
```

### Middleware Implementation

#### Auth Middleware (`backend/src/middleware/auth.ts`)

```typescript
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}
```

#### RBAC Middleware (`backend/src/middleware/rbac.ts`)

```typescript
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) 
      throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}
```

### API Protection Examples

```typescript
// Protected endpoint example
serviceRequestRouter.get('/', 
  requireAuth,              // Must be authenticated
  requirePermission('tickets:read'),  // Must have tickets:read
  async (req, res, next) => { ... }
);
```

### Backend Route Protection Matrix

| Module | GET | POST | PATCH | DELETE |
|--------|-----|------|-------|--------|
| Dashboard | `dashboard:read` | - | - | - |
| Service Requests | `tickets:read` | `tickets:write` | `tickets:write` | - |
| Incidents (generic) | `incidents:read` | `incidents:write` | `incidents:write` | `incidents:write` |
| Problems (generic) | `incidents:read` | `incidents:write` | `incidents:write` | `incidents:write` |
| Changes (generic) | `changes:read` | `changes:approve` | `changes:approve` | `changes:approve` |
| Inventory (generic) | `inventory:read` | `inventory:write` | `inventory:write` | `inventory:write` |
| Access Mgmt (generic) | `access:read` | `access:approve` | `access:approve` | `access:approve` |
| Compliance (generic) | `compliance:read` | `compliance:write` | `compliance:write` | `compliance:write` |
| Projects (generic) | `dashboard:read` | `settings:write` | `settings:write` | `settings:write` |
| Vendors (generic) | `dashboard:read` | `settings:write` | `settings:write` | `settings:write` |
| Knowledge Base (generic) | `dashboard:read` | `settings:write` | `settings:write` | `settings:write` |
| Reports (generic) | `dashboard:read` | `dashboard:read` | - | - |
| Settings | `settings:read` | - | `settings:write` | - |
| Roles | `users:read` | `users:write` | `users:write` | `users:write` |
| Users | `users:read` | `users:write` | `users:write` | `users:delete` |
| AI | - | `ai:ask` | - | - |

---

## Frontend Authorization Flow

### Component Hierarchy

```
App
└── AuthProvider
    └── AppRouter
        └── Layout
            ├── Header
            ├── Sidebar (menu filtering)
            │   └── NavLink items filtered by hasPermission()
            ├── CommandBar (ai:ask check)
            └── Main Content
                ├── DashboardPage (no guards - relies on menu)
                ├── ModulePage (generic - button guards)
                │   └── ModuleConfig[] (permissions defined per module)
                ├── RolesPermissionsPage (hasPermission guards)
                ├── SettingsPage (no guards - relies on menu)
                └── LoginPage (unauthenticated)
```

### Auth Context (`frontend/src/auth/AuthContext.tsx`)

```typescript
type AuthContextValue = {
  token: string | null;
  user: User | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

function hasPermission(permission: string): boolean {
  return permissions.includes(permission);
}
```

### Usage Patterns

#### Sidebar Menu Filtering

```typescript
// frontend/src/layout/Sidebar.tsx
const menuPermissionMap: Record<string, string> = {
  '/': 'dashboard:read',
  '/service-requests': 'tickets:read',
  '/incidents': 'incidents:read',
  // ...
};

const menuItems = allMenuItems.filter(item => {
  const requiredPermission = menuPermissionMap[item.path];
  if (!requiredPermission) return true;
  return hasPermission(requiredPermission);
});
```

#### Button-Level Guards

```typescript
// Example from ModulePage.tsx
{config.permissions.create && hasPermission(config.permissions.create) && (
  <button className="primary" onClick={() => setCreateOpen(true)}>Create</button>
)}
```

#### Page-Level Guards

```typescript
// Example from CommandBar.tsx
if (!hasPermission('ai:ask')) {
  return null; // Entire component hidden
}
```

---

## Current Permission Namespaces

### Namespace Definition

| Namespace | Read Permission | Write Permission(s) | Delete Permission |
|-----------|-----------------|---------------------|-------------------|
| `dashboard` | `dashboard:read` | - | - |
| `tickets` | `tickets:read` | `tickets:write`, `tickets:assign` | - |
| `incidents` | `incidents:read` | `incidents:write` | - |
| `changes` | `changes:read` | `changes:approve` | - |
| `inventory` | `inventory:read` | `inventory:write` | - |
| `access` | `access:read` | `access:approve` | - |
| `compliance` | `compliance:read` | `compliance:write` | - |
| `settings` | `settings:read` | `settings:write` | - |
| `users` | `users:read` | `users:write` | `users:delete` |
| `ai` | - | `ai:ask` | - |

### Semantic Permission Groups

#### ITSM Operations
- `tickets:*` - Service Request workflow
- `incidents:*` - Incident management
- `changes:*` - Change management
- `compliance:*` - Compliance controls

#### Asset Management
- `inventory:*` - Asset tracking
- `access:*` - Access requests

#### Administration
- `users:*` - User management
- `settings:*` - System settings
- `roles:*` (implicit via `users:*`) - Role management

#### General
- `dashboard:*` - Dashboard and reporting
- `ai:*` - AI features

---

## Modules Using Each Namespace

### dashboard:read (Shared - 6 modules)

| Module | Usage | Issue |
|--------|-------|-------|
| Dashboard | View dashboard | ✅ Own namespace |
| Problems | View problems | ⚠️ Should use `incidents:read` |
| Projects | View projects | ⚠️ Should use `projects:read` |
| Vendors | View vendors | ⚠️ Should use `vendors:read` |
| Knowledge Base | View KB | ⚠️ Should use `kb:read` |
| Reports | View reports | ⚠️ Should use `reports:read` |

### settings:write (Shared - 4 modules)

| Module | Usage | Issue |
|--------|-------|-------|
| Settings | Edit system settings | ✅ Own namespace |
| Projects | Create/update projects | ⚠️ Should use `projects:write` |
| Vendors | Create/update vendors | ⚠️ Should use `vendors:write` |
| Knowledge Base | Create/update articles | ⚠️ Should use `kb:write` |

### Other Namespaces (Well-Structured)

| Namespace | Modules | Status |
|-----------|---------|--------|
| `tickets:*` | Service Requests | ✅ Proper |
| `incidents:*` | Incidents | ✅ Proper |
| `inventory:*` | Inventory | ✅ Proper |
| `compliance:*` | Compliance | ✅ Proper |
| `access:*` | Access Management | ✅ Proper |
| `users:*` | Users & Teams, Roles | ✅ Proper |
| `ai:*` | AI Assistant | ✅ Proper |
| `changes:*` | Changes | ✅ Proper (except for approve naming) |

---

## Technical Debt Inventory

### Critical Issues

| ID | Issue | Severity | Module(s) Affected |
|----|-------|----------|-------------------|
| TD-001 | Delete operations use write permission | High | All generic modules |
| TD-002 | Problems shares `incidents:*` permissions | Medium | Problems |
| TD-003 | All roles have identical permissions | High | Roles |
| TD-004 | No Super Admin role check in backend | High | Admin functions |

### Medium Issues

| ID | Issue | Severity | Module(s) Affected |
|----|-------|----------|-------------------|
| TD-005 | Export uses write permission | Medium | All modules with export |
| TD-006 | `changes:approve` used for create | Medium | Changes |
| TD-007 | `access:approve` used for create | Medium | Access Management |
| TD-008 | Shared `dashboard:read` across 6 modules | Medium | Problems, Projects, Vendors, KB, Reports |

### Low Issues

| ID | Issue | Severity | Module(s) Affected |
|----|-------|----------|-------------------|
| TD-009 | View buttons lack explicit permission guards | Low | ModulePage |
| TD-010 | Refresh buttons lack permission guards | Low | ModulePage |
| TD-011 | Permission names use `:write` instead of `:manage` | Low | Naming |

---

## Recommended Migration Order

### Phase 1: Critical Fixes (Week 1)

1. **TD-004: Super Admin Protection**
   - Add Super Admin bypass in RBAC middleware
   - Prevent modification of Super Admin role

2. **TD-001: Delete Permission**
   - Add `*:delete` permissions where needed
   - Update backend DELETE endpoints
   - Update frontend delete buttons

### Phase 2: Namespace Separation (Week 2-3)

3. **Separate Problems from Incidents**
   - Add `problems:read`, `problems:write` permissions
   - Update Problems module to use new permissions

4. **Create Dedicated Namespaces**
   - Add `projects:read`, `projects:write`
   - Add `vendors:read`, `vendors:write`
   - Add `kb:read`, `kb:write`
   - Add `reports:read`

### Phase 3: Permission Refinement (Week 4)

5. **Export Permissions**
   - Add `*:export` permissions to all modules
   - Update export buttons

6. **Approval Permissions**
   - Refine `changes:approve` vs `changes:create`
   - Refine `access:approve` vs `access:request`

7. **Role Definition**
   - Create meaningful role hierarchies
   - Update seed data

### Phase 4: Frontend Consistency (Week 5)

8. **Button Guards**
   - Add explicit permission guards to all action buttons
   - Add guards to view/open buttons

9. **Page Guards**
   - Add explicit guards to all pages

---

## Appendix: Permission Matrix

### Frontend Permission Usage

| Page | Menu Guard | Create Guard | Export Guard | Status Actions Guard |
|------|-----------|--------------|--------------|---------------------|
| Dashboard | ✅ | N/A | N/A | N/A |
| Service Requests | ✅ | ✅ | ✅ | ✅ |
| Incidents | ✅ | ✅ | ✅ | ✅ |
| Problems | ✅ | ✅ | ✅ | ✅ |
| Changes | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Access Management | ✅ | ✅ | ✅ | ✅ |
| Compliance | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | N/A |
| Vendors | ✅ | ✅ | ✅ | N/A |
| Knowledge Base | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | N/A | N/A | N/A |
| Users & Teams | ✅ | ✅ | ✅ | N/A |
| Roles & Permissions | ✅ | ✅ | N/A | ✅ |
| Settings | ✅ | N/A | N/A | N/A |
| AI Command Bar | ✅ | N/A | N/A | N/A |

### Backend Protection Status

| Endpoint | Method | Protected | Permission |
|----------|--------|-----------|------------|
| /api/dashboard/summary | GET | ✅ | dashboard:read |
| /api/service-requests | GET | ✅ | tickets:read |
| /api/service-requests | POST | ✅ | tickets:write |
| /api/service-requests/:id | PATCH | ✅ | tickets:write |
| /api/generic/:module | GET | ✅ | Varies |
| /api/generic/:module | POST | ✅ | Varies |
| /api/generic/:module/:id | PATCH | ✅ | Varies |
| /api/generic/:module/:id | DELETE | ✅ | Varies |
| /api/roles | GET | ✅ | users:read |
| /api/roles | POST | ✅ | users:write |
| /api/roles/:id | GET | ✅ | users:read |
| /api/roles/:id | PATCH | ✅ | users:write |
| /api/roles/:id/permissions | PATCH | ✅ | users:write |
| /api/roles/:id | DELETE | ✅ | users:write |
| /api/roles/permissions | GET | ✅ | users:read |
| /api/users | GET | ✅ | users:read |
| /api/users | POST | ✅ | users:write |
| /api/users/:id | PATCH | ✅ | users:write |
| /api/users/:id | DELETE | ✅ | users:delete |
| /api/settings | GET | ✅ | settings:read |
| /api/settings/:key | PUT | ✅ | settings:write |
| /api/ai/ask | POST | ✅ | ai:ask |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | RBAC Audit | Initial document |

---

*End of RBAC Architecture Audit*
