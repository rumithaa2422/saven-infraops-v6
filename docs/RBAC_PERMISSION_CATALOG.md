# RBAC Permission Catalog

**Document Version:** 1.0  
**Date:** 2024  
**Repository:** Saven InfraOps Enterprise V6  
**Branch:** feature/rbac-redesign

---

## Table of Contents

1. [Overview](#overview)
2. [Permission Naming Convention](#permission-naming-convention)
3. [Module Permission Catalogs](#module-permission-catalogs)
   - [Users & Teams](#users--teams)
   - [Roles & Permissions](#roles--permissions)
   - [Service Requests](#service-requests)
   - [Incidents](#incidents)
   - [Problems](#problems)
   - [Changes](#changes)
   - [Inventory](#inventory)
   - [Access Management](#access-management)
   - [Compliance](#compliance)
   - [Projects & Environments](#projects--environments)
   - [Vendors & Licenses](#vendors--licenses)
   - [Knowledge Base](#knowledge-base)
   - [Reports & Analytics](#reports--analytics)
   - [Settings](#settings)
   - [Dashboard](#dashboard)
   - [AI Assistant](#ai-assistant)
4. [Permission Summary Table](#permission-summary-table)

---

## Overview

This document defines the complete RBAC permission model for Saven InfraOps Enterprise V6. Each module has its own permission namespace with granular actions.

### Permission Types

| Type | Suffix | Description |
|------|--------|-------------|
| View | `:view` | Read-only access to list and view details |
| Create | `:create` | Create new records |
| Manage | `:manage` | Update existing records |
| Delete | `:delete` | Delete records |
| Export | `:export` | Export data to CSV/Excel |
| Special | `:approve` | Approval workflow (where applicable) |
| Special | `:assign` | Assignment workflow (where applicable) |

---

## Permission Naming Convention

### Format

```
{module}:{action}
```

### Examples

```
users:view        // View users list and details
users:create      // Create new users
users:manage      // Update user information
users:delete      // Delete users
users:export      // Export user data

incidents:view    // View incidents list and details
incidents:create  // Create new incidents
incidents:manage  // Update incident status, severity
incidents:export  // Export incident data
```

### Module Name Mapping

| Module Display Name | Namespace |
|-------------------|-----------|
| Users & Teams | `users` |
| Roles & Permissions | `roles` |
| Service Requests | `tickets` |
| Incidents | `incidents` |
| Problems | `problems` |
| Changes | `changes` |
| Inventory | `inventory` |
| Access Management | `access` |
| Compliance | `compliance` |
| Projects & Environments | `projects` |
| Vendors & Licenses | `vendors` |
| Knowledge Base | `kb` |
| Reports & Analytics | `reports` |
| Settings | `settings` |
| Dashboard | `dashboard` |
| AI Assistant | `ai` |

---

## Module Permission Catalogs

---

### Users & Teams

**Namespace:** `users`

**Purpose:** Manage system users and team members including account creation, role assignment, and deactivation.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `users:view` | View users list, details, and team assignments | `users:read` |
| `users:create` | Create new user accounts | `users:write` |
| `users:manage` | Update user details, assign roles, change status | `users:write` |
| `users:delete` | Delete user accounts | `users:delete` |
| `users:export` | Export user data to CSV | `users:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Users List | `users:view` | Menu item, Table |
| View User Details | `users:view` | Open button, Drawer |
| Create User | `users:create` | Create button, Modal |
| Update User | `users:manage` | Status actions in drawer |
| Delete User | `users:delete` | Delete button |
| Export Users | `users:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `users:view` | Sidebar filter |
| Refresh Button | `users:view` | Optional |
| Create Button | `users:create` | Button guard |
| Export CSV | `users:export` | Button guard |
| Open User | `users:view` | Optional |
| Delete User | `users:delete` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `users:*` |
| Admin | All `users:*` |
| IT Manager | `users:view`, `users:manage` |
| HR Manager | `users:view`, `users:create` |
| Employee | None (self-service via profile) |

---

### Roles & Permissions

**Namespace:** `roles`

**Purpose:** Define and manage roles with associated permissions for RBAC system administration.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `roles:view` | View roles list and permission catalog | `users:read` |
| `roles:create` | Create new roles | `users:write` |
| `roles:manage` | Update role name, description, permissions | `users:write` |
| `roles:delete` | Delete roles (except Super Admin) | `users:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Roles List | `roles:view` | Menu item, Table |
| View Permissions Catalog | `roles:view` | Module permission grid |
| Create Role | `roles:create` | Create button, Modal |
| Edit Role | `roles:manage` | Edit button, Modal |
| Delete Role | `roles:delete` | Delete button |
| Update Role Permissions | `roles:manage` | Permission checkboxes |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `roles:view` | Sidebar filter |
| Refresh Button | `roles:view` | Optional |
| Create Button | `roles:create` | Button guard |
| Edit Button | `roles:manage` | Button guard |
| Delete Button | `roles:delete` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `roles:*` |
| Admin | All `roles:*` |
| Security Admin | `roles:view`, `roles:manage` (no delete) |

**Note:** Role management is tightly coupled with user management. The `roles:create`, `roles:manage`, `roles:delete` permissions should typically be granted alongside `users:create`, etc.

---

### Service Requests

**Namespace:** `tickets`

**Purpose:** Submit and manage IT service requests/tickets for infrastructure support.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `tickets:view` | View service requests list and details | `tickets:read` |
| `tickets:create` | Submit new service requests | `tickets:write` |
| `tickets:manage` | Update status, priority, close tickets | `tickets:write` |
| `tickets:assign` | Assign tickets to team members | `tickets:assign` |
| `tickets:export` | Export ticket data | `tickets:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Tickets List | `tickets:view` | Menu item, Table |
| View Ticket Details | `tickets:view` | Open button, Drawer |
| Create Ticket | `tickets:create` | Create button, Modal |
| Assign Ticket | `tickets:assign` | Assign button |
| Escalate Ticket | `tickets:manage` | Escalate button |
| Change Status | `tickets:manage` | Status buttons |
| Add Comment | `tickets:manage` | Comment box |
| Close Ticket | `tickets:manage` | Close button |
| Export Tickets | `tickets:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `tickets:view` | Sidebar filter |
| Refresh Button | `tickets:view` | Optional |
| Create Button | `tickets:create` | Button guard |
| Export CSV | `tickets:export` | Button guard |
| Open Ticket | `tickets:view` | Optional |
| Assign Button | `tickets:assign` | Button guard |
| Escalate/Close | `tickets:manage` | Button guard |
| Comment Box | `tickets:manage` | Container guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `tickets:*` |
| Admin | All `tickets:*` |
| IT Support | `tickets:view`, `tickets:manage`, `tickets:assign` |
| IT Manager | All `tickets:*` |
| Employee | `tickets:view` (own), `tickets:create` |

---

### Incidents

**Namespace:** `incidents`

**Purpose:** Log and track IT incidents that disrupt or threaten to disrupt IT services.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `incidents:view` | View incidents list and details | `incidents:read` |
| `incidents:create` | Create new incident records | `incidents:write` |
| `incidents:manage` | Update status, severity, close incidents | `incidents:write` |
| `incidents:export` | Export incident data | `incidents:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Incidents List | `incidents:view` | Menu item, Table |
| View Incident Details | `incidents:view` | Open button, Drawer |
| Create Incident | `incidents:create` | Create button, Modal |
| Update Incident | `incidents:manage` | Status actions |
| Export Incidents | `incidents:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `incidents:view` | Sidebar filter |
| Refresh Button | `incidents:view` | Optional |
| Create Button | `incidents:create` | Button guard |
| Export CSV | `incidents:export` | Button guard |
| Open Incident | `incidents:view` | Optional |
| Status Actions | `incidents:manage` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `incidents:*` |
| Admin | All `incidents:*` |
| NOC Team | `incidents:view`, `incidents:manage` |
| IT Manager | All `incidents:*` |
| Employee | `incidents:view` (read-only) |

---

### Problems

**Namespace:** `problems`

**Purpose:** Track and manage IT problems (root causes of incidents) for prevention.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `problems:view` | View problems list and details | `incidents:read` |
| `problems:create` | Create new problem records | `incidents:write` |
| `problems:manage` | Update status, root cause, close problems | `incidents:write` |
| `problems:export` | Export problem data | `incidents:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Problems List | `problems:view` | Menu item, Table |
| View Problem Details | `problems:view` | Open button, Drawer |
| Create Problem | `problems:create` | Create button, Modal |
| Update Problem | `problems:manage` | Status actions |
| Export Problems | `problems:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `problems:view` | Sidebar filter |
| Create Button | `problems:create` | Button guard |
| Status Actions | `problems:manage` | Button guard |
| Export CSV | `problems:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `problems:*` |
| Admin | All `problems:*` |
| Problem Manager | All `problems:*` |
| Engineer | `problems:view`, `problems:create` |

**Note:** Currently Problems shares `incidents:*` permissions. This should be separated for proper RBAC.

---

### Changes

**Namespace:** `changes`

**Purpose:** Manage IT change requests for planned modifications with approval workflow.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `changes:view` | View change requests list and details | `changes:read` |
| `changes:create` | Submit new change requests | `changes:approve` |
| `changes:approve` | Approve or reject change requests | `changes:approve` |
| `changes:manage` | Update change status, implement changes | `changes:approve` |
| `changes:export` | Export change data | `changes:approve` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Changes List | `changes:view` | Menu item, Table |
| View Change Details | `changes:view` | Open button, Drawer |
| Create Change | `changes:create` | Create button, Modal |
| Approve/Reject | `changes:approve` | Status actions |
| Update Change | `changes:manage` | Status actions |
| Export Changes | `changes:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `changes:view` | Sidebar filter |
| Create Button | `changes:create` | Button guard |
| Status Actions | `changes:approve` or `changes:manage` | Button guard |
| Export CSV | `changes:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `changes:*` |
| Admin | All `changes:*` |
| CAB Member | `changes:view`, `changes:approve` |
| IT Staff | `changes:view`, `changes:create` |
| Change Manager | All `changes:*` |

---

### Inventory

**Namespace:** `inventory`

**Purpose:** Manage IT hardware and software assets (CMDB) for tracking and allocation.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `inventory:view` | View assets list and details | `inventory:read` |
| `inventory:create` | Add new assets to inventory | `inventory:write` |
| `inventory:manage` | Update asset info, change status, assign | `inventory:write` |
| `inventory:delete` | Remove assets from inventory | `inventory:write` |
| `inventory:export` | Export inventory data | `inventory:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Assets List | `inventory:view` | Menu item, Table |
| View Asset Details | `inventory:view` | Open button, Drawer |
| Create Asset | `inventory:create` | Create button, Modal |
| Update Asset | `inventory:manage` | Status actions |
| Delete Asset | `inventory:delete` | Delete button |
| Export Assets | `inventory:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `inventory:view` | Sidebar filter |
| Create Button | `inventory:create` | Button guard |
| Status Actions | `inventory:manage` | Button guard |
| Delete Button | `inventory:delete` | Button guard |
| Export CSV | `inventory:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `inventory:*` |
| Admin | All `inventory:*` |
| Asset Manager | All `inventory:*` |
| Procurement | `inventory:view`, `inventory:create` |
| IT Staff | `inventory:view`, `inventory:manage` |

---

### Access Management

**Namespace:** `access`

**Purpose:** Manage user access requests for IT systems with approval workflow.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `access:view` | View access requests list and details | `access:read` |
| `access:request` | Submit new access requests | `access:approve` |
| `access:approve` | Approve or reject access requests | `access:approve` |
| `access:provision` | Provision granted access | `access:approve` |
| `access:revoke` | Revoke existing access | `access:approve` |
| `access:export` | Export access request data | `access:approve` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Access List | `access:view` | Menu item, Table |
| View Request Details | `access:view` | Open button, Drawer |
| Create Request | `access:request` | Create button, Modal |
| Approve Request | `access:approve` | Approve button |
| Provision Access | `access:provision` | Provision button |
| Revoke Access | `access:revoke` | Revoke button |
| Export Requests | `access:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `access:view` | Sidebar filter |
| Create Button | `access:request` | Button guard |
| Approve Button | `access:approve` | Button guard |
| Provision Button | `access:provision` | Button guard |
| Revoke Button | `access:revoke` | Button guard |
| Export CSV | `access:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `access:*` |
| Admin | All `access:*` |
| Manager | `access:view`, `access:approve` |
| IT Admin | `access:view`, `access:provision`, `access:revoke` |
| Employee | `access:view` (own), `access:request` |

---

### Compliance

**Namespace:** `compliance`

**Purpose:** Manage IT compliance controls and regulatory requirements (SOC2, ISO27001, GDPR).

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `compliance:view` | View compliance controls list and details | `compliance:read` |
| `compliance:create` | Add new compliance controls | `compliance:write` |
| `compliance:manage` | Update control status, evidence, owners | `compliance:write` |
| `compliance:audit` | Mark controls as audited/reviewed | `compliance:write` |
| `compliance:export` | Export compliance data | `compliance:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Controls List | `compliance:view` | Menu item, Table |
| View Control Details | `compliance:view` | Open button, Drawer |
| Create Control | `compliance:create` | Create button, Modal |
| Update Control | `compliance:manage` | Status actions |
| Mark Audited | `compliance:audit` | Status actions |
| Export Controls | `compliance:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `compliance:view` | Sidebar filter |
| Create Button | `compliance:create` | Button guard |
| Status Actions | `compliance:manage` or `compliance:audit` | Button guard |
| Export CSV | `compliance:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `compliance:*` |
| Admin | All `compliance:*` |
| Compliance Officer | All `compliance:*` |
| Auditor | `compliance:view`, `compliance:audit` |
| Control Owner | `compliance:view`, `compliance:manage` |

---

### Projects & Environments

**Namespace:** `projects`

**Purpose:** Manage IT projects and their associated environments (dev, staging, production).

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `projects:view` | View projects list and details | `dashboard:read` |
| `projects:create` | Add new projects | `settings:write` |
| `projects:manage` | Update project details | `settings:write` |
| `projects:delete` | Remove projects | `settings:write` |
| `projects:export` | Export project data | `settings:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Projects List | `projects:view` | Menu item, Table |
| View Project Details | `projects:view` | Open button, Drawer |
| Create Project | `projects:create` | Create button, Modal |
| Update Project | `projects:manage` | Status actions |
| Delete Project | `projects:delete` | Delete button |
| Export Projects | `projects:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `projects:view` | Sidebar filter |
| Create Button | `projects:create` | Button guard |
| Status Actions | `projects:manage` | Button guard |
| Delete Button | `projects:delete` | Button guard |
| Export CSV | `projects:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `projects:*` |
| Admin | All `projects:*` |
| PMO | All `projects:*` |
| IT Staff | `projects:view` |

**Note:** Currently uses `dashboard:read` for view and `settings:write` for create. Should be separated.

---

### Vendors & Licenses

**Namespace:** `vendors`

**Purpose:** Manage IT vendors, software licenses, and subscription tracking.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `vendors:view` | View vendors list and details | `dashboard:read` |
| `vendors:create` | Add new vendors/licenses | `settings:write` |
| `vendors:manage` | Update vendor/license details | `settings:write` |
| `vendors:delete` | Remove vendors/licenses | `settings:write` |
| `vendors:export` | Export vendor data | `settings:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Vendors List | `vendors:view` | Menu item, Table |
| View Vendor Details | `vendors:view` | Open button, Drawer |
| Create Vendor | `vendors:create` | Create button, Modal |
| Update Vendor | `vendors:manage` | Status actions |
| Delete Vendor | `vendors:delete` | Delete button |
| Export Vendors | `vendors:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `vendors:view` | Sidebar filter |
| Create Button | `vendors:create` | Button guard |
| Status Actions | `vendors:manage` | Button guard |
| Delete Button | `vendors:delete` | Button guard |
| Export CSV | `vendors:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `vendors:*` |
| Admin | All `vendors:*` |
| ITAM Manager | All `vendors:*` |
| Procurement | `vendors:view`, `vendors:create` |
| Employee | `vendors:view` (read-only) |

**Note:** Currently uses `dashboard:read` for view and `settings:write` for create. Should be separated.

---

### Knowledge Base

**Namespace:** `kb`

**Purpose:** Manage IT knowledge base articles for documentation and self-service support.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `kb:view` | View knowledge base articles | `dashboard:read` |
| `kb:create` | Create new articles | `settings:write` |
| `kb:publish` | Publish articles to make visible | `settings:write` |
| `kb:manage` | Edit and update articles | `settings:write` |
| `kb:archive` | Archive obsolete articles | `settings:write` |
| `kb:export` | Export knowledge base data | `settings:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Articles List | `kb:view` | Menu item, Table |
| View Article Details | `kb:view` | Open button, Drawer |
| Create Article | `kb:create` | Create button, Modal |
| Publish Article | `kb:publish` | Status actions |
| Update Article | `kb:manage` | Status actions |
| Archive Article | `kb:archive` | Status actions |
| Export Articles | `kb:export` | Export CSV button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `kb:view` | Sidebar filter |
| Create Button | `kb:create` | Button guard |
| Status Actions | `kb:publish`, `kb:manage`, `kb:archive` | Button guard |
| Export CSV | `kb:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `kb:*` |
| Admin | All `kb:*` |
| Knowledge Manager | All `kb:*` |
| Author | `kb:view`, `kb:create`, `kb:manage` |
| Employee | `kb:view` (read-only, published only) |

**Note:** Currently uses `dashboard:read` for view and `settings:write` for create. Should be separated.

---

### Reports & Analytics

**Namespace:** `reports`

**Purpose:** View and manage pre-built and custom reports for IT operations.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `reports:view` | View reports list and details | `dashboard:read` |
| `reports:create` | Create custom reports | `dashboard:read` |
| `reports:export` | Export report data | - (not implemented) |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Reports List | `reports:view` | Menu item, Table |
| View Report Details | `reports:view` | Open button, Drawer |
| Create Custom Report | `reports:create` | Create button, Modal |
| Export Reports | `reports:export` | Export button |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `reports:view` | Sidebar filter |
| Create Button | `reports:create` | Button guard |
| Export Button | `reports:export` | Button guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `reports:*` |
| Admin | All `reports:*` |
| IT Manager | `reports:view`, `reports:export` |
| Employee | `reports:view` (basic reports) |

**Note:** Currently a read-only module. Create and Export features not implemented.

---

### Settings

**Namespace:** `settings`

**Purpose:** View and manage system configuration settings.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `settings:view` | View system settings | `settings:read` |
| `settings:manage` | Modify system settings | `settings:write` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Settings | `settings:view` | Menu item, Grid |
| Edit Setting | `settings:manage` | Not exposed in UI |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `settings:view` | Sidebar filter |
| Settings Grid | `settings:view` | Page-level guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | All `settings:*` |
| Admin | `settings:view` |
| System Configurator | `settings:view`, `settings:manage` |

**Note:** Backend has PUT endpoint protected with `settings:write`, but UI only displays read-only.

---

### Dashboard

**Namespace:** `dashboard`

**Purpose:** Display overview of IT operations with key metrics and KPIs.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `dashboard:view` | View dashboard summary | `dashboard:read` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| View Dashboard | `dashboard:view` | Menu item, Stats cards |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Menu Item | `dashboard:view` | Sidebar filter |
| Dashboard Stats | `dashboard:view` | Page-level guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| All Roles | `dashboard:view` |

---

### AI Assistant

**Namespace:** `ai`

**Purpose:** Provide AI-powered natural language interface for IT operations.

#### Permissions

| Permission | Description | Current Equivalent |
|------------|-------------|-------------------|
| `ai:ask` | Use AI command bar to ask questions | `ai:ask` |

#### Actions

| Action | Permission Required | UI Element |
|--------|-------------------|-----------|
| Ask AI Question | `ai:ask` | Command bar input |
| Auto-Navigate | `ai:ask` | Built into submit handler |

#### UI Visibility Matrix

| UI Element | Required Permission | Recommended Guard |
|------------|-------------------|-------------------|
| Command Bar | `ai:ask` | Component guard |

#### Role Recommendations

| Role | Suggested Permissions |
|------|----------------------|
| Super Admin | `ai:ask` |
| Admin | `ai:ask` |
| Knowledge Worker | `ai:ask` |
| IT Staff | `ai:ask` |

---

## Permission Summary Table

| Namespace | :view | :create | :manage | :delete | :export | :special |
|-----------|-------|---------|---------|---------|---------|----------|
| users | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| roles | ✅ | ✅ | ✅ | ✅ | - | - |
| tickets | ✅ | ✅ | ✅ | - | ✅ | `:assign` |
| incidents | ✅ | ✅ | ✅ | - | ✅ | - |
| problems | ✅ | ✅ | ✅ | - | ✅ | - |
| changes | ✅ | ✅ | - | - | ✅ | `:approve` |
| inventory | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| access | ✅ | - | - | - | ✅ | `:request`, `:approve`, `:provision`, `:revoke` |
| compliance | ✅ | ✅ | ✅ | - | ✅ | `:audit` |
| projects | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| vendors | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| kb | ✅ | ✅ | - | - | ✅ | `:publish`, `:archive` |
| reports | ✅ | ✅ | - | - | ✅ | - |
| settings | ✅ | - | ✅ | - | - | - |
| dashboard | ✅ | - | - | - | - | - |
| ai | - | - | - | - | - | `:ask` |

---

*End of Permission Catalog*
