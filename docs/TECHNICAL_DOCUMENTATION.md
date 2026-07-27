# Saven InfraOps Enterprise Command Center V6 - Technical Documentation

**Generated:** 2026-06-18  
**Repository:** https://github.com/rumithaa2422/saven-infraops-v6  
**Tag:** v6-working-baseline  
**Commit:** 1bbb05ae3b2bf113156bcab18ef11b1a21ce54db

---

# 1. Project Overview

## Purpose
Enterprise IT Service Management (ITSM) command center providing centralized management of service requests, incidents, problems, changes, assets, compliance, and AI-powered assistance.

## Business Use Cases
- IT helpdesk and service request management
- Incident response and root cause analysis
- Change management workflows
- Asset and inventory tracking
- Compliance control management
- Vendor and license tracking
- AI-powered ticket analysis and suggestions

## Major Modules
| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Overview statistics and AI command |
| Service Requests | `/service-requests` | Dedicated SR management with filtering |
| Incidents | `/incidents` | Incident tracking |
| Problems | `/problems` | Problem management |
| Changes | `/changes` | Change request management |
| Inventory | `/inventory` | Asset management |
| Access Management | `/access-management` | Access request workflows |
| Compliance | `/compliance` | Compliance control tracking |
| Projects & Environments | `/projects-environments` | Infrastructure mapping |
| Vendors & Licenses | `/vendors-licenses` | License management |
| Reports & Analytics | `/reports-analytics` | Report generation |
| Knowledge Base | `/knowledge-base` | Article management |
| Users & Teams | `/users-teams` | User administration |
| Settings | `/settings` | System configuration |

## Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** React Context (AuthContext)
- **HTTP Client:** Axios
- **Styling:** Custom CSS (app.css)

### Key Frontend Files
```
frontend/src/
├── app/App.tsx              # Main router with protected routes
├── auth/AuthContext.tsx     # Authentication state management
├── components/
│   ├── AssistantPanel.tsx   # AI command panel
│   ├── CommandBar.tsx       # Quick command interface
│   └── StatCard.tsx         # Dashboard stat cards
├── layout/
│   ├── AppShell.tsx         # Main layout wrapper
│   └── Sidebar.tsx          # Left navigation menu
├── pages/
│   ├── DashboardPage.tsx   # Dashboard view
│   ├── LoginPage.tsx        # Login form
│   ├── ModulePage.tsx       # Generic CRUD for all modules
│   ├── ServiceRequestsPage.tsx # Dedicated SR page
│   ├── SettingsPage.tsx     # Settings management
│   └── ActivateAccountPage.tsx # Email activation flow
└── services/api.ts          # Axios API client
```

## Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript
- **ORM:** Prisma with MySQL
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** Zod schemas
- **Logging:** Pino HTTP logger

### Key Backend Files
```
backend/src/
├── app.ts                   # Express app configuration
├── server.ts               # Server entry point
├── config/env.ts           # Environment variable loading
├── common/
│   ├── prisma.ts           # Prisma client singleton
│   ├── email.ts            # Email service
│   ├── logger.ts          # Pino logger
│   └── httpError.ts        # Custom error class
├── middleware/
│   ├── auth.ts             # JWT authentication
│   ├── rbac.ts             # Permission checking
│   └── errorHandler.ts     # Global error handler
└── modules/
    ├── auth/               # Login, activation, password
    ├── dashboard/         # Dashboard stats
    ├── generic/           # Generic CRUD framework
    ├── serviceRequests/   # SR management
    ├── settings/          # System settings
    ├── ai/                # AI integration
    ├── import/            # Excel import
    └── notifications/     # Notification service
```

## Authentication Flow
```
┌──────────┐     POST /api/auth/login     ┌──────────┐
│  Login   │ ──────────────────────────► │  Backend │
│  Page    │ ◄────────────────────────── │          │
└──────────┘      { token, user }        └──────────┘
                                               │
                                               ▼
                                        ┌──────────┐
                                        │  Prisma  │
                                        │  Verify  │
                                        │ password │
                                        └──────────┘
```

1. User submits email/password to `/api/auth/login`
2. Backend verifies credentials via `auth.service.ts:loginWithPassword()`
3. On success, returns JWT token with user roles/permissions
4. Frontend stores token in localStorage and sets Authorization header
5. All subsequent requests include `Bearer <token>` header

## Authorization/RBAC Flow
```
JWT Token Payload:
{
  id: "user-cuid",
  email: "user@example.com",
  roles: ["Super Admin"],
  permissions: ["dashboard:read", "tickets:read", ...]
}
```

1. `requireAuth` middleware validates JWT and attaches user to request
2. `requirePermission('module:action')` middleware checks user's permissions array
3. Permissions checked against `RolePermission` table in database

---

# 2. Folder Structure

## Root Level
```
saven-infraops-enterprise-v6/
├── backend/                 # Express API server
├── frontend/                # React SPA
├── docs/                   # Architecture docs
├── docker-compose.yml       # MySQL + Redis containers
├── package.json            # Root package with scripts
└── README.md               # Setup instructions
```

## Backend Folder Structure
```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema (all models)
│   ├── seed.ts             # Initial data seeder
│   └── migrations/         # Prisma migrations
├── src/
│   ├── app.ts              # Express app factory
│   ├── server.ts           # Entry point
│   ├── common/             # Shared utilities
│   ├── config/             # Environment config
│   ├── middleware/         # Express middleware
│   └── modules/            # Feature modules
└── package.json            # Dependencies
```

## Frontend Folder Structure
```
frontend/
├── src/
│   ├── app/                # Router and App component
│   ├── auth/              # AuthContext
│   ├── components/         # Reusable components
│   ├── layout/            # AppShell, Sidebar
│   ├── pages/              # Page components
│   ├── services/           # API service
│   ├── main.tsx           # Entry point
│   └── app.css            # Global styles
├── index.html              # HTML entry
└── package.json
```

## Key Files Explained

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express app with all routes and middleware |
| `backend/src/middleware/auth.ts` | JWT validation middleware |
| `backend/src/middleware/rbac.ts` | Permission checking middleware |
| `backend/src/modules/generic/generic.routes.ts` | Generic CRUD for all modules |
| `frontend/src/app/App.tsx` | React Router with protected routes |
| `frontend/src/pages/ModulePage.tsx` | Generic management page with form configs |
| `frontend/src/layout/Sidebar.tsx` | Navigation menu definition |

## Startup Flow

### Backend Startup
```bash
cd backend
npm install
npm run prisma:generate   # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:seed           # Seed initial data
npm run dev               # Start with tsx (tsx src/server.ts)
```
Runs on `http://localhost:4000`

### Frontend Startup
```bash
cd frontend
npm install
npm run dev               # Start with Vite
```
Runs on `http://localhost:3001`

---

# 3. Frontend Analysis

## Routes
Located in `frontend/src/app/App.tsx`:

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/activate-account" element={<ActivateAccountPage />} />
  <Route path="/" element={<Protected><AppShell /></Protected>}>
    <Route index element={<DashboardPage />} />
    <Route path="service-requests" element={<ServiceRequestsPage />} />
    <Route path="incidents" element={<ModulePage moduleKey="incidents" />} />
    <Route path="problems" element={<ModulePage moduleKey="problems" />} />
    <Route path="changes" element={<ModulePage moduleKey="changes" />} />
    <Route path="inventory" element={<ModulePage moduleKey="inventory" />} />
    <Route path="access-management" element={<ModulePage moduleKey="access-management" />} />
    <Route path="compliance" element={<ModulePage moduleKey="compliance" />} />
    <Route path="projects-environments" element={<ModulePage moduleKey="projects-environments" />} />
    <Route path="vendors-licenses" element={<ModulePage moduleKey="vendors-licenses" />} />
    <Route path="reports-analytics" element={<ModulePage moduleKey="reports-analytics" />} />
    <Route path="knowledge-base" element={<ModulePage moduleKey="knowledge-base" />} />
    <Route path="users-teams" element={<ModulePage moduleKey="users-teams" />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

## Pages

| Page | File | Description |
|------|------|-------------|
| Login | `LoginPage.tsx` | Email/password login form |
| Dashboard | `DashboardPage.tsx` | Stats and AI command |
| ModulePage | `ModulePage.tsx` | Generic CRUD for 12 modules |
| ServiceRequests | `ServiceRequestsPage.tsx` | Dedicated SR page with filters |
| Settings | `SettingsPage.tsx` | System settings editor |
| ActivateAccount | `ActivateAccountPage.tsx` | Email activation with password set |

## Components

| Component | File | Purpose |
|-----------|------|---------|
| AppShell | `AppShell.tsx` | Main layout with sidebar + content area |
| Sidebar | `Sidebar.tsx` | Left navigation menu |
| StatCard | `StatCard.tsx` | Dashboard statistics card |
| CommandBar | `CommandBar.tsx` | AI question input |
| AssistantPanel | `AssistantPanel.tsx` | AI suggestions and results |

## Layout Structure
```
AppShell
├── Sidebar (left, collapsible)
│   ├── Brand header
│   ├── Navigation links
│   └── Toggle button
├── Content area (right)
│   ├── Page header
│   ├── Page content
│   └── AI AssistantPanel (bottom, collapsible)
└── User menu (top-right)
```

## Left Menu Implementation
`frontend/src/layout/Sidebar.tsx`:

```tsx
const menuItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Service Requests', path: '/service-requests', icon: 'SR' },
  { label: 'Incidents', path: '/incidents', icon: 'IN' },
  // ... 12 more items
];
```

Menu is hardcoded array - adding new items requires editing this file.

## AI Panel Implementation
`frontend/src/components/AssistantPanel.tsx`:
- Collapsible panel at bottom of screen
- Preset question buttons
- Question input with "Ask" button
- Displays result cards linking to modules

## Drawer Implementation
Modal-based drawer in `ModulePage.tsx`:
```tsx
{selected && (
  <div className="drawer">
    <button onClick={() => setSelected(null)}>Close</button>
    <h3>{formatValue(selected[config.titleKey])}</h3>
    <div className="record-detail">
      {config.columns.map((col) => (
        <p key={col.key}><strong>{col.label}:</strong> {formatValue(selected[col.key])}</p>
      ))}
    </div>
  </div>
)}
```

## Generic Management Screens
`ModulePage.tsx` uses configuration objects:

```tsx
type ModuleConfig = {
  referenceKey: string;  // Unique identifier field
  titleKey: string;      // Display title field
  ownerKey?: string;     // Owner field
  statusKey?: string;    // Status field
  dateKey?: string;      // Date field
  fields: Field[];       // Form fields for create/edit
  columns: Field[];      // Table columns
};
```

All 12 generic modules use this single component.

## State Management Approach
- **Auth:** React Context (`AuthContext.tsx`) with localStorage persistence
- **Module Data:** Local component state (`useState`)
- **No Redux/Zustand** - lightweight approach

```tsx
// AuthContext stores:
- token: string | null
- user: { id, name, email, roles }
- isBootstrapping: boolean
- login(), logout() methods
```

## API Integration Approach
`frontend/src/services/api.ts`:

```tsx
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 20000
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
```

---

# 4. Backend Analysis

## API Architecture
Express-based REST API with modular router structure:

```
/api/
├── health              GET   - Health check
├── auth/
│   ├── login          POST   - Email/password login
│   ├── me             GET    - Current user info
│   ├── microsoft/start GET    - MS OAuth initiation
│   ├── activate/validate/:token GET  - Validate activation
│   ├── activate       POST    - Complete activation
│   └── activate/resend POST   - Resend activation email
├── dashboard/         GET    - Dashboard statistics
├── service-requests/
│   ├── GET            - List SRs
│   ├── GET/:id        - Get single SR
│   ├── POST           - Create SR
│   ├── PATCH/:id      - Update SR
│   └── PATCH/:id/assign - Assign SR
├── roles              GET    - List all roles
├── :module            GET    - Generic list
├── :module            POST   - Generic create
├── :module/:id        PATCH  - Generic update
├── settings/          GET    - Get settings
├── settings/          PATCH  - Update setting
├── ai/ask             POST   - AI query
└── import/            POST   - Excel import
```

## Middleware

### Authentication Middleware
`backend/src/middleware/auth.ts`:

```tsx
export function requireAuth(req, res, next) {
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

### Permission Middleware
`backend/src/middleware/rbac.ts`:

```tsx
export function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!req.user.permissions.includes(permission)) throw new HttpError(403, `Permission required: ${permission}`);
    next();
  };
}
```

### Error Handler
`backend/src/middleware/errorHandler.ts`:
- Catches all errors
- Returns consistent JSON error responses
- Logs errors with stack traces

## Generic CRUD Framework
`backend/src/modules/generic/generic.routes.ts`:

```tsx
const moduleMap: Record<string, ModuleConfig> = {
  'module-name': {
    permission: 'module:read',
    writePermission: 'module:write',
    entityType: 'PrismaModel',
    list: () => prisma.model.findMany(...),
    create: (payload) => prisma.model.create({ data: payload }),
    update: (id, payload) => prisma.model.update({ where: { id }, data: payload })
  }
};
```

Routes:
- `GET /:module` - List with permission check
- `POST /:module` - Create with audit log
- `PATCH /:module/:id` - Update with audit log

## Audit Logging
Automatic in generic routes:
```tsx
await prisma.auditLog.create({
  data: {
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'CREATE',
    entityType: config.entityType,
    entityId: item.id,
    newValue: item,
    ipAddress: req.ip
  }
});
```

## AI Integration
`backend/src/modules/ai/ai.service.ts`:

```tsx
export async function askAi(input: { question: string; userId?: string }) {
  // Parse question keywords
  if (q.includes('service request') || q.includes('ticket')) {
    // Query service requests
  } else if (q.includes('incident')) {
    // Query incidents
  } else if (q.includes('asset') || q.includes('inventory')) {
    // Query assets
  } else if (q.includes('compliance')) {
    // Query compliance
  } else {
    // Use AI provider
    const providerAnswer = await runAiProvider(input.question);
  }
  
  // Log conversation
  await prisma.aiConversation.create({ ... });
  
  return { answer, cards, provider };
}
```

Provider factory at `ai/providers/providerFactory.ts` supports:
- mock (built-in responses)
- openai
- claude
- private model

## Email Integration
`backend/src/common/email.ts`:

```tsx
export async function sendActivationEmail(user, activationUrl) {
  if (!env.EMAIL_ENABLED) {
    console.log(`[EMAIL MOCK] ...`);
    await prisma.notificationLog.create({ data: { status: 'MOCK_SENT' }});
    return { success: true, mock: true };
  }
  
  const transporter = nodemailer.createTransport({ ... });
  await transporter.sendMail({ from: env.SMTP_FROM, to: user.email, ... });
  await prisma.notificationLog.create({ data: { status: 'SENT' }});
  return { success: true };
}
```

Requires `EMAIL_ENABLED=true` and SMTP configuration in `.env`.

## Teams Integration
Placeholder in notification service - not fully implemented.

---

# 5. Authentication & User Management

## Login Flow
`backend/src/modules/auth/auth.routes.ts`:

```tsx
authRouter.post('/login', async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const result = await loginWithPassword(payload.email, payload.password);
  res.json(result);  // { token, user }
});
```

`auth.service.ts:loginWithPassword()`:
1. Find user by email
2. Check status (PENDING_ACTIVATION, DISABLED, LOCKED)
3. Verify password with bcrypt
4. Generate JWT with roles and permissions
5. Return token + user object

## User Creation Flow
`generic.routes.ts:users-teams.create`:

```tsx
create: async (payload) => {
  // 1. Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) throw new HttpError(400, 'Email already exists');
  
  // 2. Create user with PENDING_ACTIVATION
  const user = await prisma.user.create({ 
    data: { name, email, phoneNumber, department, status: 'PENDING_ACTIVATION' }
  });
  
  // 3. Assign role if provided
  if (payload.roleId) {
    const role = await prisma.role.findFirst({ where: { OR: [{ id: payload.roleId }, { name: payload.roleId }] }});
    await prisma.userRole.create({ userId: user.id, roleId: role.id });
  }
  
  // 4. Send activation email
  await sendUserActivationEmail(user.id);
  
  // 5. Audit log
  await prisma.auditLog.create({ action: 'USER_CREATED' });
  
  return user;
}
```

## User Activation Flow
1. Admin creates user → User status = PENDING_ACTIVATION
2. System generates secure token → stores in UserActivationToken
3. Email sent to user with activation link
4. User clicks link → navigates to `/activate-account?token=xxx`
5. Frontend validates token via `GET /api/auth/activate/validate/:token`
6. User sets password → `POST /api/auth/activate` with token + password
7. Backend verifies token, hashes password, sets status = ACTIVE
8. User can now login

## Password Handling
- **Storage:** bcrypt with 12 rounds
- **Validation:** 8+ chars, uppercase, lowercase, number, special char
- **Seeded admin:** Admin@12345 (must be changed in production)

## JWT Implementation
`auth.service.ts`:

```tsx
const token = jwt.sign(
  { id: user.id, email: user.email, roles, permissions },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }  // Default: 8h
);
```

JWT payload:
```json
{
  "id": "cmqhvqo2h000k1m9boyu5frc0",
  "email": "admin@saven.in",
  "roles": ["Super Admin"],
  "permissions": ["dashboard:read", "tickets:read", ...],
  "iat": 1781691614,
  "exp": 1781720414
}
```

## Roles Implementation
Seed in `prisma/seed.ts`:
```tsx
const adminRole = await prisma.role.upsert({
  where: { name: 'Super Admin' },
  create: { name: 'Super Admin', description: 'Full system access' }
});
```

Only one role exists by default. Role management UI not implemented.

## Permissions Implementation
Seed creates 16 permissions:
```tsx
permissions = [
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

Super Admin role has ALL permissions.

## User-Team Management
Frontend `ModulePage.tsx` config:
```tsx
'users-teams': {
  fields: [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'department', label: 'Department', type: 'select', 
      options: ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'], 
      required: true },
    { key: 'roleId', label: 'Role', type: 'select' }
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

---

# 6. Users and Teams Module Deep Dive

## User Entity
```prisma
model User {
  id               String               @id @default(cuid())
  name             String
  email            String               @unique
  phoneNumber      String?
  passwordHash     String?              // Null for PENDING_ACTIVATION users
  department       String?
  status           UserStatus           @default(PENDING_ACTIVATION)
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  roles            UserRole[]
  activationToken  UserActivationToken?
  requestedTickets ServiceRequest[]      @relation("RequesterTickets")
  assignedTickets  ServiceRequest[]      @relation("AssigneeTickets")
}

enum UserStatus {
  PENDING_ACTIVATION  // New users, no password set
  ACTIVE              // Can login
  DISABLED            // Locked by admin
  LOCKED              // Too many failed attempts (future)
}
```

## UserActivationToken Entity
```prisma
model UserActivationToken {
  id        String   @id @default(cuid())
  userId    String   @unique
  token     String   @unique         // Secure random hex (64 chars)
  expiresAt DateTime                  // 24 hours from creation
  used      Boolean  @default(false) // Marked true after activation
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

## Role Entity
```prisma
model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  users       UserRole[]
  permissions RolePermission[]
}
```

## Permission Entity
```prisma
model Permission {
  id          String           @id @default(cuid())
  code        String           @unique  // e.g., "tickets:read"
  description String?
  roles       RolePermission[]
}
```

## UserRole (Junction)
```prisma
model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}
```

## RolePermission (Junction)
```prisma
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}
```

## Relationships
```
User ─┬─< UserRole >─┬─ Role
      │              │
      │              └─< RolePermission >─┬─ Permission
      │
      └─< UserActivationToken
```

## APIs Used
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users-teams` | List all users |
| POST | `/api/users-teams` | Create new user |
| PATCH | `/api/users-teams/:id` | Update user |
| GET | `/api/roles` | List all roles |

## UI Screens
- **List View:** `ModulePage.tsx` with users-teams config
- **Create Form:** Modal with Name, Email, Phone, Department dropdown, Role dropdown
- **Detail Drawer:** Shows selected user info
- **Activation:** `ActivateAccountPage.tsx` for password setup

## Create/Edit/Delete Flow

### Create
1. Click "Create" → Modal opens
2. Fill form → Submit
3. Backend validates email uniqueness
4. Creates user with PENDING_ACTIVATION
5. Sends activation email (or mock log)
6. Table refreshes with new user

### Edit
1. Click "Open" on user row → Drawer opens
2. Status actions: ACTIVE, DISABLED (direct status change)
3. No edit form implemented - only status changes

### Delete
Not implemented - no delete endpoint or UI button.

## Current Limitations
1. **No role management UI** - Only Super Admin exists
2. **No delete user** - Can't remove users
3. **No password reset** - Admin can't reset passwords
4. **No team entity** - Only departments on users
5. **No bulk operations** - Can't enable/disable multiple users
6. **Limited department list** - Hardcoded 9 options

---

# 7. Database Documentation

## User

**Purpose:** Core user account entity for authentication and identification.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| name | String | No | - | Full display name |
| email | String | No | @unique | Login identifier |
| phoneNumber | String | Yes | - | Contact phone |
| passwordHash | String | Yes | - | bcrypt hash (null if pending) |
| department | String | Yes | - | Department name |
| status | UserStatus | No | PENDING_ACTIVATION | Account state |
| createdAt | DateTime | No | now() | Creation timestamp |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Relationships
- `roles: UserRole[]` - Many-to-many with roles
- `activationToken: UserActivationToken` - One-to-one activation token
- `requestedTickets: ServiceRequest[]` - Tickets created by user
- `assignedTickets: ServiceRequest[]` - Tickets assigned to user

### Used By Screens
- Dashboard (current user)
- Users & Teams module

### Used By APIs
- POST /api/auth/login
- POST /api/auth/activate
- GET /api/users-teams
- POST /api/users-teams
- PATCH /api/users-teams/:id

---

## UserActivationToken

**Purpose:** Stores secure tokens for email-based account activation.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| userId | String | No | @unique | FK to User |
| token | String | No | @unique | 64-char hex token |
| expiresAt | DateTime | No | - | Expiration (24h) |
| used | Boolean | No | false | Activation complete |
| createdAt | DateTime | No | now() | Creation time |

### Relationships
- `user: User` - Belongs to one user

### Used By Screens
- Activate Account page

### Used By APIs
- GET /api/auth/activate/validate/:token
- POST /api/auth/activate

---

## Role

**Purpose:** Defines named permission groupings.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| name | String | No | @unique | Role name |
| description | String | Yes | - | Role description |

### Relationships
- `users: UserRole[]` - Users with this role
- `permissions: RolePermission[]` - Permissions assigned

### Used By Screens
- Users & Teams (role dropdown)

### Used By APIs
- GET /api/roles

---

## Permission

**Purpose:** Individual permission codes for RBAC.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| code | String | No | @unique | Permission code |
| description | String | Yes | - | Permission description |

### Relationships
- `roles: RolePermission[]` - Roles with this permission

### Used By Screens
- (Display only, no UI for permissions)

### Used By APIs
- (Used internally for auth checks)

---

## UserRole

**Purpose:** Junction table for User-Role many-to-many.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| userId | String | No | - | FK to User |
| roleId | String | No | - | FK to Role |

### Relationships
- `user: User` - The user
- `role: Role` - The assigned role

### Used By Screens
- Users & Teams

### Used By APIs
- POST /api/auth/login (loads permissions)

---

## RolePermission

**Purpose:** Junction table for Role-Permission many-to-many.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| roleId | String | No | - | FK to Role |
| permissionId | String | No | - | FK to Permission |

### Relationships
- `role: Role` - The role
- `permission: Permission` - The permission

### Used By Screens
- (Internal only)

### Used By APIs
- POST /api/auth/login (loads permissions)

---

## AuditLog

**Purpose:** Tracks all create/update operations for compliance.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| actorId | String | Yes | - | User who performed action |
| actorEmail | String | Yes | - | Email of actor |
| action | String | No | - | Action type (CREATE, UPDATE, etc.) |
| entityType | String | No | - | Prisma model name |
| entityId | String | Yes | - | ID of affected record |
| oldValue | Json | Yes | - | Previous values |
| newValue | Json | Yes | - | New values |
| ipAddress | String | Yes | - | Client IP |
| createdAt | DateTime | No | now() | Timestamp |

### Relationships
None (flat table)

### Used By Screens
- (No UI - database query only)

### Used By APIs
- Auto-created by generic routes

---

## ServiceRequest

**Purpose:** IT service request tickets.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| ticketNo | String | No | @unique | Display ID (SR-1001) |
| title | String | No | - | Request title |
| description | String | Yes | - | Full description |
| category | String | No | - | Category (Network, Asset, etc.) |
| subCategory | String | Yes | - | Sub-category |
| priority | TicketPriority | No | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| status | WorkStatus | No | OPEN | Current status |
| requesterId | String | Yes | - | FK to User (creator) |
| assigneeId | String | Yes | - | FK to User (assigned) |
| requesterName | String | No | - | Creator name (denormalized) |
| assigneeName | String | Yes | - | Assignee name |
| projectName | String | Yes | - | Associated project |
| dueAt | DateTime | Yes | - | SLA deadline |
| resolvedAt | DateTime | Yes | - | Resolution time |
| closedAt | DateTime | Yes | - | Closure time |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Relationships
- `requester: User?` - Creator user
- `assignee: User?` - Assigned user

### Used By Screens
- Service Requests (dedicated page)
- Dashboard (counts)
- AI assistant (ticket queries)

### Used By APIs
- GET /api/service-requests
- POST /api/service-requests
- PATCH /api/service-requests/:id
- PATCH /api/service-requests/:id/assign

---

## Incident

**Purpose:** IT incident tracking.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| incidentNo | String | No | @unique | Display ID |
| title | String | No | - | Incident title |
| description | String | Yes | - | Details |
| severity | IncidentSeverity | No | SEV3 | SEV1/SEV2/SEV3/SEV4 |
| status | WorkStatus | No | OPEN | Current status |
| impactedService | String | Yes | - | Affected service |
| impactedProject | String | Yes | - | Affected project |
| startedAt | DateTime | Yes | - | Incident start |
| resolvedAt | DateTime | Yes | - | Resolution time |
| rca | String | Yes | - | Root cause analysis |
| correctiveAction | String | Yes | - | Fix applied |
| preventiveAction | String | Yes | - | Prevention steps |
| ownerName | String | Yes | - | Owner |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Incidents module
- Dashboard
- AI assistant

### Used By APIs
- GET /api/incidents
- POST /api/incidents
- PATCH /api/incidents/:id

---

## ChangeRequest

**Purpose:** IT change management.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| changeNo | String | No | @unique | Display ID |
| title | String | No | - | Change title |
| description | String | Yes | - | Details |
| riskLevel | String | No | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| status | WorkStatus | No | PENDING_APPROVAL | Status |
| changeWindow | DateTime | Yes | - | Scheduled window |
| rollbackPlan | String | Yes | - | Rollback steps |
| ownerName | String | Yes | - | Owner |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Changes module

### Used By APIs
- GET /api/changes
- POST /api/changes
- PATCH /api/changes/:id

---

## Problem

**Purpose:** Problem management for root cause analysis.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| problemNo | String | No | @unique | Display ID |
| title | String | No | - | Problem title |
| description | String | Yes | - | Details |
| status | WorkStatus | No | OPEN | Current status |
| rootCause | String | Yes | - | Root cause |
| ownerName | String | Yes | - | Owner |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Problems module

### Used By APIs
- GET /api/problems
- POST /api/problems
- PATCH /api/problems/:id

---

## Asset

**Purpose:** IT asset inventory.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| assetNo | String | No | @unique | Asset tag |
| assetType | String | No | - | Type (Laptop, Server, etc.) |
| make | String | Yes | - | Manufacturer |
| model | String | Yes | - | Model name |
| serialNo | String | Yes | @unique | Serial number |
| status | AssetStatus | No | AVAILABLE | AVAILABLE/ASSIGNED/etc |
| assignedToName | String | Yes | - | Assigned person |
| location | String | Yes | - | Physical location |
| warrantyEndAt | DateTime | Yes | - | Warranty expiry |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Inventory module
- AI assistant (asset queries)

### Used By APIs
- GET /api/inventory
- POST /api/inventory
- PATCH /api/inventory/:id

---

## AccessRequest

**Purpose:** System access request workflow.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| requestNo | String | No | @unique | Request ID |
| requesterName | String | No | - | Who needs access |
| accessType | String | No | - | Type of access |
| systemName | String | No | - | Target system |
| justification | String | Yes | - | Business justification |
| status | AccessStatus | No | REQUESTED | REQUESTED/APPROVED/etc |
| expiryAt | DateTime | Yes | - | Access expiry |
| approverName | String | Yes | - | Who approved |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Access Management module

### Used By APIs
- GET /api/access-management
- POST /api/access-management
- PATCH /api/access-management/:id

---

## VendorLicense

**Purpose:** Vendor and license tracking.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| vendorName | String | No | - | Vendor name |
| licenseName | String | No | - | License name |
| licenseCount | Int | No | 0 | Total licenses |
| assignedCount | Int | No | 0 | Assigned count |
| cost | Decimal | Yes | - | License cost |
| renewalAt | DateTime | Yes | - | Renewal date |
| ownerName | String | Yes | - | Owner |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Vendors & Licenses module

### Used By APIs
- GET /api/vendors-licenses
- POST /api/vendors-licenses
- PATCH /api/vendors-licenses/:id

---

## ComplianceControl

**Purpose:** Compliance control tracking.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| controlNo | String | No | @unique | Control ID |
| title | String | No | - | Control title |
| controlArea | String | No | - | Area (Access, Security, etc.) |
| ownerName | String | No | - | Owner |
| frequency | String | No | Quarterly | Review frequency |
| dueAt | DateTime | Yes | - | Due date |
| status | WorkStatus | No | OPEN | Current status |
| evidenceUrl | String | Yes | - | Evidence link |
| riskRating | String | No | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Compliance module
- AI assistant (compliance queries)

### Used By APIs
- GET /api/compliance
- POST /api/compliance
- PATCH /api/compliance/:id

---

## KnowledgeBaseArticle

**Purpose:** Knowledge base articles.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| title | String | No | - | Article title |
| category | String | No | - | Category |
| body | String | No | - | Article content |
| status | String | No | DRAFT | DRAFT/PUBLISHED/ARCHIVED |
| authorName | String | Yes | - | Author |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Knowledge Base module

### Used By APIs
- GET /api/knowledge-base
- POST /api/knowledge-base
- PATCH /api/knowledge-base/:id

---

## ProjectEnvironment

**Purpose:** Project and environment mapping.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| projectName | String | No | - | Project name |
| environmentName | String | No | - | Env (Dev, Staging, Prod) |
| serviceName | String | Yes | - | Service name |
| serverName | String | Yes | - | Server hostname |
| databaseName | String | Yes | - | Database name |
| ownerName | String | Yes | - | Owner |
| monitoringUrl | String | Yes | - | Monitor link |
| backupEnabled | Boolean | No | false | Backup status |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Used By Screens
- Projects & Environments module

### Used By APIs
- GET /api/projects-environments
- POST /api/projects-environments
- PATCH /api/projects-environments/:id

---

## NotificationLog

**Purpose:** Email/notification sending history.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| channel | String | No | - | email/teams/sms |
| recipient | String | Yes | - | To address |
| subject | String | Yes | - | Email subject |
| body | String | No | - | Message body |
| status | String | No | - | SENT/FAILED/MOCK_SENT |
| error | String | Yes | - | Error message |
| createdAt | DateTime | No | now() | Timestamp |

### Used By Screens
- (No UI - database query only)

### Used By APIs
- Auto-created by email service

---

## AiConversation

**Purpose:** AI query history.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| userId | String | Yes | - | FK to User |
| question | String | No | - | User question |
| answer | String | No | - | AI response |
| provider | String | No | - | Provider (mock/openai/etc) |
| sourceJson | Json | Yes | - | Raw source data |
| createdAt | DateTime | No | now() | Timestamp |

### Used By Screens
- (No UI - database query only)

### Used By APIs
- POST /api/ai/ask (auto-logged)

---

## SystemSetting

**Purpose:** Key-value system configuration.

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | No | @default(cuid()) | Primary key |
| group | String | No | - | Group (AI, AUTH, etc.) |
| key | String | No | @unique | Setting key |
| value | String | No | - | Setting value |
| isSecret | Boolean | No | false | Hide in UI |
| updatedBy | String | Yes | - | Last editor |
| createdAt | DateTime | No | now() | Creation time |
| updatedAt | DateTime | No | @updatedAt | Last update |

### Seeded Settings
| Group | Key | Default |
|-------|-----|---------|
| AI | AI_PROVIDER | mock |
| AI | OPENAI_MODEL | gpt-4.1-mini |
| AI | CLAUDE_MODEL | claude-3-5-sonnet-latest |
| AUTH | CUSTOM_LOGIN_ENABLED | true |
| AUTH | MICROSOFT_LOGIN_ENABLED | false |
| NOTIFICATION | EMAIL_ENABLED | false |
| NOTIFICATION | TEAMS_ENABLED | false |
| SLA | CRITICAL_RESPONSE_MINUTES | 15 |
| SLA | HIGH_RESPONSE_MINUTES | 30 |
| IMPORT | EXCEL_PREVIEW_REQUIRED | true |

### Used By Screens
- Settings page

### Used By APIs
- GET /api/settings
- PATCH /api/settings

---

# 8. API Inventory

## Health Check

| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/health` |
| **Purpose** | Service health check |
| **Auth Required** | No |
| **Response** | `{ "status": "ok", "service": "saven-infraops-api" }` |

## Authentication

### POST /api/auth/login
| Property | Value |
|----------|-------|
| **Method** | POST |
| **URL** | `/api/auth/login` |
| **Purpose** | Email/password login |
| **Auth Required** | No |

**Request Body:**
```json
{
  "email": "admin@saven.in",
  "password": "Admin@12345"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cmqhvqo2h000k1m9boyu5frc0",
    "name": "Saven Admin",
    "email": "admin@saven.in",
    "roles": ["Super Admin"],
    "permissions": ["dashboard:read", ...]
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account pending/disabled/locked

---

### GET /api/auth/me
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/auth/me` |
| **Purpose** | Get current user info |
| **Auth Required** | Yes (Bearer token) |

**Response (200):**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "roles": [], "permissions": [] }
}
```

---

### GET /api/auth/activate/validate/:token
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/auth/activate/validate/:token` |
| **Purpose** | Validate activation token |
| **Auth Required** | No |

**Response (200):**
```json
{ "valid": true }
```

**Errors:**
- 400: Invalid/expired/used token

---

### POST /api/auth/activate
| Property | Value |
|----------|-------|
| **Method** | POST |
| **URL** | `/api/auth/activate` |
| **Purpose** | Complete account activation |
| **Auth Required** | No |

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account activated successfully. You can now login."
}
```

---

### POST /api/auth/activate/resend
| Property | Value |
|----------|-------|
| **Method** | POST |
| **URL** | `/api/auth/activate/resend` |
| **Purpose** | Resend activation email |
| **Auth Required** | Yes (Admin) |

**Request Body:**
```json
{ "userId": "user-id-here" }
```

---

## Dashboard

### GET /api/dashboard
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/dashboard` |
| **Purpose** | Dashboard statistics |
| **Auth Required** | Yes |
| **Permissions** | dashboard:read |

**Response (200):**
```json
{
  "serviceRequests": { "open": 2, "total": 2 },
  "incidents": { "open": 1, "total": 1 },
  "changes": { "pending": 0, "total": 0 },
  "assets": { "total": 1, "available": 1 }
}
```

---

## Generic Modules

### GET /api/:module
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/:module` |
| **Purpose** | List module records |
| **Auth Required** | Yes |
| **Permissions** | module-specific |

**Modules:** incidents, problems, changes, inventory, access-management, compliance, projects-environments, vendors-licenses, knowledge-base, users-teams

**Response (200):**
```json
{
  "items": [...]
}
```

---

### POST /api/:module
| Property | Value |
|----------|-------|
| **Method** | POST |
| **URL** | `/api/:module` |
| **Purpose** | Create module record |
| **Auth Required** | Yes |
| **Permissions** | module-specific (write) |

**Request Body:** Module-specific fields

**Response (201):**
```json
{
  "item": { "id": "...", ... }
}
```

---

### PATCH /api/:module/:id
| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **URL** | `/api/:module/:id` |
| **Purpose** | Update module record |
| **Auth Required** | Yes |
| **Permissions** | module-specific (write) |

**Request Body:** `{ "status": "CLOSED" }` or specific fields

**Response (200):**
```json
{
  "item": { "id": "...", ... }
}
```

---

## Roles

### GET /api/roles
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/roles` |
| **Purpose** | List all roles |
| **Auth Required** | Yes |
| **Permissions** | users:read |

**Response (200):**
```json
{
  "items": [
    { "id": "role-id", "name": "Super Admin", "description": "..." }
  ]
}
```

---

## Service Requests

### GET /api/service-requests
Same as generic GET with tickets:read permission.

### POST /api/service-requests
Same as generic POST with tickets:write permission.

### PATCH /api/service-requests/:id
Same as generic PATCH.

### PATCH /api/service-requests/:id/assign
| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **URL** | `/api/service-requests/:id/assign` |
| **Purpose** | Assign SR to user |
| **Auth Required** | Yes |
| **Permissions** | tickets:assign |

**Request Body:**
```json
{
  "assigneeId": "user-id",
  "assigneeName": "John Doe"
}
```

---

## Settings

### GET /api/settings
| Property | Value |
|----------|-------|
| **Method** | GET |
| **URL** | `/api/settings` |
| **Purpose** | Get all settings |
| **Auth Required** | Yes |
| **Permissions** | settings:read |

**Response (200):**
```json
{
  "items": [
    { "id": "...", "group": "AI", "key": "AI_PROVIDER", "value": "mock", "isSecret": false }
  ]
}
```

---

### PATCH /api/settings
| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **URL** | `/api/settings` |
| **Purpose** | Update setting |
| **Auth Required** | Yes |
| **Permissions** | settings:write |

**Request Body:**
```json
{
  "key": "AI_PROVIDER",
  "value": "openai"
}
```

---

## AI

### POST /api/ai/ask
| Property | Value |
|----------|-------|
| **Method** | POST |
| **URL** | `/api/ai/ask` |
| **Purpose** | Query AI assistant |
| **Auth Required** | Yes |
| **Permissions** | ai:ask |

**Request Body:**
```json
{
  "question": "How many service requests are open?"
}
```

**Response (200):**
```json
{
  "answer": "There are 2 open service requests...",
  "cards": [
    { "title": "SR-1001", "value": "HIGH", "description": "...", "href": "/service-requests" }
  ],
  "provider": "mock"
}
```

---

# 9. Current Features Working

## Working Features
✅ **Authentication**
- Email/password login
- JWT token management
- Token validation
- Logout

✅ **User Management**
- Create user with email activation
- User list with department/status
- Role assignment on create
- Email activation flow

✅ **Generic CRUD**
- List, Create, Update for all modules
- Permission-based access control
- Audit logging on changes
- CSV export

✅ **Service Requests**
- Dedicated page with filters
- Assignment workflow
- Priority and status tracking

✅ **Dashboard**
- Statistics cards
- Quick AI queries
- Recent activity

✅ **AI Assistant**
- Natural language queries
- Mock provider with real data
- Quick action cards
- Conversation history logging

✅ **Settings**
- System configuration UI
- Dynamic setting updates
- Group-based organization

✅ **Modules (12 generic)**
- Incidents
- Problems
- Changes
- Inventory
- Access Management
- Compliance
- Projects & Environments
- Vendors & Licenses
- Reports & Analytics
- Knowledge Base
- Users & Teams
- Settings

## Partially Implemented Features
⚠️ **Email Notifications**
- Activation emails work (mock mode)
- Real SMTP not configured

⚠️ **Microsoft Login**
- Endpoint exists but returns 501
- Requires Entra app registration

⚠️ **Teams Integration**
- Notification service exists
- No Teams webhook configured

⚠️ **Excel Import**
- Import route exists
- UI for preview not implemented

## Placeholder Features
🔧 **Teams Notifications** - Placeholder
🔧 **Microsoft OAuth** - Returns not implemented message
🔧 **Reports Analytics** - Shows static reports, not generated

## Mock Implementations
🤖 **AI Provider** - Returns pre-configured responses based on keywords
📧 **Email** - Logs to console and database when EMAIL_ENABLED=false
💬 **Teams** - Not implemented

---

# 10. Known Technical Debt

## Missing Functionality
1. **No delete operations** - Users, assets, etc. can't be deleted
2. **No user edit form** - Only status changes via drawer
3. **No role management UI** - Can't create/edit roles
4. **No team entity** - Only department field on users
5. **No password reset** - Admin can't reset passwords
6. **No password change** - Users can't change their own password
7. **No refresh token** - Only access token (8h)
8. **No bulk operations** - Can't batch update records
9. **No audit log UI** - Can't view audit trail

## Hardcoded Values
1. **Department list** - 9 options hardcoded in ModulePage.tsx
2. **Menu items** - Hardcoded in Sidebar.tsx
3. **Permission codes** - Hardcoded in seed.ts
4. **AI presets** - Hardcoded button suggestions
5. **Ticket prefixes** - SR-, INC-, CHG-, etc. in generic.routes.ts

## Incomplete Screens
1. **Reports & Analytics** - Shows static placeholder data
2. **Excel Import** - API exists but no UI
3. **Microsoft Login** - Returns "not implemented" message

## Missing Validations
1. **Email format** - No server-side validation
2. **Password strength** - Only on activation, not on admin reset
3. **Duplicate prevention** - Only email uniqueness checked
4. **SLA breach** - No automatic status update
5. **Date validation** - Due dates can be in past

## Security Concerns
1. **JWT secret** - Should be longer, rotated periodically
2. **No rate limiting on login** - Brute force possible
3. **No password history** - Can reuse old passwords
4. **Sensitive data in logs** - Stack traces may expose info
5. **No CSRF protection** - Relies on CORS only
6. **Admin can set any status** - No approval workflow

## Scalability Concerns
1. **No pagination** - All records loaded (take: 100 limit)
2. **No caching** - Every request hits database
3. **Synchronous imports** - Excel import blocks server
4. **No query optimization** - No indexes beyond unique constraints
5. **Single JWT secret** - Can't rotate without logout all

---

# 11. Future Development Guide

## How to Add a New Module

### 1. Add to Prisma Schema
Add model to `backend/prisma/schema.prisma`:
```prisma
model NewModule {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

### 2. Run Migration
```bash
cd backend
npx prisma migrate dev --name add_new_module
```

### 3. Add to Generic Routes
Edit `backend/src/modules/generic/generic.routes.ts`:
```tsx
'new-module': {
  permission: 'newmodule:read',
  writePermission: 'newmodule:write',
  entityType: 'NewModule',
  list: () => prisma.newModule.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  create: (payload) => prisma.newModule.create({ data: payload }),
  update: (id, payload) => prisma.newModule.update({ where: { id }, data: payload })
}
```

### 4. Add to Frontend Config
Edit `frontend/src/pages/ModulePage.tsx`:
```tsx
'new-module': {
  referenceKey: 'id',
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Name', required: true }
  ],
  columns: [
    { key: 'name', label: 'Name' }
  ]
}
```

### 5. Add Menu Item
Edit `frontend/src/layout/Sidebar.tsx`:
```tsx
{ label: 'New Module', path: '/new-module', icon: 'NM' },
```

### 6. Add Route
Edit `frontend/src/app/App.tsx`:
```tsx
<Route path="new-module" element={<ModulePage moduleKey="new-module" title="New Module" />} />
```

---

## How to Add a New Menu Item

### Edit Sidebar
`frontend/src/layout/Sidebar.tsx`:
```tsx
const menuItems = [
  // ... existing items
  { label: 'New Item', path: '/new-path', icon: 'XX' },
];
```

---

## How to Add a New Database Table

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_table`
3. Add CRUD in `generic.routes.ts` or create dedicated routes
4. Update frontend config

---

## How to Add a New API Endpoint

### Create in New Route File
`backend/src/modules/newfeature/newfeature.routes.ts`:
```tsx
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export const newfeatureRouter = Router();

newfeatureRouter.get('/items', requireAuth, requirePermission('feature:read'), async (req, res) => {
  // Implementation
});
```

### Register in App
`backend/src/app.ts`:
```tsx
import { newfeatureRouter } from './modules/newfeature/newfeature.routes.js';

app.use('/api/newfeature', newfeatureRouter);
```

---

## How to Add a New Permission

### 1. Add to Seed
`backend/prisma/seed.ts`:
```tsx
permissions.push('newmodule:action');
```

### 2. Re-seed Database
```bash
cd backend
npm run db:seed
```

### 3. Use in Routes
```tsx
requirePermission('newmodule:action')
```

---

## How to Add a New Generic Management Screen

Already documented above in "How to Add a New Module".

---

# 12. Change Impact Analysis

## Login Module

**Files Impacted:**
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/middleware/auth.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/auth/AuthContext.tsx`

**Changes Affecting Login:**
1. **Adding new login method** (OAuth, SSO):
   - Add route in auth.routes.ts
   - Add button in LoginPage.tsx
   - Handle new token format in AuthContext.tsx

2. **Changing JWT structure**:
   - Update AuthUser type in auth.ts
   - Update auth.service.ts token generation
   - Update AuthContext user parsing

3. **Adding MFA**:
   - Modify login flow in auth.routes.ts
   - Add MFA verification endpoint
   - Add MFA input UI in LoginPage.tsx

4. **Changing password requirements**:
   - Update seed.ts password validation
   - Update activation.service.ts password validation
   - May need password change endpoint

---

## Users Module

**Files Impacted:**
- `backend/src/modules/generic/generic.routes.ts` (users-teams section)
- `frontend/src/pages/ModulePage.tsx` (users-teams config)
- `backend/prisma/schema.prisma` (User model)

**Changes Affecting Users:**
1. **Adding user fields**:
   - Add column in schema.prisma
   - Add field in generic.routes.ts create/update
   - Add field in ModulePage.tsx config

2. **Adding new departments**:
   - Update ModulePage.tsx options array
   - No backend changes needed

3. **Changing user creation flow**:
   - Modify generic.routes.ts users-teams.create function
   - May affect frontend form

4. **Adding user deletion**:
   - Add DELETE endpoint in generic.routes.ts
   - Add delete button in ModulePage.tsx
   - Consider soft delete vs hard delete

---

## Teams Module

**Files Impacted:**
- `backend/prisma/schema.prisma` (no Team model exists)
- No dedicated teams UI

**Current State:**
- Teams are not implemented as a separate entity
- Only `department` field exists on User

**Changes to Add Teams:**
1. Add Team model to schema.prisma
2. Create migration
3. Add to generic.routes.ts
4. Add route in App.tsx
5. Add menu item in Sidebar.tsx
6. Add config in ModulePage.tsx

---

## Roles Module

**Files Impacted:**
- `backend/prisma/schema.prisma` (Role model)
- `backend/prisma/seed.ts` (role/permission seeding)
- `backend/src/modules/generic/generic.routes.ts` (GET /roles)

**Changes Affecting Roles:**
1. **Creating new role**:
   - Add upsert in seed.ts
   - Or create admin endpoint

2. **Assigning permissions**:
   - Modify RolePermission creation
   - Seed must be updated

3. **Role management UI**:
   - Not currently implemented
   - Would need new page and routes

---

## Permissions Module

**Files Impacted:**
- `backend/prisma/schema.prisma` (Permission model)
- `backend/prisma/seed.ts` (permission seeding)
- `backend/src/middleware/rbac.ts`

**Changes Affecting Permissions:**
1. **Adding new permission**:
   - Add to seed.ts permissions array
   - Re-run seed
   - Update Super Admin role permissions

2. **Using permission in routes**:
   - Add `requirePermission('module:action')` middleware
   - Permission must exist in database

3. **Permission groups**:
   - Not implemented
   - Would need UI/management layer

---

## Generic Management Framework

**Files Impacted:**
- `backend/src/modules/generic/generic.routes.ts`
- `frontend/src/pages/ModulePage.tsx`

**Framework Architecture:**
```
generic.routes.ts:
  moduleMap[moduleKey] = {
    permission, writePermission,
    entityType, list(), create(), update()
  }
```

**Changes to Framework:**
1. **Adding new action** (delete, bulk update):
   - Add handler in generic.routes.ts
   - Add UI button in ModulePage.tsx

2. **Adding field types** (date picker, file upload):
   - Update ModulePage.tsx render logic
   - May need new API endpoint

3. **Adding validation**:
   - Add Zod schema in generic.routes.ts create/update
   - Add frontend validation in ModulePage.tsx

4. **Adding relationships**:
   - Modify Prisma query in list/create/update
   - Update frontend config for dropdown

---

**End of Technical Documentation**
