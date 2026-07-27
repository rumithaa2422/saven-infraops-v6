# Saven InfraOps RBAC Permission Map

**Generated:** 2026-06-18  
**Purpose:** Role & Permissions UI Panel Design Reference

---

# 1. Frontend Pages/Routes

| # | Route | Component | Module Key | Title |
|---|-------|----------|-----------|-------|
| 1 | `/` | DashboardPage | - | Dashboard |
| 2 | `/service-requests` | ServiceRequestsPage | - | Service Requests |
| 3 | `/incidents` | ModulePage | incidents | Incidents |
| 4 | `/problems` | ModulePage | problems | Problems |
| 5 | `/changes` | ModulePage | changes | Change Management |
| 6 | `/inventory` | ModulePage | inventory | Inventory |
| 7 | `/access-management` | ModulePage | access-management | Access Management |
| 8 | `/compliance` | ModulePage | compliance | Compliance |
| 9 | `/projects-environments` | ModulePage | projects-environments | Projects & Environments |
| 10 | `/vendors-licenses` | ModulePage | vendors-licenses | Vendors & Licenses |
| 11 | `/reports-analytics` | ModulePage | reports-analytics | Reports & Analytics |
| 12 | `/knowledge-base` | ModulePage | knowledge-base | Knowledge Base |
| 13 | `/users-teams` | ModulePage | users-teams | Users & Teams |
| 14 | `/settings` | SettingsPage | - | Settings |
| 15 | `/activate-account` | ActivateAccountPage | - | Account Activation |

---

# 2. Module Actions & Permission Mapping

## 2.1 Service Requests

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `tickets:read` | GET /api/service-requests | |
| Create | `tickets:write` | POST /api/service-requests | |
| Update | `tickets:write` | PATCH /api/service-requests/:id | |
| Delete | - | - | Not implemented |
| Assign | `tickets:assign` | PATCH /api/service-requests/:id/assign | Special endpoint |

---

## 2.2 Incidents

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `incidents:read` | GET /api/incidents | |
| Create | `incidents:write` | POST /api/incidents | |
| Update | `incidents:write` | PATCH /api/incidents/:id | |
| Delete | - | - | Not implemented |

---

## 2.3 Problems

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `incidents:read` | GET /api/problems | Uses incidents permission |
| Create | `incidents:write` | POST /api/problems | Uses incidents permission |
| Update | `incidents:write` | PATCH /api/problems/:id | Uses incidents permission |
| Delete | - | - | Not implemented |

---

## 2.4 Change Requests

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `changes:read` | GET /api/changes | |
| Create | `changes:approve` | POST /api/changes | Uses approve permission |
| Update | `changes:approve` | PATCH /api/changes/:id | Uses approve permission |
| Approve | `changes:approve` | PATCH /api/changes/:id | Status change |

---

## 2.5 Inventory/Assets

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `inventory:read` | GET /api/inventory | |
| Create | `inventory:write` | POST /api/inventory | |
| Update | `inventory:write` | PATCH /api/inventory/:id | |
| Delete | - | - | Not implemented |

---

## 2.6 Access Management

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `access:read` | GET /api/access-management | |
| Create | `access:approve` | POST /api/access-management | Uses approve permission |
| Update | `access:approve` | PATCH /api/access-management/:id | Uses approve permission |
| Approve | `access:approve` | PATCH /api/access-management/:id | Status change |

---

## 2.7 Compliance

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `compliance:read` | GET /api/compliance | |
| Create | `compliance:write` | POST /api/compliance | |
| Update | `compliance:write` | PATCH /api/compliance/:id | |
| Delete | - | - | Not implemented |

---

## 2.8 Projects & Environments

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `dashboard:read` | GET /api/projects-environments | Uses dashboard permission |
| Create | `settings:write` | POST /api/projects-environments | Uses settings permission |
| Update | `settings:write` | PATCH /api/projects-environments/:id | Uses settings permission |
| Delete | - | - | Not implemented |

---

## 2.9 Vendors & Licenses

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `dashboard:read` | GET /api/vendors-licenses | Uses dashboard permission |
| Create | `settings:write` | POST /api/vendors-licenses | Uses settings permission |
| Update | `settings:write` | PATCH /api/vendors-licenses/:id | Uses settings permission |
| Delete | - | - | Not implemented |

---

## 2.10 Knowledge Base

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `dashboard:read` | GET /api/knowledge-base | Uses dashboard permission |
| Create | `settings:write` | POST /api/knowledge-base | Uses settings permission |
| Update | `settings:write` | PATCH /api/knowledge-base/:id | Uses settings permission |
| Delete | - | - | Not implemented |

---

## 2.11 Reports & Analytics

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `dashboard:read` | GET /api/reports-analytics | Read-only, static data |
| Create | - | - | Not implemented |
| Export | - | - | CSV export available in UI |

---

## 2.12 Users & Teams

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `users:read` | GET /api/users-teams | |
| Create | `users:write` | POST /api/users-teams | Creates with PENDING_ACTIVATION |
| Update | `users:write` | PATCH /api/users-teams/:id | |
| Delete | - | - | Not implemented |
| Resend Activation | `users:write` | POST /api/auth/activate/resend | Admin only |

---

## 2.13 Dashboard

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View | `dashboard:read` | GET /api/dashboard | |

---

## 2.14 Settings

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| View/List | `settings:read` | GET /api/settings | |
| Update | `settings:write` | PATCH /api/settings | |

---

## 2.15 AI Assistant

| Action | Permission Code | API Endpoint | Notes |
|--------|---------------|--------------|-------|
| Ask Question | `ai:ask` | POST /api/ai/ask | |

---

# 3. All Permissions (From Database Seed)

## 3.1 Complete Permission List

| # | Permission Code | Description | Category |
|---|----------------|-------------|----------|
| 1 | `dashboard:read` | View dashboard and statistics | Dashboard |
| 2 | `tickets:read` | View service requests | Service Requests |
| 3 | `tickets:write` | Create/update service requests | Service Requests |
| 4 | `tickets:assign` | Assign service requests | Service Requests |
| 5 | `incidents:read` | View incidents | Incidents |
| 6 | `incidents:write` | Create/update incidents | Incidents |
| 7 | `changes:read` | View change requests | Changes |
| 8 | `changes:approve` | Approve/create change requests | Changes |
| 9 | `inventory:read` | View assets/inventory | Inventory |
| 10 | `inventory:write` | Create/update assets | Inventory |
| 11 | `access:read` | View access requests | Access |
| 12 | `access:approve` | Approve/create access requests | Access |
| 13 | `compliance:read` | View compliance controls | Compliance |
| 14 | `compliance:write` | Update compliance controls | Compliance |
| 15 | `settings:read` | View system settings | Settings |
| 16 | `settings:write` | Modify system settings | Settings |
| 17 | `users:read` | View users | Users |
| 18 | `users:write` | Create/update users | Users |
| 19 | `ai:ask` | Use AI assistant | AI |

---

# 4. Suggested Role Templates

## 4.1 Super Admin

**Description:** Full system access with all permissions

| Permission | Granted |
|-----------|---------|
| dashboard:read | ✅ |
| tickets:read | ✅ |
| tickets:write | ✅ |
| tickets:assign | ✅ |
| incidents:read | ✅ |
| incidents:write | ✅ |
| changes:read | ✅ |
| changes:approve | ✅ |
| inventory:read | ✅ |
| inventory:write | ✅ |
| access:read | ✅ |
| access:approve | ✅ |
| compliance:read | ✅ |
| compliance:write | ✅ |
| settings:read | ✅ |
| settings:write | ✅ |
| users:read | ✅ |
| users:write | ✅ |
| ai:ask | ✅ |

---

## 4.2 Admin

**Description:** Full system access (same as Super Admin for now)

| Permission | Granted |
|-----------|---------|
| dashboard:read | ✅ |
| tickets:read | ✅ |
| tickets:write | ✅ |
| tickets:assign | ✅ |
| incidents:read | ✅ |
| incidents:write | ✅ |
| changes:read | ✅ |
| changes:approve | ✅ |
| inventory:read | ✅ |
| inventory:write | ✅ |
| access:read | ✅ |
| access:approve | ✅ |
| compliance:read | ✅ |
| compliance:write | ✅ |
| settings:read | ✅ |
| settings:write | ✅ |
| users:read | ✅ |
| users:write | ✅ |
| ai:ask | ✅ |

---

## 4.3 Employee

**Description:** Standard employee access (same as Super Admin for now)

| Permission | Granted |
|-----------|---------|
| dashboard:read | ✅ |
| tickets:read | ✅ |
| tickets:write | ✅ |
| tickets:assign | ❌ |
| incidents:read | ✅ |
| incidents:write | ✅ |
| changes:read | ✅ |
| changes:approve | ❌ |
| inventory:read | ✅ |
| inventory:write | ✅ |
| access:read | ✅ |
| access:approve | ❌ |
| compliance:read | ✅ |
| compliance:write | ❌ |
| settings:read | ✅ |
| settings:write | ❌ |
| users:read | ❌ |
| users:write | ❌ |
| ai:ask | ✅ |

---

## 4.4 Read-Only User

**Description:** View-only access to all modules

| Permission | Granted |
|-----------|---------|
| dashboard:read | ✅ |
| tickets:read | ✅ |
| tickets:write | ❌ |
| tickets:assign | ❌ |
| incidents:read | ✅ |
| incidents:write | ❌ |
| changes:read | ✅ |
| changes:approve | ❌ |
| inventory:read | ✅ |
| inventory:write | ❌ |
| access:read | ✅ |
| access:approve | ❌ |
| compliance:read | ✅ |
| compliance:write | ❌ |
| settings:read | ✅ |
| settings:write | ❌ |
| users:read | ❌ |
| users:write | ❌ |
| ai:ask | ❌ |

---

# 5. Module-wise Permission Matrix (UI Reference)

## 5.1 Service Requests Module

| Permission | Code | Type |
|-----------|------|------|
| View Service Requests | `tickets:read` | Read |
| Create Service Request | `tickets:write` | Write |
| Update Service Request | `tickets:write` | Write |
| Assign Service Request | `tickets:assign` | Special |

---

## 5.2 Incidents Module

| Permission | Code | Type |
|-----------|------|------|
| View Incidents | `incidents:read` | Read |
| Create Incident | `incidents:write` | Write |
| Update Incident | `incidents:write` | Write |

---

## 5.3 Problems Module

| Permission | Code | Type |
|-----------|------|------|
| View Problems | `incidents:read` | Read |
| Create Problem | `incidents:write` | Write |
| Update Problem | `incidents:write` | Write |

> **Note:** Problems use `incidents:*` permissions

---

## 5.4 Changes Module

| Permission | Code | Type |
|-----------|------|------|
| View Changes | `changes:read` | Read |
| Create Change | `changes:approve` | Write |
| Approve Change | `changes:approve` | Write |
| Update Change | `changes:approve` | Write |

> **Note:** Changes uses `changes:approve` for write operations

---

## 5.5 Inventory Module

| Permission | Code | Type |
|-----------|------|------|
| View Assets | `inventory:read` | Read |
| Create Asset | `inventory:write` | Write |
| Update Asset | `inventory:write` | Write |

---

## 5.6 Access Management Module

| Permission | Code | Type |
|-----------|------|------|
| View Access Requests | `access:read` | Read |
| Create Access Request | `access:approve` | Write |
| Approve Access | `access:approve` | Write |
| Update Access Request | `access:approve` | Write |

> **Note:** Access uses `access:approve` for write operations

---

## 5.7 Compliance Module

| Permission | Code | Type |
|-----------|------|------|
| View Compliance Controls | `compliance:read` | Read |
| Create Compliance Control | `compliance:write` | Write |
| Update Compliance Control | `compliance:write` | Write |

---

## 5.8 Projects & Environments Module

| Permission | Code | Type |
|-----------|------|------|
| View Projects | `dashboard:read` | Read |
| Create Project | `settings:write` | Write |
| Update Project | `settings:write` | Write |

> **Note:** Projects use `dashboard:read` and `settings:write`

---

## 5.9 Vendors & Licenses Module

| Permission | Code | Type |
|-----------|------|------|
| View Licenses | `dashboard:read` | Read |
| Create License | `settings:write` | Write |
| Update License | `settings:write` | Write |

> **Note:** Vendors uses `dashboard:read` and `settings:write`

---

## 5.10 Knowledge Base Module

| Permission | Code | Type |
|-----------|------|------|
| View Articles | `dashboard:read` | Read |
| Create Article | `settings:write` | Write |
| Update Article | `settings:write` | Write |

> **Note:** Knowledge Base uses `dashboard:read` and `settings:write`

---

## 5.11 Reports & Analytics Module

| Permission | Code | Type |
|-----------|------|------|
| View Reports | `dashboard:read` | Read |

> **Note:** Reports are read-only

---

## 5.12 Users & Teams Module

| Permission | Code | Type |
|-----------|------|------|
| View Users | `users:read` | Read |
| Create User | `users:write` | Write |
| Update User | `users:write` | Write |
| Resend Activation | `users:write` | Write |

---

## 5.13 Settings Module

| Permission | Code | Type |
|-----------|------|------|
| View Settings | `settings:read` | Read |
| Update Settings | `settings:write` | Write |

---

## 5.14 AI Assistant Module

| Permission | Code | Type |
|-----------|------|------|
| Use AI Assistant | `ai:ask` | Execute |

---

# 6. Permission Categories

## Dashboard & Analytics
| Permission | Module |
|-----------|--------|
| `dashboard:read` | Dashboard, Reports, Projects, Vendors, Knowledge Base |

## Service Management
| Permission | Module |
|-----------|--------|
| `tickets:read` | Service Requests |
| `tickets:write` | Service Requests |
| `tickets:assign` | Service Requests |

## Incident Management
| Permission | Module |
|-----------|--------|
| `incidents:read` | Incidents, Problems |
| `incidents:write` | Incidents, Problems |

## Change Management
| Permission | Module |
|-----------|--------|
| `changes:read` | Changes |
| `changes:approve` | Changes |

## Asset Management
| Permission | Module |
|-----------|--------|
| `inventory:read` | Inventory |
| `inventory:write` | Inventory |

## Access Management
| Permission | Module |
|-----------|--------|
| `access:read` | Access Management |
| `access:approve` | Access Management |

## Compliance
| Permission | Module |
|-----------|--------|
| `compliance:read` | Compliance |
| `compliance:write` | Compliance |

## System Administration
| Permission | Module |
|-----------|--------|
| `settings:read` | Settings, Projects, Vendors, Knowledge Base |
| `settings:write` | Settings, Projects, Vendors, Knowledge Base |

## User Management
| Permission | Module |
|-----------|--------|
| `users:read` | Users & Teams |
| `users:write` | Users & Teams |

## AI
| Permission | Module |
|-----------|--------|
| `ai:ask` | AI Assistant |

---

# 7. Role vs Permission Matrix

| Permission | Super Admin | Admin | Employee | Read-Only |
|-----------|-------------|-------|----------|-----------|
| dashboard:read | ✅ | ✅ | ✅ | ✅ |
| tickets:read | ✅ | ✅ | ✅ | ✅ |
| tickets:write | ✅ | ✅ | ✅ | ❌ |
| tickets:assign | ✅ | ✅ | ❌ | ❌ |
| incidents:read | ✅ | ✅ | ✅ | ✅ |
| incidents:write | ✅ | ✅ | ✅ | ❌ |
| changes:read | ✅ | ✅ | ✅ | ✅ |
| changes:approve | ✅ | ✅ | ❌ | ❌ |
| inventory:read | ✅ | ✅ | ✅ | ✅ |
| inventory:write | ✅ | ✅ | ✅ | ❌ |
| access:read | ✅ | ✅ | ✅ | ✅ |
| access:approve | ✅ | ✅ | ❌ | ❌ |
| compliance:read | ✅ | ✅ | ✅ | ✅ |
| compliance:write | ✅ | ✅ | ❌ | ❌ |
| settings:read | ✅ | ✅ | ✅ | ✅ |
| settings:write | ✅ | ✅ | ❌ | ❌ |
| users:read | ✅ | ✅ | ❌ | ❌ |
| users:write | ✅ | ✅ | ❌ | ❌ |
| ai:ask | ✅ | ✅ | ✅ | ❌ |

---

# 8. UI Panel Design Recommendations

## 8.1 Role List View

```
┌─────────────────────────────────────────────────────────┐
│  Roles & Permissions                              [+] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔷 Super Admin          Full system access  [⋮] │   │
│  │ 🔷 Admin                Full system access  [⋮] │   │
│  │ 🔷 Employee             Standard access    [⋮] │   │
│  │ 🔷 Read-Only           View only          [⋮] │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 8.2 Role Detail View

```
┌─────────────────────────────────────────────────────────┐
│  Edit Role: Employee                                    │
├─────────────────────────────────────────────────────────┤
│  Role Name: [Employee________________]                  │
│  Description: [Standard employee access_____]           │
│                                                         │
│  Permissions:                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☑ Dashboard                                      │   │
│  │   ☑ View Dashboard                              │   │
│  │ ☑ Service Requests                               │   │
│  │   ☑ View Service Requests                        │   │
│  │   ☑ Create Service Requests                      │   │
│  │   ☐ Assign Service Requests                       │   │
│  │ ☑ Incidents                                     │   │
│  │   ☑ View Incidents                              │   │
│  │   ☑ Create Incidents                            │   │
│  │ ...                                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Cancel]                              [Save Changes]   │
└─────────────────────────────────────────────────────────┘
```

## 8.3 Permission Grouping for UI

```
CATEGORY: Service Management
├── tickets:read    View Service Requests
├── tickets:write   Create/Update Service Requests
└── tickets:assign  Assign Service Requests

CATEGORY: Incident Management
├── incidents:read  View Incidents & Problems
└── incidents:write Create/Update Incidents & Problems

CATEGORY: Change Management
├── changes:read    View Changes
└── changes:approve Approve/Create Changes

CATEGORY: Asset Management
├── inventory:read  View Assets
└── inventory:write Create/Update Assets

CATEGORY: Access Management
├── access:read    View Access Requests
└── access:approve Approve/Create Access

CATEGORY: Compliance
├── compliance:read  View Compliance
└── compliance:write Update Compliance

CATEGORY: System Administration
├── settings:read    View Settings
├── settings:write   Modify Settings
├── users:read       View Users
└── users:write      Manage Users

CATEGORY: Analytics
├── dashboard:read   View Dashboard & Reports

CATEGORY: AI
└── ai:ask          Use AI Assistant
```

---

**End of RBAC Permission Map**
