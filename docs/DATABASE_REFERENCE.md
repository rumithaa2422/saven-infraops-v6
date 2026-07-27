# Saven InfraOps Enterprise V6 - Database Reference

**Generated from:** `backend/prisma/schema.prisma`  
**Database:** MySQL 8  
**ORM:** Prisma 5.22.0

---

# Table of Contents

1. [Enumerations](#enumerations)
2. [Complete Table Reference](#complete-table-reference)
3. [ER Diagram (Text)](#er-diagram-text-format)
4. [User/Roles/Permissions Relationship](#uservrolesvpermissions-relationship-diagram)
5. [Authentication Tables Diagram](#authentication-related-tables-diagram)
6. [Service Request Tables Diagram](#service-request-related-tables-diagram)

---

# Enumerations

## TicketPriority
| Value | Description |
|-------|-------------|
| LOW | Low priority ticket |
| MEDIUM | Medium priority ticket |
| HIGH | High priority ticket |
| CRITICAL | Critical priority ticket |

## WorkStatus
| Value | Description |
|-------|-------------|
| OPEN | Newly opened ticket |
| ASSIGNED | Assigned to a user |
| IN_PROGRESS | Work in progress |
| WAITING_FOR_USER | Waiting for user response |
| WAITING_FOR_VENDOR | Waiting for vendor |
| PENDING_APPROVAL | Awaiting approval |
| RESOLVED | Resolved |
| CLOSED | Closed |
| REOPENED | Reopened |

## IncidentSeverity
| Value | Description |
|-------|-------------|
| SEV1 | Critical - Business down |
| SEV2 | High - Major impact |
| SEV3 | Medium - Minor impact |
| SEV4 | Low - Minimal impact |

## AssetStatus
| Value | Description |
|-------|-------------|
| AVAILABLE | Asset is available |
| ASSIGNED | Assigned to someone |
| UNDER_REPAIR | Being repaired |
| DAMAGED | Damaged |
| LOST | Lost |
| RETIRED | Retired |
| DISPOSED | Disposed |

## UserStatus
| Value | Description |
|-------|-------------|
| PENDING_ACTIVATION | New user, awaiting email activation |
| ACTIVE | Active user |
| DISABLED | Disabled by admin |
| LOCKED | Locked due to failed attempts |

## AccessStatus
| Value | Description |
|-------|-------------|
| REQUESTED | Access requested |
| APPROVED | Approved |
| REJECTED | Rejected |
| PROVISIONED | Access provisioned |
| REVOKED | Access revoked |
| EXPIRED | Access expired |

---

# Complete Table Reference

---

## User

**Purpose:** Core user account entity for authentication, authorization, and identification.

### Table Definition
```sql
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191),
  `passwordHash` VARCHAR(191),
  `department` VARCHAR(191),
  `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOCKED') NOT NULL DEFAULT 'PENDING_ACTIVATION',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key using CUID |
| `name` | VARCHAR(191) | NO | - | User's full display name |
| `email` | VARCHAR(191) | NO | - | Unique email address (login ID) |
| `phoneNumber` | VARCHAR(191) | YES | - | Contact phone number |
| `passwordHash` | VARCHAR(191) | YES | - | bcrypt hash (NULL for PENDING_ACTIVATION) |
| `department` | VARCHAR(191) | YES | - | Department name |
| `status` | ENUM | NO | PENDING_ACTIVATION | Account state |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update timestamp |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `email` | `User_email_key` |

### Relationships
```
User 1───∞ UserRole (userId)     → Users can have many roles
User 1───0,1 UserActivationToken  → User has optional activation token
User 1───∞ ServiceRequest (requesterId) → User created many SRs
User 1───∞ ServiceRequest (assigneeId)  → User assigned many SRs
```

### API Usage
- `POST /api/auth/login` - Verify credentials
- `POST /api/users-teams` - Create new user
- `GET /api/users-teams` - List users
- `PATCH /api/users-teams/:id` - Update user

---

## UserActivationToken

**Purpose:** Stores secure tokens for email-based account activation flow.

### Table Definition
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
  FOREIGN KEY `UserActivationToken_userId_fkey` (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `userId` | VARCHAR(191) | NO | - | FK to User (1:1) |
| `token` | VARCHAR(191) | NO | - | 64-char hex secure token |
| `expiresAt` | DATETIME(3) | NO | - | Token expiration (24h) |
| `used` | BOOLEAN | NO | false | Token consumed flag |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `userId` | `UserActivationToken_userId_key` |
| UNIQUE | `token` | `UserActivationToken_token_key` |

### Foreign Keys
| Column | References | On Delete |
|--------|------------|-----------|
| `userId` | User(id) | CASCADE |

### Relationships
```
User 1───0,1 UserActivationToken (userId)
```

### API Usage
- `GET /api/auth/activate/validate/:token` - Validate token
- `POST /api/auth/activate` - Activate with password

---

## Role

**Purpose:** Defines named groupings of permissions for role-based access control.

### Table Definition
```sql
CREATE TABLE `Role` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Role_name_key` (`name`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `name` | VARCHAR(191) | NO | - | Unique role name |
| `description` | VARCHAR(191) | YES | - | Role description |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `name` | `Role_name_key` |

### Relationships
```
Role 1───∞ UserRole (roleId)      → Role assigned to many users
Role 1───∞ RolePermission (roleId) → Role has many permissions
```

### API Usage
- `GET /api/roles` - List all roles

### Seeded Data
| Name | Description |
|------|-------------|
| Super Admin | Full system access |

---

## Permission

**Purpose:** Individual permission codes for granular RBAC.

### Table Definition
```sql
CREATE TABLE `Permission` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Permission_code_key` (`code`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `code` | VARCHAR(191) | NO | - | Unique permission code |
| `description` | VARCHAR(191) | YES | - | Permission description |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `code` | `Permission_code_key` |

### Relationships
```
Permission 1───∞ RolePermission (permissionId) → Permission in many roles
```

### Seeded Permissions
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
| access:read | View access requests |
| access:approve | Approve access |
| compliance:read | View compliance |
| compliance:write | Update compliance |
| settings:read | View settings |
| settings:write | Modify settings |
| users:read | View users |
| users:write | Create/update users |
| ai:ask | Use AI assistant |

---

## UserRole

**Purpose:** Junction table for User-to-Role many-to-many relationship.

### Table Definition
```sql
CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`userId`, `roleId`),
  FOREIGN KEY `UserRole_userId_fkey` (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `UserRole_roleId_fkey` (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `userId` | VARCHAR(191) | NO | - | FK to User |
| `roleId` | VARCHAR(191) | NO | - | FK to Role |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `userId`, `roleId` | - |

### Foreign Keys
| Column | References | On Delete |
|--------|------------|-----------|
| `userId` | User(id) | CASCADE |
| `roleId` | Role(id) | CASCADE |

---

## RolePermission

**Purpose:** Junction table for Role-to-Permission many-to-many relationship.

### Table Definition
```sql
CREATE TABLE `RolePermission` (
  `roleId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`roleId`, `permissionId`),
  FOREIGN KEY `RolePermission_roleId_fkey` (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `RolePermission_permissionId_fkey` (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `roleId` | VARCHAR(191) | NO | - | FK to Role |
| `permissionId` | VARCHAR(191) | NO | - | FK to Permission |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `roleId`, `permissionId` | - |

### Foreign Keys
| Column | References | On Delete |
|--------|------------|-----------|
| `roleId` | Role(id) | CASCADE |
| `permissionId` | Permission(id) | CASCADE |

---

## ServiceRequest

**Purpose:** IT service request tickets from users.

### Table Definition
```sql
CREATE TABLE `ServiceRequest` (
  `id` VARCHAR(191) NOT NULL,
  `ticketNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(191) NOT NULL,
  `subCategory` VARCHAR(191),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `requesterId` VARCHAR(191),
  `assigneeId` VARCHAR(191),
  `requesterName` VARCHAR(191) NOT NULL,
  `assigneeName` VARCHAR(191),
  `projectName` VARCHAR(191),
  `dueAt` DATETIME(3),
  `resolvedAt` DATETIME(3),
  `closedAt` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ServiceRequest_ticketNo_key` (`ticketNo`),
  FOREIGN KEY `ServiceRequest_requesterId_fkey` (`requesterId`) REFERENCES `User`(`id`) ON DELETE SET NULL,
  FOREIGN KEY `ServiceRequest_assigneeId_fkey` (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `ticketNo` | VARCHAR(191) | NO | - | Display ID (SR-XXXX) |
| `title` | VARCHAR(191) | NO | - | Ticket title |
| `description` | TEXT | YES | - | Full description |
| `category` | VARCHAR(191) | NO | - | Category (Network, Asset, etc.) |
| `subCategory` | VARCHAR(191) | YES | - | Sub-category |
| `priority` | ENUM | NO | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| `status` | ENUM | NO | OPEN | Current status |
| `requesterId` | VARCHAR(191) | YES | - | FK to User (creator) |
| `assigneeId` | VARCHAR(191) | YES | - | FK to User (assigned) |
| `requesterName` | VARCHAR(191) | NO | - | Creator name (denormalized) |
| `assigneeName` | VARCHAR(191) | YES | - | Assignee name |
| `projectName` | VARCHAR(191) | YES | - | Associated project |
| `dueAt` | DATETIME(3) | YES | - | SLA deadline |
| `resolvedAt` | DATETIME(3) | YES | - | Resolution timestamp |
| `closedAt` | DATETIME(3) | YES | - | Closure timestamp |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `ticketNo` | `ServiceRequest_ticketNo_key` |

### Foreign Keys
| Column | References | On Delete |
|--------|------------|-----------|
| `requesterId` | User(id) | SET NULL |
| `assigneeId` | User(id) | SET NULL |

### Relationships
```
User 1───∞ ServiceRequest (requesterId)
User 1───∞ ServiceRequest (assigneeId)
```

### API Usage
- `GET /api/service-requests` - List SRs
- `POST /api/service-requests` - Create SR
- `PATCH /api/service-requests/:id` - Update SR
- `PATCH /api/service-requests/:id/assign` - Assign SR

---

## Incident

**Purpose:** IT incident tracking and RCA.

### Table Definition
```sql
CREATE TABLE `Incident` (
  `id` VARCHAR(191) NOT NULL,
  `incidentNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `severity` ENUM('SEV1', 'SEV2', 'SEV3', 'SEV4') NOT NULL DEFAULT 'SEV3',
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `impactedService` VARCHAR(191),
  `impactedProject` VARCHAR(191),
  `startedAt` DATETIME(3),
  `resolvedAt` DATETIME(3),
  `rca` TEXT,
  `correctiveAction` TEXT,
  `preventiveAction` TEXT,
  `ownerName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Incident_incidentNo_key` (`incidentNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `incidentNo` | VARCHAR(191) | NO | - | Display ID (INC-XXXX) |
| `title` | VARCHAR(191) | NO | - | Incident title |
| `description` | TEXT | YES | - | Incident details |
| `severity` | ENUM | NO | SEV3 | SEV1/SEV2/SEV3/SEV4 |
| `status` | ENUM | NO | OPEN | Current status |
| `impactedService` | VARCHAR(191) | YES | - | Affected service |
| `impactedProject` | VARCHAR(191) | YES | - | Affected project |
| `startedAt` | DATETIME(3) | YES | - | Incident start time |
| `resolvedAt` | DATETIME(3) | YES | - | Resolution time |
| `rca` | TEXT | YES | - | Root cause analysis |
| `correctiveAction` | TEXT | YES | - | Corrective action |
| `preventiveAction` | TEXT | YES | - | Preventive action |
| `ownerName` | VARCHAR(191) | YES | - | Owner |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `incidentNo` | `Incident_incidentNo_key` |

### API Usage
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `PATCH /api/incidents/:id` - Update incident

---

## Problem

**Purpose:** Problem management for root cause analysis.

### Table Definition
```sql
CREATE TABLE `Problem` (
  `id` VARCHAR(191) NOT NULL,
  `problemNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `rootCause` TEXT,
  `ownerName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Problem_problemNo_key` (`problemNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `problemNo` | VARCHAR(191) | NO | - | Display ID (PRB-XXXX) |
| `title` | VARCHAR(191) | NO | - | Problem title |
| `description` | TEXT | YES | - | Problem details |
| `status` | ENUM | NO | OPEN | Current status |
| `rootCause` | TEXT | YES | - | Root cause |
| `ownerName` | VARCHAR(191) | YES | - | Owner |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `problemNo` | `Problem_problemNo_key` |

### API Usage
- `GET /api/problems` - List problems
- `POST /api/problems` - Create problem
- `PATCH /api/problems/:id` - Update problem

---

## ChangeRequest

**Purpose:** IT change management workflow.

### Table Definition
```sql
CREATE TABLE `ChangeRequest` (
  `id` VARCHAR(191) NOT NULL,
  `changeNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'PENDING_APPROVAL',
  `changeWindow` DATETIME(3),
  `rollbackPlan` TEXT,
  `ownerName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ChangeRequest_changeNo_key` (`changeNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `changeNo` | VARCHAR(191) | NO | - | Display ID (CHG-XXXX) |
| `title` | VARCHAR(191) | NO | - | Change title |
| `description` | TEXT | YES | - | Change details |
| `riskLevel` | VARCHAR(191) | NO | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| `status` | ENUM | NO | PENDING_APPROVAL | Current status |
| `changeWindow` | DATETIME(3) | YES | - | Scheduled window |
| `rollbackPlan` | TEXT | YES | - | Rollback procedure |
| `ownerName` | VARCHAR(191) | YES | - | Owner |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `changeNo` | `ChangeRequest_changeNo_key` |

### API Usage
- `GET /api/changes` - List changes
- `POST /api/changes` - Create change
- `PATCH /api/changes/:id` - Update change

---

## Asset

**Purpose:** IT asset and inventory management.

### Table Definition
```sql
CREATE TABLE `Asset` (
  `id` VARCHAR(191) NOT NULL,
  `assetNo` VARCHAR(191) NOT NULL,
  `assetType` VARCHAR(191) NOT NULL,
  `make` VARCHAR(191),
  `model` VARCHAR(191),
  `serialNo` VARCHAR(191),
  `status` ENUM('AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED', 'DISPOSED') NOT NULL DEFAULT 'AVAILABLE',
  `assignedToName` VARCHAR(191),
  `location` VARCHAR(191),
  `warrantyEndAt` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Asset_assetNo_key` (`assetNo`),
  UNIQUE INDEX `Asset_serialNo_key` (`serialNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `assetNo` | VARCHAR(191) | NO | - | Asset tag (AST-XXXX) |
| `assetType` | VARCHAR(191) | NO | - | Type (Laptop, Server, etc.) |
| `make` | VARCHAR(191) | YES | - | Manufacturer |
| `model` | VARCHAR(191) | YES | - | Model name |
| `serialNo` | VARCHAR(191) | YES | - | Serial number |
| `status` | ENUM | NO | AVAILABLE | Current status |
| `assignedToName` | VARCHAR(191) | YES | - | Assigned person |
| `location` | VARCHAR(191) | YES | - | Physical location |
| `warrantyEndAt` | DATETIME(3) | YES | - | Warranty expiry |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `assetNo` | `Asset_assetNo_key` |
| UNIQUE | `serialNo` | `Asset_serialNo_key` |

### API Usage
- `GET /api/inventory` - List assets
- `POST /api/inventory` - Create asset
- `PATCH /api/inventory/:id` - Update asset

---

## AccessRequest

**Purpose:** System access request and approval workflow.

### Table Definition
```sql
CREATE TABLE `AccessRequest` (
  `id` VARCHAR(191) NOT NULL,
  `requestNo` VARCHAR(191) NOT NULL,
  `requesterName` VARCHAR(191) NOT NULL,
  `accessType` VARCHAR(191) NOT NULL,
  `systemName` VARCHAR(191) NOT NULL,
  `justification` TEXT,
  `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PROVISIONED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'REQUESTED',
  `expiryAt` DATETIME(3),
  `approverName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AccessRequest_requestNo_key` (`requestNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `requestNo` | VARCHAR(191) | NO | - | Request ID (ACC-XXXX) |
| `requesterName` | VARCHAR(191) | NO | - | Who needs access |
| `accessType` | VARCHAR(191) | NO | - | Type of access |
| `systemName` | VARCHAR(191) | NO | - | Target system |
| `justification` | TEXT | YES | - | Business justification |
| `status` | ENUM | NO | REQUESTED | Current status |
| `expiryAt` | DATETIME(3) | YES | - | Access expiry |
| `approverName` | VARCHAR(191) | YES | - | Who approved |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `requestNo` | `AccessRequest_requestNo_key` |

### API Usage
- `GET /api/access-management` - List requests
- `POST /api/access-management` - Create request
- `PATCH /api/access-management/:id` - Update request

---

## ComplianceControl

**Purpose:** Compliance control tracking and evidence management.

### Table Definition
```sql
CREATE TABLE `ComplianceControl` (
  `id` VARCHAR(191) NOT NULL,
  `controlNo` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `controlArea` VARCHAR(191) NOT NULL,
  `ownerName` VARCHAR(191) NOT NULL,
  `frequency` VARCHAR(191) NOT NULL,
  `dueAt` DATETIME(3),
  `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
  `evidenceUrl` VARCHAR(191),
  `riskRating` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ComplianceControl_controlNo_key` (`controlNo`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `controlNo` | VARCHAR(191) | NO | - | Control ID (CMP-XXXX) |
| `title` | VARCHAR(191) | NO | - | Control title |
| `controlArea` | VARCHAR(191) | NO | - | Area (Access, Security, etc.) |
| `ownerName` | VARCHAR(191) | NO | - | Owner |
| `frequency` | VARCHAR(191) | NO | - | Review frequency |
| `dueAt` | DATETIME(3) | YES | - | Due date |
| `status` | ENUM | NO | OPEN | Current status |
| `evidenceUrl` | VARCHAR(191) | YES | - | Evidence link |
| `riskRating` | VARCHAR(191) | NO | MEDIUM | LOW/MEDIUM/HIGH/CRITICAL |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `controlNo` | `ComplianceControl_controlNo_key` |

### API Usage
- `GET /api/compliance` - List controls
- `POST /api/compliance` - Create control
- `PATCH /api/compliance/:id` - Update control

---

## ProjectEnvironment

**Purpose:** Project and environment infrastructure mapping.

### Table Definition
```sql
CREATE TABLE `ProjectEnvironment` (
  `id` VARCHAR(191) NOT NULL,
  `projectName` VARCHAR(191) NOT NULL,
  `environmentName` VARCHAR(191) NOT NULL,
  `serviceName` VARCHAR(191),
  `serverName` VARCHAR(191),
  `databaseName` VARCHAR(191),
  `ownerName` VARCHAR(191),
  `monitoringUrl` VARCHAR(191),
  `backupEnabled` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `projectName` | VARCHAR(191) | NO | - | Project name |
| `environmentName` | VARCHAR(191) | NO | - | Environment (Dev, Staging, Prod) |
| `serviceName` | VARCHAR(191) | YES | - | Service name |
| `serverName` | VARCHAR(191) | YES | - | Server hostname |
| `databaseName` | VARCHAR(191) | YES | - | Database name |
| `ownerName` | VARCHAR(191) | YES | - | Owner |
| `monitoringUrl` | VARCHAR(191) | YES | - | Monitoring link |
| `backupEnabled` | BOOLEAN | NO | false | Backup enabled |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### API Usage
- `GET /api/projects-environments` - List projects
- `POST /api/projects-environments` - Create project
- `PATCH /api/projects-environments/:id` - Update project

---

## VendorLicense

**Purpose:** Vendor and software license tracking.

### Table Definition
```sql
CREATE TABLE `VendorLicense` (
  `id` VARCHAR(191) NOT NULL,
  `vendorName` VARCHAR(191) NOT NULL,
  `licenseName` VARCHAR(191) NOT NULL,
  `licenseCount` INT NOT NULL DEFAULT 0,
  `assignedCount` INT NOT NULL DEFAULT 0,
  `cost` DECIMAL(12, 2),
  `renewalAt` DATETIME(3),
  `ownerName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `vendorName` | VARCHAR(191) | NO | - | Vendor name |
| `licenseName` | VARCHAR(191) | NO | - | License name |
| `licenseCount` | INT | NO | 0 | Total licenses |
| `assignedCount` | INT | NO | 0 | Assigned count |
| `cost` | DECIMAL(12,2) | YES | - | License cost |
| `renewalAt` | DATETIME(3) | YES | - | Renewal date |
| `ownerName` | VARCHAR(191) | YES | - | Owner |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### API Usage
- `GET /api/vendors-licenses` - List licenses
- `POST /api/vendors-licenses` - Create license
- `PATCH /api/vendors-licenses/:id` - Update license

---

## KnowledgeBaseArticle

**Purpose:** Knowledge base articles for self-service.

### Table Definition
```sql
CREATE TABLE `KnowledgeBaseArticle` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
  `authorName` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `title` | VARCHAR(191) | NO | - | Article title |
| `category` | VARCHAR(191) | NO | - | Category |
| `body` | TEXT | NO | - | Article content |
| `status` | VARCHAR(191) | NO | DRAFT | DRAFT/PUBLISHED/ARCHIVED |
| `authorName` | VARCHAR(191) | YES | - | Author |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### API Usage
- `GET /api/knowledge-base` - List articles
- `POST /api/knowledge-base` - Create article
- `PATCH /api/knowledge-base/:id` - Update article

---

## SystemSetting

**Purpose:** Key-value system configuration storage.

### Table Definition
```sql
CREATE TABLE `SystemSetting` (
  `id` VARCHAR(191) NOT NULL,
  `group` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `isSecret` BOOLEAN NOT NULL DEFAULT false,
  `updatedBy` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SystemSetting_key_key` (`key`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `group` | VARCHAR(191) | NO | - | Group (AI, AUTH, etc.) |
| `key` | VARCHAR(191) | NO | - | Setting key (unique) |
| `value` | TEXT | NO | - | Setting value |
| `isSecret` | BOOLEAN | NO | false | Hide in UI |
| `updatedBy` | VARCHAR(191) | YES | - | Last editor |
| `createdAt` | DATETIME(3) | NO | now() | Creation timestamp |
| `updatedAt` | DATETIME(3) | NO | @updatedAt | Last update |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |
| UNIQUE | `key` | `SystemSetting_key_key` |

### API Usage
- `GET /api/settings` - List settings
- `PATCH /api/settings` - Update setting

---

## AuditLog

**Purpose:** Audit trail for all create/update operations.

### Table Definition
```sql
CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191),
  `actorEmail` VARCHAR(191),
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191),
  `oldValue` JSON,
  `newValue` JSON,
  `ipAddress` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `actorId` | VARCHAR(191) | YES | - | User ID who performed action |
| `actorEmail` | VARCHAR(191) | YES | - | Email of actor |
| `action` | VARCHAR(191) | NO | - | Action type (CREATE, UPDATE, etc.) |
| `entityType` | VARCHAR(191) | NO | - | Prisma model name |
| `entityId` | VARCHAR(191) | YES | - | ID of affected record |
| `oldValue` | JSON | YES | - | Previous values |
| `newValue` | JSON | YES | - | New values |
| `ipAddress` | VARCHAR(191) | YES | - | Client IP |
| `createdAt` | DATETIME(3) | NO | now() | Timestamp |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### Auto-logged Actions
- CREATE (on new records)
- UPDATE (on record changes)
- USER_CREATED
- ACTIVATION_EMAIL_SENT
- ACTIVATION_COMPLETED

---

## AiConversation

**Purpose:** AI assistant conversation history.

### Table Definition
```sql
CREATE TABLE `AiConversation` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191),
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `sourceJson` JSON,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `userId` | VARCHAR(191) | YES | - | FK to User |
| `question` | TEXT | NO | - | User's question |
| `answer` | TEXT | NO | - | AI response |
| `provider` | VARCHAR(191) | NO | - | Provider (mock/openai/claude) |
| `sourceJson` | JSON | YES | - | Raw source data |
| `createdAt` | DATETIME(3) | NO | now() | Timestamp |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### API Usage
- `POST /api/ai/ask` - Auto-logs conversation

---

## NotificationLog

**Purpose:** Email/notification sending history and audit.

### Table Definition
```sql
CREATE TABLE `NotificationLog` (
  `id` VARCHAR(191) NOT NULL,
  `channel` VARCHAR(191) NOT NULL,
  `recipient` VARCHAR(191),
  `subject` VARCHAR(191),
  `body` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `error` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(191) | NO | @default(cuid()) | Primary key |
| `channel` | VARCHAR(191) | NO | - | email/teams/sms |
| `recipient` | VARCHAR(191) | YES | - | To address |
| `subject` | VARCHAR(191) | YES | - | Email subject |
| `body` | TEXT | NO | - | Message body |
| `status` | VARCHAR(191) | NO | - | SENT/FAILED/MOCK_SENT |
| `error` | TEXT | YES | - | Error message |
| `createdAt` | DATETIME(3) | NO | now() | Timestamp |

### Indexes
| Type | Column(s) | Name |
|------|----------|------|
| PRIMARY | `id` | - |

### Notification Statuses
| Status | Description |
|--------|-------------|
| MOCK_SENT | Email logged (EMAIL_ENABLED=false) |
| SENT | Email successfully sent |
| FAILED | Email send failed |

---

# ER Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                            │
│                         Saven InfraOps Enterprise V6                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════
                                    AUTHENTICATION CORE
═══════════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────────────┐
                              │       User           │
                              │─────────────────────│
                              │ PK  id              │
                              │    name             │
                              │ UK  email           │
                              │    phoneNumber      │
                              │    passwordHash     │
                              │    department       │
                              │    status           │
                              │    createdAt        │
                              │    updatedAt        │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
        ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
        │  UserActivation   │  │     UserRole     │  │  ServiceRequest      │
        │      Token        │  │──────────────────│  │──────────────────────│
        │───────────────────│  │ PK  userId       │  │ PK  id               │
        │ PK  id            │  │ PK  roleId       │  │ UK  ticketNo         │
        │ UK  userId         │  └────────┬─────────┘  │ FK  requesterId ─────┼──┐
        │ UK  token          │           │            │ FK  assigneeId  ─────┼──┤
        │    expiresAt       │           │            │    requesterName     │  │
        │    used            │           │            │    assigneeName       │  │
        │    createdAt       │           │            │    ...                │  │
        └───────────────────┘           │            └──────────────────────┘  │
                                        │                    (1:N)              │
                                        ▼                    (requesterId)     │
                            ┌─────────────────────┐                             │
                            │       Role          │                             │
                            │─────────────────────│                             │
                            │ PK  id              │                             │
                            │ UK  name            │                             │
                            │    description      │                             │
                            └──────────┬──────────┘                             │
                                       │                                         │
                                       ▼                                         │
                            ┌─────────────────────┐                               │
                            │   RolePermission    │                               │
                            │─────────────────────│                               │
                            │ PK  roleId          │                               │
                            │ PK  permissionId     │                               │
                            └──────────┬──────────┘                               │
                                       │                                         │
                                       ▼                                         │
                            ┌─────────────────────┐                               │
                            │    Permission        │                               │
                            │─────────────────────│                               │
                            │ PK  id              │                               │
                            │ UK  code            │                               │
                            │    description      │                               │
                            └─────────────────────┘                               │


═══════════════════════════════════════════════════════════════════════════════════════
                                  TICKET MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════════════

        ┌──────────────────────────────────────────────────────────────────────────┐
        │                     SERVICE REQUEST WORKFLOW                              │
        └──────────────────────────────────────────────────────────────────────────┘

        ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
        │   ServiceRequest     │      │      Incident        │      │       Problem       │
        │─────────────────────│      │─────────────────────│      │─────────────────────│
        │ PK  id               │      │ PK  id               │      │ PK  id               │
        │ UK  ticketNo         │      │ UK  incidentNo       │      │ UK  problemNo        │
        │ FK  requesterId ──┐  │      │    severity          │      │    title             │
        │ FK  assigneeId  ──┤  │      │    status            │      │    status            │
        │    requesterName │  │      │    impactedService   │      │    rootCause         │
        │    assigneeName  │  │      │    impactedProject   │      │    ownerName         │
        │    priority      │  │      │    startedAt         │      │    createdAt         │
        │    status       │  │      │    resolvedAt        │      │    updatedAt         │
        │    category     │  │      │    rca               │      └──────────────────────┘
        │    subCategory  │  │      │    correctiveAction  │
        │    dueAt        │  │      │    preventiveAction  │
        │    createdAt    │  │      │    ownerName         │
        │    updatedAt    │  │      │    createdAt         │
        └──────────────────┘  │      │    updatedAt         │
              │               │      └──────────────────────┘
              │               │                │
              │               │                │
              ▼               │                ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │        User          │      │   ChangeRequest      │
        │─────────────────────│      │─────────────────────│
        │ PK  id               │      │ PK  id               │
        │    name              │      │ UK  changeNo         │
        │ UK  email            │      │    title             │
        │    status            │      │    riskLevel         │
        │    ...               │      │    status           │
        └──────────────────────┘      │    changeWindow      │
                                     │    rollbackPlan      │
                                     │    ownerName         │
                                     │    createdAt         │
                                     │    updatedAt         │
                                     └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                 ASSET & ACCESS MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════════════

        ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
        │        Asset         │      │   AccessRequest      │      │ ComplianceControl   │
        │─────────────────────│      │─────────────────────│      │─────────────────────│
        │ PK  id               │      │ PK  id               │      │ PK  id               │
        │ UK  assetNo          │      │ UK  requestNo        │      │ UK  controlNo        │
        │    assetType         │      │    requesterName     │      │    title             │
        │    make              │      │    accessType        │      │    controlArea       │
        │    model             │      │    systemName        │      │    ownerName         │
        │ UK  serialNo         │      │    justification     │      │    frequency         │
        │    status            │      │    status            │      │    dueAt             │
        │    assignedToName    │      │    expiryAt          │      │    status            │
        │    location          │      │    approverName      │      │    evidenceUrl       │
        │    warrantyEndAt     │      │    createdAt         │      │    riskRating        │
        │    createdAt         │      │    updatedAt         │      │    createdAt         │
        │    updatedAt         │      └──────────────────────┘      │    updatedAt         │
        └──────────────────────┘                                  └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                               INFRASTRUCTURE & KNOWLEDGE
═══════════════════════════════════════════════════════════════════════════════════════

        ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
        │ ProjectEnvironment    │      │  VendorLicense       │      │ KnowledgeBaseArticle │
        │─────────────────────│      │─────────────────────│      │─────────────────────│
        │ PK  id               │      │ PK  id               │      │ PK  id               │
        │    projectName       │      │    vendorName        │      │    title             │
        │    environmentName   │      │    licenseName       │      │    category          │
        │    serviceName       │      │    licenseCount      │      │    body              │
        │    serverName        │      │    assignedCount     │      │    status            │
        │    databaseName      │      │    cost              │      │    authorName        │
        │    ownerName         │      │    renewalAt         │      │    createdAt         │
        │    monitoringUrl     │      │    ownerName         │      │    updatedAt         │
        │    backupEnabled     │      │    createdAt         │      └──────────────────────┘
        │    createdAt         │      │    updatedAt         │
        │    updatedAt         │      └──────────────────────┘
        └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                  SYSTEM & AUDIT
═══════════════════════════════════════════════════════════════════════════════════════

        ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
        │   SystemSetting      │      │     AuditLog          │      │   AiConversation    │
        │─────────────────────│      │─────────────────────│      │─────────────────────│
        │ PK  id               │      │ PK  id               │      │ PK  id               │
        │ UK  key              │      │    actorId           │      │ FK  userId           │
        │    group             │      │    actorEmail        │      │    question          │
        │    value             │      │    action            │      │    answer            │
        │    isSecret          │      │    entityType        │      │    provider          │
        │    updatedBy         │      │    entityId          │      │    sourceJson        │
        │    createdAt         │      │    oldValue (JSON)   │      │    createdAt         │
        │    updatedAt         │      │    newValue (JSON)   │      └──────────────────────┘
        └──────────────────────┘      │    ipAddress         │
                                     │    createdAt         │
                                     └──────────────────────┘

                                     ┌──────────────────────┐
                                     │  NotificationLog     │
                                     │─────────────────────│
                                     │ PK  id               │
                                     │    channel           │
                                     │    recipient         │
                                     │    subject           │
                                     │    body              │
                                     │    status            │
                                     │    error             │
                                     │    createdAt         │
                                     └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                      LEGEND
═══════════════════════════════════════════════════════════════════════════════════════

  PK = Primary Key
  UK = Unique Key
  FK = Foreign Key
  ─── = Relationship (1:1 or 1:N)

  One-to-One:    Table A ─── Table B (single FK)
  One-to-Many:  Table A ───┬── Table B (multiple B rows per A)

```

---

# User/Roles/Permissions Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         USER / ROLES / PERMISSIONS                                   │
│                              RBAC Architecture                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘


                              PERMISSIONS (19 total)
                              ┌─────────────────────────────────────────────────────┐
                              │  dashboard:read                                    │
                              │  tickets:read, tickets:write, tickets:assign       │
                              │  incidents:read, incidents:write                   │
                              │  changes:read, changes:approve                     │
                              │  inventory:read, inventory:write                    │
                              │  access:read, access:approve                        │
                              │  compliance:read, compliance:write                 │
                              │  settings:read, settings:write                     │
                              │  users:read, users:write                           │
                              │  ai:ask                                            │
                              └─────────────────────────────────────────────────────┘
                                              │
                                              │ 1:N
                                              │ RolePermission
                                              │ (junction)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    ROLE                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              Super Admin                                      │   │
│  │                    (Has ALL 19 permissions)                                   │   │
│  │                                                                              │   │
│  │  permissions[] = [                                                          │   │
│  │    "dashboard:read", "tickets:*", "incidents:*", "changes:*",               │   │
│  │    "inventory:*", "access:*", "compliance:*", "settings:*",                  │   │
│  │    "users:*", "ai:ask"                                                      │   │
│  │  ]                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  id (PK): cuid                                                                       │
│  name (UK): "Super Admin"                                                           │
│  description: "Full system access"                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              │ 1:N
                                              │ UserRole
                                              │ (junction)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                     USER                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           admin@saven.in                                      │   │
│  │                                                                              │   │
│  │  id (PK): cuid                                                               │   │
│  │  name: "Saven Admin"                                                         │   │
│  │  email (UK): "admin@saven.in"                                               │   │
│  │  passwordHash: bcrypt hash                                                   │   │
│  │  department: "InfraOps"                                                      │   │
│  │  status: ACTIVE                                                              │   │
│  │                                                                              │   │
│  │  roles[] = [Role("Super Admin")]                                            │   │
│  │                                                                              │   │
│  │  JWT Payload: {                                                              │   │
│  │    id: "cuid",                                                              │   │
│  │    email: "admin@saven.in",                                                 │   │
│  │    roles: ["Super Admin"],                                                  │   │
│  │    permissions: ["dashboard:read", "tickets:*", ..., "ai:ask"]             │   │
│  │  }                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  +─── Many more users can be added                                                │
│  └── Each user can have multiple roles (via UserRole junction)                     │
└─────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    RELATIONSHIP FLOW
═══════════════════════════════════════════════════════════════════════════════════════

   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │   User      │         │  UserRole   │         │    Role     │
   │─────────────│         │─────────────│         │─────────────│
   │ PK  id      │────────<│ PK userId   │         │ PK  id      │
   │     email   │         │ PK roleId   │>────────│     name    │
   │             │         └─────────────┘         │             │
   └─────────────┘                                 └──────┬──────┘
                                                          │
                                                          │ 1:N
                                                          │ RolePermission
                                                          ▼
                                                   ┌─────────────┐
                                                   │ Permission  │
                                                   │─────────────│
                                                   │ PK  id      │
                                                   │ UK  code    │
                                                   └─────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    ACCESS CHECK FLOW
═══════════════════════════════════════════════════════════════════════════════════════

   User Request ──> requireAuth() ──> JWT Verify ──> req.user.permissions
                                                        │
                                                        ▼
                                             requirePermission("tickets:write")
                                                        │
                                                        ▼
                                    permissions.includes("tickets:write")
                                                        │
                                        ┌───────────────┴───────────────┐
                                        │                               │
                                       YES                              NO
                                        │                               │
                                        ▼                               ▼
                                   Continue                      403 Forbidden
```

---

# Authentication-Related Tables Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                         │
│                     Email-Based Account Activation                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STEP 1: User Creation
═══════════════════════════════════════════════════════════════════════════════════════

   Admin creates user
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                            User Table                                       │
   │─────────────────────────────────────────────────────────────────────────────│
   │  id               | email                | status           | passwordHash │
   │─────────────────────────────────────────────────────────────────────────────│
   │  cuid-001         | newuser@email.com     | PENDING_ACTIVATION| NULL        │
   └─────────────────────────────────────────────────────────────────────────────┘
                                                                                      │
                                                                                      ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                      UserActivationToken Table                                │
   │─────────────────────────────────────────────────────────────────────────────│
   │  id      | userId    | token (64-char)           | expiresAt | used         │
   │─────────────────────────────────────────────────────────────────────────────│
   │  act-001 | cuid-001  | a1b2c3d4...xyz (hex)     | +24h      | false        │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STEP 2: Email Sent
═══════════════════════════════════════════════════════════════════════════════════════

   System sends email to newuser@email.com
   Contains link: http://localhost:3001/activate-account?token=a1b2c3d4...xyz
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                        NotificationLog Table                                  │
   │─────────────────────────────────────────────────────────────────────────────│
   │  id      | channel | recipient         | subject                      |status│
   │─────────────────────────────────────────────────────────────────────────────│
   │  nl-001  | email   | newuser@email.com | Welcome to Saven InfraOps...  |MOCK_ │
   │          |         |                   |                              |SENT  │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STEP 3: Token Validation
═══════════════════════════════════════════════════════════════════════════════════════

   User clicks activation link
         │
         ▼
   GET /api/auth/activate/validate/:token
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                   UserActivationToken Validation                             │
   │                                                                              │
   │  1. Token exists?        YES ──────────────────────────────────────────┐   │
   │  2. Token.used = false?  YES ──────────────────────────────────────┐     │   │
   │  3. Token.expiresAt > NOW? YES ──────────────────────────────┐     │     │   │
   │                                                              │     │     │   │
   │                                                     Valid! ◄──┘     │     │   │
   │                                                              │     │     │   │
   └──────────────────────────────────────────────────────────────│─────│─────┘   │
                                                                     │          │
                                                                     ▼          ▼
   ┌─────────────────────────────────┐    or    ┌─────────────────────────────────┐
   │  Response: { valid: true }       │         │  Response: {                    │
   │  User can set password          │         │    valid: false,                 │
   └─────────────────────────────────┘         │    error: "Token expired..."     │
                                               └─────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STEP 4: Activation Complete
═══════════════════════════════════════════════════════════════════════════════════════

   User submits password + confirmPassword
         │
         ▼
   POST /api/auth/activate
   Body: { token, password, confirmPassword }
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                              Transaction                                       │
   │                                                                              │
   │  1. password === confirmPassword?                                           │
   │  2. bcrypt.hash(password, 12) → passwordHash                               │
   │  3. User.update(status = ACTIVE)                                            │
   │  4. UserActivationToken.update(used = true)                                  │
   │  5. AuditLog: ACTIVATION_COMPLETED                                          │
   │                                                                              │
   └─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                            User Table (Updated)                               │
   │─────────────────────────────────────────────────────────────────────────────│
   │  id       | email               | status  | passwordHash                    │
   │─────────────────────────────────────────────────────────────────────────────│
   │  cuid-001 | newuser@email.com  | ACTIVE  | $2a$12$hash...                  │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STEP 5: Login
═══════════════════════════════════════════════════════════════════════════════════════

   User can now login
         │
         ▼
   POST /api/auth/login
   Body: { email, password }
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         auth.service.ts                                        │
   │                                                                              │
   │  1. User.findUnique(email)                                                   │
   │  2. Check status !== PENDING_ACTIVATION                                     │
   │  3. bcrypt.compare(password, user.passwordHash)                             │
   │  4. Generate JWT with { id, email, roles[], permissions[] }               │
   │                                                                              │
   └─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                               JWT Token                                       │
   │─────────────────────────────────────────────────────────────────────────────│
   │                                                                              │
   │  {                                                                            │
   │    "id": "cuid-001",                                                         │
   │    "email": "newuser@email.com",                                             │
   │    "roles": ["Super Admin"],                                                 │
   │    "permissions": ["dashboard:read", "tickets:read", ..., "ai:ask"],        │
   │    "iat": 1719234567,                                                        │
   │    "exp": 1719262567                                                         │
   │  }                                                                            │
   │                                                                              │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    TABLES SUMMARY
═══════════════════════════════════════════════════════════════════════════════════════

   ┌─────────────────────────┐     ┌─────────────────────────┐
   │         User            │     │  UserActivationToken    │
   │─────────────────────────│     │─────────────────────────│
   │  id (PK)                │     │  id (PK)                │
   │  email (UK)             │────<│  userId (FK, UK)        │
   │  passwordHash           │     │  token (UK)             │
   │  status                 │     │  expiresAt              │
   │  department             │     │  used                   │
   │  createdAt              │     │  createdAt              │
   │  updatedAt              │     └─────────────────────────┘
   └─────────────────────────┘
              │
              │ 1:N
              │ ServiceRequest
              ▼
   ┌─────────────────────────┐     ┌─────────────────────────┐
   │   ServiceRequest         │     │    NotificationLog      │
   │─────────────────────────│     │─────────────────────────│
   │  id (PK)                │     │  id (PK)                │
   │  requesterId (FK)       │     │  channel                │
   │  assigneeId (FK)        │     │  recipient              │
   │  requesterName          │     │  subject                │
   │  assigneeName           │     │  body                   │
   │  ...                    │     │  status                 │
   └─────────────────────────┘     │  error                  │
                                   │  createdAt              │
                                   └─────────────────────────┘
```

---

# Service Request-Related Tables Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE REQUEST WORKFLOW                                     │
│                         Request → Assignment → Resolution                             │
└─────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    ENTITY RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════════════════

                           ┌─────────────────────┐
                           │        User         │
                           │─────────────────────│
                           │ PK  id              │
                           │ UK  email           │
                           │    name             │
                           │    status           │
                           │    department       │
                           └──────────┬──────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                │  requesterId        │  assigneeId         │
                │  (1:N)              │  (1:N)             │
                ▼                     ▼                     ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           ServiceRequest                                           │
│───────────────────────────────────────────────────────────────────────────────────│
│ PK  id                   │                                                     │
│ UK  ticketNo (SR-XXXX)   │                                                     │
│                           │                                                     │
│ FK  requesterId ──────────┼──────────────────────────────────────────────────────│
│ FK  assigneeId  ──────────┼──────────────────────────────────────────────────────│
│                           │                                                     │
│    requesterName          │  "John Doe" (denormalized)                         │
│    assigneeName           │  "Jane Smith" (denormalized)                        │
│                           │                                                     │
│    title                  │  "VPN not working"                                 │
│    description            │  "Cannot connect since morning..."                  │
│                           │                                                     │
│    category               │  "Network"                                         │
│    subCategory            │  "VPN"                                              │
│    projectName            │  "Federal Project"                                  │
│                           │                                                     │
│    priority (ENUM)        │  LOW | MEDIUM | HIGH | CRITICAL                    │
│    status (ENUM)          │  OPEN | ASSIGNED | IN_PROGRESS | ... | CLOSED      │
│                           │                                                     │
│    dueAt                  │  SLA deadline                                       │
│    resolvedAt             │  When marked resolved                                │
│    closedAt               │  When closed                                         │
│                           │                                                     │
│    createdAt              │  2026-06-16T10:30:00Z                               │
│    updatedAt              │  2026-06-16T14:45:00Z                               │
└───────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    STATUS WORKFLOW
═══════════════════════════════════════════════════════════════════════════════════════

   ┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────────┐
   │  OPEN   │────>│ ASSIGNED  │────>│ IN_PROGRESS │────>│   RESOLVED   │
   └─────────┘     └──────────┘     └─────────────┘     └──────────────┘
       │               │                   │                  │
       │               │                   │                  │
       ▼               ▼                   ▼                  ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                      Other Possible Statuses                            │
   │                                                                         │
   │  WAITING_FOR_USER      ──>  Waiting for user response                 │
   │  WAITING_FOR_VENDOR    ──>  Waiting for vendor                         │
   │  PENDING_APPROVAL      ──>  Awaiting approval                         │
   │  REOPENED              ──>  Reopened after resolution                   │
   │  CLOSED                ──>  Fully closed                              │
   └─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    RELATED TABLES
═══════════════════════════════════════════════════════════════════════════════════════

   ServiceRequest is related to these modules:

   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
   │   Incident      │      │    Problem      │      │ ChangeRequest   │
   │─────────────────│      │─────────────────│      │─────────────────│
   │ Links incidents │      │ Links problems  │      │ Links changes   │
   │ to tickets      │      │ to tickets      │      │ to tickets      │
   │                 │      │                 │      │                 │
   │ Root cause of   │      │ Known problems  │      │ Change needed   │
   │ incidents       │      │ causing tickets │      │ to fix tickets  │
   └─────────────────┘      └─────────────────┘      └─────────────────┘

   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
   │     Asset       │      │  AccessRequest  │      │   AuditLog      │
   │─────────────────│      │─────────────────│      │─────────────────│
   │ Asset requests  │      │ Access needed   │      │ All SR changes  │
   │ (laptop, etc.)  │      │ (permissions)  │      │ are logged      │
   │                 │      │                 │      │                 │
   │ "Need a laptop" │      │ "Need DB access"│      │ CREATE, UPDATE  │
   │ is an SR        │      │ is an SR        │      │ logged          │
   └─────────────────┘      └─────────────────┘      └─────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    API ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════════════

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                        Service Request APIs                                   │
   │─────────────────────────────────────────────────────────────────────────────│
   │                                                                              │
   │  GET    /api/service-requests          List all SRs                         │
   │  GET    /api/service-requests/:id      Get single SR                         │
   │  POST   /api/service-requests          Create new SR                         │
   │  PATCH  /api/service-requests/:id      Update SR fields                      │
   │  PATCH  /api/service-requests/:id/assign  Assign SR to user                │
   │                                                                              │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    PERMISSIONS
═══════════════════════════════════════════════════════════════════════════════════════

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                     Service Request Permissions                              │
   │─────────────────────────────────────────────────────────────────────────────│
   │                                                                              │
   │  tickets:read    ──>  Can view SRs                                           │
   │  tickets:write   ──>  Can create/update SRs                                  │
   │  tickets:assign  ──>  Can assign SRs to users                               │
   │                                                                              │
   └─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                                    TABLE SCHEMA SUMMARY
═══════════════════════════════════════════════════════════════════════════════════════

   ServiceRequest Table
   ══════════════════
   ┌────────────────┬────────────────────────────────────────────────────────────┐
   │ Column         │ Type/Constraints                                           │
   ├────────────────┼────────────────────────────────────────────────────────────┤
   │ id             │ VARCHAR(191) PK, @default(cuid())                        │
   │ ticketNo       │ VARCHAR(191) UK, unique (SR-1001, SR-1002, ...)          │
   │ title          │ VARCHAR(191) NOT NULL                                       │
   │ description    │ TEXT NULL                                                  │
   │ category       │ VARCHAR(191) NOT NULL                                       │
   │ subCategory    │ VARCHAR(191) NULL                                          │
   │ priority       │ ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM'   │
   │ status         │ ENUM('OPEN','ASSIGNED','IN_PROGRESS',...) DEFAULT 'OPEN' │
   │ requesterId    │ VARCHAR(191) FK → User(id), SET NULL                      │
   │ assigneeId     │ VARCHAR(191) FK → User(id), SET NULL                      │
   │ requesterName  │ VARCHAR(191) NOT NULL (denormalized)                      │
   │ assigneeName   │ VARCHAR(191) NULL (denormalized)                          │
   │ projectName    │ VARCHAR(191) NULL                                          │
   │ dueAt          │ DATETIME NULL (SLA deadline)                               │
   │ resolvedAt     │ DATETIME NULL                                              │
   │ closedAt       │ DATETIME NULL                                              │
   │ createdAt      │ DATETIME NOT NULL, DEFAULT now()                           │
   │ updatedAt      │ DATETIME NOT NULL, @updatedAt                              │
   └────────────────┴────────────────────────────────────────────────────────────┘

   Indexes:
   ├── PRIMARY (id)
   └── UNIQUE (ticketNo)

   Foreign Keys:
   ├── requesterId → User(id) ON DELETE SET NULL
   └── assigneeId → User(id) ON DELETE SET NULL

   Relations:
   ├── User (requesterId) ← User.requesterId: 1:N
   └── User (assigneeId) ← User.assigneeId: 1:N
```

---

**End of Database Reference Document**
