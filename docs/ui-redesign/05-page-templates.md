# Enterprise UI/UX Design Blueprint
## PHASE U0: Page Templates Specification

**Document Version:** 1.0  
**Date:** 2026-07-22  
**Status:** DEFINITION ONLY - NOT IMPLEMENTED

---

## 1. Overview

This document defines standardized page templates for the Saven InfraOps Enterprise application. Each template provides consistent structure, layout, and component arrangement.

**Important:** This document is for specification only. Implementation should follow the migration plan in `08-migration-plan.md`.

---

## 2. Template Directory

| Template | Use Case | Pages |
|----------|----------|-------|
| Dashboard | Overview and widgets | `/dashboard` |
| List Page | Data listing with filters | Service Requests, Incidents, etc. |
| Detail Page | Single record view | Ticket detail, Asset detail |
| Settings Page | User preferences | `/settings` |
| Form Page | Multi-step data entry | Create/Edit pages |
| Report Page | Data reports | `/reports` |
| Knowledge Page | Articles and categories | Knowledge Base |
| Compliance Page | Framework management | Compliance |

---

## 3. Dashboard Template

### Purpose
Provides overview of key metrics, quick actions, and activity feeds.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: Dashboard                                                 │
│ Subtitle: Welcome back, {user.name}                            │
│ Actions: [Refresh] [AI Assistant]                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [SummaryCards]                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Total    │ │ Open     │ │ Critical │ │ Resolved │              │
│ │ 1,234    │ │ 89       │ │ 12       │ │ 892      │              │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐ ┌───────────────────────────────┐
│ [QuickActions]                │ │ [AlertsWidget]               │
│ ┌─────┐ ┌─────┐ ┌─────┐     │ │ ⚠️ 3 critical incidents        │
│ │New  │ │View │ │Export│     │ │ ⚠️ 5 items low stock          │
│ │SR   │ │My   │ │Report│     │ │ 🔔 8 pending approvals        │
│ └─────┘ └─────┘ └─────┘     │ │                               │
└───────────────────────────────┘ └───────────────────────────────┘

┌───────────────────────────────┐ ┌───────────────────────────────┐
│ [MyWorkWidget]                │ │ [RecentActivity]              │
│ Your assigned items           │ │ Latest actions                 │
│ ┌─────────────────────────────┐ │ │ • John updated SR-001         │
│ │ SR-001 Network issue   🔴  │ │ • Sarah created new ticket     │
│ │ SR-002 Software request 🟡 │ │ • System auto-assigned SR-045  │
│ └─────────────────────────────┘ │                               │
└───────────────────────────────┘ └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [ModuleOverview]                                                │
│ Service  │ Incidents │ Inventory │ Knowledge │ Compliance        │
│ Requests │           │           │           │                   │
│ 342      │ 89        │ 1.2K     │ 156       │ 45                │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- SummaryCards (4-column)
- QuickActions
- AlertsWidget
- MyWorkWidget
- RecentActivity
- ModuleOverview

### Spacing
- Page padding: 24px (desktop), 16px (mobile)
- Section gap: 24px
- Card internal padding: 20px
- Widget gap: 16px

---

## 4. List Page Template

### Purpose
Displays paginated data with search, filters, and bulk actions.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: {Module Name}                                            │
│ Subtitle: {Count} items                                        │
│ Actions: [+ Create] [Export]                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Toolbar]                                                        │
│ ┌───────────────────────┐ [Status ▼] [Priority ▼] [Clear]       │
│ │ 🔍 Search...          │                                       │
│ └───────────────────────┘                                       │
├─────────────────────────────────────────────────────────────────┤
│ (When items selected)                                            │
│ ✓ {count} selected    [Assign] [Update Status] [Delete]        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [SummaryStats] (optional)                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Total    │ │ Open     │ │ Pending  │ │ Resolved │              │
│ │ 234      │ │ 89       │ │ 42       │ │ 103      │              │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [DataTable]                                                      │
│ ┌────┬─────────────┬──────────┬─────────┬────────┬─────────┐    │
│ │ ☑  │ Title       │ Status  │ Priority│ Assign │ Age     │    │
│ ├────┼─────────────┼──────────┼─────────┼────────┼─────────┤    │
│ │ ☑  │ SR-001      │ ● New   │ 🔴 High │ John   │ 2d      │    │
│ │    │ SR-002      │ ● Open  │ 🟡 Med  │ Sarah  │ 1d      │    │
│ └────┴─────────────┴──────────┴─────────┴────────┴─────────┘    │
│                                                                  │
│ Showing 1-10 of 234        [<] [1] [2] [3]... [>]               │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- Toolbar (search + filters)
- BulkActionBar (conditional)
- SummaryStats (optional)
- DataTable
- Pagination

### Variants

#### Variant A: With Summary Stats
Use when key metrics should be visible above the table.

#### Variant B: Without Summary Stats
Use for simpler list pages or when filters provide sufficient context.

#### Variant C: Card View
Use for mobile or when visual representation is more important than data density.

### Responsive Behavior

| Breakpoint | Table | Filters | Actions |
|------------|-------|---------|---------|
| Desktop | Full table | Inline | In toolbar |
| Tablet | Horizontal scroll | Collapsible | Sticky |
| Mobile | Card view | Modal | Bottom bar |

### Spacing
- Page padding: 24px
- Toolbar gap: 16px
- Table row height: 48px
- Pagination height: 56px

---

## 5. Detail Page Template

### Purpose
Displays complete information about a single record.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Breadcrumbs: Home / {Module} / {Record ID}                      │
│ Title: {Record Title}                                            │
│ Actions: [Edit] [Delete] [More ▼]                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Tabs]                                                           │
│ [Details] [Attachments] [History] [Comments]                     │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐ ┌───────────────────────┐
│ [MainContent]                        │ │ [Sidebar]            │
│                                       │ │                       │
│ ┌───────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ Description                        │ │ │ Status             │ │
│ │ Lorem ipsum dolor sit amet...      │ │ │ ● Open            │ │
│ └───────────────────────────────────┘ │ └───────────────────┘ │
│                                       │ │                       │
│ ┌───────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ Request Details                    │ │ │ Priority          │ │
│ │ Category: Network                  │ │ │ 🔴 High           │ │
│ │ Subcategory: Connectivity          │ │ └───────────────────┘ │
│ │ Project: Alpha                     │ │                       │
│ └───────────────────────────────────┘ │ ┌───────────────────┐ │
│                                       │ │ Assignee          │ │
│ ┌───────────────────────────────────┐ │ │ 👤 John Doe       │ │
│ │ Custom Fields                      │ │ └───────────────────┘ │
│ │ ...                                │ │                       │
│ └───────────────────────────────────┘ │ ┌───────────────────┐ │
│                                       │ │ Dates             │ │
│                                       │ │ Created: Jan 15   │ │
│                                       │ │ Updated: Jan 16    │ │
│                                       │ └───────────────────┘ │
│                                       │                       │
│                                       │ ┌───────────────────┐ │
│                                       │ │ Tags              │ │
│                                       │ │ [Network] [Bug]   │ │
│                                       │ └───────────────────┘ │
└───────────────────────────────────────┘ └───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [FooterActions]                                                  │
│ [Cancel/Back]                    [Secondary Action] [Primary]  │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader (with back button)
- Tabs
- TwoColumnLayout
- DetailCard
- SidebarCard
- StatusBadge
- PriorityBadge
- FooterActions

### Variants

#### Variant A: Simple Detail
For records with minimal information.
```
Header → Content (full width)
```

#### Variant B: Standard Detail
Most common layout.
```
Header → Tabs → Content (2/3) + Sidebar (1/3)
```

#### Variant C: Complex Detail
With timeline, comments, and activity.
```
Header → Tabs → Content + Sidebar → Activity Feed
```

### Responsive Behavior

| Breakpoint | Layout | Sidebar |
|------------|--------|---------|
| Desktop | Two columns | Fixed right |
| Tablet | Two columns | Below content |
| Mobile | Single column | Below content |

### Spacing
- Page padding: 24px
- Section gap: 24px
- Card padding: 20px
- Sidebar card gap: 16px

---

## 6. Settings Page Template

### Purpose
Organizes user preferences and account settings.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [SettingsLayout]                                                │
│                                                                  │
│ ┌───────────────┐ ┌─────────────────────────────────────────┐ │
│ │ [SettingsNav] │ │ [SettingsContent]                         │ │
│ │               │ │                                           │ │
│ │ 👤 My Profile │ │ Profile Settings                          │ │
│ │ ⚙️ Preferences│ │ ─────────────────────────────────────     │ │
│ │ 🔔 Notifications│                                           │ │
│ │ 🔒 Security   │ │ ┌─────────────────────────────────────┐   │ │
│ │               │ │ │ [ProfileForm]                       │   │ │
│ │               │ │ │                                     │   │ │
│ │               │ │ │ Name: [John Doe              ]      │   │ │
│ │               │ │ │ Email: [john@example.com     ]      │   │ │
│ │               │ │ │ Phone: [+1 555-0123        ]      │   │ │
│ │               │ │ │                                     │   │ │
│ │               │ │ └─────────────────────────────────────┘   │ │
│ │               │ │                                           │ │
│ │               │ │ [Save Changes]                            │ │
│ │               │ │                                           │ │
│ └───────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- SettingsLayout
- SettingsNav
- SettingsSection
- SettingsForm
- FormInput
- FormSelect
- Toggle

### Navigation Items
1. My Profile
2. Preferences
3. Notifications
4. Security
5. API Keys (if applicable)
6. Team (for admins)

### Spacing
- Sidebar width: 240px
- Content padding: 32px
- Section gap: 32px
- Form field gap: 20px

---

## 7. Form Page Template

### Purpose
Captures user input for creating or editing records.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: {Create|Edit} {Entity}                                    │
│ Breadcrumbs: Home / {Module} / {Create|Edit}                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [FormContainer]                                                  │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Section: General Information                                │ │
│ │ ───────────────────────────────────────────────────────     │ │
│ │                                                             │ │
│ │ Title *        [________________________]                    │ │
│ │                                                             │ │
│ │ Description   [________________________]                     │ │
│ │               [________________________]                    │ │
│ │               [________________________]                    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Section: Details                                            │ │
│ │ ───────────────────────────────────────────────────────     │ │
│ │                                                             │ │
│ │ Category *   [Network        ▼]    Priority * [High ▼]     │ │
│ │                                                             │ │
│ │ Assignee     [John Doe       ▼]    Due Date   [📅 Select]  │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Section: Attachments                                         │ │
│ │ ───────────────────────────────────────────────────────     │ │
│ │                                                             │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ 📁 Drop files here or click to browse                   │ │ │
│ │ │ PNG, JPG, PDF up to 25MB                                 │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Cancel]                                        [Save Draft] │ │
│ │                                                     [Submit] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- FormContainer
- FormSection
- FormRow
- FormInput
- FormSelect
- FormTextarea
- FileUpload
- FormActions

### Validation Display
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Please correct the following errors:                     │
│                                                             │
│ • Title is required                                         │
│ • Email format is invalid                                  │
│ • Password must be at least 8 characters                   │
└─────────────────────────────────────────────────────────────┘
```

### Spacing
- Form padding: 24px
- Section gap: 32px
- Field gap: 20px
- Label-to-input gap: 8px

---

## 8. Report Page Template

### Purpose
Displays available reports with generation and export options.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: Reports & Analytics                                       │
│ Subtitle: Generate downloadable reports from InfraOps data       │
│ Actions: [Refresh]                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [SummaryCards]                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Available│ │ Generated│ │ Exported │ │ Scheduled│              │
│ │ 24       │ │ 156      │ │ 89       │ │ 5        │              │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Search & Filter]                                                │
│ 🔍 Search reports...                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [ReportCategories]                                               │
│                                                                  │
│ Service Requests                                                 │
│ ┌──────────────────────┐ ┌──────────────────────┐               │
│ │ 📊 Request Summary   │ │ 📋 Request Details  │               │
│ │ Overview of all SRs   │ │ Full SR listing      │               │
│ │ [Generate]           │ │ [Generate]            │               │
│ └──────────────────────┘ └──────────────────────┘               │
│                                                                  │
│ Incidents                                                        │
│ ┌──────────────────────┐ ┌──────────────────────┐               │
│ │ 📊 Incident Summary  │ │ ⚠️ Critical Report  │               │
│ │ Overview of incidents│ │ Critical incidents    │               │
│ │ [Generate]           │ │ [Generate]            │               │
│ └──────────────────────┘ └──────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- SummaryCards
- SearchInput
- ReportCategory
- ReportCard

### Report Card Structure
```
┌─────────────────────────────────────┐
│ 📊                                  │
│                                     │
│ Request Summary                     │
│ Overview of all service requests    │
│                                     │
│ Columns: 8  │  Last: 2 days ago    │
│                                     │
│ [Generate ▼] [Preview]              │
└─────────────────────────────────────┘
```

### Spacing
- Card gap: 20px
- Card padding: 20px
- Category gap: 32px

---

## 9. Knowledge Base Page Template

### Purpose
Organizes articles and categories for self-service support.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: Knowledge Base                                            │
│ Actions: [Search...] [New Article]                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [SearchFullWidth]                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search articles...                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [CategoryGrid]                                                   │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│ │ 📚 Getting       │ │ 🔧 Troubleshooting│ │ 📋 How-To       │  │
│ │ Started (12)     │ │ (8)              │ │ Guides (15)     │  │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│ ┌──────────────────┐ ┌──────────────────┐                       │
│ │ 🔒 Security (6) │ │ 💡 Best         │                       │
│ │                  │ │ Practices (10)   │                       │
│ └──────────────────┘ └──────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [RecentArticles]                                                  │
│ Recent Updates                                                   │
│ • How to reset your password (Updated 2 days ago)                │
│ • Getting started with the API (Updated 5 days ago)             │
│ • Understanding ticket priorities (Updated 1 week ago)           │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- SearchFullWidth
- CategoryGrid
- CategoryCard
- ArticleList
- RecentArticles

### Spacing
- Category grid gap: 20px
- Article list gap: 12px
- Section gap: 32px

---

## 10. Compliance Page Template

### Purpose
Manages compliance frameworks, controls, and evidence.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: Compliance Management                                      │
│ Actions: [Add Framework] [Export]                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [SummaryCards]                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Frameworks│ │ Controls │ │ Evidence │ │ Missing  │              │
│ │ 5        │ │ 124      │ │ 312      │ │ 28       │              │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [FrameworkSelector]                                             │
│ [Framework A ▼]  [Framework B ▼]  [+ Add Framework]             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Toolbar]                                                        │
│ [🔍 Search controls...]     [Status ▼] [Compliance ▼] [Clear]   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [ControlsTable]                                                   │
│ ┌────┬──────────────────┬─────────────┬──────────┬────────────┐  │
│ │ ☑  │ Control Name    │ Description │ Evidence │ Actions   │  │
│ ├────┼──────────────────┼─────────────┼──────────┼────────────┤  │
│ │ ☑  │ AC-1           │ Access con...│ 📎 3     │ [View]     │  │
│ │    │ AC-2           │ Audit log...│ 📎 1     │ [View]     │  │
│ └────┴──────────────────┴─────────────┴──────────┴────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- SummaryCards
- FrameworkSelector
- Toolbar
- ControlsTable
- EvidenceModal

---

## 11. Asset Detail Template

### Purpose
Displays complete information about inventory assets.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Back: Back to Assets                                             │
│ Title: Laptop - Dell XPS 15                                      │
│ Subtitle: AST-2024-00156                                        │
│ Actions: [Edit] [Assign] [Return] [More ▼]                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [StatusBanner]                                                  │
│ ● In Stock - Adequate quantity available                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐ ┌───────────────────────┐
│ [MainContent]                        │ │ [Sidebar]            │
│                                       │ │                       │
│ ┌───────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ Details                            │ │ │ Quick Info         │ │
│ │ ─────────────────────────────────  │ │ │ ─────────────────│ │
│ │ Category: Hardware > Laptops       │ │ │ Status: In Stock  │ │
│ │ Brand: Dell                        │ │ │ Qty: 15           │ │
│ │ Model: XPS 15                      │ │ │ Min Stock: 5      │ │
│ │ Serial: SN123456789                │ │ └───────────────────┘ │
│ │ Location: Building A, Floor 2        │ │                       │
│ └───────────────────────────────────┘ │ ┌───────────────────┐ │
│                                       │ │ Assignment        │ │
│ ┌───────────────────────────────────┐ │ │ ─────────────────│ │
│ │ Assignment History                │ │ │ Not assigned      │ │
│ │ ─────────────────────────────────  │ │ [Assign to User]  │ │
│ │ Jan 15 - Assigned to John Doe     │ │ └───────────────────┘ │
│ │ Jan 10 - Returned by Jane Smith   │ │                       │
│ │ Jan 05 - Assigned to Jane Smith   │ │ ┌───────────────────┐ │
│ └───────────────────────────────────┘ │ │ │ Purchase Info    │ │
│                                       │ │ │ ─────────────────│ │
│ ┌───────────────────────────────────┐ │ │ Cost: $1,299.00  │ │
│ │ Warranty & Maintenance            │ │ │ Date: Jan 1, 2023 │ │
│ │ ─────────────────────────────────  │ │ Warranty: 24 mo   │ │
│ │ Warranty: Active (expires Mar 2025)│ │ └───────────────────┘ │
│ │ Maintenance: Up to date            │ │                       │
│ └───────────────────────────────────┘ │                       │
└───────────────────────────────────────┘ └───────────────────────┘
```

### Components Used
- PageHeader (with back)
- StatusBanner
- DetailCard
- SidebarCard
- Timeline
- AssignmentForm

---

## 12. Wizard Template

### Purpose
Multi-step forms for complex data entry.

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                     │
│ Title: Create New Project                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [StepIndicator]                                                  │
│                                                                  │
│    ①───────②───────③───────④                                     │
│    Info   Team   Budget  Review                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [StepContent]                                                    │
│                                                                  │
│ Step 2: Team Setup                                               │
│ ─────────────────────────────────────                           │
│                                                                  │
│ Project Manager *                                                │
│ [John Doe ▼]                                                     │
│                                                                  │
│ Team Members                                                     │
│ ┌─────────────────────────────────────────────┐               │
│ │ 👤 Sarah Johnson                               │ [Remove]      │
│ │ 👤 Mike Chen                                  │ [Remove]      │
│ │ [+ Add Member]                                │               │
│ └─────────────────────────────────────────────┘               │
│                                                                  │
│ Approvals                                                        │
│ [ ] Require budget approval                                      │
│ [ ] Require manager approval                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [WizardActions]                                                  │
│ [← Back]                                    [Save Draft] [Next →]│
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- PageHeader
- StepIndicator
- StepContent
- WizardActions
- FormFields (varies by step)

### Spacing
- Step indicator gap: 0 (continuous line)
- Step content padding: 32px
- Action bar padding: 24px

---

## 13. Template Specifications Reference

### Common Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps |
| sm | 8px | Tight gaps |
| md | 16px | Standard padding |
| lg | 24px | Section padding |
| xl | 32px | Page padding |
| 2xl | 48px | Major sections |

### Container Widths

| Context | Width |
|---------|-------|
| Content max | 1280px |
| Form max | 720px |
| Sidebar | 320px |
| Card min | 280px |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column |
| Tablet | 640-1024px | Condensed |
| Desktop | > 1024px | Full |
| Wide | > 1440px | Expanded |

---

**End of Page Templates Document**
