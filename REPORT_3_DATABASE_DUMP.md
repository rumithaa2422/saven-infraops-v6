# Report 3: Exact Database Dump Documentation

**Generated:** 2026-06-18  
**Source:** `backend/prisma/schema.prisma`  
**Database:** MySQL 8  
**ORM:** Prisma 5.22.0

---

# Table of Contents

1. [User Table - Detailed](#user-table--detailed)
2. [UserActivationToken Table - Detailed](#useractivationtoken-table--detailed)
3. [Role Table - Detailed](#role-table--detailed)
4. [Permission Table - Detailed](#permission-table--detailed)
5. [UserRole Table - Detailed](#userrole-table--detailed)
6. [RolePermission Table - Detailed](#rolepermission-table--detailed)
7. [All Other Tables](#all-other-tables)
8. [Complete SQL CREATE Statements](#complete-sql-create-statements)

---

# User Table - Detailed

## Answer to Key Question: What columns does User have?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Table                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  id               │ VARCHAR(191) │ PK      │ @default(cuid())              │
│  name             │ VARCHAR(191) │ NOT NULL│ -                              │
│  email            │ VARCHAR(191) │ NOT NULL│ @unique                        │
│  phoneNumber      │ VARCHAR(191) │ NULL    │ -                              │
│  passwordHash     │ VARCHAR(191) │ NULL    │ -                              │
│  department       │ VARCHAR(191) │ NULL    │ -                              │
│  status           │ ENUM         │ NOT NULL│ @default(PENDING_ACTIVATION)  │
│  createdAt        │ DATETIME(3) │ NOT NULL│ @default(now())                │
│  updatedAt        │ DATETIME(3) │ NOT NULL│ @updatedAt                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Full Prisma Definition

```prisma
model User {
  id               String               @id @default(cuid())
  name             String
  email            String               @unique
  phoneNumber      String?
  passwordHash     String?
  department       String?
  status           UserStatus           @default(PENDING_ACTIVATION)
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  roles            UserRole[]
  activationToken  UserActivationToken?
  requestedTickets ServiceRequest[]     @relation("RequesterTickets")
  assignedTickets  ServiceRequest[]     @relation("AssigneeTickets")
}
```

## SQL Equivalent

```sql
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NULL,
  `passwordHash` VARCHAR(191) NULL,
  `department` VARCHAR(191) NULL,
  `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOCKED') NOT NULL DEFAULT 'PENDING_ACTIVATION',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
);
```

## Column-by-Column Explanation

### id (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Default** | @default(cuid()) |
| **Purpose** | Primary key - unique identifier |
| **Why** | CUID provides distributed-safe unique IDs |
| **Used In** | Foreign keys in UserRole, ServiceRequest, UserActivationToken, AuditLog, AiConversation |
| **Can Change?** | NO - immutable primary key |

### name (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Default** | None |
| **Purpose** | User's full display name |
| **Why** | Required for display in UI and notifications |
| **Used In** | Dashboard, ServiceRequest.requesterName, ServiceRequest.assigneeName |
| **Can Change?** | YES - via PATCH /api/users-teams/:id |

### email (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Default** | None |
| **Unique** | YES |
| **Purpose** | Login identifier |
| **Why** | Email serves as unique login ID |
| **Used In** | Login, activation emails, JWT, audit logs |
| **Can Change?** | NO - immutable after creation |
| **Validation** | Server checks for duplicates on create |

### phoneNumber (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | YES |
| **Default** | NULL |
| **Purpose** | Contact phone number |
| **Why** | Optional contact method |
| **Used In** | User profile display |
| **Can Change?** | YES - via PATCH /api/users-teams/:id |

### passwordHash (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | YES |
| **Default** | NULL |
| **Purpose** | bcrypt hash of password |
| **Why** | Stores hashed password, never plain text |
| **Used In** | auth.service.ts:loginWithPassword() |
| **Can Change?** | YES - via activation flow (new users) or future reset endpoint |
| **Important** | NULL for PENDING_ACTIVATION users |

### department (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | YES |
| **Default** | NULL |
| **Purpose** | User's department |
| **Why** | Groups users by department for filtering |
| **Used In** | Frontend dropdown: ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'] |
| **Can Change?** | YES - via PATCH /api/users-teams/:id |
| **Important** | NOT a foreign key - just a string |

### status (ENUM)
| Property | Value |
|----------|-------|
| **Type** | ENUM('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOCKED') |
| **Nullable** | NO |
| **Default** | PENDING_ACTIVATION |
| **Purpose** | Account state |
| **Why** | Controls login eligibility |
| **Used In** | Login flow, user list display |
| **Can Change?** | YES - via PATCH /api/users-teams/:id |

#### Status Values Explained

| Status | Meaning | Login Allowed | Created By |
|--------|---------|----------------|-------------|
| PENDING_ACTIVATION | New user, no password | NO | POST /api/users-teams |
| ACTIVE | Can use the system | YES | Activation flow |
| DISABLED | Admin disabled | NO | PATCH /api/users-teams/:id |
| LOCKED | Failed attempts (future) | NO | Future implementation |

### createdAt (DATETIME)
| Property | Value |
|----------|-------|
| **Type** | DATETIME(3) |
| **Nullable** | NO |
| **Default** | now() |
| **Purpose** | Account creation timestamp |
| **Why** | Audit and display |
| **Used In** | User list, audit logs |
| **Can Change?** | NO - auto-generated |

### updatedAt (DATETIME)
| Property | Value |
|----------|-------|
| **Type** | DATETIME(3) |
| **Nullable** | NO |
| **Default** | @updatedAt |
| **Purpose** | Last modification timestamp |
| **Why** | Auto-updates on any change |
| **Used In** | Audit purposes |
| **Can Change?** | NO - auto-generated |

## Relationships

```
User 1───∞ UserRole (userId)
User 1───0,1 UserActivationToken (userId)
User 1───∞ ServiceRequest (requesterId)
User 1───∞ ServiceRequest (assigneeId)
```

## API Usage

| Endpoint | Operation | Fields Used |
|----------|-----------|-------------|
| POST /api/auth/login | SELECT | email, passwordHash, status |
| POST /api/users-teams | INSERT | name, email, phoneNumber, department, status |
| GET /api/users-teams | SELECT | id, name, email, department, createdAt, updatedAt |
| PATCH /api/users-teams/:id | UPDATE | name, department, status, phoneNumber |

---

# UserActivationToken Table - Detailed

## Prisma Definition

```prisma
model UserActivationToken {
  id        String   @id @default(cuid())
  userId    String   @unique
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

## SQL Equivalent

```sql
CREATE TABLE `UserActivationToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserActivationToken_userId_key` (`userId`),
  UNIQUE INDEX `UserActivationToken_token_key` (`token`),
  CONSTRAINT `UserActivationToken_userId_fkey` FOREIGN KEY (`userId`) 
    REFERENCES `User`(`id`) ON DELETE CASCADE
);
```

## Column-by-Column Explanation

### id (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Purpose** | Primary key |
| **Default** | cuid() |

### userId (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) FK |
| **Nullable** | NO |
| **Unique** | YES (1:1 relationship) |
| **Purpose** | Links to User |
| **Foreign Key** | User(id) ON DELETE CASCADE |
| **Why** | One token per user |

### token (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Unique** | YES |
| **Purpose** | Secure random token for activation URL |
| **Generated By** | crypto.randomBytes(32).toString('hex') - 64 hex chars |
| **In URL** | ?token=a1b2c3d4...xyz |

### expiresAt (DATETIME)
| Property | Value |
|----------|-------|
| **Type** | DATETIME |
| **Nullable** | NO |
| **Purpose** | Token expiration |
| **Default** | now() + 24 hours |
| **Validation** | Must be > current time |

### used (BOOLEAN)
| Property | Value |
|----------|-------|
| **Type** | BOOLEAN |
| **Nullable** | NO |
| **Default** | false |
| **Purpose** | Prevents token reuse |
| **Set True** | After successful activation |

### createdAt (DATETIME)
| Property | Value |
|----------|-------|
| **Purpose** | When token was created |

## Relationships

```
User 1───0,1 UserActivationToken (userId)
```

## API Usage

| Endpoint | Operation | Purpose |
|----------|-----------|---------|
| GET /api/auth/activate/validate/:token | SELECT | Check if token valid |
| POST /api/auth/activate | UPDATE | Mark token as used |
| POST /api/auth/activate/resend | DELETE + INSERT | Replace old token |

---

# Role Table - Detailed

## Prisma Definition

```prisma
model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  users       UserRole[]
  permissions RolePermission[]
}
```

## SQL Equivalent

```sql
CREATE TABLE `Role` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Role_name_key` (`name`)
);
```

## Column Explanation

### id (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Purpose** | Primary key |
| **Default** | cuid() |

### name (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Unique** | YES |
| **Purpose** | Role display name |
| **Seeded Values** | "Super Admin" |

### description (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | YES |
| **Purpose** | Role description |
| **Seeded Values** | "Full system access" |

## Relationships

```
Role 1───∞ UserRole (roleId)
Role 1───∞ RolePermission (roleId)
```

## API Usage

| Endpoint | Operation | Purpose |
|----------|-----------|---------|
| GET /api/roles | SELECT | List all roles (for dropdown) |

---

# Permission Table - Detailed

## Prisma Definition

```prisma
model Permission {
  id          String           @id @default(cuid())
  code        String           @unique
  description String?
  roles       RolePermission[]
}
```

## SQL Equivalent

```sql
CREATE TABLE `Permission` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Permission_code_key` (`code`)
);
```

## Column Explanation

### id (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Purpose** | Primary key |
| **Default** | cuid() |

### code (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | NO |
| **Unique** | YES |
| **Purpose** | Permission identifier for code checks |
| **Format** | "module:action" (e.g., "users:read") |

### description (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) |
| **Nullable** | YES |
| **Purpose** | Human-readable description |

## Seeded Permissions (19 total)

| Code | Description |
|------|-------------|
| dashboard:read | View dashboard |
| tickets:read | View tickets |
| tickets:write | Create/update tickets |
| tickets:assign | Assign tickets |
| incidents:read | View incidents |
| incidents:write | Create/update incidents |
| changes:read | View changes |
| changes:approve | Approve changes |
| inventory:read | View inventory |
| inventory:write | Create/update inventory |
| access:read | View access |
| access:approve | Approve access |
| compliance:read | View compliance |
| compliance:write | Update compliance |
| settings:read | View settings |
| settings:write | Update settings |
| users:read | View users |
| users:write | Create/update users |
| ai:ask | Use AI |

## Relationships

```
Permission 1───∞ RolePermission (permissionId)
```

---

# UserRole Table - Detailed

## Prisma Definition

```prisma
model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}
```

## SQL Equivalent

```sql
CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`userId`, `roleId`),
  CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) 
    REFERENCES `User`(`id`) ON DELETE CASCADE,
  CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) 
    REFERENCES `Role`(`id`) ON DELETE CASCADE
);
```

## Column Explanation

### userId (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) FK |
| **Nullable** | NO |
| **Part Of** | @@id([userId, roleId]) |
| **Foreign Key** | User(id) ON DELETE CASCADE |
| **Purpose** | Links to User |

### roleId (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) FK |
| **Nullable** | NO |
| **Part Of** | @@id([userId, roleId]) |
| **Foreign Key** | Role(id) ON DELETE CASCADE |
| **Purpose** | Links to Role |

## Composite Primary Key
The `@@id([userId, roleId])` means:
- A user can have the same role only once
- Multiple roles per user require multiple rows

## Relationships

```
User 1───∞ UserRole (userId)
Role 1───∞ UserRole (roleId)
```

## Usage in Code

```tsx
// Assign role on user creation
await prisma.userRole.create({
  data: { userId: user.id, roleId: role.id }
});
```

---

# RolePermission Table - Detailed

## Prisma Definition

```prisma
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}
```

## SQL Equivalent

```sql
CREATE TABLE `RolePermission` (
  `roleId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`roleId`, `permissionId`),
  CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) 
    REFERENCES `Role`(`id`) ON DELETE CASCADE,
  CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) 
    REFERENCES `Permission`(`id`) ON DELETE CASCADE
);
```

## Column Explanation

### roleId (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) FK |
| **Part Of** | @@id([roleId, permissionId]) |
| **Foreign Key** | Role(id) ON DELETE CASCADE |
| **Purpose** | Links to Role |

### permissionId (VARCHAR(191))
| Property | Value |
|----------|-------|
| **Type** | VARCHAR(191) FK |
| **Part Of** | @@id([roleId, permissionId]) |
| **Foreign Key** | Permission(id) ON DELETE CASCADE |
| **Purpose** | Links to Permission |

## Relationships

```
Role 1───∞ RolePermission (roleId)
Permission 1───∞ RolePermission (permissionId)
```

---

# All Other Tables

## ServiceRequest

```prisma
model ServiceRequest {
  id            String         @id @default(cuid())
  ticketNo      String         @unique
  title         String
  description   String?        @db.Text
  category      String
  subCategory   String?
  priority      TicketPriority @default(MEDIUM)
  status        WorkStatus     @default(OPEN)
  requesterId   String?
  assigneeId    String?
  requesterName String
  assigneeName  String?
  projectName   String?
  dueAt         DateTime?
  resolvedAt    DateTime?
  closedAt      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  requester     User?          @relation("RequesterTickets", fields: [requesterId], references: [id])
  assignee      User?          @relation("AssigneeTickets", fields: [assigneeId], references: [id])
}
```

**Key Columns:**
- `requesterId` FK → User(id) - Who created the ticket
- `assigneeId` FK → User(id) - Who is working on it

## Incident

```prisma
model Incident {
  id               String           @id @default(cuid())
  incidentNo       String           @unique
  title            String
  description      String?          @db.Text
  severity         IncidentSeverity @default(SEV3)
  status           WorkStatus       @default(OPEN)
  impactedService  String?
  impactedProject  String?
  startedAt        DateTime?
  resolvedAt       DateTime?
  rca              String?          @db.Text
  correctiveAction String?          @db.Text
  preventiveAction String?         @db.Text
  ownerName        String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

## Problem

```prisma
model Problem {
  id          String     @id @default(cuid())
  problemNo   String     @unique
  title       String
  description String?    @db.Text
  status      WorkStatus @default(OPEN)
  rootCause   String?    @db.Text
  ownerName   String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

## ChangeRequest

```prisma
model ChangeRequest {
  id           String     @id @default(cuid())
  changeNo     String     @unique
  title        String
  description  String?    @db.Text
  riskLevel    String     @default("MEDIUM")
  status       WorkStatus @default(PENDING_APPROVAL)
  changeWindow DateTime?
  rollbackPlan String?    @db.Text
  ownerName    String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

## Asset

```prisma
model Asset {
  id             String      @id @default(cuid())
  assetNo        String      @unique
  assetType      String
  make           String?
  model          String?
  serialNo       String?     @unique
  status         AssetStatus @default(AVAILABLE)
  assignedToName String?
  location       String?
  warrantyEndAt  DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}
```

## AccessRequest

```prisma
model AccessRequest {
  id            String       @id @default(cuid())
  requestNo     String       @unique
  requesterName String
  accessType    String
  systemName    String
  justification String?      @db.Text
  status        AccessStatus @default(REQUESTED)
  expiryAt      DateTime?
  approverName  String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

## ComplianceControl

```prisma
model ComplianceControl {
  id          String     @id @default(cuid())
  controlNo   String     @unique
  title       String
  controlArea String
  ownerName   String
  frequency   String
  dueAt       DateTime?
  status      WorkStatus @default(OPEN)
  evidenceUrl String?
  riskRating  String     @default("MEDIUM")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

## ProjectEnvironment

```prisma
model ProjectEnvironment {
  id              String   @id @default(cuid())
  projectName     String
  environmentName String
  serviceName     String?
  serverName      String?
  databaseName    String?
  ownerName       String?
  monitoringUrl   String?
  backupEnabled   Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## VendorLicense

```prisma
model VendorLicense {
  id            String    @id @default(cuid())
  vendorName    String
  licenseName   String
  licenseCount  Int       @default(0)
  assignedCount Int       @default(0)
  cost          Decimal?  @db.Decimal(12, 2)
  renewalAt     DateTime?
  ownerName     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## KnowledgeBaseArticle

```prisma
model KnowledgeBaseArticle {
  id         String   @id @default(cuid())
  title      String
  category   String
  body       String   @db.Text
  status     String   @default("DRAFT")
  authorName String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## SystemSetting

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  group     String
  key       String   @unique
  value     String   @db.Text
  isSecret  Boolean  @default(false)
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## AuditLog

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actorEmail String?
  action     String
  entityType String
  entityId   String?
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}
```

## AiConversation

```prisma
model AiConversation {
  id         String   @id @default(cuid())
  userId     String?
  question   String   @db.Text
  answer     String   @db.Text
  provider   String
  sourceJson Json?
  createdAt  DateTime @default(now())
}
```

## NotificationLog

```prisma
model NotificationLog {
  id        String   @id @default(cuid())
  channel   String
  recipient String?
  subject   String?
  body      String   @db.Text
  status    String
  error     String?  @db.Text
  createdAt DateTime @default(now())
}
```

---

# Complete SQL CREATE Statements

```sql
-- =============================================
-- USER TABLE
-- =============================================
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NULL,
  `passwordHash` VARCHAR(191) NULL,
  `department` VARCHAR(191) NULL,
  `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOCKED') NOT NULL DEFAULT 'PENDING_ACTIVATION',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
);

-- =============================================
-- USERACTIVATIONTOKEN TABLE
-- =============================================
CREATE TABLE `UserActivationToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserActivationToken_userId_key` (`userId`),
  UNIQUE INDEX `UserActivationToken_token_key` (`token`),
  CONSTRAINT `UserActivationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);

-- =============================================
-- ROLE TABLE
-- =============================================
CREATE TABLE `Role` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Role_name_key` (`name`)
);

-- =============================================
-- PERMISSION TABLE
-- =============================================
CREATE TABLE `Permission` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Permission_code_key` (`code`)
);

-- =============================================
-- USERROLE TABLE
-- =============================================
CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`userId`, `roleId`),
  CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE
);

-- =============================================
-- ROLEPERMISSION TABLE
-- =============================================
CREATE TABLE `RolePermission` (
  `roleId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`roleId`, `permissionId`),
  CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE,
  CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE
);

-- =============================================
-- SERVICEREQUEST TABLE
-- =============================================
CREATE TABLE `ServiceRequest` (
  `id` VARCHAR(191) NOT NULL,
  `ticketNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(191) NOT NULL,
  `subCategory` VARCHAR(191) NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `requesterId` VARCHAR(191) NULL,
  `assigneeId` VARCHAR(191) NULL,
  `requesterName` VARCHAR(191) NOT NULL,
  `assigneeName` VARCHAR(191) NULL,
  `projectName` VARCHAR(191) NULL,
  `dueAt` DATETIME(3) NULL,
  `resolvedAt` DATETIME(3) NULL,
  `closedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ServiceRequest_ticketNo_key` (`ticketNo`),
  CONSTRAINT `ServiceRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE SET NULL,
  CONSTRAINT `ServiceRequest_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);

-- =============================================
-- INCIDENT TABLE
-- =============================================
CREATE TABLE `Incident` (
  `id` VARCHAR(191) NOT NULL,
  `incidentNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `severity` ENUM('SEV1', 'SEV2', 'SEV3', 'SEV4') NOT NULL DEFAULT 'SEV3',
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `impactedService` VARCHAR(191) NULL,
  `impactedProject` VARCHAR(191) NULL,
  `startedAt` DATETIME(3) NULL,
  `resolvedAt` DATETIME(3) NULL,
  `rca` TEXT NULL,
  `correctiveAction` TEXT NULL,
  `preventiveAction` TEXT NULL,
  `ownerName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Incident_incidentNo_key` (`incidentNo`)
);

-- =============================================
-- (Remaining tables follow similar patterns)
-- =============================================
```

---

# Answers to Your Specific Questions

## Q: Is there actually a Team table?

**NO.** There is no `Team` table in the database. The "Teams" in "Users & Teams" is implemented as:

1. **Roles** (via `UserRole` junction) - Users can be assigned to roles
2. **Departments** (string field) - Users have a `department` string field

## Q: What exactly is /api/users-teams doing?

It's a **User management endpoint** that uses the generic CRUD framework:

- `GET /api/users-teams` - Lists all users (id, name, email, department, createdAt, updatedAt)
- `POST /api/users-teams` - Creates user with PENDING_ACTIVATION status, sends activation email
- `PATCH /api/users-teams/:id` - Updates user (name, department, status, phoneNumber)

## Q: How generic.routes.ts is implemented?

See Report 1 for complete details. Summary:

```tsx
const moduleMap = {
  'users-teams': {
    permission: 'users:read',
    writePermission: 'users:write',
    entityType: 'User',
    list: () => prisma.user.findMany({ select: { ... } }),
    create: async (payload) => { /* validation, create user, assign role, send email */ },
    update: (id, payload) => prisma.user.update({ where: { id }, data: payload })
  }
};
```

## Q: Current User model columns?

```
User {
  id               - Primary key (cuid)
  name             - Display name (required)
  email            - Login ID (unique, required)
  phoneNumber      - Optional phone
  passwordHash     - bcrypt hash (NULL for pending users)
  department       - String (not FK): "Engineering", "QA", etc.
  status           - ENUM: PENDING_ACTIVATION, ACTIVE, DISABLED, LOCKED
  createdAt        - Auto timestamp
  updatedAt        - Auto timestamp
}
```

---

**End of Report 3: Database Dump Documentation**
