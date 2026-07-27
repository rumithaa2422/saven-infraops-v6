# MODULE SCREENSHOTS REFERENCE

**Version:** 1.0  
**Date:** 2026-06-20  
**Purpose:** Visual reference for all modules, pages, and UI components

---

## HOW TO USE THIS DOCUMENT

For each module, this document provides:
1. ASCII representation of the page layout
2. Component inventory
3. Button and action locations
4. Permission requirements

---

## MODULE 1: DASHBOARD

**Route:** `/`  
**File:** `DashboardPage.tsx`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │                                                             │
│             │  ┌─────────────────────────────────────────────────────┐   │
│  Dashboard  │  │                                                     │   │
│  ─────────  │  │  AI-first operations                               │   │
│  Service    │  │  What do you want to check today?                  │   │
│    Req     │  │                                                     │   │
│  Incidents  │  │  Use the menu for structured work.                 │   │
│  Problems   │  │  Use the command bar for fast answers.            │   │
│  Changes    │  └─────────────────────────────────────────────────────┘   │
│  Inventory  │                                                             │
│  Access     │  ┌─────────┐ ┌─────────┐ ┌─────────┐                     │
│  Compliance │  │  Open   │ │Critical │ │  SLA    │                     │
│  Users      │  │ Service │ │Incidents│ │ Breaches│                     │
│  Roles      │  │   12    │ │    3    │ │    2    │                     │
│  Settings   │  └─────────┘ └─────────┘ └─────────┘                     │
│             │                                                             │
│             │  ┌─────────┐ ┌─────────┐ ┌─────────┐                     │
│             │  │Pending  │ │Available│ │Pending  │                     │
│             │  │Complianc│ │ Assets  │ │Approvals│                     │
│             │  │    5    │ │   24    │ │    8    │                     │
│             │  └─────────┘ └─────────┘ └─────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | ID/Class | Type | Permission |
|-----------|-----------|------|------------|
| Hero Panel | `.hero-panel` | Section | None |
| Open SR Card | StatCard | StatCard | `dashboard:read` |
| Critical Incidents Card | StatCard | StatCard | `dashboard:read` |
| SLA Breaches Card | StatCard | StatCard | `dashboard:read` |
| Pending Compliance Card | StatCard | StatCard | `dashboard:read` |
| Available Assets Card | StatCard | StatCard | `dashboard:read` |
| Pending Approvals Card | StatCard | StatCard | `dashboard:read` |

---

## MODULE 2: SERVICE REQUESTS

**Route:** `/service-requests`  
**File:** `ServiceRequestsPage.tsx`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Service Requests                               [Ref][CSV][+] │
│             │  ITSM                                                    │
│             │  ─────────────────────────────────────────────────────────  │
│  Dashboard  │  ┌─────────────────────────────────────────────────────┐    │
│  ─────────  │  │ Ticket │ Title      │ Cat  │ Pri │ Status │ Req │ Asg │    │
│  Service    │  ├────────┼────────────┼──────┼─────┼────────┼─────┼─────┤    │
│    Req ●   │  │ SR-1001│VPN Issues  │Net   │HIGH │ OPEN   │John │Infra│    │
│  Incidents  │  │ SR-1002│Laptop Req  │Asset │ MED │ASSIGNED│ HR  │Admin│    │
│  Problems   │  │ SR-1003│Access Perm │Perm  │ LOW │OPEN    │Jane │Infra│    │
│  Changes    │  └─────────────────────────────────────────────────────┘    │
│  Inventory  │  Stats: [Active: 12] [Tracked: 45] [Due: 3]                │
│  Access     │                                                             │
│  Compliance │  DRAWER (on row click):                                    │
│  Users      │  ┌──────────────────────────────────────────────┐           │
│  Roles      │  │ SR-1001                                    [X]│           │
│  Settings   │  │ VPN not working                            │           │
│             │  │ Category: Network > VPN                     │           │
│             │  │ Priority: HIGH                              │           │
│             │  │ Status: OPEN                                │           │
│             │  │ Requester: John Smith                       │           │
│             │  │ Assignee: Infra Team                        │           │
│             │  │                                             │           │
│             │  │ [Assign] [Escalate] [Close] [Wait]         │           │
│             │  │                                             │           │
│             │  │ Comment:                                    │           │
│             │  │ [________________________________] [Save]   │           │
│             │  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | ID/Class | Type | Permission |
|-----------|-----------|------|------------|
| Page Header | `.page-title-row` | Header | `tickets:read` |
| Refresh Button | `button.secondary` | Button | `tickets:read` |
| Export CSV Button | `button.secondary` | Button | **NONE** ⚠️ |
| Create Button | `button.primary` | Button | `tickets:write` |
| Service Request Table | `table` | Table | `tickets:read` |
| Open Button | `button.link-button` | Button | `tickets:read` |
| Detail Drawer | `.drawer` | Drawer | `tickets:read` |
| Assign Button | `.drawer-actions button` | Button | `tickets:assign` |
| Escalate Button | `.drawer-actions button` | Button | `tickets:write` |
| Close Button | `.drawer-actions button` | Button | `tickets:write` |
| Wait for User Button | `.drawer-actions button` | Button | `tickets:write` |
| Comment Box | `.comment-box` | Form | `tickets:write` |
| Save Comment Button | `.comment-box button` | Button | `tickets:write` |

### Create Modal

```
┌──────────────────────────────────────────────┐
│ Create Service Request                  [X]  │
│ ─────────────────────────────────────────── │
│ Title *                                     │
│ [________________________________]         │
│                                             │
│ Description                                 │
│ [________________________________]         │
│                                             │
│ Category *                                  │
│ [Network________________________]           │
│                                             │
│ Sub Category                                │
│ [VPN____________________________]           │
│                                             │
│ Priority                                    │
│ [MEDIUM_________________________]           │
│                                             │
│ Requester *                                 │
│ [________________________________]         │
│                                             │
│ Project                                     │
│ [________________________________]         │
│                                             │
│              [Cancel]  [Save Request]       │
└──────────────────────────────────────────────┘
```

---

## MODULE 3: INCIDENTS

**Route:** `/incidents`  
**File:** `ModulePage.tsx` with `moduleKey="incidents"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Incidents                                    [Ref][CSV][+]   │
│             │  Management                                               │
│  Dashboard  │  ─────────────────────────────────────────────────────────  │
│  Service    │  ┌─────────────────────────────────────────────────────┐   │
│  Incidents● │  │ Incident│ Title         │ Sev │ Status │ Owner │     │
│  Problems   │  ├─────────┼───────────────┼─────┼────────┼───────┤     │
│  Changes    │  │ INC-1001│UAT API Timeout│SEV2 │IN_PROG │DevOps │     │
│  Inventory  │  │ INC-1002│DB Connection  │SEV3 │OPEN    │SRE    │     │
│  Access     │  └─────────────────────────────────────────────────────┘   │
│  Compliance  │  Stats: [Active: 5] [Tracked: 12] [Risk: 2]              │
│  Users       │                                                           │
│  Roles       │  DRAWER: Similar to Service Requests                      │
│  Settings    │  Status actions: Open, In Progress, Resolved, Closed       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `incidents:read` |
| Refresh Button | Button | `incidents:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `incidents:write` |
| Incidents Table | Table | `incidents:read` |
| Open Button | Button | `incidents:read` |
| Status Dropdown | Select | `incidents:write` |

---

## MODULE 4: PROBLEMS

**Route:** `/problems`  
**File:** `ModulePage.tsx` with `moduleKey="problems"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Problems                                     [Ref][CSV][+]   │
│             │  Management                                               │
│  Dashboard  │  ─────────────────────────────────────────────────────────  │
│  Service    │  ┌─────────────────────────────────────────────────────┐   │
│  Incidents  │  │ Problem │ Title             │ Status │ Owner │       │
│  Problems ● │  ├─────────┼───────────────────┼────────┼───────┤       │
│  Changes    │  │ PRB-1001│Memory Leak in API│OPEN    │SRE    │       │
│  Inventory  │  │ PRB-1002│DB Slow Queries  │INVESTIG│DevOps │       │
│  Access     │  └─────────────────────────────────────────────────────┘   │
│  Compliance  │  Stats: [Active: 3] [Tracked: 8] [Risk: 1]              │
│  Users       │                                                           │
│  Roles       │  NOTE: Shares `incidents:read` permission (GAP-08)       │
│  Settings    │                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `incidents:read` (should be `prb:view`) |
| Refresh Button | Button | `incidents:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `incidents:write` |
| Problems Table | Table | `incidents:read` |
| Open Button | Button | `incidents:read` |
| Status Dropdown | Select | `incidents:write` |

---

## MODULE 5: CHANGES

**Route:** `/changes`  
**File:** `ModulePage.tsx` with `moduleKey="changes"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Change Management                            [Ref][CSV][+]   │
│             │  ─────────────────────────────────────────────────────────── │
│  Dashboard  │  ┌─────────────────────────────────────────────────────┐   │
│  Service    │  │ Change │ Title       │ Risk │ Status │ Owner │      │
│  Incidents  │  ├────────┼─────────────┼──────┼────────┼───────┤      │
│  Problems   │  │ CHG-01 │DB Migration│ MED  │PENDING │DBA    │      │
│  Changes ●  │  │ CHG-02 │API Deploy  │ LOW  │APPROVED│DevOps │      │
│  Inventory  │  └─────────────────────────────────────────────────────┘   │
│  Access     │  Stats: [Active: 4] [Pending: 2] [Approved: 3]              │
│  Compliance  │                                                           │
│  Users       │  DRAWER Status Actions:                                    │
│  Roles       │  [Approve] [Reject] [Implement] [Rollback]                 │
│  Settings    │                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `changes:read` |
| Refresh Button | Button | `changes:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `changes:approve` |
| Changes Table | Table | `changes:read` |
| Open Button | Button | `changes:read` |
| Approve Button | Button | `changes:approve` |
| Reject Button | Button | `changes:approve` |
| Implement Button | Button | `changes:approve` |
| Rollback Button | Button | `changes:approve` |

---

## MODULE 6: INVENTORY

**Route:** `/inventory`  
**File:** `ModulePage.tsx` with `moduleKey="inventory"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Inventory                                      [Ref][CSV][+] │
│             │  ─────────────────────────────────────────────────────────── │
│  Dashboard  │  ┌─────────────────────────────────────────────────────┐   │
│  Service    │  │ Asset │ Type   │ Make  │ Status    │ Assigned │     │
│  Incidents  │  ├────────┼────────┼───────┼───────────┼──────────┤     │
│  Problems   │  │AST-001 │Laptop  │ Dell  │ AVAILABLE │ Jane D   │     │
│  Changes    │  │AST-002 │Monitor │ LG    │ ASSIGNED  │ John S   │     │
│  Inventory● │  │AST-003 │Laptop  │ HP    │ IN_REPAIR │ -        │     │
│  Access     │  └─────────────────────────────────────────────────────┘   │
│  Compliance  │  Stats: [Active: 8] [Available: 12] [Assigned: 24]        │
│  Users       │                                                           │
│  Roles       │  DRAWER Status Actions:                                    │
│  Settings    │  [Assign] [Return] [Dispose]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `inventory:read` |
| Refresh Button | Button | `inventory:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `inventory:write` |
| Inventory Table | Table | `inventory:read` |
| Open Button | Button | `inventory:read` |
| Assign Button | Button | `inventory:write` |
| Return Button | Button | `inventory:write` |
| Dispose Button | Button | `inventory:write` |

---

## MODULE 7: ACCESS MANAGEMENT

**Route:** `/access-management`  
**File:** `ModulePage.tsx` with `moduleKey="access-management"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Access Management                            [Ref][CSV][+]   │
│             │  ─────────────────────────────────────────────────────────── │
│  Dashboard  │  ┌─────────────────────────────────────────────────────┐   │
│  Service    │  │ Request│ Requester│ Type    │ System│ Status │    │
│  Incidents  │  ├────────┼──────────┼──────────┼───────┼────────┤    │
│  Problems   │  │ ACC-01 │ John S   │ Database │ SAP   │REQUESTD│    │
│  Changes    │  │ ACC-02 │ Jane D   │ VPN      │ Cisco │APPROVED│    │
│  Inventory  │  │ ACC-03 │ Bob W    │ Admin    │ AWS   │REQUESTD│    │
│  Access ●   │  └─────────────────────────────────────────────────────┘   │
│  Compliance  │  Stats: [Pending: 5] [Approved: 12] [Total: 45]           │
│  Users       │                                                           │
│  Roles       │  DRAWER Status Actions:                                    │
│  Settings    │  [Approve] [Reject] [Revoke]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `access:read` |
| Refresh Button | Button | `access:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `access:approve` |
| Access Table | Table | `access:read` |
| Open Button | Button | `access:read` |
| Approve Button | Button | `access:approve` |
| Reject Button | Button | `access:approve` |
| Revoke Button | Button | `access:approve` |

---

## MODULE 8: COMPLIANCE

**Route:** `/compliance`  
**File:** `ModulePage.tsx` with `moduleKey="compliance"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Compliance                                      [Ref][CSV][+]│
│             │  ─────────────────────────────────────────────────────────── │
│  Dashboard  │  ┌─────────────────────────────────────────────────────┐   │
│  Service    │  │ Control│ Title             │ Area  │ Status │     │
│  Incidents  │  ├────────┼───────────────────┼───────┼────────┤     │
│  Problems   │  │CMP-1001│Quarterly Access   │Access │PENDING │     │
│  Changes    │  │CMP-1002│Password Policy   │Auth   │COMPLIAN│     │
│  Inventory  │  │CMP-1003│Data Backup       │IT Ops │OVERDUE │     │
│  Access     │  └─────────────────────────────────────────────────────┘   │
│  Compliance●│  Stats: [Pending: 3] [Compliant: 12] [Overdue: 2]         │
│  Users       │                                                           │
│  Roles       │  DRAWER Status Actions:                                   │
│  Settings    │  [Mark Audited] [Grant Exception]                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `compliance:read` |
| Refresh Button | Button | `compliance:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `compliance:write` |
| Compliance Table | Table | `compliance:read` |
| Open Button | Button | `compliance:read` |
| Mark Audited Button | Button | `compliance:write` |
| Grant Exception Button | Button | `compliance:write` |

---

## MODULE 9: USERS & TEAMS

**Route:** `/users-teams`  
**File:** `ModulePage.tsx` with `moduleKey="users-teams"`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Users & Teams                                  [Ref][CSV][+] │
│             │  Management                                               │
│  Dashboard  │  ─────────────────────────────────────────────────────────  │
│  Service    │  ┌─────────────────────────────────────────────────────┐   │
│  Incidents  │  │ Email          │ Name    │ Dept   │ Status │       │
│  Problems   │  ├────────────────┼─────────┼────────┼────────┤       │
│  Changes    │  │admin@saven.in │Saven Adm│InfraOps│ ACTIVE │       │
│  Inventory  │  │john@saven.in  │John S   │Support │ACTIVE  │       │
│  Access     │  │jane@saven.in  │Jane D   │QA      │PENDING │       │
│  Compliance  │  └─────────────────────────────────────────────────────┘   │
│  Users ●     │  Stats: [Active: 8] [Pending: 3] [Total: 24]             │
│  Roles       │                                                           │
│  Settings    │  ROW ACTIONS:                                              │
│             │  [Open] [Delete]  ← RED BUTTON                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `users:read` |
| Refresh Button | Button | `users:read` |
| Export CSV Button | Button | **NONE** ⚠️ |
| Create Button | Button | `users:write` |
| Users Table | Table | `users:read` |
| Open Button | Button | `users:read` |
| Delete Button | Button | `users:delete` |

### Delete Confirmation Modal

```
┌──────────────────────────────────────────────┐
│ Delete User                             [X]  │
│ ─────────────────────────────────────────── │
│ ┌────────────────────────────────────────┐  │
│ │ ⚠ Warning: This action cannot be undone│  │
│ │ You are about to delete: John Smith     │  │
│ │ The user will be permanently deleted.   │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ Type DELETE to confirm:                     │
│ [DELETE________________________________]     │
│                                             │
│              [Cancel]  [Delete User]        │
│                           (disabled)        │
└──────────────────────────────────────────────┘
```

---

## MODULE 10: ROLES & PERMISSIONS

**Route:** `/roles-permissions`  
**File:** `RolesPermissionsPage.tsx`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Roles & Permissions                            [Ref][Create]│
│             │  Administration                                           │
│  Dashboard  │  ─────────────────────────────────────────────────────────  │
│  Service    │  ┌─────────────────────────────────────────────────────┐   │
│  Incidents  │  │ Role Name      │ Description    │ Perms │ Actions │  │
│  Problems   │  ├────────────────┼─────────────────┼───────┼─────────┤  │
│  Changes    │  │ Super Admin    │ Full access     │  18   │[Edit]  │  │
│  Inventory  │  │ Admin          │ Full access     │  18   │[Edit]  │  │
│  Access     │  │ Employee       │ Standard access │  18   │[Edit]  │  │
│  Compliance  │  │ Support Agent  │ Support role    │  12   │[Edit]  │  │
│  Users ●     │  └─────────────────────────────────────────────────────┘   │
│  Roles       │                                                           │
│  Settings    │                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `users:read` |
| Refresh Button | Button | `users:read` |
| Create Role Button | Button | `users:write` |
| Roles Table | Table | `users:read` |
| Edit Button | Button | `users:write` |
| Delete Button | Button | `users:write` |
| Module Checkboxes | Checkbox | `users:read` |
| Permission Checkboxes | Checkbox | `users:read` |
| Save Changes Button | Button | `users:write` |

### Create Role Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create Role                                                          [X]   │
│ ──────────────────────────────────────────────────────────────────────────  │
│ Role Name *                                   Description                  │
│ [Employee___________________________]         [Standard user access______]  │
│                                                                             │
│ Module Permissions                                                          │
│ ──────────────────────────────────────────────────────────────────────────  │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────────┐ │
│ │☑ Dashboard     │ │☑ Service Req  │ │☑ Incidents     │ │☑ Problems     │ │
│ │  dashboard:read │ │  sr:read      │ │  inc:read      │ │  prb:read     │ │
│ └────────────────┘ │  sr:write      │ │  inc:write      │ └───────────────┘ │
│                    │  sr:assign    │ └────────────────┘                   │
│ ┌────────────────┐ └────────────────┘ ┌────────────────┐ ┌───────────────┐ │
│ │☑ Changes       │ │☑ Inventory      │ │☑ Access Mgmt   │ │☑ Compliance   │ │
│ │  chg:read      │ │  inv:read      │ │  acc:read      │ │  cmp:read     │ │
│ │  chg:approve   │ │  inv:write     │ │  acc:approve   │ │  cmp:write    │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └───────────────┘ │
│                                                                             │
│              [Cancel]                          [Create Role]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MODULE 11: SETTINGS

**Route:** `/settings`  
**File:** `SettingsPage.tsx`

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Settings                                              [Ref]   │
│             │  Configuration                                                 │
│  Dashboard  │  ─────────────────────────────────────────────────────────── │
│  Service    │  ┌─────────────────────────────────────────────────────┐   │
│  Incidents  │  │┌─────────────────┬─────────────────────────────────┐│   │
│  Problems   │  ││ AI              │                                 ││   │
│  Changes    │  ││ AI_PROVIDER     │ [mock___________________]       ││   │
│  Inventory  │  ││ OPENAI_MODEL    │ [gpt-4.1-mini___________]       ││   │
│  Access     │  │└─────────────────┴─────────────────────────────────┘│   │
│  Compliance  │  ┌─────────────────────────────────────────────────────┐   │
│  Users       │  │┌─────────────────┬─────────────────────────────────┐│   │
│  Roles       │  ││ AUTH            │                                 ││   │
│  Settings ●  │  ││ CUSTOM_LOGIN_EN │ [true___________________]       ││   │
│             │  ││ MSFT_LOGIN_EN   │ [false__________________]       ││   │
│             │  │└─────────────────┴─────────────────────────────────┘│   │
│             │  ┌─────────────────────────────────────────────────────┐   │
│             │  │┌─────────────────┬─────────────────────────────────┐│   │
│             │  ││ NOTIFICATION    │                                 ││   │
│             │  ││ EMAIL_ENABLED   │ [false__________________]       ││   │
│             │  ││ TEAMS_ENABLED   │ [false__________________]       ││   │
│             │  │└─────────────────┴─────────────────────────────────┘│   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Page Header | Header | `settings:read` |
| Settings Grid | Grid | `settings:read` |
| Setting Inputs | Input (readonly) | `settings:read` |

### ISSUE: No edit functionality despite `settings:write` backend (GAP-35, GAP-36)

---

## MODULE 12: AI COMMAND BAR

**Component:** `CommandBar.tsx`  
**Location:** Global header (AppShell)

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            ┌─────────────────────────────────────────────────────────────┐ │
│            │ Ask anything, for example "How many service requests..."   │ │
│            └─────────────────────────────────────────────────────────────┘ │
│            [Run]                                                           │
│            Response appears here after submission...                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components
| Component | Type | Permission |
|-----------|------|------------|
| Command Input | Input | `ai:ask` |
| Run Button | Button | `ai:ask` |
| Status Display | Span | `ai:ask` |

### ISSUE: No permission guard in component (GAP-37) - always visible

---

## NAVIGATION: SIDEBAR

**File:** `Sidebar.tsx`

### Layout

```
┌────────────────┐
│ S InfaOps     │
│   AI Command   │
├────────────────┤
│ ⌂ Dashboard    │
│ SR Service Req │
│ IN Incidents   │
│ PR Problems    │
│ CH Changes     │
│ AS Inventory   │
│ AC Access Mgmt │
│ CO Compliance  │
│ PE Projects    │
│ VL Vendors     │
│ RA Reports     │
│ KB Knowledge   │
│ UT Users ●    │
│ RP Roles       │
│ ⚙ Settings     │
└────────────────┘
```

### Permission Mapping

| Menu Item | Path | Permission Required |
|-----------|------|---------------------|
| Dashboard | `/` | `dashboard:read` |
| Service Requests | `/service-requests` | `tickets:read` |
| Incidents | `/incidents` | `incidents:read` |
| Problems | `/problems` | `incidents:read` |
| Changes | `/changes` | `changes:read` |
| Inventory | `/inventory` | `inventory:read` |
| Access Management | `/access-management` | `access:read` |
| Compliance | `/compliance` | `compliance:read` |
| Projects & Environments | `/projects-environments` | `settings:read` |
| Vendors & Licenses | `/vendors-licenses` | `settings:read` |
| Reports & Analytics | `/reports-analytics` | `dashboard:read` |
| Knowledge Base | `/knowledge-base` | `dashboard:read` |
| Users & Teams | `/users-teams` | `users:read` |
| Roles & Permissions | `/roles-permissions` | `users:read` |
| Settings | `/settings` | `settings:read` |

---

## PERMISSION MATRIX SUMMARY

```
Permission          │ Dashboard │ Service │ Incidents │ Problems │ Changes
────────────────────┼───────────┼─────────┼───────────┼──────────┼────────
dashboard:read      │     ✓     │         │           │          │
tickets:read        │           │    ✓    │           │          │
tickets:write       │           │    ✓    │           │          │
tickets:assign      │           │    ✓    │           │          │
incidents:read      │           │         │     ✓     │    ✓     │
incidents:write     │           │         │     ✓     │    ✓     │
changes:read        │           │         │           │          │    ✓
changes:approve     │           │         │           │          │    ✓
inventory:read      │           │         │           │          │
inventory:write     │           │         │           │          │
access:read         │           │         │           │          │
access:approve      │           │         │           │          │
compliance:read    │           │         │           │          │
compliance:write    │           │         │           │          │
settings:read       │           │         │           │          │
settings:write      │           │         │           │          │
users:read          │           │         │           │          │
users:write         │           │         │           │          │
users:delete        │           │         │           │          │
ai:ask              │           │         │           │          │

Permission          │ Inventory │ Access  │ Compliance │ Users   │ Roles
────────────────────┼───────────┼─────────┼────────────┼─────────┼──────
dashboard:read      │           │         │            │         │
tickets:read        │           │         │            │         │
tickets:write       │           │         │            │         │
tickets:assign      │           │         │            │         │
incidents:read      │           │         │            │         │
incidents:write     │           │         │            │         │
changes:read        │           │         │            │         │
changes:approve     │           │         │            │         │
inventory:read      │     ✓     │         │            │         │
inventory:write     │     ✓     │         │            │         │
access:read         │           │    ✓    │            │         │
access:approve      │           │    ✓    │            │         │
compliance:read    │           │         │     ✓      │         │
compliance:write    │           │         │     ✓      │         │
settings:read       │           │         │            │         │
settings:write      │           │         │            │         │
users:read          │           │         │            │    ✓    │   ✓
users:write         │           │         │            │    ✓    │   ✓
users:delete        │           │         │            │    ✓    │
ai:ask              │           │         │            │         │
```

---

**Document Version:** 1.0  
**Generated:** 2026-06-20  
**Status:** Complete
