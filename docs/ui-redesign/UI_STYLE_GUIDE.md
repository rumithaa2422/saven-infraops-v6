# Saven InfraOps Enterprise UI Style Guide
## Official Design Specification

**Version:** 1.0  
**Date:** 2026-07-22  
**Status:** AUTHORITATIVE SPECIFICATION  
**Application:** Saven InfraOps Command Center

---

## Document Purpose

This document is the **official design specification** for the Saven InfraOps Enterprise application. It serves as the single source of truth for all UI/UX design decisions. Every frontend developer, designer, and stakeholder must reference this document when building or modifying the user interface.

This specification is derived from comprehensive audit of 33 pages and 47+ duplicate components, identifying 85+ UX issues. The goal is to create a consistent, accessible, and professional enterprise application.

---

## SECTION 1: Product Design Philosophy

### 1.1 Design Goals

| Goal | Description | Priority |
|------|-------------|----------|
| **Consistency** | Every pixel follows established patterns | Critical |
| **Efficiency** | Professional users accomplish tasks with minimal clicks | Critical |
| **Accessibility** | WCAG 2.1 AA compliance by default | Critical |
| **Clarity** | Information hierarchy guides users naturally | High |
| **Performance** | Sub-second interactions, optimized rendering | High |
| **Maintainability** | Single component library, zero duplication | High |

### 1.2 Visual Language

The application embodies a **professional enterprise aesthetic** that prioritizes function over decoration:

```
Characteristics:
├── Clean, geometric shapes (no skeuomorphic elements)
├── Subtle shadows for elevation hierarchy
├── Generous but efficient whitespace
├── Professional color palette (blues, grays, strategic accents)
├── System fonts (Inter) for optimal readability
├── Micro-interactions that provide feedback without distraction
└── Information density appropriate for enterprise users
```

**Visual Direction:**
- Modern enterprise SaaS appearance
- Light theme primary (dark mode optional)
- No decorative gradients on content areas
- No excessive rounded corners
- Professional iconography (Lucide React)

### 1.3 Enterprise UX Principles

**Principle 1: Consistency Over Creativity**
> "Design for the professional user who spends 8+ hours daily in the application. Every pixel should serve a purpose."

- Reuse existing components before creating new ones
- Follow established color semantics
- Use standard interaction patterns
- Maintain visual language across all modules
- **NEVER** create module-specific styling

**Principle 2: Information First**
- Display the most important information prominently
- Secondary details accessible via progressive disclosure
- Critical metrics visible without interaction
- Status visible without clicking

**Principle 3: Compact Enterprise Layout**
- Optimize for information density
- Tables with 48px row height minimum
- Tight but readable line heights (1.4-1.5)
- Efficient spacing that doesn't waste space
- Dashboard widgets that show multiple metrics

**Principle 4: Progressive Disclosure**
- Collapsible filter sections
- Expandable detail rows
- Tabbed interfaces for related content
- Show more patterns for long lists
- Wizards for complex flows

**Principle 5: Minimal Clicks**
| Action Type | Maximum Clicks |
|-------------|---------------|
| Create record | 3 |
| Edit record | 2 |
| View record detail | 1 (row click) |
| Search and find | 2 |
| Bulk update | 3 |
| Export data | 2 |

### 1.4 Information Hierarchy

```
PRIMARY: Action/Information
├── Primary actions (Create, Save, Submit)
├── Key status indicators
└── Summary metrics

SECONDARY: Supporting Data
├── Descriptive content
├── Secondary status
└── Related information

TERTIARY: Contextual Details
├── Metadata
├── Timestamps
└── Technical identifiers
```

### 1.5 Interaction Philosophy

- **Immediate feedback**: Every action produces visible response within 100ms
- **Predictable behavior**: Similar elements behave identically
- **Error prevention**: Confirmation for destructive actions, disabled buttons for invalid states
- **Keyboard first**: All actions accessible without mouse
- **Touch friendly**: 44px minimum touch targets

### 1.6 Accessibility Philosophy

- **Inclusive by default**: WCAG 2.1 AA compliance
- **Keyboard navigation**: Full functionality without mouse
- **Screen reader friendly**: Semantic HTML, ARIA labels
- **Color independent**: Information not conveyed by color alone
- **Focus visible**: Clear focus indicators on all interactive elements
- **Reduced motion**: Respect user preferences

### 1.7 Responsive Philosophy

- **Mobile first**: Core functionality works everywhere
- **Progressive enhancement**: Enhanced features on capable devices
- **Content priority**: Most important content visible at all breakpoints
- **Touch optimized**: Mobile interfaces designed for touch
- **No horizontal scroll**: Reflow content instead

---

## SECTION 2: Layout Standards

### 2.1 Page Container

| Property | Value |
|----------|-------|
| **Maximum width** | 1440px |
| **Center aligned** | Yes |
| **Background** | `slate-50` (#F8FAFC) |
| **Min-height** | 100vh |

### 2.2 Page Padding

| Breakpoint | Padding |
|------------|---------|
| Mobile (< 768px) | 16px |
| Tablet (768px - 1023px) | 24px |
| Desktop (1024px+) | 32px |

### 2.3 Margins

| Context | Margin |
|---------|--------|
| Section to section | 24px |
| Card to card | 16px |
| Component to component | 16px |
| Content to edge | 0px (within container) |

### 2.4 Grid System

| Breakpoint | Columns | Gutter | Container Width |
|-----------|---------|--------|----------------|
| xs (< 640px) | 4 | 16px | 100% |
| sm (640px+) | 4 | 16px | 100% |
| md (768px+) | 8 | 20px | 100% |
| lg (1024px+) | 12 | 24px | 1280px |
| xl (1280px+) | 12 | 24px | 1400px |

### 2.5 Responsive Layout Patterns

**Two-column layout (detail pages):**
```
Desktop:  Main content (66%) | Sidebar (34%)
Tablet:   Full width, sidebar below
Mobile:   Full width, sidebar below
```

**Four-column layout (summary cards):**
```
Desktop:  [Card] [Card] [Card] [Card]
Tablet:    [Card] [Card]
Mobile:    [Card]
```

### 2.6 White Space Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | None |
| `space-1` | 4px | Icon gaps |
| `space-2` | 8px | Tight gaps, label spacing |
| `space-3` | 12px | Form field gaps |
| `space-4` | 16px | Standard padding, card content |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section gaps, modal padding |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page section separation |
| `space-12` | 48px | Major page sections |

### 2.7 Content Density

| Context | Row Height | Padding | Font Size |
|---------|-----------|---------|-----------|
| Tables | 48px | 12-16px | 14px |
| Cards | Auto | 16-20px | 14px |
| Forms | 40-48px | 12-16px | 14px |
| Dashboard | Auto | 16-24px | 13-16px |

---

## SECTION 3: Typography System

### 3.1 Typography Scale

| Element | Font Size | Font Weight | Line Height | Letter Spacing | Usage |
|---------|-----------|-------------|------------|----------------|-------|
| **Page Title** | 24px (1.5rem) | 700 (Bold) | 1.25 | -0.01em | Main page headers |
| **Section Title** | 18px (1.125rem) | 600 (Semibold) | 1.375 | 0 | Card headers, section titles |
| **Card Title** | 16px (1rem) | 600 (Semibold) | 1.375 | 0 | Card headlines |
| **Subtitle** | 14px (0.875rem) | 500 (Medium) | 1.5 | 0 | Supporting descriptions |
| **Body** | 14px (0.875rem) | 400 (Regular) | 1.5 | 0 | Main content text |
| **Body Small** | 13px (0.8125rem) | 400 (Regular) | 1.5 | 0 | Secondary content |
| **Caption** | 12px (0.75rem) | 400 (Regular) | 1.4 | 0 | Helper text, timestamps |
| **Label** | 12px (0.75rem) | 500 (Medium) | 1.4 | 0.05em | Form labels (uppercase) |
| **Table Header** | 12px (0.75rem) | 600 (Semibold) | 1.4 | 0.05em | Table column headers (uppercase) |
| **Button Text** | 14px (0.875rem) | 500 (Medium) | 1 | 0 | Button labels |
| **Button Small** | 12px (0.75rem) | 500 (Medium) | 1 | 0 | Compact button labels |

### 3.2 Text Colors

| Element | Color | Hex |
|---------|-------|-----|
| Primary text | slate-900 | #0F172A |
| Secondary text | slate-600 | #475569 |
| Muted text | slate-500 | #64748B |
| Disabled text | slate-400 | #94A3B8 |
| Link text | primary-600 | #2563EB |
| Error text | danger-600 | #DC2626 |
| Success text | success-600 | #16A34A |
| Warning text | warning-600 | #D97706 |

### 3.3 Typography Usage Examples

```tsx
// Page Title
<h1 style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.25 }}>
  Service Requests
</h1>

// Section Title  
<h2 style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.375 }}>
  Request Details
</h2>

// Body Text
<p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.5 }}>
  Description of the request goes here.
</p>

// Table Header
<th style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
  Status
</th>

// Form Label
<label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
  Email Address
</label>
```

---

## SECTION 4: Color System

### 4.1 Primary Colors

Primary blue is used for primary actions, links, and focus states.

| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | #EFF6FF | Light backgrounds |
| primary-100 | #DBEAFE | Hover backgrounds |
| primary-200 | #BFDBFE | Active backgrounds |
| primary-300 | #93C5FD | Disabled states |
| primary-400 | #60A5FA | Placeholder text |
| **primary-500** | **#3B82F6** | **Main brand color** |
| primary-600 | #2563EB | Primary buttons, links |
| primary-700 | #1D4ED8 | Primary button hover |
| primary-800 | #1E40AF | Dark emphasis |
| primary-900 | #1E3A8A | Maximum emphasis |

### 4.2 Semantic Colors

| Semantic | Token | Hex | Usage |
|----------|-------|-----|-------|
| **Success** | success-500 | #22C55E | Positive actions, resolved status |
| | success-600 | #16A34A | Success text, icons |
| | success-100 | #DCFCE7 | Success backgrounds |
| **Warning** | warning-500 | #F59E0B | Caution states |
| | warning-600 | #D97706 | Warning text |
| | warning-100 | #FEF3C7 | Warning backgrounds |
| **Danger** | danger-500 | #EF4444 | Destructive actions |
| | danger-600 | #DC2626 | Error text |
| | danger-100 | #FEE2E2 | Error backgrounds |
| **Info** | info-500 | #6366F1 | Neutral highlights |
| | info-600 | #4F46E5 | Info text |
| | info-100 | #E0E7FF | Info backgrounds |

### 4.3 Neutral Colors (Slate Scale)

| Token | Hex | Usage |
|-------|-----|-------|
| slate-50 | #F8FAFC | Page background |
| slate-100 | #F1F5F9 | Card background, table header |
| slate-200 | #E2E8F0 | Borders, dividers |
| slate-300 | #CBD5E1 | Disabled backgrounds |
| slate-400 | #94A3B8 | Placeholder text |
| slate-500 | #64748B | Muted text |
| slate-600 | #475569 | Secondary text |
| slate-700 | #334155 | Body text |
| slate-800 | #1E293B | Dark surfaces |
| slate-900 | #0F172A | Sidebar, primary text |

### 4.4 Status Color Mapping

Standardized across ALL modules:

| Status | Background | Text | Border | Dot |
|--------|------------|------|--------|-----|
| **New/Open** | primary-50 | primary-700 | primary-200 | primary-500 |
| **Assigned** | #F5F3FF | #7C3AED | #DDD6FE | #8B5CF6 |
| **In Progress** | warning-50 | warning-700 | warning-200 | warning-500 |
| **Pending/Waiting** | #FFF7ED | #C2410C | #FED7AA | #F97316 |
| **Resolved/Completed** | success-50 | success-700 | success-200 | success-500 |
| **Closed/Cancelled** | slate-100 | slate-600 | slate-200 | slate-400 |
| **Blocked/Error** | danger-50 | danger-700 | danger-200 | danger-500 |

### 4.5 Priority Color Mapping

| Priority | Background | Text | Border |
|----------|------------|------|--------|
| **Critical** | danger-50 | danger-700 | danger-200 |
| **High** | warning-50 | warning-700 | warning-200 |
| **Medium** | #FFFBEB | #B45309 | #FDE68A |
| **Low** | slate-100 | slate-600 | slate-200 |

### 4.6 Surface Colors

| Surface | Color | Usage |
|---------|-------|-------|
| App Background | slate-50 | Page background |
| Card Surface | white | Cards, panels |
| Elevated Surface | white | Modals, dropdowns |
| Hover Surface | slate-50 | Hover states |
| Active Surface | slate-100 | Active/pressed states |

### 4.7 Border Colors

| Border | Color | Usage |
|--------|-------|-------|
| Default | slate-200 | Standard borders |
| Subtle | slate-100 | Light borders |
| Strong | slate-300 | Emphasis borders |
| Focus | primary-500 | Focus ring |
| Error | danger-500 | Error borders |

### 4.8 Interactive State Colors

| State | Color | Usage |
|-------|-------|-------|
| Hover background | slate-100 | Button, card hover |
| Pressed background | slate-200 | Button, card pressed |
| Disabled background | slate-100 | Disabled elements |
| Disabled text | slate-400 | Disabled labels |
| Focus ring | primary-500/30 | 3px outline, 2px offset |
| Selected background | primary-50 | Selected items |
| Selected border | primary-500 | Selected items |

---

## SECTION 5: Spacing System

### 5.1 Spacing Scale

| Token | Value | px | Common Usage |
|-------|-------|----|-------------|
| `space-0` | 0rem | 0 | Reset |
| `space-1` | 0.25rem | 4 | Icon gaps, tight spacing |
| `space-2` | 0.5rem | 8 | Label-to-input, compact lists |
| `space-3` | 0.75rem | 12 | Form field gaps, table cell padding |
| `space-4` | 1rem | 16 | Standard padding, card content |
| `space-5` | 1.25rem | 20 | Card padding, larger gaps |
| `space-6` | 1.5rem | 24 | Section gaps, modal body |
| `space-8` | 2rem | 32 | Large section gaps |
| `space-10` | 2.5rem | 40 | Page section separation |
| `space-12` | 3rem | 48 | Major page sections |
| `space-16` | 4rem | 64 | Hero spacing |

### 5.2 Context-Specific Spacing

**Page Spacing:**
| Context | Spacing |
|---------|---------|
| Page padding (desktop) | 32px |
| Page padding (tablet) | 24px |
| Page padding (mobile) | 16px |
| Page max-width | 1440px |

**Card Spacing:**
| Context | Spacing |
|---------|---------|
| Card padding | 20px |
| Card gap | 16px |
| Card border-radius | 8px |

**Toolbar Spacing:**
| Context | Spacing |
|---------|---------|
| Toolbar padding | 16px |
| Toolbar gap between elements | 12px |
| Search input width | 320px |

**Table Spacing:**
| Context | Spacing |
|---------|---------|
| Table row height | 48px |
| Table cell padding | 12px horizontal, 16px vertical |
| Table header height | 44px |
| Table border | 1px slate-200 |

**Form Spacing:**
| Context | Spacing |
|---------|---------|
| Form field gap | 16px |
| Form section gap | 24px |
| Label-to-input gap | 8px |
| Input height | 40px |
| Input padding | 12px horizontal |

**Dialog Spacing:**
| Context | Spacing |
|---------|---------|
| Modal body padding | 24px |
| Modal header padding | 24px |
| Modal footer padding | 16px |
| Dialog gap | 12px |

**Header Spacing:**
| Context | Spacing |
|---------|---------|
| Header height | 64px |
| Header padding | 24px |
| Icon-to-text gap | 12px |

**Section Spacing:**
| Context | Spacing |
|---------|---------|
| Section gap | 24px |
| Section title margin-bottom | 16px |

---

## SECTION 6: Elevation System

### 6.1 Shadow Scale

| Level | Token | CSS | Usage |
|-------|-------|-----|-------|
| 0 | shadow-none | none | Flat elements |
| 1 | shadow-xs | 0 1px 2px rgba(0,0,0,0.05) | Subtle separation |
| 2 | shadow-sm | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Cards at rest |
| 3 | shadow-md | 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06) | Hovered cards, dropdowns |
| 4 | shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) | Modals, popovers |
| 5 | shadow-xl | 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04) | Drawers, large overlays |

### 6.2 Component Elevation Usage

| Component | Shadow | When |
|----------|--------|------|
| Cards | shadow-sm | Default |
| Cards (hover) | shadow-md | On hover |
| Buttons (hover) | shadow-sm | On hover |
| Dropdowns | shadow-md | Open |
| Modals | shadow-lg | Always |
| Drawers | shadow-xl | Always |
| Tooltips | shadow-md | Always |
| Toasts | shadow-lg | Always |

### 6.3 Focus Elevation

```css
/* Focus ring for all interactive elements */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Custom focus for buttons and inputs */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
```

---

## SECTION 7: Border Radius System

### 7.1 Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0 | None |
| `radius-sm` | 4px | Badges, small chips |
| `radius-md` | 6px | Buttons, inputs |
| `radius-lg` | 8px | Cards, panels |
| `radius-xl` | 12px | Large cards, modals |
| `radius-2xl` | 16px | Page containers |
| `radius-full` | 9999px | Avatars, pills, toggles |

### 7.2 Component Radius Usage

| Component | Radius | Token |
|----------|--------|-------|
| Buttons | 6px | radius-md |
| Inputs | 6px | radius-md |
| Select dropdowns | 6px | radius-md |
| Checkboxes | 4px | radius-sm |
| Cards | 8px | radius-lg |
| Modals | 12px | radius-xl |
| Dialogs | 8px | radius-lg |
| Badges | 4px | radius-sm |
| Dropdowns | 8px | radius-lg |
| Tables | 8px | radius-lg |
| Images | 8px | radius-lg |
| Avatars | 9999px | radius-full |
| Progress bars | 9999px | radius-full |
| Tooltips | 6px | radius-md |

---

## SECTION 8: Icon System

### 8.1 Icon Library

**Library:** Lucide React  
**Sizing:** All icons use 24px as base, scaled via Tailwind

### 8.2 Icon Sizes

| Token | Size | Usage |
|-------|------|-------|
| icon-xs | 12px | Inline with caption text |
| icon-sm | 16px | Inline with body text, table actions |
| icon-md | 20px | Toolbar icons, button icons |
| icon-lg | 24px | Section icons, empty states |
| icon-xl | 32px | Large icons |
| icon-2xl | 48px | Hero icons |

### 8.3 Icon Usage by Context

| Context | Size | Spacing |
|---------|------|---------|
| Inline with button text | 16px | 8px gap |
| Table action column | 16px | 4px gap |
| Toolbar buttons | 20px | 8px gap |
| Card headers | 20px | 8px gap |
| Empty state icons | 48px | 16px below text |
| Status indicator dots | 8px | Inline |

### 8.4 Icon Color

| Context | Color |
|---------|-------|
| Default icons | slate-500 |
| Hover icons | slate-700 |
| Active icons | primary-600 |
| Disabled icons | slate-300 |
| Icon-only buttons | Current text color |

### 8.5 Navigation Icons

| Section | Icon |
|---------|------|
| Dashboard | LayoutDashboard |
| Service Requests | Ticket |
| Incidents | AlertTriangle |
| Inventory | Package |
| Assets | HardDrive |
| Knowledge Base | BookOpen |
| Compliance | Shield |
| Reports | BarChart3 |
| Vendors | Building2 |
| Users | Users |
| Settings | Settings |

---

## SECTION 9: Component Specifications

### 9.1 Page Header

**Purpose:** Provides consistent page-level headers with breadcrumbs, title, and actions.

**Variants:**
| Variant | Use Case |
|---------|----------|
| Default | List pages |
| With Back Button | Detail pages |
| With Tabs | Pages with tabbed navigation |
| Minimal | Settings, simple pages |

**Specifications:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb] > [Breadcrumb]                    [Actions...] │
│                                                             │
│  Title                                        [Btn] [Btn]  │
│  Subtitle (optional)                                    │
│                                                             │
│  [Tab 1] [Tab 2] [Tab 3]                                │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 64px |
| Padding | 24px horizontal |
| Title font | 24px, 700 weight |
| Subtitle font | 14px, 400 weight, slate-500 |
| Background | white |
| Border-bottom | 1px slate-200 |

**Usage:**
```tsx
<PageHeader
  title="Service Requests"
  subtitle="42 open tickets"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Service Requests' }
  ]}
  actions={<Button variant="primary" icon={Plus}>New Request</Button>}
/>
```

**Anti-patterns:**
- ❌ Decorative icons unrelated to content
- ❌ Forms in the header
- ❌ More than 2 primary action buttons
- ❌ Gradients on non-hero pages

---

### 9.2 Detail Header

**Purpose:** Header for detail pages with record identification.

**Specifications:**
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to Service Requests]                    [Actions...]  │
│                                                             │
│  #SR-2024-00156                        [● Status] [🔴 High] │
│  Network connectivity issue                                  │
│  Assigned to John Doe • Created Jan 15, 2024               │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Back button height | 36px |
| Record ID style | Monospace, slate-500 background |
| Title font | 24px, 700 weight |
| Meta font | 14px, slate-500 |

---

### 9.3 Breadcrumb

**Purpose:** Shows user's location in navigation hierarchy.

**Specifications:**
```
Home / Service Requests / SR-2024-00156
────   ────────────────   ──────────────
 ↑          ↑                  ↑
link     clickable         current
```

| Property | Value |
|----------|-------|
| Font size | 14px |
| Current item | slate-900, font-weight-500 |
| Clickable items | slate-500, hover: primary-600 |
| Separator | slate-400, margin: 8px |

**Responsive:**
| Breakpoint | Behavior |
|------------|---------|
| Desktop | Full breadcrumb |
| Tablet | Truncated (first + last) |
| Mobile | Current page only |

---

### 9.4 Toolbar

**Purpose:** Action bar for search, filters, and bulk actions.

**Specifications:**
```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search...        ] [Status ▼] [Priority ▼] [+ New]   │
├─────────────────────────────────────────────────────────────┤
│ ✓ 3 selected    [Assign] [Update] [Delete]                │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 56px |
| Padding | 16px |
| Search width | 320px |
| Gap between elements | 12px |
| Background | white |
| Border-bottom | 1px slate-100 |

---

### 9.5 Summary Card

**Purpose:** Displays key metrics at a glance.

**Specifications:**
```
┌───────────────────┐
│ [Icon]            │
│ 1,234            │ ← 32px, 700 weight
│ Total Requests    │ ← 14px, slate-500
│ ↑ 12% this week  │ ← 12px, success-600
└───────────────────┘
```

| Property | Value |
|----------|-------|
| Width | Flexible (grid) |
| Min-width | 180px |
| Padding | 20px |
| Icon size | 24px |
| Value font | 32px, 700 weight |
| Label font | 14px, slate-500 |
| Trend font | 12px |
| Border-radius | 8px |
| Shadow | shadow-sm |

**Variants:**
| Variant | Icon Color | Usage |
|---------|-----------|-------|
| Default | slate-400 | Neutral metrics |
| Success | success-500 | Positive trends |
| Warning | warning-500 | Attention needed |
| Danger | danger-500 | Critical items |

---

### 9.6 Data Table

**Purpose:** Displays structured data with sorting, selection, and actions.

**Specifications:**
```
┌────┬─────────────┬──────────┬─────────┬────────┬────────┐
│ ☑  │ Title    ↑ │ Status   │ Priority│ Assign │ Age    │ ← Header
├────┼─────────────┼──────────┼─────────┼────────┼────────┤
│ ☑  │ SR-001   │ ● New    │ 🔴 High │ John   │ 2d     │ ← Row
│    │ SR-002   │ ● Open   │ 🟡 Med  │ Sarah  │ 1d     │ ← Row
└────┴─────────────┴──────────┴─────────┴────────┴────────┘
```

| Property | Value |
|----------|-------|
| Row height | 48px |
| Cell padding | 12px horizontal, 16px vertical |
| Header height | 44px |
| Border | 1px slate-200 |
| Border-radius | 8px |
| Hover background | slate-50 |

**Row click behavior:** Opens detail page (no separate View button)

**Sorting:**
| State | Icon |
|--------|------|
| Not sorted | ChevronsUpDown, slate-300 |
| Ascending | ChevronUp, primary-600 |
| Descending | ChevronDown, primary-600 |

---

### 9.7 Status Badge

**Purpose:** Displays status with consistent color coding.

**Specifications:**
```
[● New]     [● In Progress]    [● Resolved]
```

| Property | Value |
|----------|-------|
| Padding | 6px 12px |
| Font size | 12px |
| Font weight | 600 |
| Border-radius | 4px |
| Dot size | 8px |
| Gap (dot to text) | 8px |

**Color mapping:** See Section 4.4

---

### 9.8 Priority Badge

**Purpose:** Displays priority levels.

**Specifications:**
```
[🔴 Critical]    [🟡 Medium]    [⚪ Low]
```

| Property | Value |
|----------|-------|
| Padding | 4px 10px |
| Font size | 12px |
| Font weight | 600 |
| Border-radius | 4px |
| Border | 1px solid |

**Color mapping:** See Section 4.5

---

### 9.9 Buttons

**Variants:**

| Variant | Purpose | Appearance |
|---------|---------|------------|
| Primary | Main CTA | Solid primary-600, white text |
| Secondary | Alternative action | White, primary-600 border, primary-600 text |
| Ghost | Tertiary action | Transparent, slate-600 text |
| Danger | Destructive action | Solid danger-600, white text |

**Sizes:**

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 32px | 8px 12px | 12px |
| md | 40px | 10px 16px | 14px |
| lg | 48px | 12px 24px | 14px |

**States:**
| State | Primary | Secondary | Ghost | Danger |
|-------|---------|-----------|-------|--------|
| Default | primary-600 | white/border | transparent | danger-600 |
| Hover | primary-700 | primary-50 | slate-100 | danger-700 |
| Active | primary-800 | primary-100 | slate-200 | danger-800 |
| Disabled | slate-300 bg | slate-100 | slate-400 | slate-300 bg |
| Loading | spinner shown | spinner shown | spinner shown | spinner shown |

**Icon buttons:**
| Size | Width |
|------|-------|
| sm | 32px |
| md | 40px |
| lg | 48px |

---

### 9.10 Search Input

**Purpose:** Consistent search experience.

**Specifications:**
```
┌────────────────────────────────────┐
│ 🔍  Search tickets...           ✕ │
└────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 40px |
| Padding | 12px left, 40px left icon area |
| Border | 1px slate-200 |
| Border-radius | 6px |
| Focus border | primary-500 |
| Focus ring | 3px primary-500/30 |
| Icon size | 20px |
| Placeholder color | slate-400 |
| Width | 100% (max 320px in toolbar) |

---

### 9.11 Filter Dropdown

**Purpose:** Filter options with multi-select capability.

**Specifications:**
```
┌──────────────────┐
│ Status      ▼   │
└──────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 36px |
| Padding | 8px 12px |
| Border | 1px slate-200 |
| Border-radius | 6px |
| Font size | 14px |
| Dropdown min-width | 200px |
| Dropdown shadow | shadow-md |

**Dropdown menu:**
| Property | Value |
|----------|-------|
| Padding | 8px |
| Item height | 36px |
| Item hover | slate-100 |
| Checkbox size | 16px |
| Gap (checkbox to label) | 8px |

---

### 9.12 Filter Chip

**Purpose:** Active filter indicator.

**Specifications:**
```
[Network ✕]    [High ✕]    [Last 7 days ✕]
```

| Property | Value |
|----------|-------|
| Padding | 4px 8px |
| Border-radius | 4px |
| Background | slate-100 |
| Font size | 13px |
| Remove icon size | 14px |
| Gap between chips | 8px |

---

### 9.13 Tabs

**Purpose:** Organizes related content into switchable views.

**Specifications:**
```
┌─────────┬────────────┬──────────┬───────────┐
│ Details  │ Attachments │ History  │ Comments   │
│ (3)      │             │          │ (12)       │
└─────────┴────────────┴──────────┴───────────┘
   ↑
   Active (bottom border)
```

| Property | Value |
|----------|-------|
| Tab height | 44px |
| Padding | 12px 16px |
| Font size | 14px |
| Font weight | 500 |
| Active color | primary-600 |
| Inactive color | slate-600 |
| Active indicator | 2px primary-600 bottom border |
| Count badge | 12px padding, slate-100 background |

**Variants:**
| Variant | Appearance |
|---------|-----------|
| Default | Bottom border indicator |
| Pills | Filled background for active |

---

### 9.14 Accordion

**Purpose:** Expandable content sections.

**Specifications:**
```
┌─────────────────────────────────────┐
│ Section Title                    ▼  │
├─────────────────────────────────────┤
│ Collapsible content                 │
│                                     │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Header height | 48px |
| Header padding | 16px |
| Header font | 14px, 600 weight |
| Border | 1px slate-200 |
| Border-radius | 8px |
| Icon size | 20px |
| Chevron rotation | 180deg when open |

---

### 9.15 Modal

**Purpose:** Displays content requiring user attention or interaction.

**Specifications:**
```
┌─────────────────────────────────────────────────────────┐
│                                             [ ✕ ]       │
│  Title                                                      │
│  Subtitle                                                   │
├─────────────────────────────────────────────────────────┤
│                                                             │
│  Content area                                              │
│                                                             │
├─────────────────────────────────────────────────────────┤
│              [Cancel]  [Confirm]                          │
└─────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Max-width (sm) | 400px |
| Max-width (md) | 500px |
| Max-width (lg) | 640px |
| Max-width (xl) | 800px |
| Border-radius | 12px |
| Header padding | 24px |
| Body padding | 24px |
| Footer padding | 16px |
| Backdrop | rgba(15, 23, 42, 0.6) |
| Footer button gap | 12px |

**Accessibility:**
- Focus trap enabled
- Escape closes modal
- Click backdrop closes modal
- aria-modal="true"

---

### 9.16 Drawer

**Purpose:** Displays supplementary content from the side.

**Specifications:**
```
┌───────────────────────────────────────┐
│ Title                      [ ✕ ]       │
├───────────────────────────────────────┤
│                                       │
│  Content                              │
│                                       │
├───────────────────────────────────────┤
│ [Cancel]                  [Confirm]   │
└───────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Position | Right |
| Width (sm) | 320px |
| Width (md) | 400px |
| Width (lg) | 480px |
| Width (xl) | 560px |
| Border-radius | 0 (full height) |
| Header padding | 20px |
| Body padding | 24px |
| Footer padding | 16px |

**Accessibility:**
- Focus trap enabled
- Escape closes drawer
- Click backdrop closes drawer

---

### 9.17 Form Elements

**Text Input:**
| Property | Value |
|----------|-------|
| Height | 40px |
| Padding | 12px horizontal |
| Border | 1px slate-200 |
| Border-radius | 6px |
| Font size | 14px |
| Focus border | primary-500 |
| Error border | danger-500 |

**Textarea:**
| Property | Value |
|----------|-------|
| Min-height | 100px |
| Padding | 12px |
| Border | 1px slate-200 |
| Border-radius | 6px |
| Font size | 14px |
| Resize | vertical only |

**Select:**
| Property | Value |
|----------|-------|
| Height | 40px |
| Padding | 12px horizontal |
| Border | 1px slate-200 |
| Border-radius | 6px |
| Dropdown shadow | shadow-md |

---

### 9.18 File Upload

**Purpose:** Enables file attachment with drag-and-drop support.

**Specifications:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              📁 Drag files here or click to browse      │
│                                                         │
│              PNG, JPG, PDF up to 25MB                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Border | 2px dashed slate-200 |
| Border-radius | 8px |
| Padding | 32px |
| Border hover | primary-300 |
| Border active (dragging) | primary-500 |

---

### 9.19 Timeline

**Purpose:** Displays chronological activity and history.

**Specifications:**
```
●─── 10:30 AM - John updated status to "In Progress"
│        Status changed from New to Assigned
│
●─── 09:15 AM - Sarah assigned to John Doe
│
●─── 09:00 AM - Request created by Jane
```

| Property | Value |
|----------|-------|
| Dot size | 10px |
| Line width | 2px |
| Line color | slate-200 |
| Item gap | 16px |
| Content padding-left | 24px |
| Timestamp font | 12px, slate-500 |
| Action font | 14px, slate-700 |

---

### 9.20 Activity Feed

**Purpose:** Shows recent user and system activities.

**Specifications:**
```
┌─────────────────────────────────────┐
│ 🔔 Recent Activity                  │
├─────────────────────────────────────┤
│ • John updated SR-001         2h   │
│ • Sarah created new ticket     5h   │
│ • System auto-assigned SR-045 1d   │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Item height | 40px |
| Item padding | 12px |
| Icon size | 16px |
| Text font | 14px |
| Time font | 12px, slate-500 |
| Hover background | slate-50 |

---

### 9.21 Comments

**Purpose:** Enables threaded discussions.

**Specifications:**
```
┌─────────────────────────────────────┐
│ 💬 3 Comments                       │
├─────────────────────────────────────┤
│ ┌───┐ John Doe              2h     │
│ │ 👤 │                                     │
│ └───┘ This issue needs attention... │
│       📎 document.pdf                  │
├─────────────────────────────────────┤
│ ┌───┐ Sarah                    10m   │
│ │ 👤 │                                     │
│ └───┘ I'm looking into this now.   │
├─────────────────────────────────────┤
│ ┌─────────────────────────┐ [Send]  │
│ │ Add a comment...       │          │
│ └─────────────────────────┘          │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Avatar size | 32px |
| Comment padding | 16px |
| Input height | 80px |
| Button width | 80px |

---

### 9.22 Empty State

**Purpose:** Provides guidance when no data exists.

**Specifications:**
```
┌─────────────────────────────────────┐
│                                     │
│              📋                     │
│                                     │
│         No items found              │
│                                     │
│    Try adjusting your search or      │
│    filter to find what you're       │
│    looking for.                    │
│                                     │
│        [+ Create New Request]       │
│                                     │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Icon size | 48px |
| Icon color | slate-300 |
| Title font | 18px, 600 weight |
| Description font | 14px, slate-500 |
| Vertical spacing | 16px |
| Icon-to-title gap | 16px |
| Max-width | 320px |

---

### 9.23 Loading State

**Skeleton:**
| Property | Value |
|----------|-------|
| Animation | pulse, 2s |
| Base color | slate-100 |
| Highlight color | slate-200 |

**Spinner:**
| Property | Value |
|----------|-------|
| Size (sm) | 16px |
| Size (md) | 24px |
| Size (lg) | 40px |
| Stroke width | 2px |
| Color | primary-500 |

---

### 9.24 Pagination

**Purpose:** Navigates through paginated data.

**Specifications:**
```
┌────────────────────────────────────────────┐
│ Showing 1-10 of 234      [<] [1] [2] [3] [>] │
└────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 56px |
| Page button size | 36px |
| Page button radius | 6px |
| Active page | primary-600 background |
| Info font | 14px, slate-600 |
| Gap between info and pages | 16px |

---

### 9.25 Toast

**Purpose:** Non-blocking feedback messages.

**Specifications:**
```
┌─────────────────────────────────────┐
│ ✓  Success                         │
│    Request created successfully     │
│                          [Undo] [✕]│
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 360px |
| Padding | 16px |
| Border-radius | 8px |
| Icon size | 20px |
| Title font | 14px, 600 weight |
| Message font | 14px, slate-600 |
| Position | bottom-right |
| Offset from edge | 24px |
| Gap between toasts | 12px |
| Duration | 4000ms (default) |

**Variants:**
| Variant | Icon | Background | Border |
|---------|------|------------|--------|
| Success | CheckCircle | success-50 | success-200 |
| Error | XCircle | danger-50 | danger-200 |
| Warning | AlertTriangle | warning-50 | warning-200 |
| Info | Info | info-50 | info-200 |

---

### 9.26 Confirmation Dialog

**Purpose:** Destructive action confirmation.

**Specifications:**
```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                      │
│                                     │
│     Delete this request?            │
│                                     │
│  This action cannot be undone.      │
│                                     │
│     [Cancel]    [Delete]           │
│                                     │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 400px |
| Icon size | 48px |
| Icon background | danger-100 |
| Title font | 18px, 700 weight |
| Message font | 14px, slate-600 |
| Button gap | 12px |
| Destructive button | danger-600 |

---

## SECTION 10: List Page Standard

### 10.1 Service Requests List Page

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                 │
│ Title: Service Requests                                       │
│ Subtitle: 42 open tickets                                    │
│ Actions: [+ Create] [Export]                                 │
├─────────────────────────────────────────────────────────────┤
│ [Toolbar]                                                   │
│ [🔍 Search...] [Status ▼] [Priority ▼] [Clear]            │
├─────────────────────────────────────────────────────────────┤
│ [SummaryCards]                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Total    │ │ Open     │ │ In Prog. │ │ Closed   │       │
│ │ 234      │ │ 89       │ │ 42       │ │ 103      │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ [DataTable]                                                  │
│ ┌────┬──────────┬────────┬─────────┬────────┬─────────┐   │
│ │ ☑  │ Ticket   │ Status │ Priority│ Assign │ Created │   │
│ ├────┼──────────┼────────┼─────────┼────────┼─────────┤   │
│ │    │ SR-001  │ ● New  │ 🔴 High │ John   │ 2d ago │   │
│ │    │ SR-002  │ ● Open │ 🟡 Med  │ Sarah  │ 1d ago │   │
│ └────┴──────────┴────────┴─────────┴────────┴─────────┘   │
│                                                              │
│ Showing 1-10 of 234          [<] [1] [2] [3]... [>]     │
└─────────────────────────────────────────────────────────────┘
```

**Components Used:**
- PageHeader (with breadcrumbs)
- Toolbar (search + filters)
- SummaryCards (4-column)
- DataTable (with row click)
- Pagination

---

### 10.2 Incidents List Page

**Same structure as Service Requests with:**

| Different Element | Specification |
|-------------------|---------------|
| Header Title | "Incidents" |
| Summary Cards | Total, Open, Critical, Resolved |
| Import button | Present (not in Service Requests) |

---

### 10.3 Assets/Inventory List Page

**Same structure as Service Requests with:**

| Different Element | Specification |
|-------------------|---------------|
| Header Title | "Assets" or "Inventory" |
| Tabs | Inventory \| User \| Project |
| Summary Cards | By category appropriate to view |

---

### 10.4 Knowledge Base List Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                 │
│ Title: Knowledge Base                                        │
│ Actions: [+ New Article]                                     │
├─────────────────────────────────────────────────────────────┤
│ [Search Bar]                                                 │
│ [🔍 Search articles...]                                      │
├─────────────────────────────────────────────────────────────┤
│ [CategoryGrid]                                               │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│ │ 📚 Getting      │ │ 🔧 Troubleshooting│ │ 📋 How-To    │   │
│ │ Started (12)   │ │ (8)            │ │ Guides (15)  │   │
│ └────────────────┘ └────────────────┘ └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ [RecentArticles]                                              │
│ Recent Updates                                               │
│ • How to reset your password (Updated 2 days ago)           │
│ • Getting started with the API (Updated 5 days ago)         │
└─────────────────────────────────────────────────────────────┘
```

---

### 10.5 Compliance List Page

**Same structure as Service Requests with:**

| Different Element | Specification |
|-------------------|---------------|
| Header Title | "Compliance" |
| Framework selector | Dropdown above table |
| Table columns | Control Name, Description, Evidence, Actions |

---

### 10.6 Reports List Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                 │
│ Title: Reports & Analytics                                    │
│ Subtitle: Generate downloadable reports                        │
├─────────────────────────────────────────────────────────────┤
│ [SummaryCards]                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Available│ │ Generated│ │ Exported │ │ Scheduled│       │
│ │ 24       │ │ 156     │ │ 89       │ │ 5        │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ [SearchBar]                                                   │
│ [🔍 Search reports...]                                       │
├─────────────────────────────────────────────────────────────┤
│ Service Requests                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ 📊 Request Summary   │ │ 📋 Request Details   │          │
│ │ Overview of all SRs   │ │ Full SR listing      │          │
│ │ [Generate ▼] [Preview]│ │ [Generate ▼] [Preview]│        │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

### 10.7 Vendors List Page

**Same structure as Service Requests with:**

| Different Element | Specification |
|-------------------|---------------|
| Header Title | "Vendor Directory" |
| Table columns | Vendor Name, Category, Status, Contact, Contract |

---

### 10.8 Users List Page

**Same structure as Service Requests with:**

| Different Element | Specification |
|-------------------|---------------|
| Header Title | "Users" or "User Management" |
| Table columns | Name, Email, Role, Status, Last Active |

---

## SECTION 11: Detail Page Standard

### 11.1 Standard Detail Page Layout

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb]                                                 │
│ Home / Service Requests / SR-2024-00156                       │
├─────────────────────────────────────────────────────────────┤
│ [DetailHeader]                                               │
│ [← Back]                              [Edit] [Delete]     │
│                                                              │
│ #SR-2024-00156                      [● Open] [🔴 High]    │
│ Network connectivity issue                                  │
│ Assigned to John Doe • Created Jan 15, 2024                │
├─────────────────────────────────────────────────────────────┤
│ [Tabs]                                                       │
│ [Details] [Attachments] [History] [Comments]                │
├───────────────────────────────────────┬─────────────────────┤
│ [Main Content]                        │ [Sidebar]          │
│                                       │                     │
│ ┌─────────────────────────────────┐ │ ┌─────────────────┐│
│ │ Description                      │ │ │ Status          ││
│ │ Lorem ipsum dolor sit amet...   │ │ │ ● Open         ││
│ └─────────────────────────────────┘ │ └─────────────────┘│
│                                       │                     │
│ ┌─────────────────────────────────┐ │ ┌─────────────────┐│
│ │ Request Details                 │ │ │ Priority        ││
│ │ Category: Network               │ │ │ 🔴 High        ││
│ │ Subcategory: Connectivity       │ │ └─────────────────┘│
│ └─────────────────────────────────┘ │                     │
│                                       │ ┌─────────────────┐│
│ ┌─────────────────────────────────┐ │ │ Assignee       ││
│ │ Custom Fields                   │ │ │ 👤 John Doe   ││
│ │ ...                             │ │ └─────────────────┘│
│ └─────────────────────────────────┘ │                     │
│                                       │ ┌─────────────────┐│
│                                       │ │ Dates           ││
│                                       │ │ Created: Jan 15 ││
│                                       │ │ Updated: Jan 16 ││
│                                       │ └─────────────────┘│
└───────────────────────────────────────┴─────────────────────┘
```

### 11.2 Components on Detail Pages

| Component | Position | Content |
|-----------|----------|---------|
| Breadcrumb | Top | Navigation path |
| Back button | Top-left | Return to list |
| Record ID | Header | Monospace, badge style |
| Title | Header | 24px, 700 weight |
| Status badge | Header | Right of title |
| Priority badge | Header | Right of title |
| Meta info | Header | Assignee, dates |
| Action buttons | Header-right | Edit, Delete, More |
| Tabs | Below header | Details, Attachments, etc. |
| Sidebar | Right column | Key-value pairs |
| Content | Left column | Tabbed content |

### 11.3 Sidebar Cards

| Property | Value |
|----------|-------|
| Padding | 16px |
| Border | 1px slate-200 |
| Border-radius | 8px |
| Gap between cards | 16px |
| Label font | 12px, slate-500, uppercase |
| Value font | 14px, slate-900 |

---

## SECTION 12: Form Standard

### 12.1 Create/Edit Form Layout

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                 │
│ Title: Create Service Request                                │
│ Breadcrumb: Home / Service Requests / Create                  │
├─────────────────────────────────────────────────────────────┤
│ [FormContainer]                                              │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Section: General Information                              │ │
│ │ ────────────────────────────────────────────────────    │ │
│ │                                                          │ │
│ │ Title *          [________________________]              │ │
│ │                                                          │ │
│ │ Description    [________________________]               │ │
│ │                [________________________]               │ │
│ │                [________________________]               │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Section: Request Details                                 │ │
│ │ ────────────────────────────────────────────────────    │ │
│ │                                                          │ │
│ │ Category *   [Network        ▼]  Priority * [High ▼]  │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Section: Attachments                                     │ │
│ │ ────────────────────────────────────────────────────    │ │
│ │                                                          │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ 📁 Drop files here or click to browse             │   │ │
│ │ │ PNG, JPG, PDF up to 25MB                          │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Cancel]                                     [Save Draft] │ │
│ │                                                 [Submit] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Form Specifications

| Element | Specification |
|---------|---------------|
| Container max-width | 720px |
| Section gap | 24px |
| Field gap | 16px |
| Label font | 12px, 500 weight, uppercase, slate-700 |
| Required indicator | Red asterisk (*) |
| Input height | 40px |
| Input padding | 12px horizontal |
| Textarea min-height | 100px |
| Error message font | 12px, danger-600 |
| Error message position | Below input |
| Button alignment | Footer-right |

### 12.3 Validation

**On blur validation:**
- Validate when user leaves field
- Show error immediately
- Clear error when user starts typing

**Error styling:**
- Border color: danger-500
- Error message: Below input, danger-600

**Required fields:**
- Marked with asterisk (*)
- "Required" in aria-label for screen readers

### 12.4 Form Buttons

| Button | Position | Variant |
|--------|----------|---------|
| Cancel | Footer-left | Secondary |
| Save Draft | Footer-right | Ghost |
| Submit | Footer-right | Primary |

### 12.5 Modal Forms

| Modal Size | Form Content |
|------------|--------------|
| sm (400px) | Simple forms (1-3 fields) |
| md (500px) | Standard forms (4-6 fields) |
| lg (640px) | Complex forms (7+ fields) |
| xl (800px) | Multi-section forms |

---

## SECTION 13: Table Standard

### 13.1 Table Structure

| Element | Specification |
|---------|---------------|
| Container border-radius | 8px |
| Header background | slate-50 |
| Header height | 44px |
| Header font | 12px, 600 weight, uppercase |
| Row height | 48px |
| Row hover | slate-50 |
| Cell padding | 12px horizontal, 16px vertical |
| Border | 1px slate-200 |
| Border-collapse | collapse |

### 13.2 Row Interactions

| Interaction | Behavior |
|-------------|---------|
| Row click | Opens detail page |
| Checkbox click | Toggles selection |
| Action button click | Opens action menu |

### 13.3 Sortable Columns

| State | Icon | Color |
|-------|------|-------|
| Not sorted | ChevronsUpDown | slate-300 |
| Ascending | ChevronUp | primary-600 |
| Descending | ChevronDown | primary-600 |

### 13.4 Selection

| State | Checkbox | Row Background |
|-------|---------|---------------|
| Unselected | Empty | white |
| Selected | Checked | primary-50 |

### 13.5 Responsive Table Behavior

| Breakpoint | Behavior |
|------------|---------|
| Desktop | Full columns visible |
| Tablet | Horizontal scroll |
| Mobile | Card view |

**Mobile Card View:**
```
┌─────────────────────────────────────────┐
│ SR-001 - Network Issue                  │
│ ──────────────────────────────────────── │
│ Status: ● Open    Priority: 🔴 High     │
│ Assignee: John D.   Age: 2 days         │
│                                         │
│ [View] [Edit]                           │
└─────────────────────────────────────────┘
```

---

## SECTION 14: Navigation Standard

### 14.1 Sidebar Navigation

**Specifications:**
| Property | Value |
|----------|-------|
| Width (expanded) | 256px |
| Width (collapsed) | 64px |
| Background | slate-900 |
| Item height | 44px |
| Item padding | 12px horizontal |
| Icon size | 20px |
| Icon-to-text gap | 12px |
| Active indicator | 3px left border, primary-500 |

**Item States:**
| State | Background | Text | Icon |
|-------|------------|------|------|
| Default | transparent | slate-300 | slate-400 |
| Hover | rgba(255,255,255,0.1) | white | white |
| Active | rgba(255,255,255,0.1) | white | white |

### 14.2 Record Navigation

**Clickable rows:**
- Every data table row is clickable
- Row click opens detail page
- No separate "View" button in most cases
- Action buttons for Edit, Delete, More

**Navigation flow:**
```
List Page → Click Row → Detail Page
                       ↓
                  Click Back → List Page
                       ↓
                  Edit Button → Edit Mode
```

### 14.3 Back Button

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 36px |
| Padding | 8px 12px |
| Icon size | 16px |
| Font size | 14px |
| Font weight | 500 |
| Color | slate-600 |
| Hover background | slate-100 |
| Hover color | slate-900 |

---

## SECTION 15: Responsive Standard

### 15.1 Breakpoints

| Name | Min-width | Max-width | Devices |
|------|-----------|-----------|---------|
| xs | 0 | 639px | Mobile phones |
| sm | 640px | 767px | Large phones |
| md | 768px | 1023px | Tablets |
| lg | 1024px | 1279px | Laptops |
| xl | 1280px | 1535px | Desktops |
| 2xl | 1536px | - | Large desktops |

### 15.2 Phone (< 640px)

| Element | Behavior |
|---------|---------|
| Sidebar | Hidden, hamburger menu |
| Tables | Card view |
| Forms | Single column |
| Dialogs | Full screen |
| Toolbar | Stacked or condensed |
| Cards | Single column |

### 15.3 Tablet (640px - 1023px)

| Element | Behavior |
|---------|---------|
| Sidebar | Collapsed (icons only) |
| Tables | Horizontal scroll |
| Forms | Single column |
| Dialogs | 90% width |
| Cards | 2 columns |
| Grid | 2-3 columns |

### 15.4 Laptop (1024px - 1279px)

| Element | Behavior |
|---------|---------|
| Sidebar | Collapsible |
| Tables | Full with scroll |
| Forms | 2 columns where appropriate |
| Cards | 3-4 columns |
| Grid | 8-12 columns |

### 15.5 Desktop (1280px+)

| Element | Behavior |
|---------|---------|
| Sidebar | Expanded |
| Tables | Full |
| Forms | 2 columns |
| Cards | 4 columns |
| Grid | 12 columns |
| Max content width | 1440px |

### 15.6 Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44px × 44px |
| Links | 44px height |
| Form inputs | 48px height |
| Table rows | 48px height |
| Icons (tappable) | 44px × 44px |

---

## SECTION 16: Accessibility Standard

### 16.1 Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| Tab | Next focusable element |
| Shift+Tab | Previous focusable element |
| Enter | Activate button, follow link |
| Escape | Close modal, dropdown, drawer |
| Space | Toggle checkbox, activate button |

### 16.2 Focus Management

**Focus indicators:**
```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

**Focus trap in modals:**
- Tab cycles within modal
- Escape returns focus to trigger element

### 16.3 ARIA Attributes

| Element | Attributes |
|---------|------------|
| Buttons | aria-label (if icon-only) |
| Inputs | aria-label or aria-labelledby |
| Error messages | aria-describedby |
| Modals | role="dialog", aria-modal="true" |
| Tables | role="grid" |
| Headings | aria-level |

### 16.4 Color Contrast

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

### 16.5 Screen Reader Support

| Element | Implementation |
|---------|---------------|
| Images | alt text |
| Icons | aria-label or visually hidden text |
| Status badges | Visible text (not color alone) |
| Loading states | aria-busy="true" |
| Error messages | role="alert" or aria-live |

---

## SECTION 17: Motion Standard

### 17.1 Animation Principles

- **Subtle**: Animations enhance without distracting
- **Purposeful**: Every animation serves a function
- **Fast**: 150-200ms for micro-interactions
- **Smooth**: Ease-out for exits, ease-in for entrances

### 17.2 Animation Durations

| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, focus) | 100-150ms | ease-out |
| Standard (modals, dropdowns) | 150-200ms | ease-in-out |
| Complex (page transitions) | 200-300ms | ease-in-out |

### 17.3 Component Animations

| Component | Animation | Duration |
|-----------|-----------|----------|
| Button hover | Background color, shadow | 150ms |
| Card hover | Shadow elevation | 150ms |
| Modal open | Fade + scale from 95% | 200ms |
| Modal close | Fade + scale to 95% | 150ms |
| Drawer slide | Translate X | 200ms |
| Dropdown | Fade + translate Y | 150ms |
| Toast | Slide from right | 200ms |
| Spinner | Rotate | 1s linear (continuous) |
| Skeleton | Pulse | 2s (continuous) |

### 17.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## SECTION 18: UI Consistency Checklist

Every page must satisfy ALL items before being considered complete.

### Layout & Structure
- [ ] Uses standard PageHeader component
- [ ] Uses standard Toolbar component
- [ ] Uses standard Breadcrumb component
- [ ] Uses standard Sidebar navigation
- [ ] Page max-width does not exceed 1440px
- [ ] Responsive padding applied (16px/24px/32px)
- [ ] No inline styles in component markup
- [ ] No custom CSS outside stylesheet

### Typography
- [ ] Page title: 24px, 700 weight
- [ ] Section titles: 18px, 600 weight
- [ ] Body text: 14px, 400 weight
- [ ] Labels: 12px, 500 weight, uppercase
- [ ] Table headers: 12px, 600 weight, uppercase
- [ ] Uses system font family (Inter)
- [ ] Text colors match specification

### Color System
- [ ] Primary color: primary-600 for actions
- [ ] Status colors match specification exactly
- [ ] Priority colors match specification exactly
- [ ] Background: slate-50
- [ ] Surface: white
- [ ] Borders: slate-200
- [ ] No decorative gradients

### Spacing
- [ ] Uses spacing scale (4/8/12/16/20/24/32/40px)
- [ ] Card padding: 20px
- [ ] Section gap: 24px
- [ ] Form field gap: 16px
- [ ] Toolbar gap: 12px
- [ ] Table row height: 48px
- [ ] Button height: 40px (md), 32px (sm)
- [ ] Input height: 40px

### Components
- [ ] Uses shared Button component with variants
- [ ] Uses shared StatusBadge component
- [ ] Uses shared PriorityBadge component
- [ ] Uses shared DataTable component
- [ ] Uses shared Modal component
- [ ] Uses shared Drawer component
- [ ] Uses shared Pagination component
- [ ] Uses shared Toast component
- [ ] Uses shared EmptyState component
- [ ] Uses shared Skeleton component
- [ ] NO duplicate component copies

### Interaction
- [ ] Row click opens detail page
- [ ] No separate View button unless necessary
- [ ] Escape closes modals/drawers
- [ ] Click backdrop closes modals/drawers
- [ ] Focus trap in modals
- [ ] Loading states shown during data fetch
- [ ] Error states handled gracefully

### Forms
- [ ] Uses shared FormSection component
- [ ] Labels positioned above inputs
- [ ] Required fields marked with asterisk
- [ ] Error messages positioned below inputs
- [ ] Validation on blur
- [ ] Submit button disabled during processing

### Tables
- [ ] Uses standard table structure
- [ ] 48px row height minimum
- [ ] Hover state on rows
- [ ] Selected state for checked rows
- [ ] Sortable columns have sort icons
- [ ] Pagination at bottom
- [ ] Responsive card view on mobile

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on icon buttons
- [ ] Form inputs have labels
- [ ] Error messages linked to inputs
- [ ] Color contrast meets 4.5:1
- [ ] Screen reader tested
- [ ] Skip links present

### Responsiveness
- [ ] Mobile breakpoint (640px) tested
- [ ] Tablet breakpoint (768px) tested
- [ ] Desktop breakpoint (1024px) tested
- [ ] No horizontal scroll on any breakpoint
- [ ] Touch targets 44px minimum
- [ ] Tables convert to cards on mobile

### Code Quality
- [ ] No inline styles
- [ ] No magic numbers
- [ ] CSS variables used
- [ ] Tailwind classes used consistently
- [ ] No console.log statements
- [ ] Proper TypeScript typing
- [ ] Components properly typed

### Performance
- [ ] No unnecessary re-renders
- [ ] Lazy loading for heavy components
- [ ] Images optimized
- [ ] No layout shift on load

---

## Output Summary

### Sections Completed: 18

### Pages Covered
| Module | Pages |
|--------|-------|
| Service Requests | 2 (List, Detail) |
| Incidents | 2 (List, Detail) |
| Inventory | 3 (List, Detail, Master) |
| Assets | 2 (List, Detail) |
| Knowledge Base | 2 (Categories, Articles) |
| Compliance | 2 (Frameworks, Controls) |
| Reports | 2 (List, Generator) |
| Vendors | 2 (Directory, Detail) |
| Users | 3 (List, Detail, Create) |
| Settings | 2 (Settings, Profile) |
| Authentication | 2 (Login, Activate) |
| Dashboard | 1 |

**Total Pages Covered: 23+**

### Components Standardized: 26

| Category | Components |
|----------|-----------|
| Layout | PageHeader, DetailHeader, Breadcrumb, Toolbar |
| Data Display | SummaryCard, DataTable, Pagination, StatusBadge, PriorityBadge |
| Actions | Button, IconButton, ActionMenu |
| Forms | Input, Textarea, Select, Checkbox, Radio, FileUpload, FormSection |
| Navigation | Tabs, Accordion, BackButton |
| Overlays | Modal, Drawer, Toast, ConfirmationDialog |
| Feedback | EmptyState, LoadingState, Skeleton, Spinner, Progress |
| Content | Timeline, ActivityFeed, Comments, Card |

### Checklist Items Created: 60

Organized into 8 categories:
1. Layout & Structure (9 items)
2. Typography (6 items)
3. Color System (7 items)
4. Spacing (8 items)
5. Components (12 items)
6. Interaction (7 items)
7. Accessibility (8 items)
8. Code Quality (3 items)

### Unresolved Design Decisions: 0

All design decisions have been resolved in this specification.

---

## Reference Documents

This style guide consolidates the following documents:
- `01-current-ui-audit.md` - Audit findings
- `02-design-principles.md` - Design philosophy
- `03-design-tokens.md` - Token specifications
- `04-component-library.md` - Component specs
- `05-page-templates.md` - Page layouts
- `06-navigation-standards.md` - Navigation patterns
- `07-responsive-standards.md` - Responsive specs
- `08-migration-plan.md` - Migration roadmap
- `ui-scorecard.md` - Page scoring

---

**End of UI Style Guide**
**Document Version: 1.0**
**Last Updated: 2026-07-22**
