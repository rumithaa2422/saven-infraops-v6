# Enterprise UI/UX Design Blueprint
## PHASE U0: Responsive Design Standards

**Document Version:** 1.0  
**Date:** 2026-07-22  
**Status:** DEFINITION ONLY - NOT IMPLEMENTED

---

## 1. Overview

This document defines responsive design standards for the Saven InfraOps Enterprise application. The design system is mobile-first with progressive enhancement for larger screens.

**Important:** This document is for specification only. Implementation should follow the migration plan in `08-migration-plan.md`.

---

## 2. Breakpoints

### 2.1 Breakpoint Definitions

| Name | Min Width | Max Width | Typical Devices |
|------|-----------|-----------|-----------------|
| xs | 0px | 639px | Mobile phones |
| sm | 640px | 767px | Large phones, small tablets |
| md | 768px | 1023px | Tablets, small laptops |
| lg | 1024px | 1279px | Laptops |
| xl | 1280px | 1535px | Desktops |
| 2xl | 1536px | 1919px | Large desktops |
| 3xl | 1920px | - | Ultra-wide displays |

### 2.2 CSS Implementation

```css
/* Mobile First Approach */

/* Extra Small (default) */
.container {
  width: 100%;
  padding: 0 16px;
}

/* Small */
@media (min-width: 640px) {
  .container {
    padding: 0 24px;
  }
}

/* Medium */
@media (min-width: 768px) {
  .container {
    padding: 0 32px;
  }
}

/* Large and up */
@media (min-width: 1024px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}

/* Extra Large */
@media (min-width: 1280px) {
  /* Sidebar visible, full layouts */
}
```

---

## 3. Grid System

### 3.1 Column Specifications

| Breakpoint | Columns | Gutter | Container |
|------------|---------|--------|-----------|
| xs | 4 | 16px | 100% |
| sm | 4 | 16px | 100% |
| md | 8 | 20px | 100% |
| lg | 12 | 24px | 1280px |
| xl | 12 | 24px | 1280px |
| 2xl | 12 | 24px | 1400px |

### 3.2 Grid Examples

```tsx
// Dashboard - 4 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <SummaryCard />
  <SummaryCard />
  <SummaryCard />
  <SummaryCard />
</div>

// Two-column layout on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <main className="lg:col-span-2">
    {/* Main content */}
  </main>
  <aside>
    {/* Sidebar */}
  </aside>
</div>
```

---

## 4. Phone Layouts (< 640px)

### 4.1 Page Structure

```
┌─────────────────────────────┐
│ [≡] Title         [🔔] [👤]│  ← Compact header
├─────────────────────────────┤
│ Breadcrumbs                 │
├─────────────────────────────┤
│                             │
│ Page Content                │
│ (Full width, stacked)      │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ [Tab 1] [Tab 2] [Tab 3] [+] │  ← Scrollable tabs or bottom nav
└─────────────────────────────┘
```

### 4.2 Header Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Logo | Full | Icon only |
| Title | Always visible | Truncate |
| Actions | All visible | Overflow menu |
| Search | Expandable | Icon toggle |

### 4.3 Form Layouts

```
┌─────────────────────────────┐
│ Label                       │
│ ┌─────────────────────────┐ │
│ │ Input                   │ │
│ └─────────────────────────┘ │
│                             │
│ Label                       │
│ ┌─────────────────────────┐ │
│ │ Input                   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───────────┐ ┌───────────┐ │
│ │ Cancel   │ │   Save    │ │
│ └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

### 4.4 Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44px × 44px |
| Links | 44px height |
| Form inputs | 48px height |
| Table rows | 48px height |
| Icons (tappable) | 44px × 44px |

---

## 5. Tablet Layouts (640px - 1023px)

### 5.1 Sidebar Behavior

| Mode | Width | Trigger |
|------|-------|---------|
| Expanded | 256px | Default |
| Collapsed | 64px | Toggle button |
| Hidden | 0 | Menu button |

### 5.2 Page Structure

```
┌────────┬──────────────────────────────────────────┐
│        │ [🔍 Search...]                [🔔] [👤]  │
│  Side  ├──────────────────────────────────────────┤
│  bar   │                                          │
│  64px  │  Page Content                           │
│        │  (2-column grid where appropriate)      │
│        │                                          │
│        │  ┌──────────┐ ┌──────────┐              │
│        │  │ Card 1   │ │ Card 2   │              │
│        │  └──────────┘ └──────────┘              │
└────────┴──────────────────────────────────────────┘
```

### 5.3 Table Behavior

Tables switch to horizontal scroll on tablet.

```
┌─────────────────────────────────────────────────────────┐
│ ← Scroll →                                              │
│ ┌────┬─────────────┬──────────┬─────────┬────────┬──────┐ │
│ │ ID │ Title      │ Status   │ Priority│ Assign │ Age  │ │
│ ├────┼─────────────┼──────────┼─────────┼────────┼──────┤ │
│ │ 1  │ Item 1     │ ● Open  │ 🔴 High │ John   │ 2d   │ │
│ └────┴─────────────┴──────────┴─────────┴────────┴──────┘ │
│                    ← Swipe/scroll to see more →          │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Laptop Layouts (1024px - 1279px)

### 6.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (256px) │              Header                      │
│                 ├─────────────────────────────────────────┤
│ Dashboard       │                                         │
│ Service Req. ●  │  Page Content                           │
│ Incidents      │  (Full tables, sidebars)               │
│ Inventory       │                                         │
│ Assets          │  ┌──────────────────┐ ┌──────────────────┐ │
│ Knowledge Base  │  │                 │ │                 │ │
│ Compliance      │  │   Content        │ │    Sidebar      │ │
│ Reports         │  │                 │ │                 │ │
│ Vendors         │  │                 │ │                 │ │
│ Users           │  └──────────────────┘ └──────────────────┘ │
│ Settings        │                                         │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Summary Cards

4-column grid becomes 2-column on smaller laptops.

```
┌──────────┬──────────┬──────────┬──────────┐
│ Card 1   │ Card 2   │ Card 3   │ Card 4   │
└──────────┴──────────┴──────────┴──────────┘
     ↓ (narrower screens) ↓
┌──────────┬──────────┐
│ Card 1   │ Card 2   │
├──────────┼──────────┤
│ Card 3   │ Card 4   │
└──────────┴──────────┘
```

---

## 7. Desktop Layouts (1280px+)

### 7.1 Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (256px) │                    Header                     │
│                 ├───────────────────────────────────────────────┤
│ Dashboard       │                                                │
│ Service Req. ●  │  ┌─────────────────────────────────────────┐ │
│ Incidents       │  │ Page Header                              │ │
│ Inventory       │  │ Title                          [Actions]  │ │
│ Assets          │  └─────────────────────────────────────────┘ │
│ Knowledge Base  │                                                │
│ Compliance      │  ┌─────────────────────────────────────────┐ │
│ Reports         │  │ Content Area                             │ │
│ ─────────────── │  │                                          │ │
│ Vendors         │  │  ┌──────────────────────┐ ┌────────────┐ │ │
│ Users           │  │  │                      │ │            │ │ │
│ Settings        │  │  │   Main Content      │ │  Sidebar   │ │ │
│                 │  │  │                      │ │            │ │ │
│                 │  │  │                      │ │            │ │ │
│                 │  │  └──────────────────────┘ └────────────┘ │ │
└─────────────────┴──────────────────────────────────────────────┘
```

### 7.2 Maximum Content Width

| Element | Max Width |
|---------|-----------|
| Page content | 1280px |
| Table | 100% (container) |
| Form | 720px |
| Sidebar | 320px |

---

## 8. Ultra-Wide Layouts (1920px+)

### 8.1 Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Sidebar │                    Header                                   │
│ 256px   ├───────────────────────────────────────────────────────────┤
│         │                                                               │
│         │  ┌───────────────────────────────────────────────────────┐ │
│         │  │ Container (max 1400px, centered)                   │ │
│         │  │                                                       │ │
│         │  │  Content with increased information density         │ │
│         │  │  or expanded sidebar                                 │ │
│         │  │                                                       │ │
│         │  └───────────────────────────────────────────────────────┘ │
│         │                                                               │
└─────────┴───────────────────────────────────────────────────────────────┘
```

### 8.2 Density Options

On ultra-wide screens, provide option to increase information density:

```
┌─────────────────────────────────────────────────────────────┐
│ [Compact] [Comfortable] [Spacious]                        │
│                                                          │
│ Density selector for power users                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Component-Specific Responsiveness

### 9.1 Data Tables

| Breakpoint | Behavior |
|------------|----------|
| xs | Card view (one record per card) |
| sm | Card view with swipe actions |
| md | Horizontal scroll, essential columns |
| lg | Full table with all columns |
| xl+ | Full table + column resizing |

#### Card View (Mobile)

```
┌─────────────────────────────────────────┐
│ SR-001 - Network Issue                  │
│ ──────────────────────────────────────── │
│ Status: ● Open    Priority: 🔴 High      │
│ Assignee: John D.   Age: 2 days           │
│                                         │
│ [View] [Edit]                           │
└─────────────────────────────────────────┘
```

### 9.2 Modals & Drawers

| Breakpoint | Modal | Drawer |
|------------|-------|--------|
| xs | Full screen | Full screen |
| sm | 95% width | 100% width |
| md | 90% width | 80% width |
| lg | 720px max | 560px |
| xl | 800px max | 640px |

### 9.3 Forms

| Breakpoint | Layout |
|------------|--------|
| xs | Single column, stacked labels |
| sm | Single column, inline labels |
| md | Two columns where appropriate |
| lg+ | Two columns, full labels |

### 9.4 Charts & Graphs

| Breakpoint | Behavior |
|------------|----------|
| xs | Simplified, essential data only |
| sm | Full data, smaller dimensions |
| md | Full data, standard dimensions |
| lg+ | Full data, larger dimensions, tooltips |

### 9.5 Navigation

| Breakpoint | Header | Sidebar | Bottom Nav |
|------------|--------|---------|------------|
| xs | Minimal | Hidden | Fixed |
| sm | Minimal | Collapsible | Fixed |
| md | Full | Visible | Hidden |
| lg+ | Full | Visible, collapsible | Hidden |

---

## 10. Responsive Patterns

### 10.1 Visibility Patterns

```tsx
// Hide on mobile
<div className="hidden md:block">
  Desktop-only content
</div>

// Hide on desktop
<div className="block md:hidden">
  Mobile-only content
</div>

// Show at specific breakpoints
<div className="hidden lg:block xl:hidden">
  Large screens only (1024px-1279px)
</div>
```

### 10.2 Stacking Patterns

```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">{/* Content */}</div>
  <div className="flex-1">{/* Sidebar */}</div>
</div>

// Grid auto-fit
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### 10.3 Typography Scaling

```css
/* Mobile-first typography */
.text-heading-1 { font-size: 1.5rem; }   /* 24px */
.text-heading-2 { font-size: 1.25rem; }  /* 20px */
.text-heading-3 { font-size: 1.125rem; } /* 18px */
.text-body { font-size: 0.875rem; }      /* 14px */
.text-caption { font-size: 0.75rem; }    /* 12px */

@media (min-width: 768px) {
  .text-heading-1 { font-size: 2rem; }    /* 32px */
  .text-heading-2 { font-size: 1.5rem; }  /* 24px */
  .text-heading-3 { font-size: 1.25rem; } /* 18px */
}
```

---

## 11. Responsive Testing Checklist

### Device Testing Matrix

| Device Type | Device | Breakpoint | Pass/Fail |
|-------------|--------|------------|-----------|
| Phone | iPhone SE | xs | |
| Phone | iPhone 14 | sm | |
| Tablet | iPad Mini | md | |
| Tablet | iPad Pro 11" | md | |
| Laptop | MacBook Air 13" | lg | |
| Desktop | iMac 27" | xl | |
| Desktop | Large Monitor | 2xl | |
| TV | 4K Display | 3xl | |

### Functional Testing

- [ ] All navigation links work
- [ ] Forms submit correctly
- [ ] Tables scroll horizontally
- [ ] Modals/drawers display properly
- [ ] Touch targets are large enough
- [ ] Text is readable without zooming
- [ ] Images scale appropriately
- [ ] Icons are visible and tappable
- [ ] Loading states display correctly
- [ ] Error states are accessible

### Performance Testing

- [ ] Page load time < 3s on 3G
- [ ] Smooth scrolling (60fps)
- [ ] No layout shift on load
- [ ] Images lazy load correctly

---

## 12. Accessibility at Every Size

### 12.1 Touch Accessibility

- Minimum touch target: 44px × 44px
- Adequate spacing between targets: 8px minimum
- Visual feedback on touch: ripple effect or highlight

### 12.2 Zoom Behavior

| Zoom Level | Expected Behavior |
|------------|------------------|
| 200% | Text reflows, no horizontal scroll |
| 400% | Core functionality accessible |

### 12.3 Screen Reader Testing

Test on both mobile and desktop:
- [ ] All content is announced correctly
- [ ] Navigation landmarks are identified
- [ ] Form labels are associated
- [ ] Dynamic content is announced

---

## 13. Responsive Animation Guidelines

### 13.1 Performance

- Use CSS transforms (GPU accelerated)
- Avoid animating layout properties (width, height)
- Use `will-change` sparingly

### 13.2 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 13.3 Transition Guidelines

| Animation | Mobile | Desktop |
|-----------|--------|---------|
| Hover states | N/A (touch) | 150ms |
| Modal open | 200ms | 200ms |
| Drawer slide | 250ms | 200ms |
| Page transition | Instant | 200ms |

---

**End of Responsive Standards Document**
