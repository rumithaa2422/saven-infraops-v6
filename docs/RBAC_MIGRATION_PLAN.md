# RBAC Migration Plan

**Document Version:** 1.0  
**Date:** 2024  
**Repository:** Saven InfraOps Enterprise V6  
**Branch:** feature/rbac-redesign

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Phases](#migration-phases)
   - [Phase A: Permission Seed Updates](#phase-a-permission-seed-updates)
   - [Phase B: Backend API Permission Changes](#phase-b-backend-api-permission-changes)
   - [Phase C: Frontend Menu Guards](#phase-c-frontend-menu-guards)
   - [Phase D: Frontend Button Guards](#phase-d-frontend-button-guards)
   - [Phase E: Role Redesign](#phase-e-role-redesign)
   - [Phase F: Testing and Validation](#phase-f-testing-and-validation)
4. [Rollback Strategy](#rollback-strategy)
5. [Risk Assessment](#risk-assessment)

---

## Overview

This document defines the step-by-step migration plan to implement the approved RBAC permission model. The migration is designed to be incremental and reversible.

### Migration Goals

1. **Standardize permission names** - Use `:view`, `:create`, `:manage`, `:delete`, `:export` suffixes
2. **Separate shared namespaces** - Give Problems, Projects, Vendors, KB their own namespaces
3. **Add missing permissions** - Create `:delete` and `:export` permissions where missing
4. **Improve role definitions** - Create meaningful role hierarchies
5. **Ensure consistent guards** - Add permission checks at all UI levels

### Expected Outcomes

- 22 permissions → 40+ permissions (more granular)
- 3 identical roles → 8+ distinct roles
- Consistent permission naming across all modules
- Full frontend and backend permission alignment

---

## Prerequisites

Before starting the migration:

1. ✅ Database backup completed
2. ✅ All team members notified of upcoming changes
3. ✅ Testing environment prepared
4. ✅ Rollback plan documented
5. ✅ Super Admin access verified

---

## Migration Phases

---

### Phase A: Permission Seed Updates

**Objective:** Add new permissions to the database seed without removing existing ones.

**Duration:** ~1 hour

**Files Affected:**
- `backend/prisma/seed.ts`

#### Step A.1: Add New Permissions

Add the following new permissions to the seed file:

```typescript
// Problems module (new namespace)
'problems:view',
'problems:create',
'problems:manage',
'problems:export',

// Projects module (new namespace)
'projects:view',
'projects:create',
'projects:manage',
'projects:delete',
'projects:export',

// Vendors module (new namespace)
'vendors:view',
'vendors:create',
'vendors:manage',
'vendors:delete',
'vendors:export',

// Knowledge Base module (new namespace)
'kb:view',
'kb:create',
'kb:publish',
'kb:manage',
'kb:archive',
'kb:export',

// Reports module (new namespace)
'reports:view',
'reports:create',
'reports:export',

// Manage permissions (renamed from write)
'tickets:manage',
'incidents:manage',
'problems:manage',
'inventory:manage',
'compliance:manage',
'projects:manage',
'vendors:manage',
'kb:manage',

// Access module (refined)
'access:request',
'access:provision',
'access:revoke',

// Special permissions
'compliance:audit',
'kb:publish',
'kb:archive',
```

#### Step A.2: Update Seed Permissions Array

```typescript
const permissions = [
  // Dashboard
  'dashboard:view',
  
  // Service Requests
  'tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign', 'tickets:export',
  
  // Incidents
  'incidents:view', 'incidents:create', 'incidents:manage', 'incidents:export',
  
  // Problems (NEW)
  'problems:view', 'problems:create', 'problems:manage', 'problems:export',
  
  // Changes
  'changes:view', 'changes:create', 'changes:approve', 'changes:manage', 'changes:export',
  
  // Inventory
  'inventory:view', 'inventory:create', 'inventory:manage', 'inventory:delete', 'inventory:export',
  
  // Access Management
  'access:view', 'access:request', 'access:approve', 'access:provision', 'access:revoke', 'access:export',
  
  // Compliance
  'compliance:view', 'compliance:create', 'compliance:manage', 'compliance:audit', 'compliance:export',
  
  // Projects (NEW)
  'projects:view', 'projects:create', 'projects:manage', 'projects:delete', 'projects:export',
  
  // Vendors (NEW)
  'vendors:view', 'vendors:create', 'vendors:manage', 'vendors:delete', 'vendors:export',
  
  // Knowledge Base (NEW)
  'kb:view', 'kb:create', 'kb:publish', 'kb:manage', 'kb:archive', 'kb:export',
  
  // Reports (NEW)
  'reports:view', 'reports:create', 'reports:export',
  
  // Settings
  'settings:view', 'settings:manage',
  
  // Users
  'users:view', 'users:create', 'users:manage', 'users:delete', 'users:export',
  
  // Roles
  'roles:view', 'roles:create', 'roles:manage', 'roles:delete',
  
  // AI
  'ai:ask'
];
```

#### Step A.3: Execute Seed

```bash
cd backend
npx prisma db seed
```

#### Step A.4: Verify

```sql
SELECT COUNT(*) as permission_count FROM Permission;
-- Expected: 40+
```

#### Step A.5: Assign New Permissions to Existing Roles

All existing roles (Super Admin, Admin, Employee) should receive ALL new permissions:

```typescript
// After creating all permissions, assign to admin roles
const allPermissions = await prisma.permission.findMany();

for (const permission of allPermissions) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: permission.id }
  });
  // Repeat for Admin and Employee roles
}
```

#### Checklist for Phase A

- [ ] New permissions added to seed
- [ ] Seed executed successfully
- [ ] Permission count verified (40+)
- [ ] All roles have new permissions
- [ ] No existing permissions removed

---

### Phase B: Backend API Permission Changes

**Objective:** Update backend API routes to use new permission names.

**Duration:** ~4-6 hours

**Files Affected:**
- `backend/src/modules/generic/generic.routes.ts`
- `backend/src/modules/serviceRequests/serviceRequest.routes.ts`
- `backend/src/modules/dashboard/dashboard.routes.ts`
- `backend/src/modules/settings/settings.routes.ts`
- `backend/src/modules/ai/ai.routes.ts`

#### Step B.1: Update Generic Module Routes

For each module in `generic.routes.ts`:

| Module | Current Read | Current Write | New Read | New Write |
|--------|--------------|---------------|----------|-----------|
| incidents | `incidents:read` | `incidents:write` | `incidents:view` | `incidents:create`, `incidents:manage` |
| problems | `incidents:read` | `incidents:write` | `problems:view` | `problems:create`, `problems:manage` |
| changes | `changes:read` | `changes:approve` | `changes:view` | `changes:create`, `changes:approve`, `changes:manage` |
| inventory | `inventory:read` | `inventory:write` | `inventory:view` | `inventory:create`, `inventory:manage` |
| access-management | `access:read` | `access:approve` | `access:view` | `access:request`, `access:approve`, etc. |
| compliance | `compliance:read` | `compliance:write` | `compliance:view` | `compliance:create`, `compliance:manage` |
| projects-environments | `dashboard:read` | `settings:write` | `projects:view` | `projects:create`, `projects:manage` |
| vendors-licenses | `dashboard:read` | `settings:write` | `vendors:view` | `vendors:create`, `vendors:manage` |
| knowledge-base | `dashboard:read` | `settings:write` | `kb:view` | `kb:create`, `kb:publish`, `kb:manage` |
| reports-analytics | `dashboard:read` | `dashboard:read` | `reports:view` | `reports:create` |

#### Step B.2: Update DELETE Permissions

For modules that need delete:

```typescript
// Example for inventory
genericModuleRouter.delete('/:id', requireAuth, requirePermission('inventory:delete'), async (req, res, next) => {
  // ...
});
```

#### Step B.3: Update Service Requests

```typescript
// GET - view
router.get('/', requireAuth, requirePermission('tickets:view'), async (req, res, next) => {
  // ...
});

// POST - create
router.post('/', requireAuth, requirePermission('tickets:create'), async (req, res, next) => {
  // ...
});

// PATCH - manage (for status updates)
router.patch('/:id', requireAuth, requirePermission('tickets:manage'), async (req, res, next) => {
  // ...
});

// PATCH assign - separate permission
router.patch('/:id/assign', requireAuth, requirePermission('tickets:assign'), async (req, res, next) => {
  // ...
});
```

#### Step B.4: Update Dashboard Routes

```typescript
// GET summary - view
router.get('/summary', requireAuth, requirePermission('dashboard:view'), async (req, res, next) => {
  // ...
});
```

#### Step B.5: Update Settings Routes

```typescript
// GET settings - view
router.get('/', requireAuth, requirePermission('settings:view'), async (req, res, next) => {
  // ...
});

// PUT setting - manage
router.put('/:key', requireAuth, requirePermission('settings:manage'), async (req, res, next) => {
  // ...
});
```

#### Step B.6: Update AI Routes

```typescript
// POST ask - already correct
router.post('/ask', requireAuth, requirePermission('ai:ask'), async (req, res, next) => {
  // ...
});
```

#### Step B.7: Verify Backend

```bash
cd backend
npm run build
# Should compile without errors
```

#### Checklist for Phase B

- [ ] Generic routes updated with new permissions
- [ ] Service requests updated (view, create, manage, assign)
- [ ] Dashboard updated (dashboard:view)
- [ ] Settings updated (settings:view, settings:manage)
- [ ] DELETE endpoints use :delete permissions
- [ ] Backend builds successfully

---

### Phase C: Frontend Menu Guards

**Objective:** Update sidebar menu to use new permission names.

**Duration:** ~1 hour

**Files Affected:**
- `frontend/src/layout/Sidebar.tsx`

#### Step C.1: Update Permission Map

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

#### Step C.2: Verify Build

```bash
cd frontend
npm run build
# Should compile without errors
```

#### Checklist for Phase C

- [ ] Menu permission map updated
- [ ] All routes use new permission names
- [ ] Frontend builds successfully

---

### Phase D: Frontend Button Guards

**Objective:** Update all component permission checks to use new names.

**Duration:** ~2-3 hours

**Files Affected:**
- `frontend/src/pages/ModulePage.tsx`
- `frontend/src/pages/RolesPermissionsPage.tsx`
- `frontend/src/components/CommandBar.tsx`
- `frontend/src/pages/ServiceRequestsPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`

#### Step D.1: Update ModulePage Config

For each module config in `ModulePage.tsx`:

```typescript
// INCIDENTS
incidents: {
  permissions: { 
    create: 'incidents:create', 
    write: 'incidents:manage',
    export: 'incidents:export',
    delete: 'incidents:delete'  // if applicable
  }
}

// PROBLEMS (new namespace)
problems: {
  permissions: { 
    create: 'problems:create', 
    write: 'problems:manage',
    export: 'problems:export'
  }
}

// CHANGES
changes: {
  permissions: { 
    create: 'changes:create',
    write: 'changes:approve',
    export: 'changes:export'
  }
}

// INVENTORY
inventory: {
  permissions: { 
    create: 'inventory:create', 
    write: 'inventory:manage',
    export: 'inventory:export',
    delete: 'inventory:delete'
  }
}

// ACCESS MANAGEMENT
'access-management': {
  permissions: { 
    create: 'access:request',
    write: 'access:approve',
    export: 'access:export'
  }
}

// COMPLIANCE
compliance: {
  permissions: { 
    create: 'compliance:create', 
    write: 'compliance:manage',
    export: 'compliance:export'
  }
}

// PROJECTS (new namespace)
'projects-environments': {
  permissions: { 
    create: 'projects:create', 
    write: 'projects:manage',
    export: 'projects:export',
    delete: 'projects:delete'
  }
}

// VENDORS (new namespace)
'vendors-licenses': {
  permissions: { 
    create: 'vendors:create', 
    write: 'vendors:manage',
    export: 'vendors:export',
    delete: 'vendors:delete'
  }
}

// KNOWLEDGE BASE (new namespace)
'knowledge-base': {
  permissions: { 
    create: 'kb:create', 
    write: 'kb:publish',
    export: 'kb:export'
  }
}

// REPORTS (new namespace)
'reports-analytics': {
  permissions: { 
    create: 'reports:create',
    export: 'reports:export'
  }
}

// USERS (expanded)
'users-teams': {
  permissions: { 
    create: 'users:create', 
    write: 'users:manage',
    delete: 'users:delete',
    export: 'users:export'
  }
}
```

#### Step D.2: Update Status Action Permissions

In `ModulePage.tsx`, update `getStatusActions` to use appropriate permissions:

```typescript
function getStatusActions(moduleKey: string) {
  if (moduleKey === 'access-management') return [
    { label: 'Approve', value: 'APPROVED', permission: 'access:approve' },
    { label: 'Provision', value: 'PROVISIONED', permission: 'access:provision' },
    { label: 'Revoke', value: 'REVOKED', permission: 'access:revoke' }
  ];
  // ...
}
```

#### Step D.3: Update RolesPermissionsPage

```typescript
// Edit button guard
{hasPermission('roles:manage') && (
  <button onClick={() => openEdit(role)}>Edit</button>
)}

// Delete button guard
{hasPermission('roles:delete') && (
  <button onClick={() => deleteRole(role)}>Delete</button>
)}

// Create button guard
{hasPermission('roles:create') && (
  <button onClick={() => setCreateOpen(true)}>Create Role</button>
)}
```

#### Step D.4: Update ServiceRequestsPage

```typescript
const canCreate = hasPermission('tickets:create');
const canManage = hasPermission('tickets:manage');
const canAssign = hasPermission('tickets:assign');
const canExport = hasPermission('tickets:export');
```

#### Step D.5: Update CommandBar

```typescript
// Already uses 'ai:ask' - should remain unchanged
if (!hasPermission('ai:ask')) {
  return null;
}
```

#### Step D.6: Verify Build

```bash
cd frontend
npm run build
# Should compile without errors
```

#### Checklist for Phase D

- [ ] ModulePage configs updated with new permissions
- [ ] Status actions have appropriate permission checks
- [ ] RolesPermissionsPage updated
- [ ] ServiceRequestsPage updated
- [ ] Frontend builds successfully

---

### Phase E: Role Redesign

**Objective:** Create meaningful role hierarchies with distinct permissions.

**Duration:** ~2 hours

**Files Affected:**
- `backend/prisma/seed.ts`

#### Step E.1: Define New Role Structure

```typescript
// Role definitions with meaningful permissions

const superAdminRole = await prisma.role.upsert({
  where: { name: 'Super Admin' },
  update: {},
  create: { name: 'Super Admin', description: 'Full system access - can manage all resources and users' }
});

const adminRole = await prisma.role.upsert({
  where: { name: 'Admin' },
  update: {},
  create: { name: 'Admin', description: 'Administrative access - can manage all resources' }
});

const itManagerRole = await prisma.role.upsert({
  where: { name: 'IT Manager' },
  update: {},
  create: { name: 'IT Manager', description: 'IT management - full access to ITSM modules' }
});

const supportRole = await prisma.role.upsert({
  where: { name: 'IT Support' },
  update: {},
  create: { name: 'IT Support', description: 'Support staff - can manage tickets and incidents' }
});

const engineerRole = await prisma.role.upsert({
  where: { name: 'IT Engineer' },
  update: {},
  create: { name: 'IT Engineer', description: 'Technical staff - can create incidents and problems' }
});

const complianceOfficerRole = await prisma.role.upsert({
  where: { name: 'Compliance Officer' },
  update: {},
  create: { name: 'Compliance Officer', description: 'Compliance management - full access to compliance module' }
});

const employeeRole = await prisma.role.upsert({
  where: { name: 'Employee' },
  update: {},
  create: { name: 'Employee', description: 'Basic access - can view dashboard and submit requests' }
});

const viewerRole = await prisma.role.upsert({
  where: { name: 'Viewer' },
  update: {},
  create: { name: 'Viewer', description: 'Read-only access to dashboard and reports' }
});
```

#### Step E.2: Assign Permissions to Roles

```typescript
// Helper function to assign permissions
async function assignPermissions(roleId: string, permissionCodes: string[]) {
  for (const code of permissionCodes) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id }
      });
    }
  }
}

// Super Admin - all permissions
await assignPermissions(superAdminRole.id, await getAllPermissionCodes());

// Admin - all permissions except Super Admin deletion
await assignPermissions(adminRole.id, await getAllPermissionCodes());

// IT Manager - full ITSM access
await assignPermissions(itManagerRole.id, [
  'dashboard:view',
  'tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign', 'tickets:export',
  'incidents:view', 'incidents:create', 'incidents:manage', 'incidents:export',
  'problems:view', 'problems:create', 'problems:manage', 'problems:export',
  'changes:view', 'changes:create', 'changes:approve', 'changes:manage', 'changes:export',
  'inventory:view', 'inventory:create', 'inventory:manage', 'inventory:export',
  'access:view', 'access:approve', 'access:provision', 'access:revoke', 'access:export',
  'compliance:view', 'compliance:manage', 'compliance:export',
  'projects:view', 'projects:manage',
  'vendors:view', 'vendors:manage',
  'reports:view', 'reports:export',
  'ai:ask'
]);

// IT Support - ticket management
await assignPermissions(supportRole.id, [
  'dashboard:view',
  'tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign',
  'incidents:view', 'incidents:manage',
  'inventory:view',
  'access:view', 'access:provision',
  'ai:ask'
]);

// IT Engineer - technical access
await assignPermissions(engineerRole.id, [
  'dashboard:view',
  'tickets:view', 'tickets:create', 'tickets:manage',
  'incidents:view', 'incidents:create', 'incidents:manage',
  'problems:view', 'problems:create', 'problems:manage',
  'changes:view', 'changes:create',
  'inventory:view', 'inventory:manage',
  'ai:ask'
]);

// Compliance Officer - compliance focus
await assignPermissions(complianceOfficerRole.id, [
  'dashboard:view',
  'compliance:view', 'compliance:create', 'compliance:manage', 'compliance:audit', 'compliance:export',
  'reports:view', 'reports:export',
  'ai:ask'
]);

// Employee - basic access
await assignPermissions(employeeRole.id, [
  'dashboard:view',
  'tickets:view', 'tickets:create',
  'incidents:view',
  'access:view', 'access:request',
  'reports:view',
  'kb:view',
  'ai:ask'
]);

// Viewer - read only
await assignPermissions(viewerRole.id, [
  'dashboard:view',
  'reports:view',
  'kb:view'
]);
```

#### Step E.3: Remove Old Roles

Remove or keep legacy roles (Super Admin, Admin, Employee) if needed for backward compatibility.

#### Step E.4: Execute Updated Seed

```bash
cd backend
npx prisma db seed
```

#### Step E.5: Verify Role Assignments

```sql
-- Check Super Admin has all permissions
SELECT COUNT(*) as perm_count FROM RolePermission WHERE roleId = (SELECT id FROM Role WHERE name = 'Super Admin');

-- Check Employee has limited permissions
SELECT COUNT(*) as perm_count FROM RolePermission WHERE roleId = (SELECT id FROM Role WHERE name = 'Employee');
```

#### Checklist for Phase E

- [ ] New role definitions created
- [ ] Permissions assigned to each role
- [ ] Role hierarchy makes sense
- [ ] Seed executed successfully
- [ ] Role counts verified

---

### Phase F: Testing and Validation

**Objective:** Validate the migration through comprehensive testing.

**Duration:** ~4 hours

#### Step F.1: Unit Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

#### Step F.2: Integration Tests

Test each permission scenario:

| Role | Expected Access |
|------|-----------------|
| Super Admin | All modules, all actions |
| Admin | All modules, all actions |
| IT Manager | ITSM modules full, admin modules view |
| IT Support | Tickets/Incidents management |
| Employee | View dashboard, create tickets, view KB |

#### Step F.3: Manual Testing Checklist

**Login as Super Admin:**
- [ ] All menu items visible
- [ ] Can create in all modules
- [ ] Can edit in all modules
- [ ] Can delete where applicable
- [ ] Can export in all modules
- [ ] AI command bar visible

**Login as Employee:**
- [ ] Dashboard visible
- [ ] Service Requests visible, can create
- [ ] Incidents visible (read-only)
- [ ] Knowledge Base visible
- [ ] Reports visible
- [ ] AI command bar visible
- [ ] Cannot see: Settings, Users, Roles

**Login as IT Support:**
- [ ] Dashboard visible
- [ ] Service Requests visible, can manage
- [ ] Incidents visible, can manage
- [ ] Inventory visible
- [ ] AI command bar visible
- [ ] Cannot see: Settings, Users, Roles, Compliance

#### Step F.4: API Testing

Test each endpoint with different roles:

```bash
# As Employee (limited permissions)
curl -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  http://localhost:4000/api/service-requests
# Expected: 200 OK

curl -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  http://localhost:4000/api/users
# Expected: 403 Forbidden

# As Admin (full permissions)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/users
# Expected: 200 OK
```

#### Step F.5: Security Testing

1. **Permission bypass tests**
   - Attempt to access protected endpoints without token
   - Attempt to access with wrong permissions

2. **Privilege escalation tests**
   - Attempt to delete Super Admin role
   - Attempt to modify permissions without appropriate role

3. **Data isolation tests**
   - Verify users only see their permitted modules
   - Verify button guards work client-side

#### Step F.6: Performance Testing

```bash
# Test concurrent permission checks
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/dashboard/summary
```

#### Checklist for Phase F

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] API testing complete
- [ ] Security testing complete
- [ ] Performance acceptable

---

## Rollback Strategy

### If Phase A Fails

```bash
# Restore database from backup
mysql -u root -p saven_infraops < backup_before_migration.sql
```

### If Phase B Fails

1. Revert permission changes in route files
2. Restart backend
3. No database changes needed

### If Phase C/D Fails

1. Revert permission changes in frontend files
2. Rebuild frontend
3. No database changes needed

### If Phase E Fails

1. Restore seed file to previous state
2. Re-run seed
3. Restart backend

### If Phase F Fails

1. Identify specific test failures
2. Fix affected phase
3. Re-run from affected phase

---

## Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| Existing users lose access | Assign all new permissions to existing roles before deployment |
| Break existing integrations | Maintain backward compatibility during migration |
| Seed failure corrupts data | Full database backup before migration |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Frontend build fails | Test build before deployment |
| Permission typos | Use consistent naming convention |
| Test coverage gaps | Comprehensive manual testing |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Performance degradation | Test with concurrent users |
| Documentation outdated | Update docs with migration |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | RBAC Team | Initial migration plan |

---

*End of RBAC Migration Plan*
