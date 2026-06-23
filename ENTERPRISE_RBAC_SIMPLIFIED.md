# Saven InfraOps Enterprise RBAC - Simplified Model

**Version:** 2.0  
**Date:** 2026-06-20  
**Purpose:** Simplified permission model for implementation

---

## FINAL PERMISSION CATALOG

### Total Permissions: 56 (reduced from 90+)

```
MODULE         | view         | create       | manage       | export
---------------|--------------|--------------|--------------|--------------
dashboard      | dashboard:view              |              | dashboard:export
service-req    | sr:view       | sr:create    | sr:manage    | sr:export
incidents      | inc:view      | inc:create   | inc:manage   | inc:export
problems       | prb:view      | prb:create   | prb:manage   | prb:export
changes        | chg:view      | chg:create   | chg:manage   | chg:export
inventory      | inv:view      | inv:create   | inv:manage   | inv:export
access         | acc:view      | acc:create   | acc:manage   | acc:export
compliance     | cmp:view      | cmp:create   | cmp:manage   | cmp:export
projects       | prj:view      | prj:create   | prj:manage   | prj:export
vendors        | vnd:view      | vnd:create   | vnd:manage   | vnd:export
knowledge      | kb:view       | kb:create    | kb:manage    | kb:export
reports        | rpt:view      |              | rpt:generate | rpt:export
users          | usr:view      | usr:create   | usr:manage   | usr:export
roles          | rol:view      | rol:create   | rol:manage   |
settings       | set:view      |              | set:manage   |
ai             |              |              | ai:use       |
system         |              |              | sys:admin    |
```

---

## COMPLETE PERMISSION LIST (56)

### Dashboard Module
| Permission | Description |
|------------|-------------|
| `dashboard:view` | View dashboard page and widgets |
| `dashboard:export` | Export dashboard data |

### Service Requests Module
| Permission | Description |
|------------|-------------|
| `sr:view` | View service request list and details |
| `sr:create` | Create new service requests |
| `sr:manage` | Update, assign, close, escalate, comment on SRs |
| `sr:export` | Export service requests to CSV |

### Incidents Module
| Permission | Description |
|------------|-------------|
| `inc:view` | View incident list and details |
| `inc:create` | Create new incidents |
| `inc:manage` | Update, resolve, escalate, close incidents |
| `inc:export` | Export incidents to CSV |

### Problems Module
| Permission | Description |
|------------|-------------|
| `prb:view` | View problem list and details |
| `prb:create` | Create new problems |
| `prb:manage` | Update and resolve problems |
| `prb:export` | Export problems to CSV |

### Changes Module
| Permission | Description |
|------------|-------------|
| `chg:view` | View change request list and details |
| `chg:create` | Create new change requests |
| `chg:manage` | Approve, reject, implement, rollback changes |
| `chg:export` | Export changes to CSV |

### Inventory Module
| Permission | Description |
|------------|-------------|
| `inv:view` | View asset list and details |
| `inv:create` | Create new assets |
| `inv:manage` | Update, assign, return, dispose, delete assets |
| `inv:export` | Export inventory to CSV |

### Access Management Module
| Permission | Description |
|------------|-------------|
| `acc:view` | View access request list and details |
| `acc:create` | Create new access requests |
| `acc:manage` | Approve, reject, revoke access |
| `acc:export` | Export access requests to CSV |

### Compliance Module
| Permission | Description |
|------------|-------------|
| `cmp:view` | View compliance controls and status |
| `cmp:create` | Create new compliance controls |
| `cmp:manage` | Update, audit, exception on controls |
| `cmp:export` | Export compliance data to CSV |

### Projects Module
| Permission | Description |
|------------|-------------|
| `prj:view` | View projects and environments |
| `prj:create` | Create new projects |
| `prj:manage` | Update and delete projects |
| `prj:export` | Export projects to CSV |

### Vendors Module
| Permission | Description |
|------------|-------------|
| `vnd:view` | View vendor and license data |
| `vnd:create` | Add new vendors |
| `vnd:manage` | Update vendors, allocate/renew licenses |
| `vnd:export` | Export vendor data to CSV |

### Knowledge Base Module
| Permission | Description |
|------------|-------------|
| `kb:view` | View knowledge base articles |
| `kb:create` | Create new articles |
| `kb:manage` | Edit, publish, delete articles |
| `kb:export` | Export knowledge base |

### Reports Module
| Permission | Description |
|------------|-------------|
| `rpt:view` | View reports and analytics |
| `rpt:generate` | Generate custom reports |
| `rpt:export` | Export reports |

### Users Module
| Permission | Description |
|------------|-------------|
| `usr:view` | View user list and details |
| `usr:create` | Create new users |
| `usr:manage` | Update, activate, deactivate, delete users |
| `usr:export` | Export user list to CSV |

### Roles Module
| Permission | Description |
|------------|-------------|
| `rol:view` | View roles and permissions |
| `rol:create` | Create new roles |
| `rol:manage` | Update role permissions, delete roles |

### Settings Module
| Permission | Description |
|------------|-------------|
| `set:view` | View system settings |
| `set:manage` | Update AI, notifications, SLA settings |

### AI Module
| Permission | Description |
|------------|-------------|
| `ai:use` | Use AI assistant for queries and suggestions |

### System Module
| Permission | Description |
|------------|-------------|
| `sys:admin` | Full system administration (backup, maintenance, logs) |

---

## PERMISSION MAPPING (Old → New)

| Old Permission | New Permissions |
|---------------|-----------------|
| `dashboard:read` | `dashboard:view` |
| `tickets:read` | `sr:view` |
| `tickets:write` | `sr:create` + `sr:manage` |
| `tickets:assign` | `sr:manage` |
| `incidents:read` | `inc:view` |
| `incidents:write` | `inc:create` + `inc:manage` |
| `changes:read` | `chg:view` |
| `changes:approve` | `chg:create` + `chg:manage` |
| `inventory:read` | `inv:view` |
| `inventory:write` | `inv:create` + `inv:manage` |
| `access:read` | `acc:view` |
| `access:approve` | `acc:create` + `acc:manage` |
| `compliance:read` | `cmp:view` |
| `compliance:write` | `cmp:create` + `cmp:manage` |
| `settings:read` | `set:view` |
| `settings:write` | `set:manage` |
| `users:read` | `usr:view` + `rol:view` |
| `users:write` | `usr:create` + `usr:manage` + `rol:create` + `rol:manage` |
| `users:delete` | `usr:manage` |
| `ai:ask` | `ai:use` |

---

## UI ELEMENTS BY PERMISSION

### dashboard:view
**Hide without permission:**
- Dashboard menu item in sidebar
- All stat cards (Open SRs, Critical Incidents, SLA Breaches, etc.)
- Refresh button on dashboard
- All dashboard widgets

---

### sr:view
**Hide without permission:**
- Service Requests menu item in sidebar
- Service Requests table
- All row data display
- Open button in table rows

---

### sr:create
**Hide without permission:**
- "Create Request" button
- Create Request modal
- All form fields (Title, Description, Category, Priority, etc.)
- Save Request button

---

### sr:manage
**Hide without permission:**
- All status change buttons in drawer:
  - Assign button
  - Escalate button
  - Close button
  - Reopen button
  - Wait for User button
- Edit button
- Comment textarea
- Save Comment button

---

### sr:export
**Hide without permission:**
- Export CSV button

---

### inc:view
**Hide without permission:**
- Incidents menu item in sidebar
- Incidents table
- All row data display
- Open button in table rows

---

### inc:create
**Hide without permission:**
- Create button
- Create Incident modal
- All form fields
- Save button

---

### inc:manage
**Hide without permission:**
- Edit button
- Resolve button
- Escalate button
- Close button
- All status change buttons

---

### inc:export
**Hide without permission:**
- Export CSV button

---

### prb:view
**Hide without permission:**
- Problems menu item in sidebar
- Problems table

---

### prb:create
**Hide without permission:**
- Create button
- Create modal

---

### prb:manage
**Hide without permission:**
- Edit button
- Resolve button

---

### prb:export
**Hide without permission:**
- Export CSV button

---

### chg:view
**Hide without permission:**
- Changes menu item in sidebar
- Changes table

---

### chg:create
**Hide without permission:**
- Create button
- Create modal

---

### chg:manage
**Hide without permission:**
- Edit button
- Approve button
- Reject button
- Implement button
- Rollback button

---

### chg:export
**Hide without permission:**
- Export CSV button

---

### inv:view
**Hide without permission:**
- Inventory menu item in sidebar
- Inventory table

---

### inv:create
**Hide without permission:**
- Create button
- Create Asset modal

---

### inv:manage
**Hide without permission:**
- Edit button
- Assign button
- Return button
- Dispose button
- Delete button

---

### inv:export
**Hide without permission:**
- Export CSV button

---

### acc:view
**Hide without permission:**
- Access Management menu item in sidebar
- Access Management table

---

### acc:create
**Hide without permission:**
- Create button
- Create Access Request modal

---

### acc:manage
**Hide without permission:**
- Edit button
- Approve button
- Reject button
- Revoke button

---

### acc:export
**Hide without permission:**
- Export CSV button

---

### cmp:view
**Hide without permission:**
- Compliance menu item in sidebar
- Compliance table

---

### cmp:create
**Hide without permission:**
- Create button
- Create Control modal

---

### cmp:manage
**Hide without permission:**
- Edit button
- Mark Audited button
- Grant Exception button

---

### cmp:export
**Hide without permission:**
- Export CSV button

---

### prj:view
**Hide without permission:**
- Projects & Environments menu item in sidebar
- Projects table

---

### prj:create
**Hide without permission:**
- Create button
- Create Project modal

---

### prj:manage
**Hide without permission:**
- Edit button
- Delete button

---

### prj:export
**Hide without permission:**
- Export CSV button

---

### vnd:view
**Hide without permission:**
- Vendors & Licenses menu item in sidebar
- Vendors table

---

### vnd:create
**Hide without permission:**
- Create button
- Create Vendor modal

---

### vnd:manage
**Hide without permission:**
- Edit button
- Allocate button
- Renew button

---

### vnd:export
**Hide without permission:**
- Export CSV button

---

### kb:view
**Hide without permission:**
- Knowledge Base menu item in sidebar
- Knowledge Base table

---

### kb:create
**Hide without permission:**
- Create button
- Create Article modal

---

### kb:manage
**Hide without permission:**
- Edit button
- Publish button
- Delete button

---

### kb:export
**Hide without permission:**
- Export button

---

### rpt:view
**Hide without permission:**
- Reports & Analytics menu item in sidebar
- All report cards

---

### rpt:generate
**Hide without permission:**
- Generate Report button
- Report configuration options

---

### rpt:export
**Hide without permission:**
- Export button

---

### usr:view
**Hide without permission:**
- Users & Teams menu item in sidebar
- Users table
- All row data

---

### usr:create
**Hide without permission:**
- Create button
- Create User modal
- All form fields
- Save User button

---

### usr:manage
**Hide without permission:**
- Edit button (in drawer)
- Delete button (red button)
- Status dropdown
- Activate action
- Deactivate action
- Reset Password button

---

### usr:export
**Hide without permission:**
- Export CSV button

---

### rol:view
**Hide without permission:**
- Roles & Permissions menu item in sidebar
- Roles table
- Permission checkboxes

---

### rol:create
**Hide without permission:**
- Create Role button
- Create Role modal
- Role name input
- Save button

---

### rol:manage
**Hide without permission:**
- Edit button (role name/description)
- Permission checkboxes
- Delete button

---

### set:view
**Hide without permission:**
- Settings menu item in sidebar
- All settings tabs

---

### set:manage
**Hide without permission:**
- Save buttons in all settings tabs
- AI Provider dropdown
- API key inputs
- Email/Teams toggles
- SLA inputs

---

### ai:use
**Hide without permission:**
- AI Command Bar panel
- Message input
- Send button
- All AI actions (Summarize, Suggest)

---

### sys:admin
**Hide without permission:**
- Audit Logs tab
- Backup management
- Maintenance mode toggle
- System configuration

---

## RECOMMENDED ROLE TEMPLATES

### Super Admin
```
dashboard:view, dashboard:export
sr:view, sr:create, sr:manage, sr:export
inc:view, inc:create, inc:manage, inc:export
prb:view, prb:create, prb:manage, prb:export
chg:view, chg:create, chg:manage, chg:export
inv:view, inv:create, inv:manage, inv:export
acc:view, acc:create, acc:manage, acc:export
cmp:view, cmp:create, cmp:manage, cmp:export
prj:view, prj:create, prj:manage, prj:export
vnd:view, vnd:create, vnd:manage, vnd:export
kb:view, kb:create, kb:manage, kb:export
rpt:view, rpt:generate, rpt:export
usr:view, usr:create, usr:manage, usr:export
rol:view, rol:create, rol:manage
set:view, set:manage
ai:use
sys:admin
```

### Admin (IT Manager)
```
dashboard:view, dashboard:export
sr:view, sr:create, sr:manage, sr:export
inc:view, inc:create, inc:manage, inc:export
prb:view, prb:create, prb:manage, prb:export
chg:view, chg:create, chg:manage, chg:export
inv:view, inv:create, inv:manage, inv:export
acc:view, acc:create, acc:manage, acc:export
cmp:view, cmp:create, cmp:manage, cmp:export
prj:view, prj:create, prj:manage, prj:export
vnd:view, vnd:create, vnd:manage, vnd:export
kb:view, kb:create, kb:manage, kb:export
rpt:view, rpt:generate, rpt:export
usr:view, usr:create, usr:manage, usr:export
rol:view, rol:create, rol:manage
set:view, set:manage
ai:use
```

### Support Agent
```
dashboard:view
sr:view, sr:create, sr:manage
inc:view, inc:manage
prb:view
acc:view, acc:create
kb:view
ai:use
```

### Employee
```
dashboard:view
sr:view, sr:create
inc:view
acc:view, acc:create
kb:view
ai:use
```

### Auditor
```
dashboard:view
sr:view, sr:export
inc:view, inc:export
prb:view, prb:export
chg:view, chg:export
inv:view, inv:export
acc:view, acc:export
cmp:view, cmp:export
prj:view
vnd:view
kb:view
rpt:view, rpt:export
usr:view, usr:export
set:view
sys:admin
```

---

## SEED SCRIPT

```typescript
const permissions = [
  // Dashboard
  'dashboard:view',
  'dashboard:export',
  
  // Service Requests
  'sr:view',
  'sr:create',
  'sr:manage',
  'sr:export',
  
  // Incidents
  'inc:view',
  'inc:create',
  'inc:manage',
  'inc:export',
  
  // Problems
  'prb:view',
  'prb:create',
  'prb:manage',
  'prb:export',
  
  // Changes
  'chg:view',
  'chg:create',
  'chg:manage',
  'chg:export',
  
  // Inventory
  'inv:view',
  'inv:create',
  'inv:manage',
  'inv:export',
  
  // Access Management
  'acc:view',
  'acc:create',
  'acc:manage',
  'acc:export',
  
  // Compliance
  'cmp:view',
  'cmp:create',
  'cmp:manage',
  'cmp:export',
  
  // Projects
  'prj:view',
  'prj:create',
  'prj:manage',
  'prj:export',
  
  // Vendors
  'vnd:view',
  'vnd:create',
  'vnd:manage',
  'vnd:export',
  
  // Knowledge Base
  'kb:view',
  'kb:create',
  'kb:manage',
  'kb:export',
  
  // Reports
  'rpt:view',
  'rpt:generate',
  'rpt:export',
  
  // Users
  'usr:view',
  'usr:create',
  'usr:manage',
  'usr:export',
  
  // Roles
  'rol:view',
  'rol:create',
  'rol:manage',
  
  // Settings
  'set:view',
  'set:manage',
  
  // AI
  'ai:use',
  
  // System
  'sys:admin'
];
```

---

## SUMMARY

| Metric | Value |
|--------|-------|
| Total Modules | 16 |
| Total Permissions | 56 |
| Permissions per module (avg) | 3.5 |
| View permissions | 15 |
| Create permissions | 13 |
| Manage permissions | 14 |
| Export permissions | 13 |
| Special permissions | 2 (ai:use, sys:admin) |

---

**Document Version:** 2.0  
**Last Updated:** 2026-06-20  
**Status:** Ready for Implementation
