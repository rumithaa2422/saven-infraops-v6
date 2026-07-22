# Enterprise UI/UX Design Blueprint
## PHASE U0: Navigation Standards

**Document Version:** 1.0  
**Date:** 2026-07-22  
**Status:** DEFINITION ONLY - NOT IMPLEMENTED

---

## 1. Overview

This document defines standardized navigation patterns for the Saven InfraOps Enterprise application. Consistent navigation reduces cognitive load and helps users efficiently move through the application.

**Important:** This document is for specification only. Implementation should follow the migration plan in `08-migration-plan.md`.

---

## 2. Global Navigation

### 2.1 Sidebar Navigation

#### Standard Sidebar

```
┌──────────────────────────────┐
│ [Logo] Saven InfraOps        │
├──────────────────────────────┤
│ 🏠 Dashboard                 │ ← Active
│ 🎫 Service Requests          │
│ ⚠️ Incidents                │
│ 📦 Inventory                │
│ 💻 Assets                  │
│ 📚 Knowledge Base          │
│ 📋 Compliance              │
│ 📊 Reports                 │
│ ────────────────────────── │
│ 🏢 Vendors                  │
│ 👥 Users                   │
│ ⚙️ Settings                │
│ ────────────────────────── │
│ [?] Help                   │
│ [AI 🤖]                    │
└──────────────────────────────┘
```

#### Specifications

| Property | Value |
|----------|-------|
| Width | 256px (expanded), 64px (collapsed) |
| Background | slate-900 (#0f172a) |
| Text color | slate-300 (default), white (hover/active) |
| Item height | 44px |
| Item padding | 12px horizontal |
| Icon size | 20px |
| Gap between icon and text | 12px |
| Active indicator | Left border 3px brand-500 |
| Section divider | 1px slate-700, margin 8px |

#### Navigation Item States

| State | Background | Text | Icon |
|-------|------------|------|------|
| Default | transparent | slate-300 | slate-400 |
| Hover | white/10 | white | white |
| Active | white/10 | white | white |
| Disabled | transparent | slate-600 | slate-600 |

### 2.2 Top Bar

```
┌─────────────────────────────────────────────────────────────────┐
│ Saven InfraOps                           🔔  [Avatar ▼]        │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar                                    Main Content Area     │
│                                            ┌──────────────────┐ │
│                                            │ Top Bar Content   │ │
│                                            └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Top Bar Components

| Component | Position | Width |
|-----------|----------|-------|
| Breadcrumb | Left | Auto |
| Search | Center (optional) | 400px max |
| Notifications | Right | Auto |
| User Menu | Right | Auto |

---

## 3. Page-Level Navigation

### 3.1 Breadcrumb

#### Specification

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: '/' | '>' | '→';
  maxItems?: number;  // Default: 4
}
```

#### Visual Design

```
Home / Service Requests / SR-2024-00156
────   ────────────────   ──────────────
 ↑          ↑                  ↑
home     clickable         current
link      crumb             (not link)
```

#### Responsive Behavior

| Breakpoint | Display |
|------------|---------|
| Desktop | Full breadcrumb |
| Tablet | Truncated (first + last) |
| Mobile | Only current page |

#### Styling

```css
.breadcrumb {
  font-size: 14px;
  color: slate-500;
}

.breadcrumb-item {
  color: slate-500;
}

.breadcrumb-item:hover {
  color: primary-600;
}

.breadcrumb-separator {
  color: slate-400;
  margin: 0 8px;
}

.breadcrumb-current {
  color: slate-900;
  font-weight: 500;
}
```

### 3.2 Back Button

#### When to Use

- Detail pages
- Edit/Create forms
- Modal deep navigation
- Wizard steps

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Service Requests                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Specification

```tsx
interface BackButtonProps {
  label?: string;  // Default: "Back to {parentPage}"
  onClick: () => void;
  position?: 'page-header' | 'content';
}
```

#### Styling

```css
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: slate-600;
  border-radius: 8px;
  transition: all 150ms ease;
}

.back-button:hover {
  background: slate-100;
  color: slate-900;
}

.back-button svg {
  width: 16px;
  height: 16px;
  transition: transform 150ms ease;
}

.back-button:hover svg {
  transform: translateX(-2px);
}
```

---

## 4. Content Navigation

### 4.1 Tabs

#### Page-Level Tabs

Used for major sections of a page.

```
┌─────────────────────────────────────────────────────────────┐
│ [Details] [Attachments] [History] [Comments]                 │
└─────────────────────────────────────────────────────────────┘
```

#### Specification

```tsx
interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}
```

#### Tab Variants

**Default (recommended for most cases):**
```
┌─────────┬────────────┬──────────┬───────────┐
│ Details  │ Attachments │ History  │ Comments   │
│ (3)      │             │          │ (12)       │
└─────────┴────────────┴──────────┴───────────┘
  ↑
  Active (bottom border)
```

**Pills:**
```
┌──────┐ ┌───────┐ ┌────────┐
│ All  │ │ Open  │ │ Closed │
└──────┘ └───────┘ └────────┘
  ↑
  Active (filled)
```

**Underline:**
```
Details ─────────────────────────────
Attachments
History
Comments
```

#### Styling

```css
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid slate-200;
  padding-bottom: 0;
}

.tab-item {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: slate-600;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 150ms ease;
}

.tab-item:hover {
  color: slate-900;
}

.tab-item.active {
  color: primary-600;
  border-bottom-color: primary-600;
}

.tab-count {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  background: slate-100;
  border-radius: 10px;
}

.tab-item.active .tab-count {
  background: primary-100;
  color: primary-700;
}
```

### 4.2 Secondary Navigation

Used for sub-sections within a tab.

```
┌─────────────────────────────────────────────────────────────┐
│ Overview │ Permissions │ Activity │ Settings               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Action Navigation

### 5.1 Action Buttons

#### Header Actions

Positioned in the top-right of page headers.

```
┌─────────────────────────────────────────────────────────────┐
│ Title                                    [+ New] [Export ▼]│
└─────────────────────────────────────────────────────────────┘
```

#### Button Order

1. Primary action (leftmost)
2. Secondary actions
3. More menu (rightmost)

#### Toolbar Actions

Positioned below header or in dedicated toolbar.

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search...]  [Filter ▼]  [Filter ▼]     [⋮ More]        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Context Menus

Triggered by clicking an icon or selecting "More".

```
┌─────────────────────┐
│ ✏️ Edit             │
│ 📋 Duplicate       │
│ 📤 Export          │
│ ─────────────────── │
│ 🗑️ Delete          │
└─────────────────────┘
```

#### Specification

```tsx
interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;  // Red text for destructive
  divider?: boolean;  // Section divider
}

interface ContextMenuProps {
  items: MenuItem[];
  onSelect: (itemId: string) => void;
  position?: { x: number; y: number };
}
```

### 5.3 Quick Actions

Used in cards, list items, and dashboards.

```
┌─────────────────────────────┐
│ SR-001 Network issue    ⋮  │ ← Action menu
│ ● Open  │ 🔴 High │ 2d      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ New │ │View │ │Export│    │ ← Quick action buttons
│ │ SR  │ │ My  │ │Report│    │
│ └─────┘ └─────┘ └─────┘    │
└─────────────────────────────┘
```

---

## 6. Modal & Drawer Navigation

### 6.1 Modal Navigation

#### Standard Modal

```
┌─────────────────────────────────────────────────────────────┐
│                                             [✕]              │
│  Title                                                      │
│  Subtitle                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Content                                                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                      [Cancel]  [Confirm]                     │
└─────────────────────────────────────────────────────────────┘
```

#### Nested Modals

**Do not nest modals.** If a modal requires another modal, consider:
1. Combining into a single modal with sections
2. Using a drawer instead
3. Breaking into a multi-step flow

### 6.2 Drawer Navigation

#### Standard Drawer

```
┌───────────────────────────────────────┐
│ Title                      [✕]        │
├───────────────────────────────────────┤
│                                       │
│  Content                              │
│                                       │
│                                       │
├───────────────────────────────────────┤
│ [Cancel]                  [Confirm]   │
└───────────────────────────────────────┘
```

#### Drawer Positions

| Position | Width | Use Case |
|----------|-------|----------|
| Right | 400px (sm), 560px (md), 720px (lg) | Most drawers |
| Left | Same sizes | Navigation drawers |

#### Focus Management

1. Focus moves to drawer on open
2. Focus trapped within drawer
3. Focus returns to trigger on close

### 6.3 Close Actions

| Element | Keyboard | Mouse |
|---------|----------|-------|
| Modal | `Escape` | Click backdrop, X button |
| Drawer | `Escape` | Click backdrop, X button |
| Dropdown | `Escape`, `Tab` | Click outside |
| Popover | `Escape` | Click outside |

---

## 7. Deep Navigation Patterns

### 7.1 Drill-Down Navigation

For hierarchical data (Category → Subcategory → Item).

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Hardware                                          │
├─────────────────────────────────────────────────────────────┤
│ Showing: Hardware (12 items)                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 Laptops (8)                                          │ │
│ │ 🖥️ Desktops (4)                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

After clicking "Laptops":

┌─────────────────────────────────────────────────────────────┐
│ [← Back] Hardware > Laptops                                │
├─────────────────────────────────────────────────────────────┤
│ Showing: Laptops (8 items)                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Dell XPS 15                                             │ │
│ │ MacBook Pro 14                                          │ │
│ │ HP EliteBook                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Master-Detail Pattern

For related data (Project → Environments → Instances).

```
┌────────────────────┬────────────────────────────────────────┐
│ Master List         │ Detail Panel                           │
│                    │                                        │
│ ┌────────────────┐ │ ┌────────────────────────────────────┐ │
│ │ Project Alpha │ │ │ Environment: Production            │ │
│ ├────────────────┤ │ │ ──────────────────────────────────│ │
│ │ Project Beta  │ │ │                                    │ │
│ │ Project Gamma  │ │ │ Instances: 5                       │ │
│ └────────────────┘ │ │                                    │ │
│                    │ └────────────────────────────────────┘ │
└────────────────────┴────────────────────────────────────────┘
```

### 7.3 URL Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| List | `/service-requests` | Browse all |
| Detail | `/service-requests/:id` | View single |
| Create | `/service-requests/new` | Create form |
| Edit | `/service-requests/:id/edit` | Edit form |
| Nested | `/projects/:id/environments/:envId` | Hierarchical |

---

## 8. Keyboard Navigation

### 8.1 Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | Create new item |
| `Cmd/Ctrl + /` | Show keyboard shortcuts |
| `Cmd/Ctrl + Shift + ?` | Help |
| `Escape` | Close modal/drawer/dropdown |

### 8.2 List Navigation

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Move selection |
| `Enter` | Open selected item |
| `Space` | Toggle selection (if selectable) |
| `Cmd/Ctrl + A` | Select all |

### 8.3 Tab Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next focusable element |
| `Shift + Tab` | Previous focusable element |
| `Arrow Left` / `Arrow Right` | Next/previous tab (within tab list) |

### 8.4 Focus Indicators

All interactive elements must have visible focus states.

```css
/* Focus ring */
:focus-visible {
  outline: 2px solid primary-500;
  outline-offset: 2px;
}

/* Custom focus for specific elements */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
```

---

## 9. Skip Links

Provide quick access to main content for keyboard users.

```html
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  
  <nav>
    <!-- Navigation -->
  </nav>
  
  <main id="main-content">
    <!-- Main content -->
  </main>
</body>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: primary-600;
  color: white;
  z-index: 100;
  transition: top 150ms ease;
}

.skip-link:focus {
  top: 0;
}
```

---

## 10. Mobile Navigation

### 10.1 Bottom Navigation

For primary app sections on mobile.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                      Main Content                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  🏠    🎫    ⚠️    📦    👤                                 │
│ Home   SR    Inc  Inv  More                                 │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Hamburger Menu

Alternative to bottom navigation.

```
┌─────────────────────────────────────────────────────────────┐
│ ☰  Saven InfraOps                              🔔  👤      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ─── Main ───                                               │
│  🏠 Dashboard                                              │
│  🎫 Service Requests                                        │
│  ⚠️ Incidents                                               │
│  📦 Inventory                                               │
│  💻 Assets                                                  │
│  ─── Resources ───                                          │
│  📚 Knowledge Base                                          │
│  📋 Compliance                                              │
│  📊 Reports                                                 │
│  ─── Admin ───                                              │
│  👥 Users                                                   │
│  ⚙️ Settings                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Swipe Navigation

For drill-down and detail pages.

| Swipe | Action |
|-------|--------|
| Swipe right | Go back |
| Swipe left | Quick action (if applicable) |

---

## 11. Loading & Empty States

### 11.1 Loading Navigation

```
┌────────────────────────────┐
│ ●●● Dashboard             │ ← Skeleton title
│                            │
│ ┌────────────────────────┐ │
│ │ ████████ ████ ████████ │ │ ← Skeleton content
│ │ ████████ ████ ████████ │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

### 11.2 Empty Navigation

```
┌────────────────────────────┐
│ Service Requests          │
│ 0 items                   │
├────────────────────────────┤
│                            │
│    📋                     │
│                            │
│   No requests yet         │
│   Create your first one   │
│                            │
│   [+ Create Request]       │
│                            │
└────────────────────────────┘
```

---

## 12. Error States

### 12.1 Navigation Error

```
┌────────────────────────────┐
│ ⚠️ Unable to load          │
├────────────────────────────┤
│                            │
│  Something went wrong      │
│  while loading this page.  │
│                            │
│  [Try Again]               │
│                            │
└────────────────────────────┘
```

### 12.2 404 Navigation

```
┌────────────────────────────┐
│ 🔍 Page not found          │
├────────────────────────────┤
│                            │
│  The page you're looking   │
│  for doesn't exist.        │
│                            │
│  [← Go Home]               │
│                            │
└────────────────────────────┘
```

---

## 13. Implementation Checklist

### Global Navigation
- [ ] Sidebar renders correctly at all breakpoints
- [ ] Active state is clearly visible
- [ ] Collapse/expand works smoothly
- [ ] Icons align properly

### Breadcrumbs
- [ ] All detail pages have breadcrumbs
- [ ] Current page is not clickable
- [ ] Truncation works on mobile

### Back Buttons
- [ ] All detail pages have back buttons
- [ ] Click returns to correct parent
- [ ] Keyboard accessible

### Tabs
- [ ] Active tab is clearly indicated
- [ ] Tab content switches instantly
- [ ] Count badges update appropriately

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] All shortcuts work
- [ ] Skip links present

---

**End of Navigation Standards Document**
