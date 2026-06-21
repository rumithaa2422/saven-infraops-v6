
# Report 1: Users & Teams Implementation Deep Dive

**Generated:** 2026-06-18  
**Based on:** `backend/prisma/schema.prisma`, `generic.routes.ts`, `ModulePage.tsx`

---

# Executive Summary

## ⚠️ IMPORTANT FINDING: There is NO Team Table!

The database does **NOT** have a `Team` table. The "Teams" in "Users & Teams" refers to:

1. **User Role Assignments** - Users are assigned to Roles (via `UserRole` junction table)
2. **Department Field** - Users have a `department` field (string, not a table)

The naming "Users & Teams" is misleading. The actual implementation is:
- **Users** - managed via `User` table
- **Teams** - represented by Roles (like "Super Admin") and Departments (like "Engineering")

---

# Answering Your Key Questions

## Q: Is there actually a Team table?
**NO.** There is no `Team` model in the Prisma schema. Only:
- `User` table
- `Role` table (but only one role exists: "Super Admin")
- `department` field on User (string, not a table)

## Q: What exactly is /api/users-teams doing?
**It manages Users**, not Teams. The endpoint:
- `GET /api/users-teams` → Lists all users with basic fields
- `POST /api/users-teams` → Creates a new user with PENDING_ACTIVATION status
- `PATCH /api/users-teams/:id` → Updates user fields (name, department, status, phone)

## Q: How generic.routes.ts is implemented?
See detailed section below.

## Q: Current User model columns?
```
User {
  id               String      @id @default(cuid())
  name             String                    // Full name
  email            String      @unique       // Login ID
  phoneNumber      String?                   // Optional phone
  passwordHash     String?                   // bcrypt hash (NULL until activated)
  department       String?                   // "Engineering", "QA", etc.
  status           UserStatus @default(PENDING_ACTIVATION)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  roles            UserRole[]               // Junction to Role
  activationToken  UserActivationToken?      // 1:1 optional
  requestedTickets ServiceRequest[]          // 1:N (requester)
  assignedTickets  ServiceRequest[]          // 1:N (assignee)
}
```

---

# Part 1: User Status Enum

```prisma
enum UserStatus {
  PENDING_ACTIVATION  // New user, no password set yet
  ACTIVE              // Can login
  DISABLED            // Admin disabled account
  LOCKED              // Too many failed login attempts (future)
}
```

---

# Part 2: Frontend Files Involved

## Files and Their Roles

| File | Purpose | Key Functions |
|------|---------|---------------|
| `frontend/src/pages/ModulePage.tsx` | Main users-teams UI | `configs['users-teams']`, `createRecord()`, `updateStatus()` |
| `frontend/src/app/App.tsx` | Routing | Route `/users-teams` → `<ModulePage moduleKey="users-teams" />` |
| `frontend/src/layout/Sidebar.tsx` | Navigation | Menu item for "Users & Teams" |
| `frontend/src/services/api.ts` | API client | `api.get()`, `api.post()`, `api.patch()` |
| `frontend/src/auth/AuthContext.tsx` | Auth state | Stores user info including roles |

---

# Part 3: ModulePage Configuration

## users-teams Config (Lines 219-238 in ModulePage.tsx)

```tsx
'users-teams': {
  referenceKey: 'email',     // Used as unique identifier in table
  titleKey: 'name',          // Used as title in drawer
  ownerKey: 'department',    // Used as owner column
  statusKey: 'status',       // Used for status column
  dateKey: 'createdAt',      // Used for date tracking
  fields: [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'department', label: 'Department', 
      type: 'select', 
      options: ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'], 
      required: true 
    },
    { key: 'roleId', label: 'Role', type: 'select', options: ['role-placeholder'] }
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' }
  ]
}
```

## Roles Fetch (Lines 307-316)

```tsx
useEffect(() => {
  if (moduleKey === 'users-teams') {
    api.get('/roles').then((res) => {
      setRoles(res.data.items || []);  // Fetches roles from API
    }).catch(() => {
      setRoles([]);
    });
  }
}, [moduleKey]);
```

---

# Part 4: Backend Files Involved

## Files and Their Roles

| File | Purpose | Key Functions |
|------|---------|---------------|
| `backend/src/modules/generic/generic.routes.ts` | Main logic | `moduleMap['users-teams']`, handlers |
| `backend/src/modules/auth/auth.routes.ts` | Auth endpoints | `/activate/*`, `/activate/resend` |
| `backend/src/modules/auth/auth.service.ts` | Login logic | `loginWithPassword()` |
| `backend/src/modules/auth/activation.service.ts` | Activation logic | `createActivationToken()`, `activateUserWithPassword()` |
| `backend/src/middleware/auth.ts` | JWT middleware | `requireAuth()` |
| `backend/src/middleware/rbac.ts` | Permission middleware | `requirePermission()` |
| `backend/src/common/email.ts` | Email service | `sendActivationEmail()` |
| `backend/prisma/schema.prisma` | Database schema | User, Role, Permission, UserRole, UserActivationToken |
| `backend/prisma/seed.ts` | Initial data | Creates Super Admin role, permissions, admin user |

---

# Part 5: API Endpoints for Users & Teams

## GET /api/users-teams
| Property | Value |
|----------|-------|
| **Purpose** | List all users |
| **Auth** | Required (Bearer token) |
| **Permission** | `users:read` |

**Request:** `GET /api/users-teams` with `Authorization: Bearer <token>`

**Response:**
```json
{
  "items": [
    {
      "id": "cmqhvqo2h000k1m9boyu5frc0",
      "name": "Saven Admin",
      "email": "admin@saven.in",
      "department": "InfraOps",
      "createdAt": "2026-06-16T12:00:00.000Z",
      "updatedAt": "2026-06-16T12:00:00.000Z"
    }
  ]
}
```

## POST /api/users-teams
| Property | Value |
|----------|-------|
| **Purpose** | Create new user |
| **Auth** | Required |
| **Permission** | `users:write` |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "department": "Engineering",
  "roleId": "role-cuid-or-name"
}
```

**Response (201):**
```json
{
  "item": {
    "id": "new-user-cuid",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "status": "PENDING_ACTIVATION",
    "createdAt": "2026-06-18T..."
  }
}
```

## PATCH /api/users-teams/:id
| Property | Value |
|----------|-------|
| **Purpose** | Update user |
| **Auth** | Required |
| **Permission** | `users:write` |

**Request Body:**
```json
{
  "name": "John Smith",
  "department": "DevOps",
  "status": "DISABLED",
  "phoneNumber": "+9876543210"
}
```

## GET /api/roles
| Property | Value |
|----------|-------|
| **Purpose** | List all roles (for dropdown) |
| **Auth** | Required |
| **Permission** | `users:read` |

**Response:**
```json
{
  "items": [
    { "id": "role-cuid", "name": "Super Admin", "description": "Full system access" }
  ]
}
```

## POST /api/auth/activate/resend
| Property | Value |
|----------|-------|
| **Purpose** | Resend activation email |
| **Auth** | Required (Admin) |
| **Permission** | `users:write` |

**Request Body:**
```json
{ "userId": "user-cuid" }
```

---

# Part 6: User Creation Flow (Step-by-Step)

## Sequence Diagram

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Frontend │     │ generic     │     │  activation   │     │   Prisma    │
│         │     │  .routes.ts  │     │  .service.ts  │     │             │
└────┬────┘     └──────┬──────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                   │                   │
     │ POST /users-teams│                  │                   │
     │────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │ 1. Check duplicate email               │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │                   │ <User exists?>    │
     │                 │                   │                   │
     │                 │ 2. Create User with                  │
     │                 │    PENDING_ACTIVATION status          │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │ 3. Find role (if roleId provided)   │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │ 4. Create UserRole junction          │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │ 5. Generate activation token          │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │ 6. Send activation email (mock)       │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │ 7. Create audit log                   │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │                   │  return user      │
     │                 │                   │<─────────────────│
     │                 │                   │                   │
     │<────────────────│                   │                   │
     │ 201 Created     │                   │                   │
     │                  │                   │                   │
```

## Step-by-Step Code Flow

### Step 1: Frontend Submits Form
```tsx
// ModulePage.tsx - createRecord()
async function createRecord(event: FormEvent) {
  event.preventDefault();
  await api.post(`/${moduleKey}`, form);  // POST /users-teams
  // form = { name, email, phoneNumber, department, roleId }
}
```

### Step 2: Backend Receives Request
```tsx
// generic.routes.ts - POST /:module
genericModuleRouter.post('/:module', requireAuth, async (req, res, next) => {
  const config = moduleMap[req.params.module];  // 'users-teams'
  await requirePermission(config.writePermission)(req, res, () => {});
  const item = await config.create(req.body);  // Call create function
  res.status(201).json({ item });
});
```

### Step 3: Validation & Duplicate Check
```tsx
// generic.routes.ts - create function
create: async (payload) => {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ 
    where: { email: payload.email } 
  });
  if (existing) {
    throw new HttpError(400, 'A user with this email already exists');
  }
  // ...
}
```

### Step 4: Create User
```tsx
// generic.routes.ts
const user = await prisma.user.create({ 
  data: { 
    name: payload.name, 
    email: payload.email,
    phoneNumber: payload.phoneNumber || null,
    department: payload.department || null,
    status: 'PENDING_ACTIVATION'
    // NOTE: passwordHash is NOT set - user must activate first
  } 
});
```

### Step 5: Assign Role
```tsx
// generic.routes.ts
if (payload.roleId) {
  const role = await prisma.role.findFirst({
    where: {
      OR: [
        { id: payload.roleId },
        { name: payload.roleId }  // Accepts role name or ID
      ]
    }
  });
  if (role) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id }
    });
  }
}
```

### Step 6: Send Activation Email
```tsx
// generic.routes.ts
await sendUserActivationEmail(user.id);
```

### Step 7: Audit Log
```tsx
// generic.routes.ts
await prisma.auditLog.create({
  data: { 
    actorId: 'system', 
    actorEmail: 'system', 
    action: 'USER_CREATED', 
    entityType: 'User', 
    entityId: user.id,
    newValue: { email: user.email, status: 'PENDING_ACTIVATION' }
  }
});
```

---

# Part 7: User Edit Flow

## Sequence Diagram

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│ Frontend │     │ generic     │     │   Prisma    │
│         │     │  .routes.ts  │     │             │
└────┬────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │
     │ PATCH /users-teams/:id             │
     │────────────────>│                   │
     │                 │                   │
     │                 │ prisma.user.update│
     │                 │──────────────────>>
     │                 │                   │
     │                 │                   │
     │<────────────────│                   │
     │ 200 OK          │                   │
```

## What Can Be Updated

```tsx
// generic.routes.ts - update function
update: (id, payload) => prisma.user.update({ 
  where: { id }, 
  data: { 
    name: payload.name,          // ✅ Can update
    department: payload.department, // ✅ Can update
    status: payload.status,        // ✅ Can update
    phoneNumber: payload.phoneNumber // ✅ Can update
    // NOTE: passwordHash CANNOT be updated here
    // NOTE: email CANNOT be updated here
  } 
})
```

## Current Limitations
1. **No email change** - Email is immutable after creation
2. **No password reset** - Must use activation flow
3. **No role editing** - Role assignment only on create
4. **No delete** - No delete endpoint exists

---

# Part 8: User Activation Flow

## Sequence Diagram

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Frontend │     │ auth.routes │     │ activation   │     │   Prisma    │
│         │     │             │     │  .service.ts  │     │             │
└────┬────┘     └──────┬──────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                   │                   │
     │ [Admin creates user]                 │                   │
     │──────────────────────────────────────│                   │
     │                 │                   │                   │
     │                 │   POST /auth/activate/resend            │
     │                 │───────────────────────────────────────>>
     │                 │                   │                   │
     │                 │                   │ createActivationToken()
     │                 │                   │──────────────────>>
     │                 │                   │                   │
     │                 │                   │ sendActivationEmail()
     │                 │                   │──────────────────>>
     │                 │                   │                   │
     │<──────────────────────────────────────│                   │
     │  Email sent (or mock logged)          │                   │
     │                 │                   │                   │
     │                 │                   │                   │
     │ [User clicks email link]             │                   │
     │                 │                   │                   │
     │ GET /auth/activate/validate/:token   │                   │
     │───────────────────────────────────────>>                   │
     │                 │                   │                   │
     │                 │                   │ validateActivationToken()
     │                 │                   │──────────────────>>
     │                 │                   │                   │
     │<──────────────────────────────────────│                   │
     │  { valid: true }                     │                   │
     │                 │                   │                   │
     │                 │                   │                   │
     │ [User enters password]                │                   │
     │                 │                   │                   │
     │ POST /auth/activate                   │                   │
     │ { token, password, confirmPassword } │                   │
     │───────────────────────────────────────>>                   │
     │                 │                   │                   │
     │                 │                   │ bcrypt.hash(password)
     │                 │                   │──────────────────>>
     │                 │                   │                   │
     │                 │                   │ prisma.$transaction([
     │                 │                   │   user.update(status=ACTIVE)
     │                 │                   │   token.update(used=true)
     │                 │                   │   auditLog.create()
     │                 │                   │ ])
     │                 │                   │──────────────────>>
     │                 │                   │                   │
     │<──────────────────────────────────────│                   │
     │  { success: true }                   │                   │
```

## Step-by-Step Code Flow

### Step 1: Resend Activation Email (Admin)
```tsx
// auth.routes.ts
authRouter.post('/activate/resend', requireAuth, async (req, res) => {
  const { userId } = req.body;
  await sendUserActivationEmail(userId);
  res.json({ success: true, message: 'Activation email sent' });
});
```

### Step 2: Validate Token (Frontend checks on page load)
```tsx
// activation.service.ts
export async function validateActivationToken(token: string) {
  const activationToken = await prisma.userActivationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!activationToken) {
    return { valid: false, error: 'Invalid activation token' };
  }

  if (activationToken.used) {
    return { valid: false, error: 'This activation link has already been used' };
  }

  if (new Date() > activationToken.expiresAt) {
    return { valid: false, error: 'This activation link has expired' };
  }

  return { valid: true, userId: activationToken.userId };
}
```

### Step 3: Activate with Password
```tsx
// activation.service.ts
export async function activateUserWithPassword(token, password, confirmPassword) {
  // Validate password match
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Validate password strength
  if (!validatePasswordStrength(password).valid) {
    return { success: false, error: passwordValidation.error };
  }

  // Validate token
  const tokenValidation = await validateActivationToken(token);
  if (!tokenValidation.valid) {
    return { success: false, error: tokenValidation.error };
  }

  // Transaction: update user + mark token used + audit log
  const passwordHash = await bcrypt.hash(password, 12);
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,  // NOW password is set
        status: 'ACTIVE'  // NOW user can login
      }
    }),
    prisma.userActivationToken.update({
      where: { token },
      data: { used: true }
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'ACTIVATION_COMPLETED',
        entityType: 'User',
        entityId: userId
      }
    })
  ]);

  return { success: true };
}
```

---

# Part 9: User Status Change Flow

## Status Transitions

```
PENDING_ACTIVATION ────────> ACTIVE (via activation flow)
        │
        │
        ▼
     ACTIVE ───────────────> DISABLED (via PATCH /users-teams/:id)
        │
        │
        ▼
     DISABLED (can be re-enabled by setting back to ACTIVE)
```

## Code Implementation

```tsx
// ModulePage.tsx - updateStatus()
async function updateStatus(status: string) {
  if (!selected?.id) return;
  await api.patch(`/${moduleKey}/${selected.id}`, { status });
  await load();  // Refresh table
}
```

The drawer shows status buttons based on `getStatusActions('users-teams')`:
```tsx
if (moduleKey === 'users-teams') return [];  // No status actions in drawer
```

**Currently, there's NO status change UI in the drawer for users-teams!** Status can only be changed programmatically or via direct API call.

---

# Part 10: Team-Related Operations

## IMPORTANT: No "Team" Table Exists!

The "Teams" in "Users & Teams" is implemented as:

### Option 1: Roles (via UserRole junction)
```tsx
// On user creation:
await prisma.userRole.create({
  data: { userId: user.id, roleId: role.id }
});
```

### Option 2: Department (string field on User)
```tsx
// On user creation:
department: payload.department || null  // "Engineering", "QA", etc.
```

## To Add a Real Team Table

If you want a proper Team entity, you would need to:

1. Add to Prisma schema:
```prisma
model Team {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  members   UserTeam[]
}

model UserTeam {
  userId String
  teamId String
  user   User @relation(...)
  team   Team @relation(...)
  @@id([userId, teamId])
}
```

2. Add to generic routes
3. Add to frontend config
4. Update seed data

---

# Part 11: Role Assignment Flow

## Current Implementation

Roles are assigned **only during user creation**:

```tsx
// generic.routes.ts - create function
if (payload.roleId) {
  const role = await prisma.role.findFirst({
    where: {
      OR: [
        { id: payload.roleId },      // Accept role ID
        { name: payload.roleId }       // OR role name
      ]
    }
  });
  if (role) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id }
    });
  }
}
```

## Limitations
1. **Cannot change role after creation** - No update logic for UserRole
2. **Only one role per user** - The code doesn't prevent multiple, but frontend only assigns one
3. **Only Super Admin exists** - No other roles seeded

---

# Part 12: Permission Checking Flow

## Middleware Chain

```
Request ─> requireAuth ─> requirePermission ─> Route Handler
             │                 │
             │                 │
          Verify JWT      Check if user.permissions
          Attach user     includes required permission
```

## Code

```tsx
// auth.ts - requireAuth
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');
  
  const token = header.replace('Bearer ', '');
  req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
  next();
}

// rbac.ts - requirePermission
export function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}
```

## User Permissions in JWT

Permissions are loaded during login and embedded in JWT:

```tsx
// auth.service.ts - loginWithPassword()
const permissions = [...new Set(user.roles.flatMap(
  (ur) => ur.role.permissions.map((rp) => rp.permission.code)
))];

const token = jwt.sign(
  { id, email, roles, permissions },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }
);
```

---

# Part 13: Complete File Reference

## Frontend Files

| File | Path | Changes For |
|------|------|-------------|
| `ModulePage.tsx` | `frontend/src/pages/ModulePage.tsx` | Users-teams config, form fields, API calls |
| `App.tsx` | `frontend/src/app/App.tsx` | Route for /users-teams |
| `Sidebar.tsx` | `frontend/src/layout/Sidebar.tsx` | Menu item |
| `api.ts` | `frontend/src/services/api.ts` | API client |
| `AuthContext.tsx` | `frontend/src/auth/AuthContext.tsx` | User state |

## Backend Files

| File | Path | Changes For |
|------|------|-------------|
| `generic.routes.ts` | `backend/src/modules/generic/generic.routes.ts` | Users-teams CRUD |
| `auth.routes.ts` | `backend/src/modules/auth/auth.routes.ts` | Activation endpoints |
| `auth.service.ts` | `backend/src/modules/auth/auth.service.ts` | Login logic |
| `activation.service.ts` | `backend/src/modules/auth/activation.service.ts` | Activation logic |
| `auth.ts` | `backend/src/middleware/auth.ts` | JWT middleware |
| `rbac.ts` | `backend/src/middleware/rbac.ts` | Permission middleware |
| `email.ts` | `backend/src/common/email.ts` | Email sending |
| `schema.prisma` | `backend/prisma/schema.prisma` | User, Role, Permission models |
| `seed.ts` | `backend/prisma/seed.ts` | Initial roles/permissions |

## Database Tables

| Table | Purpose |
|-------|---------|
| `User` | User accounts |
| `UserActivationToken` | Email activation tokens |
| `Role` | Role definitions |
| `Permission` | Permission codes |
| `UserRole` | User-Role junction |
| `RolePermission` | Role-Permission junction |
| `AuditLog` | Change audit trail |

---

# Part 14: Current Limitations Summary

## What CAN Be Done
✅ Create new user (with email activation)  
✅ List all users  
✅ Update user (name, department, status, phoneNumber)  
✅ Assign role on creation  
✅ Resend activation email  
✅ Activate account with password  

## What CANNOT Be Done (Yet)
❌ Delete user  
❌ Edit user role after creation  
❌ Edit user email  
❌ Reset user password (admin)  
❌ View/edit teams (no Team table)  
❌ Bulk status changes  
❌ User password change (self-service)  

---

**End of Report 1: Users & Teams Deep Dive**
