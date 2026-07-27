# RBAC UI ACTION MATRIX

**Version:** 1.0  
**Date:** 2026-06-20  
**Purpose:** Complete inventory of all UI elements, actions, and permission mapping

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Total Modules | 15 |
| Total Pages | 15 |
| Total Buttons/Actions | 52 |
| Total Forms | 15 |
| Total Modals | 8 |
| Permission Gaps Found | 23 |
| Missing Frontend Guards | 18 |

---

## MODULE 1: DASHBOARD

**Route:** `/`  
**Component:** `DashboardPage.tsx`  
**Permission Required:** `dashboard:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Hero Panel | Section | None | Always visible |
| Open Service Requests Card | StatCard | `dashboard:read` | HIDE if missing |
| Critical Incidents Card | StatCard | `dashboard:read` | HIDE if missing |
| SLA Breaches Card | StatCard | `dashboard:read` | HIDE if missing |
| Pending Compliance Card | StatCard | `dashboard:read` | HIDE if missing |
| Available Assets Card | StatCard | `dashboard:read` | HIDE if missing |
| Pending Approvals Card | StatCard | `dashboard:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| None | - | - | - | - |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-01** | No export button exists, but `dashboard:export` recommended |
| **GAP-02** | Page visible without `dashboard:read` (sidebar filter only) |

---

## MODULE 2: SERVICE REQUESTS

**Route:** `/service-requests`  
**Component:** `ServiceRequestsPage.tsx`  
**Permission Required:** `tickets:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `tickets:read` | HIDE if missing |
| Statistics Section | Cards | `tickets:read` | HIDE if missing |
| Service Request Table | Table | `tickets:read` | HIDE if missing |
| Request Creation Modal | Modal | `tickets:write` | HIDE if missing |
| Detail Drawer | Drawer | `tickets:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `tickets:read` | `sr:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `sr:export` | HIDE if missing |
| Create Request | Open create modal | `tickets:write` | `sr:create` | HIDE if missing |
| Open | View detail | `tickets:read` | `sr:view` | HIDE if missing |
| Assign | Assign ticket | `tickets:assign` | `sr:manage` | HIDE if missing |
| Escalate | Escalate ticket | `tickets:write` | `sr:manage` | HIDE if missing |
| Wait for User | Change status | `tickets:write` | `sr:manage` | HIDE if missing |
| Close | Close ticket | `tickets:write` | `sr:manage` | HIDE if missing |
| Save Comment | Add comment | `tickets:write` | `sr:manage` | HIDE if missing |

### Forms
| Form | Fields | Permission | Visibility Rule |
|------|--------|------------|-----------------|
| Create Request | title, description, category, subCategory, priority, requesterName, projectName | `tickets:write` → `sr:create` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-03** | Export CSV has no backend permission check |
| **GAP-04** | Status change buttons not tied to specific permissions |
| **GAP-05** | Comment functionality shares `tickets:write` permission |

---

## MODULE 3: INCIDENTS

**Route:** `/incidents`  
**Component:** `ModulePage` with `moduleKey="incidents"`  
**Permission Required:** `incidents:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `incidents:read` | HIDE if missing |
| Statistics Cards | Cards | `incidents:read` | HIDE if missing |
| Incidents Table | Table | `incidents:read` | HIDE if missing |
| Create Modal | Modal | `incidents:write` | HIDE if missing |
| Detail Drawer | Drawer | `incidents:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `incidents:read` | `inc:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `inc:export` | HIDE if missing |
| Create | Open create modal | `incidents:write` | `inc:create` | HIDE if missing |
| Open | View detail | `incidents:read` | `inc:view` | HIDE if missing |
| Status dropdown | Change status | `incidents:write` | `inc:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-06** | Export CSV has no permission check |
| **GAP-07** | No granular status change permissions |

---

## MODULE 4: PROBLEMS

**Route:** `/problems`  
**Component:** `ModulePage` with `moduleKey="problems"`  
**Permission Required:** `incidents:read` (shared)

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `incidents:read` | HIDE if missing |
| Statistics Cards | Cards | `incidents:read` | HIDE if missing |
| Problems Table | Table | `incidents:read` | HIDE if missing |
| Create Modal | Modal | `incidents:write` | HIDE if missing |
| Detail Drawer | Drawer | `incidents:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `incidents:read` | `prb:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `prb:export` | HIDE if missing |
| Create | Open create modal | `incidents:write` | `prb:create` | HIDE if missing |
| Open | View detail | `incidents:read` | `prb:view` | HIDE if missing |
| Status dropdown | Change status | `incidents:write` | `prb:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-08** | Problems shares `incidents:read` permission |
| **GAP-09** | No dedicated problem permissions |
| **GAP-10** | Export CSV has no permission check |

---

## MODULE 5: CHANGES

**Route:** `/changes`  
**Component:** `ModulePage` with `moduleKey="changes"`  
**Permission Required:** `changes:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `changes:read` | HIDE if missing |
| Statistics Cards | Cards | `changes:read` | HIDE if missing |
| Changes Table | Table | `changes:read` | HIDE if missing |
| Create Modal | Modal | `changes:approve` | HIDE if missing |
| Detail Drawer | Drawer | `changes:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `changes:read` | `chg:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `chg:export` | HIDE if missing |
| Create | Open create modal | `changes:approve` | `chg:create` | HIDE if missing |
| Open | View detail | `changes:read` | `chg:view` | HIDE if missing |
| Status dropdown | Change status | `changes:approve` | `chg:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-11** | `changes:approve` used for both create and status changes |
| **GAP-12** | Export CSV has no permission check |
| **GAP-13** | No separate approve/reject permissions |

---

## MODULE 6: INVENTORY

**Route:** `/inventory`  
**Component:** `ModulePage` with `moduleKey="inventory"`  
**Permission Required:** `inventory:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `inventory:read` | HIDE if missing |
| Statistics Cards | Cards | `inventory:read` | HIDE if missing |
| Inventory Table | Table | `inventory:read` | HIDE if missing |
| Create Modal | Modal | `inventory:write` | HIDE if missing |
| Detail Drawer | Drawer | `inventory:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `inventory:read` | `inv:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `inv:export` | HIDE if missing |
| Create | Open create modal | `inventory:write` | `inv:create` | HIDE if missing |
| Open | View detail | `inventory:read` | `inv:view` | HIDE if missing |
| Status dropdown | Change status | `inventory:write` | `inv:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-14** | Export CSV has no permission check |
| **GAP-15** | No asset-specific actions (assign, dispose) permissions |

---

## MODULE 7: ACCESS MANAGEMENT

**Route:** `/access-management`  
**Component:** `ModulePage` with `moduleKey="access-management"`  
**Permission Required:** `access:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `access:read` | HIDE if missing |
| Statistics Cards | Cards | `access:read` | HIDE if missing |
| Access Table | Table | `access:read` | HIDE if missing |
| Create Modal | Modal | `access:approve` | HIDE if missing |
| Detail Drawer | Drawer | `access:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `access:read` | `acc:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `acc:export` | HIDE if missing |
| Create | Open create modal | `access:approve` | `acc:create` | HIDE if missing |
| Open | View detail | `access:read` | `acc:view` | HIDE if missing |
| Status dropdown | Change status | `access:approve` | `acc:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-16** | `access:approve` used for both create and status changes |
| **GAP-17** | Export CSV has no permission check |
| **GAP-18** | No separate approve/reject permissions |

---

## MODULE 8: COMPLIANCE

**Route:** `/compliance`  
**Component:** `ModulePage` with `moduleKey="compliance"`  
**Permission Required:** `compliance:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `compliance:read` | HIDE if missing |
| Statistics Cards | Cards | `compliance:read` | HIDE if missing |
| Compliance Table | Table | `compliance:read` | HIDE if missing |
| Create Modal | Modal | `compliance:write` | HIDE if missing |
| Detail Drawer | Drawer | `compliance:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `compliance:read` | `cmp:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `cmp:export` | HIDE if missing |
| Create | Open create modal | `compliance:write` | `cmp:create` | HIDE if missing |
| Open | View detail | `compliance:read` | `cmp:view` | HIDE if missing |
| Status dropdown | Change status | `compliance:write` | `cmp:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-19** | Export CSV has no permission check |
| **GAP-20** | No audit/exception specific permissions |

---

## MODULE 9: PROJECTS & ENVIRONMENTS

**Route:** `/projects-environments`  
**Component:** `ModulePage` with `moduleKey="projects-environments"`  
**Permission Required:** `settings:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `settings:read` | HIDE if missing |
| Statistics Cards | Cards | `settings:read` | HIDE if missing |
| Projects Table | Table | `settings:read` | HIDE if missing |
| Create Modal | Modal | `settings:write` | HIDE if missing |
| Detail Drawer | Drawer | `settings:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `settings:read` | `prj:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `prj:export` | HIDE if missing |
| Create | Open create modal | `settings:write` | `prj:create` | HIDE if missing |
| Open | View detail | `settings:read` | `prj:view` | HIDE if missing |
| Status dropdown | Change status | `settings:write` | `prj:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-21** | Uses `settings:read` instead of dedicated project permission |
| **GAP-22** | Export CSV has no permission check |

---

## MODULE 10: VENDORS & LICENSES

**Route:** `/vendors-licenses`  
**Component:** `ModulePage` with `moduleKey="vendors-licenses"`  
**Permission Required:** `settings:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `settings:read` | HIDE if missing |
| Statistics Cards | Cards | `settings:read` | HIDE if missing |
| Vendors Table | Table | `settings:read` | HIDE if missing |
| Create Modal | Modal | `settings:write` | HIDE if missing |
| Detail Drawer | Drawer | `settings:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `settings:read` | `vnd:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `vnd:export` | HIDE if missing |
| Create | Open create modal | `settings:write` | `vnd:create` | HIDE if missing |
| Open | View detail | `settings:read` | `vnd:view` | HIDE if missing |
| Status dropdown | Change status | `settings:write` | `vnd:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-23** | Uses `settings:read` instead of dedicated vendor permission |
| **GAP-24** | Export CSV has no permission check |

---

## MODULE 11: REPORTS & ANALYTICS

**Route:** `/reports-analytics`  
**Component:** `ModulePage` with `moduleKey="reports-analytics"`  
**Permission Required:** `dashboard:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `dashboard:read` | HIDE if missing |
| Static Report Cards | Cards | `dashboard:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `dashboard:read` | `rpt:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `rpt:export` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-25** | Uses `dashboard:read` instead of dedicated report permission |
| **GAP-26** | No generate/report-specific permissions |

---

## MODULE 12: KNOWLEDGE BASE

**Route:** `/knowledge-base`  
**Component:** `ModulePage` with `moduleKey="knowledge-base"`  
**Permission Required:** `dashboard:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `dashboard:read` | HIDE if missing |
| Statistics Cards | Cards | `dashboard:read` | HIDE if missing |
| Articles Table | Table | `dashboard:read` | HIDE if missing |
| Create Modal | Modal | `settings:write` | HIDE if missing |
| Detail Drawer | Drawer | `dashboard:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `dashboard:read` | `kb:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `kb:export` | HIDE if missing |
| Create | Open create modal | `settings:write` | `kb:create` | HIDE if missing |
| Open | View detail | `dashboard:read` | `kb:view` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-27** | Uses `dashboard:read` instead of dedicated KB permission |
| **GAP-28** | Create uses `settings:write` instead of `kb:create` |

---

## MODULE 13: USERS & TEAMS

**Route:** `/users-teams`  
**Component:** `ModulePage` with `moduleKey="users-teams"`  
**Permission Required:** `users:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `users:read` | HIDE if missing |
| Statistics Cards | Cards | `users:read` | HIDE if missing |
| Users Table | Table | `users:read` | HIDE if missing |
| Create User Modal | Modal | `users:write` | HIDE if missing |
| Detail Drawer | Drawer | `users:read` | HIDE if missing |
| Delete Confirmation Modal | Modal | `users:delete` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `users:read` | `usr:view` | HIDE if missing |
| Export CSV | Export data | **NONE** ⚠️ | `usr:export` | HIDE if missing |
| Create | Open create modal | `users:write` | `usr:create` | HIDE if missing |
| Open | View detail | `users:read` | `usr:view` | HIDE if missing |
| Delete | Delete user | `users:delete` | `usr:manage` | HIDE if missing |
| Status dropdown | Change status | `users:write` | `usr:manage` | HIDE if missing |

### Forms
| Form | Fields | Permission | Visibility Rule |
|------|--------|------------|-----------------|
| Create User | name, email, phoneNumber, department, roleId | `users:write` → `usr:create` | HIDE if missing |
| Edit User | name, email, phoneNumber, department, status | `users:write` → `usr:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-29** | Export CSV has no permission check |
| **GAP-30** | `users:delete` is separate from `usr:manage` |
| **GAP-31** | No activate/deactivate specific permissions |

---

## MODULE 14: ROLES & PERMISSIONS

**Route:** `/roles-permissions`  
**Component:** `RolesPermissionsPage.tsx`  
**Permission Required:** `users:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `users:read` | HIDE if missing |
| Roles Table | Table | `users:read` | HIDE if missing |
| Create Role Modal | Modal | `users:write` | HIDE if missing |
| Edit Role Modal | Modal | `users:write` | HIDE if missing |
| Permission Checkboxes | Form controls | `users:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Refresh | Refresh list | `users:read` | `rol:view` | HIDE if missing |
| Create Role | Open create modal | `users:write` | `rol:create` | HIDE if missing |
| Edit | Open edit modal | `users:write` | `rol:manage` | HIDE if missing |
| Delete | Delete role | `users:write` | `rol:manage` | HIDE if missing |
| Module checkbox | Toggle module permissions | `users:read` | `rol:manage` | HIDE if missing |
| Permission checkbox | Toggle individual permission | `users:read` | `rol:manage` | HIDE if missing |
| Save Changes | Save role | `users:write` | `rol:manage` | HIDE if missing |

### Forms
| Form | Fields | Permission | Visibility Rule |
|------|--------|------------|-----------------|
| Create Role | name, description, permissions[] | `users:write` → `rol:create` | HIDE if missing |
| Edit Role | name, description, permissions[] | `users:write` → `rol:manage` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-32** | Uses `users:read` and `users:write` instead of dedicated role permissions |
| **GAP-33** | No separate `rol:view`, `rol:create`, `rol:manage` permissions |
| **GAP-34** | Permission checkboxes should require `rol:manage`, not `users:read` |

---

## MODULE 15: SETTINGS

**Route:** `/settings`  
**Component:** `SettingsPage.tsx`  
**Permission Required:** `settings:read`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Page Header | Header | `settings:read` | HIDE if missing |
| Settings Grid | Display grid | `settings:read` | HIDE if missing |
| Setting Inputs | Read-only inputs | `settings:read` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| None | - | - | - | - |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-35** | Settings page is read-only (no save buttons) |
| **GAP-36** | No edit functionality in frontend despite `settings:write` backend |

---

## MODULE 16: AI COMMAND BAR

**Component:** `CommandBar.tsx`  
**Location:** Global header  
**Permission Required:** `ai:ask`

### Visible Components
| Component | Type | Permission | Visibility Rule |
|-----------|------|------------|-----------------|
| Command Input | Input field | `ai:ask` | HIDE if missing |
| Run Button | Submit button | `ai:ask` | HIDE if missing |
| Status Display | Output span | `ai:ask` | HIDE if missing |

### Buttons
| Button | Action | Current Permission | Recommended | Visibility Rule |
|--------|--------|-------------------|-------------|-----------------|
| Run | Submit command | `ai:ask` | `ai:use` | HIDE if missing |

### Permission Gaps
| Issue | Description |
|-------|-------------|
| **GAP-37** | CommandBar is always visible (no permission check in component) |
| **GAP-38** | No granular AI permissions (summarize, suggest, etc.) |

---

## COMPLETE ACTION INVENTORY TABLE

| Module | UI Element | Action | Current Permission | Recommended Permission | Visibility Rule | Gap ID |
|--------|------------|--------|-------------------|----------------------|-----------------|--------|
| Dashboard | Open SRs Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Dashboard | Critical Incidents Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Dashboard | SLA Breaches Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Dashboard | Compliance Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Dashboard | Assets Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Dashboard | Approvals Card | View | `dashboard:read` | `dashboard:view` | HIDE if missing | - |
| Service Requests | Refresh Button | Refresh | `tickets:read` | `sr:view` | HIDE if missing | - |
| Service Requests | Export CSV Button | Export | **NONE** | `sr:export` | HIDE if missing | GAP-03 |
| Service Requests | Create Request Button | Create | `tickets:write` | `sr:create` | HIDE if missing | - |
| Service Requests | Open Button | View | `tickets:read` | `sr:view` | HIDE if missing | - |
| Service Requests | Assign Button | Assign | `tickets:assign` | `sr:manage` | HIDE if missing | - |
| Service Requests | Escalate Button | Escalate | `tickets:write` | `sr:manage` | HIDE if missing | GAP-04 |
| Service Requests | Wait for User Button | Status | `tickets:write` | `sr:manage` | HIDE if missing | GAP-04 |
| Service Requests | Close Button | Status | `tickets:write` | `sr:manage` | HIDE if missing | GAP-04 |
| Service Requests | Save Comment Button | Comment | `tickets:write` | `sr:manage` | HIDE if missing | GAP-05 |
| Incidents | Refresh Button | Refresh | `incidents:read` | `inc:view` | HIDE if missing | - |
| Incidents | Export CSV Button | Export | **NONE** | `inc:export` | HIDE if missing | GAP-06 |
| Incidents | Create Button | Create | `incidents:write` | `inc:create` | HIDE if missing | - |
| Incidents | Open Button | View | `incidents:read` | `inc:view` | HIDE if missing | - |
| Incidents | Status Dropdown | Status | `incidents:write` | `inc:manage` | HIDE if missing | GAP-07 |
| Problems | Refresh Button | Refresh | `incidents:read` | `prb:view` | HIDE if missing | GAP-08 |
| Problems | Export CSV Button | Export | **NONE** | `prb:export` | HIDE if missing | GAP-09, GAP-10 |
| Problems | Create Button | Create | `incidents:write` | `prb:create` | HIDE if missing | GAP-08 |
| Problems | Open Button | View | `incidents:read` | `prb:view` | HIDE if missing | GAP-08 |
| Problems | Status Dropdown | Status | `incidents:write` | `prb:manage` | HIDE if missing | GAP-08 |
| Changes | Refresh Button | Refresh | `changes:read` | `chg:view` | HIDE if missing | - |
| Changes | Export CSV Button | Export | **NONE** | `chg:export` | HIDE if missing | GAP-12 |
| Changes | Create Button | Create | `changes:approve` | `chg:create` | HIDE if missing | GAP-11 |
| Changes | Open Button | View | `changes:read` | `chg:view` | HIDE if missing | - |
| Changes | Status Dropdown | Status | `changes:approve` | `chg:manage` | HIDE if missing | GAP-11, GAP-13 |
| Inventory | Refresh Button | Refresh | `inventory:read` | `inv:view` | HIDE if missing | - |
| Inventory | Export CSV Button | Export | **NONE** | `inv:export` | HIDE if missing | GAP-14 |
| Inventory | Create Button | Create | `inventory:write` | `inv:create` | HIDE if missing | - |
| Inventory | Open Button | View | `inventory:read` | `inv:view` | HIDE if missing | - |
| Inventory | Status Dropdown | Status | `inventory:write` | `inv:manage` | HIDE if missing | GAP-15 |
| Access Mgmt | Refresh Button | Refresh | `access:read` | `acc:view` | HIDE if missing | - |
| Access Mgmt | Export CSV Button | Export | **NONE** | `acc:export` | HIDE if missing | GAP-17 |
| Access Mgmt | Create Button | Create | `access:approve` | `acc:create` | HIDE if missing | GAP-16 |
| Access Mgmt | Open Button | View | `access:read` | `acc:view` | HIDE if missing | - |
| Access Mgmt | Status Dropdown | Status | `access:approve` | `acc:manage` | HIDE if missing | GAP-16, GAP-18 |
| Compliance | Refresh Button | Refresh | `compliance:read` | `cmp:view` | HIDE if missing | - |
| Compliance | Export CSV Button | Export | **NONE** | `cmp:export` | HIDE if missing | GAP-19 |
| Compliance | Create Button | Create | `compliance:write` | `cmp:create` | HIDE if missing | - |
| Compliance | Open Button | View | `compliance:read` | `cmp:view` | HIDE if missing | - |
| Compliance | Status Dropdown | Status | `compliance:write` | `cmp:manage` | HIDE if missing | GAP-20 |
| Projects | Refresh Button | Refresh | `settings:read` | `prj:view` | HIDE if missing | GAP-21 |
| Projects | Export CSV Button | Export | **NONE** | `prj:export` | HIDE if missing | GAP-22 |
| Projects | Create Button | Create | `settings:write` | `prj:create` | HIDE if missing | GAP-21 |
| Projects | Open Button | View | `settings:read` | `prj:view` | HIDE if missing | GAP-21 |
| Vendors | Refresh Button | Refresh | `settings:read` | `vnd:view` | HIDE if missing | GAP-23 |
| Vendors | Export CSV Button | Export | **NONE** | `vnd:export` | HIDE if missing | GAP-24 |
| Vendors | Create Button | Create | `settings:write` | `vnd:create` | HIDE if missing | GAP-23 |
| Vendors | Open Button | View | `settings:read` | `vnd:view` | HIDE if missing | GAP-23 |
| Reports | Refresh Button | Refresh | `dashboard:read` | `rpt:view` | HIDE if missing | GAP-25 |
| Reports | Export CSV Button | Export | **NONE** | `rpt:export` | HIDE if missing | GAP-26 |
| Knowledge Base | Refresh Button | Refresh | `dashboard:read` | `kb:view` | HIDE if missing | GAP-27 |
| Knowledge Base | Export CSV Button | Export | **NONE** | `kb:export` | HIDE if missing | GAP-27 |
| Knowledge Base | Create Button | Create | `settings:write` | `kb:create` | HIDE if missing | GAP-28 |
| Knowledge Base | Open Button | View | `dashboard:read` | `kb:view` | HIDE if missing | GAP-27 |
| Users | Refresh Button | Refresh | `users:read` | `usr:view` | HIDE if missing | - |
| Users | Export CSV Button | Export | **NONE** | `usr:export` | HIDE if missing | GAP-29 |
| Users | Create Button | Create | `users:write` | `usr:create` | HIDE if missing | - |
| Users | Open Button | View | `users:read` | `usr:view` | HIDE if missing | - |
| Users | Delete Button | Delete | `users:delete` | `usr:manage` | HIDE if missing | GAP-30 |
| Users | Status Dropdown | Status | `users:write` | `usr:manage` | HIDE if missing | GAP-31 |
| Roles | Refresh Button | Refresh | `users:read` | `rol:view` | HIDE if missing | GAP-32 |
| Roles | Create Role Button | Create | `users:write` | `rol:create` | HIDE if missing | GAP-33 |
| Roles | Edit Button | Edit | `users:write` | `rol:manage` | HIDE if missing | GAP-33 |
| Roles | Delete Button | Delete | `users:write` | `rol:manage` | HIDE if missing | GAP-33 |
| Roles | Module Checkbox | Toggle | `users:read` | `rol:manage` | HIDE if missing | GAP-34 |
| Roles | Permission Checkbox | Toggle | `users:read` | `rol:manage` | HIDE if missing | GAP-34 |
| Roles | Save Changes Button | Save | `users:write` | `rol:manage` | HIDE if missing | GAP-33 |
| Settings | Settings Grid | View | `settings:read` | `set:view` | HIDE if missing | GAP-35 |
| AI Command | Command Input | Input | `ai:ask` | `ai:use` | HIDE if missing | GAP-37 |
| AI Command | Run Button | Submit | `ai:ask` | `ai:use` | HIDE if missing | GAP-37 |

---

## PERMISSION GAPS SUMMARY

| Gap ID | Module | Issue | Severity | Backend Check |
|--------|--------|-------|----------|---------------|
| GAP-03 | Service Requests | Export CSV no permission | HIGH | NO |
| GAP-04 | Service Requests | Status buttons share write permission | MEDIUM | PARTIAL |
| GAP-05 | Service Requests | Comments share write permission | LOW | PARTIAL |
| GAP-06 | Incidents | Export CSV no permission | HIGH | NO |
| GAP-07 | Incidents | No granular status permissions | MEDIUM | NO |
| GAP-08 | Problems | Uses incidents:read permission | MEDIUM | NO |
| GAP-09 | Problems | Export CSV no permission | HIGH | NO |
| GAP-10 | Problems | Export CSV no permission | HIGH | NO |
| GAP-11 | Changes | approve used for create + status | HIGH | PARTIAL |
| GAP-12 | Changes | Export CSV no permission | HIGH | NO |
| GAP-13 | Changes | No separate reject permission | MEDIUM | NO |
| GAP-14 | Inventory | Export CSV no permission | HIGH | NO |
| GAP-15 | Inventory | No asset-specific permissions | MEDIUM | NO |
| GAP-16 | Access Mgmt | approve used for create + status | HIGH | PARTIAL |
| GAP-17 | Access Mgmt | Export CSV no permission | HIGH | NO |
| GAP-18 | Access Mgmt | No separate revoke permission | MEDIUM | NO |
| GAP-19 | Compliance | Export CSV no permission | HIGH | NO |
| GAP-20 | Compliance | No audit/exception permissions | MEDIUM | NO |
| GAP-21 | Projects | Uses settings:read permission | MEDIUM | NO |
| GAP-22 | Projects | Export CSV no permission | HIGH | NO |
| GAP-23 | Vendors | Uses settings:read permission | MEDIUM | NO |
| GAP-24 | Vendors | Export CSV no permission | HIGH | NO |
| GAP-25 | Reports | Uses dashboard:read permission | MEDIUM | NO |
| GAP-26 | Reports | Export CSV no permission | HIGH | NO |
| GAP-27 | Knowledge Base | Uses dashboard:read permission | MEDIUM | NO |
| GAP-28 | Knowledge Base | Create uses settings:write | MEDIUM | NO |
| GAP-29 | Users | Export CSV no permission | HIGH | NO |
| GAP-30 | Users | delete separate from manage | LOW | YES |
| GAP-31 | Users | No activate/deactivate permissions | MEDIUM | NO |
| GAP-32 | Roles | Uses users:read/write permissions | HIGH | PARTIAL |
| GAP-33 | Roles | No granular role permissions | HIGH | PARTIAL |
| GAP-34 | Roles | Permission checkboxes need rol:manage | MEDIUM | NO |
| GAP-35 | Settings | Frontend read-only despite write backend | MEDIUM | YES |
| GAP-36 | Settings | No edit UI despite write backend | MEDIUM | PARTIAL |
| GAP-37 | AI Command | No frontend permission check | HIGH | YES |
| GAP-38 | AI Command | No granular AI permissions | LOW | NO |

---

## TOP 20 RBAC ISSUES

1. **Export CSV buttons have NO backend permission checks** (11 occurrences) - HIGH
2. **CommandBar has no frontend permission guard** - HIGH
3. **Changes and Access modules use approve permission for create** - HIGH
4. **Roles page uses users:read/write instead of dedicated role permissions** - HIGH
5. **Problems module shares incidents:read permission** - MEDIUM
6. **Settings frontend is read-only despite write backend** - MEDIUM
7. **Projects and Vendors use settings:read permission** - MEDIUM
8. **Knowledge Base uses dashboard:read permission** - MEDIUM
9. **Reports uses dashboard:read permission** - MEDIUM
10. **Permission checkboxes in Roles modal require users:read, not rol:manage** - MEDIUM
11. **Status change buttons share write permission** - MEDIUM
12. **No separate approve/reject permissions for Changes** - MEDIUM
13. **No separate revoke permission for Access** - MEDIUM
14. **No granular AI permissions (summarize, suggest)** - LOW
15. **Users module has separate users:delete instead of usr:manage** - LOW
16. **Comments share write permission in Service Requests** - LOW
17. **No asset-specific permissions (assign, dispose) in Inventory** - MEDIUM
18. **No audit/exception permissions in Compliance** - MEDIUM
19. **Users module lacks activate/deactivate specific permissions** - MEDIUM
20. **Settings page has no edit UI despite settings:write backend** - MEDIUM

---

## RECOMMENDATIONS

### Immediate Actions (Phase 1)
1. Add permission checks to all Export CSV buttons
2. Add permission guard to CommandBar component
3. Add `rol:view`, `rol:create`, `rol:manage` permissions
4. Fix permission checkboxes in Roles modal

### Short Term (Phase 2)
1. Separate create from manage permissions in Changes/Access
2. Create dedicated permissions for Projects, Vendors, KB, Reports
3. Add granular status change permissions
4. Add edit UI to Settings page

### Long Term (Phase 3)
1. Add granular AI permissions
2. Add asset lifecycle permissions
3. Add compliance audit permissions
4. Implement full simplified RBAC model

---

**Document Version:** 1.0  
**Generated:** 2026-06-20  
**Status:** Ready for Review
