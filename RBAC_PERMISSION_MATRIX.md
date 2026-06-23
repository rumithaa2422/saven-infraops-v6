# Saven InfraOps Enterprise RBAC Permission Matrix

**Version:** 1.0  
**Date:** 2026-06-20  
**Purpose:** Blueprint for rebuilding the Roles & Permissions module with granular action-level permissions

---

## A. MODULES DISCOVERED (14 Modules)

| Module | Route | Primary Entity | Status |
|--------|-------|----------------|--------|
| Dashboard | `/` | N/A | ✅ Active |
| Service Requests | `/service-requests` | ServiceRequest | ✅ Active |
| Incidents | `/incidents` | Incident | ✅ Active |
| Problems | `/problems` | Problem | ✅ Active |
| Changes | `/changes` | ChangeRequest | ✅ Active |
| Inventory | `/inventory` | Asset | ✅ Active |
| Access Management | `/access-management` | AccessRequest | ✅ Active |
| Compliance | `/compliance` | ComplianceControl | ✅ Active |
| Projects & Environments | `/projects-environments` | ProjectEnvironment | ✅ Active |
| Vendors & Licenses | `/vendors-licenses` | VendorLicense | ✅ Active |
| Reports & Analytics | `/reports-analytics` | N/A (Static) | ✅ Active |
| Knowledge Base | `/knowledge-base` | KnowledgeBaseArticle | ✅ Active |
| Users & Teams | `/users-teams` | User | ✅ Active |
| Roles & Permissions | `/roles-permissions` | Role, Permission | ✅ Active |
| Settings | `/settings` | SystemSetting | ✅ Active |
| AI Assistant | N/A (Panel) | N/A | ✅ Active |

---

## B. EXISTING PERMISSIONS (Current State)

### Currently Seeding in Database (18 permissions):

```
dashboard:read
tickets:read, tickets:write, tickets:assign
incidents:read, incidents:write
changes:read, changes:approve
inventory:read, inventory:write
access:read, access:approve
compliance:read, compliance:write
settings:read, settings:write
users:read, users:write, users:delete
ai:ask
```

### Backend Route Permission Mapping:

| Route | GET | POST | PATCH | DELETE |
|-------|-----|------|-------|--------|
| `/api/service-requests` | tickets:read | tickets:write | tickets:write | - |
| `/api/incidents` | incidents:read | incidents:write | incidents:write | - |
| `/api/problems` | incidents:read | incidents:write | incidents:write | - |
| `/api/changes` | changes:read | changes:approve | changes:approve | - |
| `/api/inventory` | inventory:read | inventory:write | inventory:write | - |
| `/api/access-management` | access:read | access:approve | access:approve | - |
| `/api/compliance` | compliance:read | compliance:write | compliance:write | - |
| `/api/users-teams` | users:read | users:write | users:write | users:delete |
| `/api/roles/*` | users:read | users:write | users:write | users:write |
| `/api/settings` | settings:read | - | settings:write | - |
| `/api/ai/ask` | - | ai:ask | - | - |
| `/api/dashboard/summary` | dashboard:read | - | - | - |

---

## C. MISSING PERMISSIONS (Recommended Additions)

### Critical Gaps Identified:

| Gap | Issue | Severity |
|-----|-------|----------|
| No status transition permissions | Assign, Close, Reopen, Escalate share write permission | HIGH |
| No export permissions | CSV export buttons have no permission checks | MEDIUM |
| No role management permissions | Roles CRUD uses users:write | MEDIUM |
| No system-wide permissions | API routes don't check users:read for all admin routes | MEDIUM |
| No approval workflow permissions | Access, Changes use same permission for create/approve | MEDIUM |

---

## D. RECOMMENDED FINAL PERMISSION MODEL

### Complete Permission Catalog by Module:

---

## 1. DASHBOARD

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `dashboard:view` | View dashboard page and summary widgets | **NEW** (splits from `dashboard:read`) |
| `dashboard:read` | Read dashboard analytics data | EXISTING |

**UI Elements Controlled:**
- Dashboard menu item in sidebar
- Summary stat cards (Open SRs, Critical Incidents, SLA Breaches, etc.)
- Refresh button on dashboard
- Charts and visualizations

**Hide Without Permission:**
- Entire Dashboard page
- All summary metrics

---

## 2. SERVICE REQUESTS (Tickets)

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `tickets:view` | View service request list and details | **NEW** (splits from `tickets:read`) |
| `tickets:read` | Read service request data via API | EXISTING |
| `tickets:create` | Create new service requests | **NEW** (splits from `tickets:write`) |
| `tickets:write` | Update service request fields | EXISTING |
| `tickets:assign` | Assign tickets to users/teams | EXISTING |
| `tickets:update_status` | Change ticket status (Open, Close, Reopen, etc.) | **NEW** |
| `tickets:escalate` | Escalate ticket priority | **NEW** |
| `tickets:comment` | Add comments to tickets | **NEW** |
| `tickets:export` | Export tickets to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Service Requests table | `tickets:view` |
| View row | Row data display | `tickets:view` |
| Create button | "Create Request" button | `tickets:create` |
| Create form | Create Request modal | `tickets:create` |
| Edit fields | Field inputs in drawer | `tickets:write` |
| Assign action | "Assign" button | `tickets:assign` |
| Escalate action | "Escalate" button | `tickets:escalate` |
| Close action | "Close" button | `tickets:update_status` |
| Reopen action | "Reopen" button | `tickets:update_status` |
| Comment | Comment textarea and save | `tickets:comment` |
| Export | "Export CSV" button | `tickets:export` |

**Hide Without Permission:**
- Service Requests menu item (if `tickets:view` missing)
- Create Request button
- Create Request modal and form
- Status change buttons (Assign, Escalate, Close, Reopen)
- Comment section
- Export CSV button

---

## 3. INCIDENTS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `incidents:view` | View incident list and details | **NEW** (splits from `incidents:read`) |
| `incidents:read` | Read incident data via API | EXISTING |
| `incidents:create` | Create new incidents | **NEW** (splits from `incidents:write`) |
| `incidents:write` | Update incident fields | EXISTING |
| `incidents:resolve` | Mark incident as resolved | **NEW** |
| `incidents:escalate` | Escalate incident severity | **NEW** |
| `incidents:close` | Close an incident | **NEW** |
| `incidents:export` | Export incidents to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Incidents table | `incidents:view` |
| Create button | "Create" button in action row | `incidents:create` |
| Edit fields | Field inputs in drawer | `incidents:write` |
| Resolve action | "Resolve" button | `incidents:resolve` |
| Escalate action | Severity change buttons | `incidents:escalate` |
| Close action | "Close" button | `incidents:close` |
| Export | "Export CSV" button | `incidents:export` |

---

## 4. PROBLEMS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `problems:view` | View problem list and details | **NEW** (uses `incidents:read`) |
| `problems:read` | Read problem data via API | **NEW** |
| `problems:create` | Create new problems | **NEW** |
| `problems:write` | Update problem fields | **NEW** |
| `problems:resolve` | Mark problem as resolved | **NEW** |
| `problems:link_incident` | Link problems to incidents | **NEW** |
| `problems:export` | Export problems to CSV | **NEW** |

---

## 5. CHANGES

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `changes:view` | View change request list and details | **NEW** (splits from `changes:read`) |
| `changes:read` | Read change data via API | EXISTING |
| `changes:create` | Create new change requests | **NEW** (splits from `changes:approve`) |
| `changes:write` | Update change fields | **NEW** |
| `changes:approve` | Approve change requests | EXISTING |
| `changes:reject` | Reject change requests | **NEW** |
| `changes:implement` | Mark change as implemented | **NEW** |
| `changes:rollback` | Execute rollback plan | **NEW** |
| `changes:export` | Export changes to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Changes table | `changes:view` |
| Create button | "Create" button | `changes:create` |
| Edit fields | Field inputs in drawer | `changes:write` |
| Approve action | "Approve" button | `changes:approve` |
| Reject action | "Reject" button | `changes:reject` |
| Implement action | "Implement" button | `changes:implement` |
| Rollback action | "Rollback" button | `changes:rollback` |
| Export | "Export CSV" button | `changes:export` |

---

## 6. INVENTORY (Assets)

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `inventory:view` | View asset list and details | **NEW** (splits from `inventory:read`) |
| `inventory:read` | Read asset data via API | EXISTING |
| `inventory:create` | Create new assets | **NEW** (splits from `inventory:write`) |
| `inventory:write` | Update asset fields | EXISTING |
| `inventory:delete` | Delete assets | **NEW** |
| `inventory:assign` | Assign assets to users | **NEW** |
| `inventory:return` | Mark assets as returned | **NEW** |
| `inventory:dispose` | Dispose assets | **NEW** |
| `inventory:export` | Export assets to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Inventory table | `inventory:view` |
| Create button | "Create" button | `inventory:create` |
| Edit fields | Field inputs in drawer | `inventory:write` |
| Assign action | Assign to dropdown | `inventory:assign` |
| Return action | "Return" button | `inventory:return` |
| Dispose action | "Dispose" button | `inventory:dispose` |
| Delete action | "Delete" button | `inventory:delete` |
| Export | "Export CSV" button | `inventory:export` |

---

## 7. ACCESS MANAGEMENT

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `access:view` | View access request list and details | **NEW** (splits from `access:read`) |
| `access:read` | Read access request data via API | EXISTING |
| `access:create` | Create new access requests | **NEW** (splits from `access:approve`) |
| `access:write` | Update access request fields | **NEW** |
| `access:approve` | Approve access requests | EXISTING |
| `access:reject` | Reject access requests | **NEW** |
| `access:revoke` | Revoke granted access | **NEW** |
| `access:export` | Export access requests to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Access Management table | `access:view` |
| Create button | "Create" button | `access:create` |
| Edit fields | Field inputs in drawer | `access:write` |
| Approve action | "Approve" button | `access:approve` |
| Reject action | "Reject" button | `access:reject` |
| Revoke action | "Revoke" button | `access:revoke` |
| Export | "Export CSV" button | `access:export` |

---

## 8. COMPLIANCE

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `compliance:view` | View compliance controls and status | **NEW** (splits from `compliance:read`) |
| `compliance:read` | Read compliance data via API | EXISTING |
| `compliance:create` | Create new compliance controls | **NEW** (splits from `compliance:write`) |
| `compliance:write` | Update compliance fields | EXISTING |
| `compliance:audit` | Mark controls as audited | **NEW** |
| `compliance:exception` | Grant exceptions | **NEW** |
| `compliance:export` | Export compliance data to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Compliance table | `compliance:view` |
| Create button | "Create" button | `compliance:create` |
| Edit fields | Field inputs in drawer | `compliance:write` |
| Audit action | "Mark Audited" button | `compliance:audit` |
| Exception action | "Grant Exception" button | `compliance:exception` |
| Export | "Export CSV" button | `compliance:export` |

---

## 9. PROJECTS & ENVIRONMENTS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `projects:view` | View projects and environments | **NEW** (uses `settings:read`) |
| `projects:read` | Read project data via API | **NEW** |
| `projects:create` | Create new projects | **NEW** (uses `settings:write`) |
| `projects:write` | Update project fields | **NEW** |
| `projects:delete` | Delete projects | **NEW** |
| `projects:export` | Export projects to CSV | **NEW** |

---

## 10. VENDORS & LICENSES

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `vendors:view` | View vendor and license data | **NEW** (uses `settings:read`) |
| `vendors:read` | Read vendor data via API | **NEW** |
| `vendors:create` | Add new vendors | **NEW** (uses `settings:write`) |
| `vendors:write` | Update vendor fields | **NEW** |
| `vendors:delete` | Remove vendors | **NEW** |
| `licenses:allocate` | Allocate licenses | **NEW** |
| `licenses:renew` | Renew licenses | **NEW** |
| `vendors:export` | Export vendor data to CSV | **NEW** |

---

## 11. KNOWLEDGE BASE

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `knowledge:view` | View knowledge base articles | **NEW** (uses `dashboard:read`) |
| `knowledge:read` | Read articles via API | **NEW** |
| `knowledge:create` | Create new articles | **NEW** (uses `settings:write`) |
| `knowledge:write` | Edit article content | **NEW** |
| `knowledge:delete` | Delete articles | **NEW** |
| `knowledge:publish` | Publish articles | **NEW** |
| `knowledge:export` | Export knowledge base | **NEW** |

---

## 12. REPORTS & ANALYTICS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `reports:view` | View reports and analytics | **NEW** (uses `dashboard:read`) |
| `reports:read` | Access report data | **NEW** |
| `reports:generate` | Generate custom reports | **NEW** |
| `reports:export` | Export reports | **NEW** |

---

## 13. USERS & TEAMS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `users:view` | View user list and details | **NEW** (splits from `users:read`) |
| `users:read` | Read user data via API | EXISTING |
| `users:create` | Create new users | **NEW** (splits from `users:write`) |
| `users:write` | Update user fields | EXISTING |
| `users:delete` | Delete users permanently | EXISTING |
| `users:activate` | Activate pending users | **NEW** |
| `users:deactivate` | Deactivate user accounts | **NEW** |
| `users:reset_password` | Reset user passwords | **NEW** |
| `users:export` | Export user list to CSV | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Users & Teams table | `users:view` |
| Create button | "Create" button | `users:create` |
| Create form | Create User modal | `users:create` |
| Edit fields | Field inputs in drawer | `users:write` |
| Status dropdown | Status selector in drawer | `users:write` |
| Delete button | "Delete" red button | `users:delete` |
| Activate action | Status → ACTIVE | `users:activate` |
| Deactivate action | Status → DISABLED | `users:deactivate` |
| Reset password | "Reset Password" button | `users:reset_password` |
| Export | "Export CSV" button | `users:export` |

---

## 14. ROLES & PERMISSIONS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `roles:view` | View roles and permissions | **NEW** (uses `users:read`) |
| `roles:read` | Read roles via API | **NEW** |
| `roles:create` | Create new roles | **NEW** (uses `users:write`) |
| `roles:write` | Update role names/descriptions | **NEW** |
| `roles:manage_permissions` | Assign permissions to roles | **NEW** |
| `roles:delete` | Delete roles | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View list | Roles table | `roles:view` |
| Create button | "Create Role" button | `roles:create` |
| Create form | Create Role modal | `roles:create` |
| Edit name/description | Name/description inputs | `roles:write` |
| Manage permissions | Permission checkboxes in modal | `roles:manage_permissions` |
| Delete button | "Delete" button on role row | `roles:delete` |

---

## 15. SETTINGS

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `settings:view` | View system settings | **NEW** (splits from `settings:read`) |
| `settings:read` | Read settings via API | EXISTING |
| `settings:write` | Update system settings | EXISTING |
| `settings:ai` | Configure AI settings | **NEW** |
| `settings:notifications` | Configure notification settings | **NEW** |
| `settings:sla` | Configure SLA settings | **NEW** |
| `settings:backup` | Manage backups | **NEW** |
| `settings:audit_logs` | View audit logs | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| View settings | Settings page tabs | `settings:view` |
| Edit AI settings | AI Provider dropdown, API keys | `settings:ai` |
| Edit notifications | Email/Teams toggles | `settings:notifications` |
| Edit SLA | SLA minute inputs | `settings:sla` |
| View audit logs | Audit Log tab | `settings:audit_logs` |

---

## 16. AI ASSISTANT

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `ai:use` | Use AI assistant for queries | **NEW** (renamed from `ai:ask`) |
| `ai:ask` | Send AI requests | EXISTING |
| `ai:summarize` | Generate ticket summaries | **NEW** |
| `ai:suggest` | Get AI suggestions | **NEW** |
| `ai:code_review` | Code review assistance | **NEW** |

**UI Elements Controlled:**

| Action | UI Element | Permission Required |
|--------|------------|-------------------|
| Command bar | AI command bar visible | `ai:use` |
| Send message | Message input and send button | `ai:ask` |
| Summarize button | AI summary action | `ai:summarize` |
| Suggest action | AI suggestion button | `ai:suggest` |

---

## 17. IMPORT/EXPORT

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `import:execute` | Import data from Excel | **NEW** (uses `settings:write`) |
| `export:all` | Full data export | **NEW** |
| `export:configure` | Configure export templates | **NEW** |

---

## 18. SYSTEM ADMINISTRATION

| Permission Code | Description | Existing/New |
|-----------------|-------------|--------------|
| `system:admin` | Full system administration | **NEW** |
| `system:logs` | View system logs | **NEW** |
| `system:maintenance` | Put system in maintenance mode | **NEW** |
| `system:api_keys` | Manage API keys | **NEW** |

---

## E. COMPLETE PERMISSION MATRIX TABLE

| Module | Screen/Page | Action | Permission Code | Existing/New | UI Elements Controlled |
|--------|-------------|--------|----------------|--------------|----------------------|
| Dashboard | Dashboard | View | `dashboard:view` | NEW | Sidebar menu, all widgets |
| Dashboard | Dashboard | Refresh | `dashboard:view` | NEW | Refresh button |
| Dashboard | Dashboard | View Summary | `dashboard:read` | EXISTING | Stat cards data |
| Service Requests | List | View | `tickets:view` | NEW | Table, all rows |
| Service Requests | List | Refresh | `tickets:view` | NEW | Refresh button |
| Service Requests | List | Export | `tickets:export` | NEW | Export CSV button |
| Service Requests | Create | Create | `tickets:create` | NEW | Create Request button, modal, form |
| Service Requests | Detail Drawer | View | `tickets:view` | NEW | Drawer with all fields |
| Service Requests | Detail Drawer | Edit | `tickets:write` | EXISTING | Editable field inputs |
| Service Requests | Detail Drawer | Assign | `tickets:assign` | EXISTING | Assign button |
| Service Requests | Detail Drawer | Escalate | `tickets:escalate` | NEW | Escalate button |
| Service Requests | Detail Drawer | Close | `tickets:update_status` | NEW | Close button |
| Service Requests | Detail Drawer | Reopen | `tickets:update_status` | NEW | Reopen button |
| Service Requests | Detail Drawer | Comment | `tickets:comment` | NEW | Comment textarea, Save button |
| Incidents | List | View | `incidents:view` | NEW | Table, all rows |
| Incidents | List | Create | `incidents:create` | NEW | Create button, modal |
| Incidents | List | Export | `incidents:export` | NEW | Export CSV button |
| Incidents | Detail | Edit | `incidents:write` | EXISTING | Field inputs |
| Incidents | Detail | Resolve | `incidents:resolve` | NEW | Resolve button |
| Incidents | Detail | Escalate | `incidents:escalate` | NEW | Escalate button |
| Incidents | Detail | Close | `incidents:close` | NEW | Close button |
| Problems | List | View | `problems:view` | NEW | Table |
| Problems | List | Create | `problems:create` | NEW | Create button |
| Problems | Detail | Edit | `problems:write` | NEW | Field inputs |
| Problems | Detail | Resolve | `problems:resolve` | NEW | Resolve button |
| Changes | List | View | `changes:view` | NEW | Table |
| Changes | List | Create | `changes:create` | NEW | Create button |
| Changes | List | Export | `changes:export` | NEW | Export button |
| Changes | Detail | Edit | `changes:write` | NEW | Field inputs |
| Changes | Detail | Approve | `changes:approve` | EXISTING | Approve button |
| Changes | Detail | Reject | `changes:reject` | NEW | Reject button |
| Changes | Detail | Implement | `changes:implement` | NEW | Implement button |
| Changes | Detail | Rollback | `changes:rollback` | NEW | Rollback button |
| Inventory | List | View | `inventory:view` | NEW | Table |
| Inventory | List | Create | `inventory:create` | NEW | Create button |
| Inventory | List | Export | `inventory:export` | NEW | Export button |
| Inventory | Detail | Edit | `inventory:write` | EXISTING | Field inputs |
| Inventory | Detail | Assign | `inventory:assign` | NEW | Assign button |
| Inventory | Detail | Return | `inventory:return` | NEW | Return button |
| Inventory | Detail | Dispose | `inventory:dispose` | NEW | Dispose button |
| Inventory | Detail | Delete | `inventory:delete` | NEW | Delete button |
| Access Management | List | View | `access:view` | NEW | Table |
| Access Management | List | Create | `access:create` | NEW | Create button |
| Access Management | List | Export | `access:export` | NEW | Export button |
| Access Management | Detail | Edit | `access:write` | NEW | Field inputs |
| Access Management | Detail | Approve | `access:approve` | EXISTING | Approve button |
| Access Management | Detail | Reject | `access:reject` | NEW | Reject button |
| Access Management | Detail | Revoke | `access:revoke` | NEW | Revoke button |
| Compliance | List | View | `compliance:view` | NEW | Table |
| Compliance | List | Create | `compliance:create` | NEW | Create button |
| Compliance | List | Export | `compliance:export` | NEW | Export button |
| Compliance | Detail | Edit | `compliance:write` | EXISTING | Field inputs |
| Compliance | Detail | Audit | `compliance:audit` | NEW | Mark Audited button |
| Compliance | Detail | Exception | `compliance:exception` | NEW | Grant Exception button |
| Projects | List | View | `projects:view` | NEW | Table |
| Projects | List | Create | `projects:create` | NEW | Create button |
| Projects | Detail | Edit | `projects:write` | NEW | Field inputs |
| Projects | Detail | Delete | `projects:delete` | NEW | Delete button |
| Vendors | List | View | `vendors:view` | NEW | Table |
| Vendors | List | Create | `vendors:create` | NEW | Create button |
| Vendors | Detail | Edit | `vendors:write` | NEW | Field inputs |
| Vendors | Detail | Allocate | `licenses:allocate` | NEW | Allocate button |
| Knowledge Base | List | View | `knowledge:view` | NEW | Table |
| Knowledge Base | List | Create | `knowledge:create` | NEW | Create button |
| Knowledge Base | Detail | Edit | `knowledge:write` | NEW | Field inputs |
| Knowledge Base | Detail | Publish | `knowledge:publish` | NEW | Publish button |
| Reports | List | View | `reports:view` | NEW | Report cards |
| Reports | Detail | Generate | `reports:generate` | NEW | Generate button |
| Reports | Detail | Export | `reports:export` | NEW | Export button |
| Users & Teams | List | View | `users:view` | NEW | Table |
| Users & Teams | List | Refresh | `users:view` | NEW | Refresh button |
| Users & Teams | List | Export | `users:export` | NEW | Export button |
| Users & Teams | List | Create | `users:create` | NEW | Create button, modal |
| Users & Teams | List | Delete | `users:delete` | EXISTING | Delete button |
| Users & Teams | Detail | Edit | `users:write` | EXISTING | Field inputs |
| Users & Teams | Detail | Activate | `users:activate` | NEW | Status → ACTIVE |
| Users & Teams | Detail | Deactivate | `users:deactivate` | NEW | Status → DISABLED |
| Users & Teams | Detail | Reset Password | `users:reset_password` | NEW | Reset button |
| Roles & Permissions | List | View | `roles:view` | NEW | Table |
| Roles & Permissions | List | Create | `roles:create` | NEW | Create Role button |
| Roles & Permissions | Detail | Edit | `roles:write` | NEW | Name, description inputs |
| Roles & Permissions | Detail | Manage Permissions | `roles:manage_permissions` | NEW | Permission checkboxes |
| Roles & Permissions | Detail | Delete | `roles:delete` | NEW | Delete button |
| Settings | Page | View | `settings:view` | NEW | Settings page tabs |
| Settings | AI Tab | Edit AI | `settings:ai` | NEW | AI config inputs |
| Settings | Notifications | Edit | `settings:notifications` | NEW | Email/Teams toggles |
| Settings | SLA Tab | Edit SLA | `settings:sla` | NEW | SLA inputs |
| Settings | Audit Logs | View | `settings:audit_logs` | NEW | Audit log table |
| AI Assistant | Command Bar | View | `ai:use` | NEW | Command bar panel |
| AI Assistant | Command Bar | Send | `ai:ask` | EXISTING | Send button |
| AI Assistant | Ticket | Summarize | `ai:summarize` | NEW | Summarize button |
| AI Assistant | Ticket | Suggest | `ai:suggest` | NEW | Suggest button |
| Import | Import Page | Execute | `import:execute` | NEW | Import button, file upload |

---

## F. RECOMMENDED ROLE TEMPLATES

### Super Admin
```json
{
  "name": "Super Admin",
  "permissions": ["*"]
}
```

### Admin
```json
{
  "name": "Admin",
  "permissions": [
    "dashboard:view", "dashboard:read",
    "tickets:*",
    "incidents:*",
    "problems:*",
    "changes:*",
    "inventory:*",
    "access:*",
    "compliance:*",
    "projects:*",
    "vendors:*",
    "knowledge:*",
    "reports:*",
    "users:view", "users:create", "users:write", "users:delete", "users:activate", "users:deactivate", "users:reset_password", "users:export",
    "roles:view", "roles:create", "roles:write", "roles:manage_permissions", "roles:delete",
    "settings:view", "settings:read", "settings:write",
    "ai:*",
    "import:*"
  ]
}
```

### IT Manager
```json
{
  "name": "IT Manager",
  "permissions": [
    "dashboard:view", "dashboard:read",
    "tickets:view", "tickets:create", "tickets:write", "tickets:assign", "tickets:update_status", "tickets:escalate", "tickets:comment", "tickets:export",
    "incidents:view", "incidents:create", "incidents:write", "incidents:resolve", "incidents:escalate", "incidents:close",
    "changes:view", "changes:create", "changes:write", "changes:approve", "changes:reject",
    "inventory:view", "inventory:create", "inventory:write", "inventory:assign",
    "access:view", "access:create", "access:write", "access:approve", "access:reject",
    "compliance:view", "compliance:audit",
    "projects:view",
    "vendors:view",
    "knowledge:view", "knowledge:create", "knowledge:write",
    "reports:view", "reports:generate", "reports:export",
    "users:view",
    "settings:view",
    "ai:use", "ai:ask", "ai:summarize", "ai:suggest"
  ]
}
```

### Support Agent
```json
{
  "name": "Support Agent",
  "permissions": [
    "dashboard:view",
    "tickets:view", "tickets:create", "tickets:write", "tickets:assign", "tickets:update_status", "tickets:comment",
    "incidents:view", "incidents:write", "incidents:resolve",
    "inventory:view",
    "access:view", "access:create",
    "knowledge:view",
    "ai:use", "ai:ask", "ai:summarize"
  ]
}
```

### Employee
```json
{
  "name": "Employee",
  "permissions": [
    "dashboard:view",
    "tickets:view", "tickets:create", "tickets:comment",
    "incidents:view",
    "access:view", "access:create",
    "knowledge:view",
    "ai:use", "ai:ask"
  ]
}
```

### Auditor (Read-Only)
```json
{
  "name": "Auditor",
  "permissions": [
    "dashboard:view",
    "tickets:view", "tickets:export",
    "incidents:view", "incidents:export",
    "changes:view", "changes:export",
    "inventory:view", "inventory:export",
    "access:view", "access:export",
    "compliance:view", "compliance:export",
    "projects:view",
    "vendors:view",
    "knowledge:view",
    "reports:view", "reports:export",
    "users:view", "users:export",
    "settings:view", "settings:audit_logs",
    "ai:use"
  ]
}
```

---

## G. IMPLEMENTATION ROADMAP

### Phase 1: Permission Model Expansion (Week 1)
1. Add new permission codes to `seed.ts`
2. Create migration for new permissions
3. Update backend routes with granular permissions
4. Test permission enforcement

### Phase 2: Frontend Permission Guards (Week 2)
1. Add `hasPermission()` checks to all buttons
2. Hide action buttons based on permissions
3. Hide entire pages based on permissions
4. Test UI visibility rules

### Phase 3: Roles & Permissions UI Enhancement (Week 3)
1. Redesign Roles & Permissions modal
2. Add module-level permission grouping
3. Add permission search/filter
4. Add bulk permission assignment

### Phase 4: Validation & Testing (Week 4)
1. End-to-end permission testing
2. Role template creation
3. Documentation updates
4. User training materials

---

## H. MIGRATION SCRIPT (New Permissions)

```typescript
// Add these permissions to seed.ts
const newPermissions = [
  // Service Requests
  'tickets:view',
  'tickets:create',
  'tickets:update_status',
  'tickets:escalate',
  'tickets:comment',
  'tickets:export',
  
  // Incidents
  'incidents:view',
  'incidents:create',
  'incidents:resolve',
  'incidents:escalate',
  'incidents:close',
  'incidents:export',
  
  // Problems
  'problems:view',
  'problems:read',
  'problems:create',
  'problems:write',
  'problems:resolve',
  'problems:link_incident',
  'problems:export',
  
  // Changes
  'changes:view',
  'changes:create',
  'changes:write',
  'changes:reject',
  'changes:implement',
  'changes:rollback',
  'changes:export',
  
  // Inventory
  'inventory:view',
  'inventory:create',
  'inventory:delete',
  'inventory:assign',
  'inventory:return',
  'inventory:dispose',
  'inventory:export',
  
  // Access Management
  'access:view',
  'access:create',
  'access:write',
  'access:reject',
  'access:revoke',
  'access:export',
  
  // Compliance
  'compliance:view',
  'compliance:create',
  'compliance:audit',
  'compliance:exception',
  'compliance:export',
  
  // Projects & Environments
  'projects:view',
  'projects:read',
  'projects:create',
  'projects:write',
  'projects:delete',
  'projects:export',
  
  // Vendors & Licenses
  'vendors:view',
  'vendors:read',
  'vendors:create',
  'vendors:write',
  'vendors:delete',
  'licenses:allocate',
  'licenses:renew',
  'vendors:export',
  
  // Knowledge Base
  'knowledge:view',
  'knowledge:read',
  'knowledge:create',
  'knowledge:write',
  'knowledge:delete',
  'knowledge:publish',
  'knowledge:export',
  
  // Reports
  'reports:view',
  'reports:read',
  'reports:generate',
  'reports:export',
  
  // Users
  'users:view',
  'users:create',
  'users:activate',
  'users:deactivate',
  'users:reset_password',
  'users:export',
  
  // Roles
  'roles:view',
  'roles:read',
  'roles:create',
  'roles:write',
  'roles:manage_permissions',
  'roles:delete',
  
  // Settings
  'settings:view',
  'settings:ai',
  'settings:notifications',
  'settings:sla',
  'settings:backup',
  'settings:audit_logs',
  
  // AI
  'ai:use',
  'ai:summarize',
  'ai:suggest',
  'ai:code_review',
  
  // Import/Export
  'import:execute',
  'export:all',
  'export:configure',
  
  // System
  'system:admin',
  'system:logs',
  'system:maintenance',
  'system:api_keys',
  
  // Dashboard
  'dashboard:view'
];
```

---

## I. BACKWARD COMPATIBILITY MAP

| Old Permission | New Permission(s) | Notes |
|----------------|-------------------|-------|
| `dashboard:read` | `dashboard:view` + `dashboard:read` | Split for menu vs data |
| `tickets:read` | `tickets:view` + `tickets:read` | Split for UI vs API |
| `tickets:write` | `tickets:create` + `tickets:write` | Separate create |
| `incidents:read` | `incidents:view` + `incidents:read` | Split for UI vs API |
| `incidents:write` | `incidents:create` + `incidents:write` | Separate create |
| `changes:read` | `changes:view` | Menu access |
| `changes:approve` | `changes:create` + `changes:approve` | Create is separate |
| `inventory:read` | `inventory:view` | Menu access |
| `inventory:write` | `inventory:create` + `inventory:write` | Create is separate |
| `access:read` | `access:view` | Menu access |
| `access:approve` | `access:create` + `access:approve` | Create is separate |
| `compliance:read` | `compliance:view` | Menu access |
| `compliance:write` | `compliance:create` + `compliance:write` | Create is separate |
| `settings:read` | `settings:view` | Menu access |
| `users:read` | `users:view` | Menu access |
| `users:write` | `users:create` + `users:write` | Create is separate |
| `ai:ask` | `ai:use` + `ai:ask` | Rename for clarity |

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-20  
**Prepared For:** Saven InfraOps Enterprise V6  
**Status:** Ready for Implementation
