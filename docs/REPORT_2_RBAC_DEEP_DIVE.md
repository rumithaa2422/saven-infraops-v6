# Report 2: RBAC (Role-Based Access Control) Deep Dive

**Generated:** 2026-06-18  
**Based on:** `backend/prisma/schema.prisma`, `seed.ts`, `auth.ts`, `rbac.ts`, `ModulePage.tsx`

---

# Executive Summary

The application implements a **4-tier RBAC system**:

```
User ──> UserRole ──> Role ──> RolePermission ──> Permission
```

**Current State:**
- 19 Permissions seeded
- 1 Role seeded (Super Admin)
- Super Admin has ALL permissions
- All other users get permissions from their assigned role

---

# Part 1: All Permissions (Seeded)

## Complete Permission List (19 total)

| # | Permission Code | Description | Used By |
|---|----------------|-------------|---------|
| 1 | `dashboard:read` | View dashboard | Dashboard API |
| 2 | `tickets:read` | View service requests | Service Request APIs |
| 3 | `tickets:write` | Create/update service requests | Service Request POST/PATCH |
| 4 | `tickets:assign` | Assign service requests | SR Assign API |
| 5 | `incidents:read` | View incidents | Generic Incidents API |
| 6 | `incidents:write` | Create/update incidents | Generic Incidents POST/PATCH |
| 7 | `changes:read` | View change requests | Generic Changes API |
| 8 | `changes:approve` | Approve changes | Generic Changes PATCH (writePermission) |
| 9 | `inventory:read` | View assets | Generic Inventory API |
| 10 | `inventory:write` | Create/update assets | Generic Inventory POST/PATCH |
| 11 | `access:read` | View access requests | Generic Access API |
| 12 | `access:approve` | Approve access requests | Generic Access PATCH (writePermission) |
| 13 | `compliance:read` | View compliance controls | Generic Compliance API |
| 14 | `compliance:write` | Update compliance controls | Generic Compliance PATCH |
| 15 | `settings:read` | View system settings | Settings API |
| 16 | `settings:write` | Modify system settings | Settings PATCH |
| 17 | `users:read` | View users | Generic Users-teams API |
| 18 | `users:write` | Create/update users | Generic Users-teams POST/PATCH |
| 19 | `ai:ask` | Use AI assistant | AI Ask API |

## Where Permissions Are Defined

```tsx
// backend/prisma/seed.ts
const permissions = [
  'dashboard:read',
  'tickets:read', 'tickets:write', 'tickets:assign',
  'incidents:read', 'incidents:write',
  'changes:read', 'changes:approve',
  'inventory:read', 'inventory:write',
  'access:read', 'access:approve',
  'compliance:read', 'compliance:write',
  'settings:read', 'settings:write',
  'users:read', 'users:write',
  'ai:ask'
];
```

---

# Part 2: All Roles (Seeded)

## Current Role List

| Role Name | Description | Permissions | Created By |
|----------|-------------|-------------|------------|
| **Super Admin** | Full system access | ALL 19 permissions | seed.ts |

## Role Definition

```tsx
// backend/prisma/seed.ts
const adminRole = await prisma.role.upsert({
  where: { name: 'Super Admin' },
  create: { name: 'Super Admin', description: 'Full system access' }
});

// Assign ALL permissions to Super Admin
const allPermissions = await prisma.permission.findMany();
for (const permission of allPermissions) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
    create: { roleId: adminRole.id, permissionId: permission.id }
  });
}
```

## Important Notes

1. **Only ONE role exists** - "Super Admin"
2. **No role management UI** - Cannot create/edit roles via frontend
3. **To add new roles:** Must edit `seed.ts` and re-seed

---

# Part 3: Role-Permission Mapping

## Current: Super Admin Has All

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPER ADMIN                                        │
│                           Has ALL 19 permissions                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ dashboard:read                                                          │
│  ✅ tickets:read                                                            │
│  ✅ tickets:write                                                          │
│  ✅ tickets:assign                                                         │
│  ✅ incidents:read                                                         │
│  ✅ incidents:write                                                        │
│  ✅ changes:read                                                            │
│  ✅ changes:approve                                                         │
│  ✅ inventory:read                                                         │
│  ✅ inventory:write                                                        │
│  ✅ access:read                                                             │
│  ✅ access:approve                                                         │
│  ✅ compliance:read                                                         │
│  ✅ compliance:write                                                        │
│  ✅ settings:read                                                           │
│  ✅ settings:write                                                         │
│  ✅ users:read                                                              │
│  ✅ users:write                                                            │
│  ✅ ai:ask                                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Schema Structure

```prisma
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}
```

---

# Part 4: JWT Structure

## JWT Payload

When a user logs in, the JWT contains:

```json
{
  "id": "cmqhvqo2h000k1m9boyu5frc0",
  "email": "admin@saven.in",
  "roles": [
    "Super Admin"
  ],
  "permissions": [
    "dashboard:read",
    "tickets:read",
    "tickets:write",
    "tickets:assign",
    "incidents:read",
    "incidents:write",
    "changes:read",
    "changes:approve",
    "inventory:read",
    "inventory:write",
    "access:read",
    "access:approve",
    "compliance:read",
    "compliance:write",
    "settings:read",
    "settings:write",
    "users:read",
    "users:write",
    "ai:ask"
  ],
  "iat": 1719234567,
  "exp": 1719262567
}
```

## JWT Generation Code

```tsx
// backend/src/modules/auth/auth.service.ts

const roles = user.roles.map((ur) => ur.role.name);

// Get ALL permissions from ALL roles
const permissions = [...new Set(
  user.roles.flatMap((ur) => 
    ur.role.permissions.map((rp) => rp.permission.code)
  )
)];

const token = jwt.sign(
  { id: user.id, email: user.email, roles, permissions },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }  // Default: 8h
);
```

## JWT Verification

```tsx
// backend/src/middleware/auth.ts

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token');
  }

  const token = header.replace('Bearer ', '');
  req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
  next();
}
```

---

# Part 5: Permission Middleware Flow

## Middleware Chain

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────┐
│  requireAuth() middleware            │
│  - Extract Bearer token              │
│  - Verify JWT signature              │
│  - Decode payload                    │
│  - Attach req.user                  │
└─────────────────────────────────────┘
     │
     ▼ (if auth succeeds)
┌─────────────────────────────────────┐
│  requirePermission('xxx:yyy')       │
│  - Check req.user exists             │
│  - Check req.user.permissions        │
│    includes 'xxx:yyy'                │
└─────────────────────────────────────┘
     │
     ▼ (if permission exists)
┌─────────────────────────────────────┐
│  Route Handler                       │
│  - Execute business logic            │
└─────────────────────────────────────┘
```

## Code Implementation

```tsx
// backend/src/middleware/rbac.ts

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Step 1: Check authentication
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Step 2: Check permission
    if (!req.user.permissions.includes(permission)) {
      throw new HttpError(403, `Permission required: ${permission}`);
    }
    
    // Step 3: Continue
    next();
  };
}
```

## Usage in Routes

```tsx
// Example: AI route
aiRouter.post('/ask', 
  requireAuth,                                    // Must be logged in
  requirePermission('ai:ask'),                    // Must have ai:ask permission
  async (req, res) => {
    const result = await askAi({ question, userId: req.user?.id });
    res.json(result);
  }
);
```

---

# Part 6: Menu Visibility Logic

## Current Implementation

**IMPORTANT:** The sidebar menu is **NOT permission-gated**. All menu items are visible to all authenticated users.

```tsx
// frontend/src/layout/Sidebar.tsx

const menuItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Service Requests', path: '/service-requests', icon: 'SR' },
  { label: 'Incidents', path: '/incidents', icon: 'IN' },
  { label: 'Problems', path: '/problems', icon: 'PR' },
  { label: 'Changes', path: '/changes', icon: 'CH' },
  { label: 'Inventory', path: '/inventory', icon: 'AS' },
  { label: 'Access Management', path: '/access-management', icon: 'AC' },
  { label: 'Compliance', path: '/compliance', icon: 'CO' },
  { label: 'Projects & Environments', path: '/projects-environments', icon: 'PE' },
  { label: 'Vendors & Licenses', path: '/vendors-licenses', icon: 'VL' },
  { label: 'Reports & Analytics', path: '/reports-analytics', icon: 'RA' },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: 'KB' },
  { label: 'Users & Teams', path: '/users-teams', icon: 'UT' },
  { label: 'Settings', path: '/settings', icon: '⚙' }
];
// All items shown regardless of permissions!
```

## To Implement Menu Permission Gating

You would modify Sidebar.tsx:

```tsx
import { useAuth } from '../auth/AuthContext';

export function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  
  const menuItems = [
    // ... items
  ];
  
  // Filter based on permissions
  const visibleItems = menuItems.filter(item => {
    // Example: Only show users-teams if has users:read
    if (item.path === '/users-teams') {
      return user?.permissions?.includes('users:read');
    }
    return true;
  });
  
  return (
    <nav>
      {visibleItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

# Part 7: Screen-Level Access Control

## Current State

**No frontend permission checks exist.** Screens are shown based on:

1. **Authentication** - Must be logged in (handled by `Protected` wrapper)
2. **Route access** - Any authenticated user can access any route

## Routes File

```tsx
// frontend/src/app/App.tsx

function Protected({ children }) {
  const { token, isBootstrapping } = useAuth();
  if (isBootstrapping) return <Loading />;
  if (!token) return <Navigate to="/login" />;
  return children;
}

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      
      {/* Protected routes - NO permission checks */}
      <Route path="/" element={<Protected><AppShell /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="service-requests" element={<ServiceRequestsPage />} />
        <Route path="users-teams" element={<ModulePage moduleKey="users-teams" />} />
        {/* ... all other routes */}
      </Route>
    </Routes>
  );
}
```

## Backend Protects the API

Even if frontend shows a screen, **backend enforces permissions**:

```
Frontend: User clicks "Users & Teams"
     │
     ▼
Frontend: Calls GET /api/users-teams
     │
     ▼
Backend: requirePermission('users:read') 
     │
     ├─── NO ──> 403 Forbidden
     │
     └─── YES ──> Returns data
```

---

# Part 8: API-Level Access Control Matrix

## All APIs and Their Permissions

| Module | Endpoint | Method | Permission | Notes |
|--------|----------|--------|------------|-------|
| **Health** | `/api/health` | GET | None | Public |
| **Auth** | `/api/auth/login` | POST | None | Public |
| **Auth** | `/api/auth/me` | GET | requireAuth | Any authenticated |
| **Auth** | `/api/auth/activate/validate/:token` | GET | None | Public |
| **Auth** | `/api/auth/activate` | POST | None | Public |
| **Auth** | `/api/auth/activate/resend` | POST | users:write | Admin only |
| **Dashboard** | `/api/dashboard` | GET | dashboard:read | |
| **Roles** | `/api/roles` | GET | users:read | |
| **Generic** | `/:module` | GET | module-specific | |
| **Generic** | `/:module` | POST | module-specific | writePermission |
| **Generic** | `/:module/:id` | PATCH | module-specific | writePermission |
| **Settings** | `/api/settings` | GET | settings:read | |
| **Settings** | `/api/settings` | PATCH | settings:write | |
| **AI** | `/api/ai/ask` | POST | ai:ask | |
| **Service Requests** | `/api/service-requests` | GET | tickets:read | |
| **Service Requests** | `/api/service-requests` | POST | tickets:write | |
| **Service Requests** | `/api/service-requests/:id` | PATCH | tickets:write | |
| **Service Requests** | `/api/service-requests/:id/assign` | PATCH | tickets:assign | |

---

# Part 9: Module Permissions (generic.routes.ts)

## Complete Module Map

```tsx
const moduleMap: Record<string, ModuleConfig> = {
  incidents: {
    permission: 'incidents:read',
    writePermission: 'incidents:write',
    entityType: 'Incident',
    // ...
  },
  problems: {
    permission: 'incidents:read',  // Uses incidents permission!
    writePermission: 'incidents:write',
    entityType: 'Problem',
    // ...
  },
  changes: {
    permission: 'changes:read',
    writePermission: 'changes:approve',  // Uses approve, not write
    entityType: 'ChangeRequest',
    // ...
  },
  inventory: {
    permission: 'inventory:read',
    writePermission: 'inventory:write',
    entityType: 'Asset',
    // ...
  },
  'access-management': {
    permission: 'access:read',
    writePermission: 'access:approve',  // Uses approve, not write
    entityType: 'AccessRequest',
    // ...
  },
  compliance: {
    permission: 'compliance:read',
    writePermission: 'compliance:write',
    entityType: 'ComplianceControl',
    // ...
  },
  'projects-environments': {
    permission: 'dashboard:read',  // Uses dashboard permission!
    writePermission: 'settings:write',  // Uses settings permission!
    entityType: 'ProjectEnvironment',
    // ...
  },
  'vendors-licenses': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    entityType: 'VendorLicense',
    // ...
  },
  'knowledge-base': {
    permission: 'dashboard:read',
    writePermission: 'settings:write',
    entityType: 'KnowledgeBaseArticle',
    // ...
  },
  'users-teams': {
    permission: 'users:read',
    writePermission: 'users:write',
    entityType: 'User',
    // ...
  },
  'reports-analytics': {
    permission: 'dashboard:read',
    writePermission: 'dashboard:read',  // Uses same for read/write
    entityType: 'Report',
    // ...
  }
};
```

---

# Part 10: Role vs Permission vs Screen vs API Matrix

## Complete Access Matrix

| Screen | Route | API Endpoint | Read Permission | Write Permission | Notes |
|--------|-------|-------------|----------------|----------------|-------|
| **Dashboard** | `/` | GET /api/dashboard | dashboard:read | - | |
| **Service Requests** | `/service-requests` | GET /api/service-requests | tickets:read | tickets:write | |
| **Incidents** | `/incidents` | GET /api/incidents | incidents:read | incidents:write | |
| **Problems** | `/problems` | GET /api/problems | incidents:read* | incidents:write* | *Uses incident permissions |
| **Changes** | `/changes` | GET /api/changes | changes:read | changes:approve | Uses approve permission |
| **Inventory** | `/inventory` | GET /api/inventory | inventory:read | inventory:write | |
| **Access Management** | `/access-management` | GET /api/access-management | access:read | access:approve | Uses approve permission |
| **Compliance** | `/compliance` | GET /api/compliance | compliance:read | compliance:write | |
| **Projects & Environments** | `/projects-environments` | GET /api/projects-environments | dashboard:read* | settings:write* | *Uses different perms |
| **Vendors & Licenses** | `/vendors-licenses` | GET /api/vendors-licenses | dashboard:read | settings:write | Uses settings for write |
| **Reports & Analytics** | `/reports-analytics` | GET /api/reports-analytics | dashboard:read | dashboard:read | Read-only reports |
| **Knowledge Base** | `/knowledge-base` | GET /api/knowledge-base | dashboard:read | settings:write | Uses settings for write |
| **Users & Teams** | `/users-teams` | GET /api/users-teams | users:read | users:write | |
| **Settings** | `/settings` | GET /api/settings | settings:read | settings:write | |
| **AI Assistant** | (panel) | POST /api/ai/ask | - | ai:ask | Only ask permission |

---

# Part 11: Permission Hierarchy

## Current: Flat Permissions

```
Permissions are NOT hierarchical.

Example:
- tickets:read does NOT imply dashboard:read
- users:write does NOT imply users:read
```

## If You Need Hierarchy

Would need to implement:

```tsx
const permissionHierarchy = {
  'admin': ['users:read', 'users:write', 'settings:read', 'settings:write', ...],
  'manager': ['tickets:read', 'tickets:write', 'incidents:read', ...],
  'agent': ['tickets:read', 'tickets:write', ...],
  'viewer': ['dashboard:read', 'tickets:read', ...]
};

function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}
```

---

# Part 12: AuthUser Type Definition

```tsx
// backend/src/middleware/auth.ts

export type AuthUser = {
  id: string;           // User's cuid
  email: string;        // User's email
  roles: string[];     // Array of role names: ["Super Admin"]
  permissions: string[]; // Array of permission codes
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
```

---

# Part 13: How Permissions Are Loaded

## Login Flow

```tsx
// backend/src/modules/auth/auth.service.ts

export async function loginWithPassword(email: string, password: string) {
  // 1. Find user with roles and permissions eager loaded
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: { 
              permissions: { 
                include: { permission: true } 
              } 
            }
          }
        }
      }
    }
  });

  // 2. Extract role names
  const roles = user.roles.map((ur) => ur.role.name);

  // 3. Flatten permissions from all roles
  const permissions = [...new Set(
    user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.code)
    )
  )];

  // 4. Sign JWT with permissions
  const token = jwt.sign(
    { id: user.id, email: user.email, roles, permissions },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  // 5. Return to frontend
  return { token, user: { id, name, email, roles, permissions } };
}
```

---

# Part 14: Security Considerations

## Current Security Model

| Aspect | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ Working | JWT-based |
| Authorization | ⚠️ Partial | API protected, UI not |
| Permission storage | ✅ Good | In database, not hardcoded |
| Permission loading | ✅ Efficient | Loaded at login, cached in JWT |

## Security Gaps

| Gap | Risk | Recommendation |
|-----|------|----------------|
| No UI permission checks | Users see screens they can't use | Add `user.permissions` checks in Sidebar |
| No row-level security | All users see all data | Add `requesterId` filters |
| No permission hierarchy | Complex role management | Implement hierarchical permissions |
| No permission groups | All 19 permissions standalone | Group related permissions |

---

# Part 15: Implementation Files Reference

## Backend Files

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Defines Role, Permission, UserRole, RolePermission models |
| `backend/prisma/seed.ts` | Seeds 19 permissions and Super Admin role |
| `backend/src/middleware/auth.ts` | JWT verification, AuthUser type |
| `backend/src/middleware/rbac.ts` | requirePermission middleware |
| `backend/src/modules/auth/auth.service.ts` | Loads permissions during login |
| `backend/src/modules/generic/generic.routes.ts` | Uses permissions for CRUD |

## Frontend Files

| File | Purpose |
|------|---------|
| `frontend/src/auth/AuthContext.tsx` | Stores user with roles/permissions |
| `frontend/src/layout/Sidebar.tsx` | Menu (no permission filtering) |
| `frontend/src/app/App.tsx` | Routes (protected but not permission-gated) |

---

**End of Report 2: RBAC Deep Dive**
