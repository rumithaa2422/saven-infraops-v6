# Phase 4D - RBAC Validation: Users & Teams

**Date:** 2024  
**Branch:** feature/rbac-redesign  
**Status:** SEED DATA COMPLETE | VALIDATION PENDING (MySQL required)

---

## Executive Summary

This document outlines the test roles, test users, and validation checklist for the Users & Teams RBAC implementation in Phase 4D.

---

## Test Roles Created

| Role | Permissions | Purpose |
|------|-------------|---------|
| **User Viewer** | `users:view` | Test read-only access |
| **User Creator** | `users:view`, `users:create` | Test create-only access |
| **User Manager** | `users:view`, `users:manage` | Test manage-only access |
| **User Admin** | `users:view`, `users:create`, `users:manage`, `users:delete`, `users:export` | Test full access |

---

## Test Users

| Email | Password | Role | Expected Permissions |
|-------|----------|------|---------------------|
| `viewer@saven.in` | `Test@12345` | User Viewer | View users only |
| `creator@saven.in` | `Test@12345` | User Creator | View + Create users |
| `manager@saven.in` | `Test@12345` | User Manager | View + Manage users |
| `useradmin@saven.in` | `Test@12345` | User Admin | Full user management |
| `admin@saven.in` | `Admin@12345` | Admin | All permissions (existing) |

---

## Frontend Visibility Rules

### Expected UI Elements by Role

| UI Element | Viewer | Creator | Manager | Admin |
|------------|--------|---------|---------|-------|
| **User List Table** | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| **Open Button** | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| **User Drawer** | ✅ Opens | ✅ Opens | ✅ Opens | ✅ Opens |
| **Status Actions (Enable/Disable)** | ❌ Hidden | ❌ Hidden | ✅ Visible | ✅ Visible |
| **Create Button** | ❌ Hidden | ✅ Visible | ❌ Hidden | ✅ Visible |
| **Create Modal** | ❌ Hidden | ✅ Opens | ❌ Hidden | ✅ Opens |
| **Delete Button** | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible |
| **Export Button** | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible |

### Permission to UI Mapping

```
users:view → Open button, Drawer visibility
users:create → Create button, Create modal
users:manage → Status actions (Enable/Disable)
users:delete → Delete button
users:export → Export CSV button
```

---

## Backend Authorization Matrix

### Endpoint: GET /api/generic/users-teams

| Role | Permission Checked | Expected Result |
|------|-------------------|-----------------|
| Viewer | `users:read` OR `users:view` | ✅ 200 OK |
| Creator | `users:read` OR `users:view` | ✅ 200 OK |
| Manager | `users:read` OR `users:view` | ✅ 200 OK |
| Admin | `users:read` OR `users:view` | ✅ 200 OK |

### Endpoint: POST /api/generic/users-teams

| Role | Permission Checked | Expected Result |
|------|-------------------|-----------------|
| Viewer | `users:write` OR `users:create` | ❌ 403 Forbidden |
| Creator | `users:write` OR `users:create` | ✅ 201 Created |
| Manager | `users:write` OR `users:create` | ❌ 403 Forbidden |
| Admin | `users:write` OR `users:create` | ✅ 201 Created |

### Endpoint: PATCH /api/generic/users-teams/:id

| Role | Permission Checked | Expected Result |
|------|-------------------|-----------------|
| Viewer | `users:write` OR `users:manage` | ❌ 403 Forbidden |
| Creator | `users:write` OR `users:manage` | ❌ 403 Forbidden |
| Manager | `users:write` OR `users:manage` | ✅ 200 OK |
| Admin | `users:write` OR `users:manage` | ✅ 200 OK |

### Endpoint: DELETE /api/users-teams/:id

| Role | Permission Checked | Expected Result |
|------|-------------------|-----------------|
| Viewer | `users:delete` | ❌ 403 Forbidden |
| Creator | `users:delete` | ❌ 403 Forbidden |
| Manager | `users:delete` | ❌ 403 Forbidden |
| Admin | `users:delete` | ✅ 200 OK |

---

## Validation Checklist

### Phase 4D.1: Seed Data Verification

- [ ] Run `npm run db:seed` successfully
- [ ] Verify 4 new roles created in database
- [ ] Verify 4 new test users created in database
- [ ] Verify role-permission assignments are correct

### Phase 4D.2: Backend Authorization Tests

- [ ] Login as `viewer@saven.in` - GET /api/generic/users-teams → 200
- [ ] Login as `viewer@saven.in` - POST /api/generic/users-teams → 403
- [ ] Login as `viewer@saven.in` - PATCH /api/generic/users-teams/:id → 403
- [ ] Login as `viewer@saven.in` - DELETE /api/users-teams/:id → 403

- [ ] Login as `creator@saven.in` - GET /api/generic/users-teams → 200
- [ ] Login as `creator@saven.in` - POST /api/generic/users-teams → 201
- [ ] Login as `creator@saven.in` - PATCH /api/generic/users-teams/:id → 403
- [ ] Login as `creator@saven.in` - DELETE /api/users-teams/:id → 403

- [ ] Login as `manager@saven.in` - GET /api/generic/users-teams → 200
- [ ] Login as `manager@saven.in` - POST /api/generic/users-teams → 403
- [ ] Login as `manager@saven.in` - PATCH /api/generic/users-teams/:id → 200
- [ ] Login as `manager@saven.in` - DELETE /api/users-teams/:id → 403

- [ ] Login as `useradmin@saven.in` - GET /api/generic/users-teams → 200
- [ ] Login as `useradmin@saven.in` - POST /api/generic/users-teams → 201
- [ ] Login as `useradmin@saven.in` - PATCH /api/generic/users-teams/:id → 200
- [ ] Login as `useradmin@saven.in` - DELETE /api/users-teams/:id → 200

### Phase 4D.3: Frontend Visibility Tests

- [ ] Login as `viewer@saven.in`:
  - [ ] User list table visible
  - [ ] Open button visible
  - [ ] Create button hidden
  - [ ] Delete button hidden
  - [ ] Export button hidden

- [ ] Login as `creator@saven.in`:
  - [ ] User list table visible
  - [ ] Open button visible
  - [ ] Create button visible
  - [ ] Create modal opens
  - [ ] Delete button hidden
  - [ ] Export button hidden

- [ ] Login as `manager@saven.in`:
  - [ ] User list table visible
  - [ ] Open button visible
  - [ ] Drawer opens with status actions
  - [ ] Create button hidden
  - [ ] Delete button hidden
  - [ ] Export button hidden

- [ ] Login as `useradmin@saven.in`:
  - [ ] User list table visible
  - [ ] Open button visible
  - [ ] Create button visible
  - [ ] Delete button visible
  - [ ] Export button visible
  - [ ] All actions work correctly

### Phase 4D.4: Backward Compatibility Tests

- [ ] Login as `admin@saven.in` (existing admin):
  - [ ] All UI elements visible
  - [ ] All endpoints return 200/201
  - [ ] No regression in existing functionality

---

## Seed Data Structure

### Roles Created

```typescript
const viewerRole = await prisma.role.create({
  name: 'User Viewer',
  description: 'Can view user list only - cannot create, edit, or delete users'
});

const userCreatorRole = await prisma.role.create({
  name: 'User Creator', 
  description: 'Can view and create users - cannot edit or delete'
});

const userManagerRole = await prisma.role.create({
  name: 'User Manager',
  description: 'Can view and manage users - cannot delete'
});

const userAdminRole = await prisma.role.create({
  name: 'User Admin',
  description: 'Full user management - can view, create, edit, delete, and export users'
});
```

### Role-Permission Assignments

| Role | Permissions Assigned |
|------|---------------------|
| User Viewer | `users:view` |
| User Creator | `users:view`, `users:create` |
| User Manager | `users:view`, `users:manage` |
| User Admin | `users:view`, `users:create`, `users:manage`, `users:delete`, `users:export` |

---

## Backend Permission Checks

### Source: backend/src/modules/generic/generic.routes.ts

```typescript
'users-teams': {
  permission: 'users:read',           // Legacy for list
  viewPermission: 'users:view',       // NEW for list (OR with legacy)
  createPermission: 'users:create',    // NEW for create
  writePermission: 'users:write',     // Legacy for update
  managePermission: 'users:manage',   // NEW for update (OR with legacy)
  deletePermission: 'users:delete',    // Legacy for delete
  exportPermission: 'users:export',   // NEW for export
}
```

### Middleware: requirePermissionOr

The backend uses OR logic for backward compatibility:
- List: `users:read` OR `users:view`
- Create: `users:write` OR `users:create`
- Update: `users:write` OR `users:manage`
- Delete: `users:delete` only

---

## Test Execution Guide

### Prerequisites

1. MySQL 8.x running locally
2. Database migrations applied: `npm run db:migrate`
3. Seed data applied: `npm run db:seed`

### Manual Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:3001
4. Login with test credentials
5. Navigate to Users & Teams module
6. Verify UI elements match expected visibility

### API Testing with curl

```bash
# Login as viewer
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@saven.in","password":"Test@12345"}' \
  | jq -r '.token')

# Test GET (should succeed)
curl -X GET http://localhost:4000/api/generic/users-teams \
  -H "Authorization: Bearer $TOKEN"

# Test POST (should fail with 403)
curl -X POST http://localhost:4000/api/generic/users-teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","department":"Engineering"}'
```

---

## Known Limitations

1. **MySQL Required**: Validation requires a running MySQL instance
2. **Manual Testing**: Full validation requires human interaction or API testing
3. **Export Permission**: Export is client-side only, no backend endpoint

---

## Validation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Seed Data | ✅ Complete | Test roles and users added to seed.ts |
| Backend Authorization | ⏳ Pending | Requires MySQL to verify |
| Frontend Visibility | ⏳ Pending | Requires MySQL to verify |
| Documentation | ✅ Complete | This document |

---

## Commit History

| Commit | Description |
|--------|-------------|
| `01e2764` | Phase 4C: Implement users action-level permissions |
| `67fa634` | Phase 4D: Add test roles and users for validation |

---

*End of Phase 4D Validation Document*
