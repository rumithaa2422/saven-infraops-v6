# Enterprise UI/UX Design Blueprint
## PHASE U0: Design Tokens Specification

**Document Version:** 1.0  
**Date:** 2026-07-22  
**Status:** DEFINITION ONLY - NOT IMPLEMENTED

---

## 1. Overview

This document defines the complete design token system for the Saven InfraOps Enterprise application. Design tokens are the atomic values that define the visual language of the interface.

**Important:** This document is for specification only. Implementation should follow the migration plan in `08-migration-plan.md`.

---

## 2. Color Tokens

### 2.1 Primary Colors

```css
:root {
  /* Brand Primary - Blue */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;  /* Main brand color */
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  
  /* Usage: Primary buttons, links, focus states */
}
```

### 2.2 Semantic Colors

```css
:root {
  /* Success - Green */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-200: #BBF7D0;
  --color-success-300: #86EFAC;
  --color-success-400: #4ADE80;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;
  --color-success-700: #15803D;
  --color-success-800: #166534;
  --color-success-900: #14532D;
  
  /* Usage: Success messages, positive states, resolved items */

  /* Warning - Amber */
  --color-warning-50: #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-200: #FDE68A;
  --color-warning-300: #FCD34D;
  --color-warning-400: #FBBF24;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;
  --color-warning-800: #92400E;
  --color-warning-900: #78350F;
  
  /* Usage: Warning messages, pending states, attention */

  /* Danger - Red */
  --color-danger-50: #FEF2F2;
  --color-danger-100: #FEE2E2;
  --color-danger-200: #FECACA;
  --color-danger-300: #FCA5A5;
  --color-danger-400: #F87171;
  --color-danger-500: #EF4444;
  --color-danger-600: #DC2626;
  --color-danger-700: #B91C1C;
  --color-danger-800: #991B1B;
  --color-danger-900: #7F1D1D;
  
  /* Usage: Error messages, destructive actions, critical */

  /* Info - Indigo */
  --color-info-50: #EEF2FF;
  --color-info-100: #E0E7FF;
  --color-info-200: #C7D2FE;
  --color-info-300: #A5B4FC;
  --color-info-400: #818CF8;
  --color-info-500: #6366F1;
  --color-info-600: #4F46E5;
  --color-info-700: #4338CA;
  --color-info-800: #3730A3;
  --color-info-900: #312E81;
  
  /* Usage: Informational messages, neutral highlights */
}
```

### 2.3 Neutral Colors (Gray Scale)

```css
:root {
  /* Slate - Primary neutral */
  --color-slate-50: #F8FAFC;
  --color-slate-100: #F1F5F9;
  --color-slate-200: #E2E8F0;
  --color-slate-300: #CBD5E1;
  --color-slate-400: #94A3B8;
  --color-slate-500: #64748B;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1E293B;
  --color-slate-900: #0F172A;
  --color-slate-950: #020617;
  
  /* Usage:
     - slate-50: Backgrounds, cards
     - slate-100: Borders, dividers
     - slate-200: Disabled backgrounds
     - slate-300: Placeholder text
     - slate-400: Muted text
     - slate-500: Secondary text
     - slate-600: Body text
     - slate-700: Headings (subtle)
     - slate-800: Headings
     - slate-900: Primary text
  */
}
```

### 2.4 Status Color Mappings

```css
:root {
  /* Standardized status colors across all modules */
  
  /* Open/New Status */
  --status-new-bg: var(--color-primary-50);
  --status-new-text: var(--color-primary-700);
  --status-new-border: var(--color-primary-200);
  --status-new-dot: var(--color-primary-500);
  
  /* Assigned Status */
  --status-assigned-bg: #F5F3FF;  /* Light purple */
  --status-assigned-text: #7C3AED;
  --status-assigned-border: #DDD6FE;
  --status-assigned-dot: #8B5CF6;
  
  /* In Progress Status */
  --status-progress-bg: var(--color-warning-50);
  --status-progress-text: var(--color-warning-700);
  --status-progress-border: var(--color-warning-200);
  --status-progress-dot: var(--color-warning-500);
  
  /* Waiting/Pending Status */
  --status-waiting-bg: #FFF7ED;  /* Light orange */
  --status-waiting-text: #C2410C;
  --status-waiting-border: #FED7AA;
  --status-waiting-dot: #F97316;
  
  /* Resolved/Completed Status */
  --status-resolved-bg: var(--color-success-50);
  --status-resolved-text: var(--color-success-700);
  --status-resolved-border: var(--color-success-200);
  --status-resolved-dot: var(--color-success-500);
  
  /* Closed/Cancelled Status */
  --status-closed-bg: var(--color-slate-100);
  --status-closed-text: var(--color-slate-600);
  --status-closed-border: var(--color-slate-200);
  --status-closed-dot: var(--color-slate-400);
  
  /* Blocked/Error Status */
  --status-blocked-bg: var(--color-danger-50);
  --status-blocked-text: var(--color-danger-700);
  --status-blocked-border: var(--color-danger-200);
  --status-blocked-dot: var(--color-danger-500);
}
```

### 2.5 Priority Color Mappings

```css
:root {
  /* Critical Priority */
  --priority-critical-bg: var(--color-danger-50);
  --priority-critical-text: var(--color-danger-700);
  --priority-critical-border: var(--color-danger-200);
  
  /* High Priority */
  --priority-high-bg: var(--color-warning-50);
  --priority-high-text: var(--color-warning-700);
  --priority-high-border: var(--color-warning-200);
  
  /* Medium Priority */
  --priority-medium-bg: #FFFBEB;
  --priority-medium-text: #B45309;
  --priority-medium-border: #FDE68A;
  
  /* Low Priority */
  --priority-low-bg: var(--color-slate-100);
  --priority-low-text: var(--color-slate-600);
  --priority-low-border: var(--color-slate-200);
}
```

### 2.6 Semantic Surface Colors

```css
:root {
  /* Backgrounds */
  --bg-app: var(--color-slate-50);
  --bg-surface: #FFFFFF;
  --bg-surface-hover: var(--color-slate-50);
  --bg-surface-active: var(--color-slate-100);
  --bg-surface-raised: #FFFFFF;
  
  /* Borders */
  --border-default: var(--color-slate-200);
  --border-subtle: var(--color-slate-100);
  --border-strong: var(--color-slate-300);
  --border-focus: var(--color-primary-500);
  
  /* Text */
  --text-primary: var(--color-slate-900);
  --text-secondary: var(--color-slate-600);
  --text-muted: var(--color-slate-400);
  --text-disabled: var(--color-slate-300);
  --text-inverse: #FFFFFF;
  
  /* Overlays */
  --overlay-light: rgba(0, 0, 0, 0.05);
  --overlay-medium: rgba(0, 0, 0, 0.1);
  --overlay-dark: rgba(0, 0, 0, 0.5);
  --overlay-scrim: rgba(15, 23, 42, 0.6);
}
```

---

## 3. Typography Tokens

### 3.1 Font Family

```css
:root {
  /* Primary font - Inter for UI */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Monospace - For code, IDs, technical data */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
  
  /* Numeric font - Tabular figures for numbers */
  --font-numeric: 'Inter', var(--font-sans);
  font-variant-numeric: tabular-nums;
}
```

### 3.2 Font Size Scale

```css
:root {
  /* Based on 14px base, 1.25 ratio (Major Third) */
  --text-xs: 0.75rem;     /* 12px - Labels, captions */
  --text-sm: 0.875rem;    /* 14px - Body text */
  --text-base: 1rem;       /* 16px - Large body */
  --text-lg: 1.125rem;     /* 18px - Subheadings */
  --text-xl: 1.25rem;      /* 20px - Section titles */
  --text-2xl: 1.5rem;      /* 24px - Page titles */
  --text-3xl: 1.875rem;    /* 30px - Display */
  --text-4xl: 2.25rem;     /* 36px - Hero */
}
```

### 3.3 Font Weight Scale

```css
:root {
  --font-normal: 400;      /* Regular body text */
  --font-medium: 500;      /* Emphasized body, labels */
  --font-semibold: 600;    /* Headings, strong emphasis */
  --font-bold: 700;        /* Display text, buttons */
}
```

### 3.4 Line Height Scale

```css
:root {
  --leading-none: 1;        /* Tight headings */
  --leading-tight: 1.25;   /* Compact text */
  --leading-snug: 1.375;    /* Default for body */
  --leading-normal: 1.5;    /* Relaxed body */
  --leading-relaxed: 1.625; /* Long-form content */
  --leading-loose: 2;       /* Display with spacing */
}
```

### 3.5 Letter Spacing Scale

```css
:root {
  --tracking-tighter: -0.05em;  /* Large display text */
  --tracking-tight: -0.025em;   /* Small headings */
  --tracking-normal: 0em;       /* Default body */
  --tracking-wide: 0.025em;     /* Emphasis */
  --tracking-wider: 0.05em;      /* ALL CAPS labels */
  --tracking-widest: 0.1em;      /* Form labels */
}
```

### 3.6 Typography Usage

```css
:root {
  /* Display - Hero numbers, big metrics */
  --font-display-size: var(--text-4xl);
  --font-display-weight: var(--font-bold);
  --font-display-line-height: var(--leading-tight);
  --font-display-tracking: var(--tracking-tight);
  
  /* Page Title - Main page headers */
  --font-page-title-size: var(--text-2xl);
  --font-page-title-weight: var(--font-bold);
  --font-page-title-line-height: var(--leading-tight);
  
  /* Section Title - Card headers, section titles */
  --font-section-title-size: var(--text-lg);
  --font-section-title-weight: var(--font-semibold);
  --font-section-title-line-height: var(--leading-snug);
  
  /* Body - Main content */
  --font-body-size: var(--text-sm);
  --font-body-weight: var(--font-normal);
  --font-body-line-height: var(--leading-normal);
  
  /* Label - Form labels, table headers */
  --font-label-size: var(--text-xs);
  --font-label-weight: var(--font-medium);
  --font-label-tracking: var(--tracking-wider);
  --font-label-transform: uppercase;
  
  /* Caption - Helper text, timestamps */
  --font-caption-size: var(--text-xs);
  --font-caption-weight: var(--font-normal);
  --font-caption-color: var(--text-muted);
  
  /* Code - IDs, technical values */
  --font-code-size: var(--text-sm);
  --font-code-family: var(--font-mono);
}
```

---

## 4. Spacing Tokens

### 4.1 Base Spacing Unit

```css
:root {
  /* All spacing based on 4px unit */
  --space-unit: 0.25rem;  /* 4px */
}
```

### 4.2 Spacing Scale

```css
:root {
  --space-0: 0;              /* 0px */
  --space-1: 0.25rem;        /* 4px - Icon gaps */
  --space-2: 0.5rem;         /* 8px - Tight gaps */
  --space-3: 0.75rem;        /* 12px - Form gaps */
  --space-4: 1rem;           /* 16px - Standard padding */
  --space-5: 1.25rem;        /* 20px - Card padding */
  --space-6: 1.5rem;         /* 24px - Section gaps */
  --space-8: 2rem;            /* 32px - Large gaps */
  --space-10: 2.5rem;         /* 40px - Page sections */
  --space-12: 3rem;           /* 48px - Major sections */
  --space-16: 4rem;           /* 64px - Page dividers */
  --space-20: 5rem;           /* 80px - Hero spacing */
  --space-24: 6rem;           /* 96px - Large margins */
}
```

### 4.3 Semantic Spacing

```css
:root {
  /* Component Internal */
  --spacing-inset-xs: var(--space-1);    /* Icon padding */
  --spacing-inset-sm: var(--space-2);    /* Tight button padding */
  --spacing-inset-md: var(--space-3);    /* Standard button padding */
  --spacing-inset-lg: var(--space-4);    /* Input padding */
  --spacing-inset-xl: var(--space-6);    /* Card padding */
  
  /* Between Components */
  --spacing-stack-xs: var(--space-1);    /* Icon gap in button */
  --spacing-stack-sm: var(--space-2);    /* Label to input */
  --spacing-stack-md: var(--space-4);    /* Form fields */
  --spacing-stack-lg: var(--space-6);    /* Sections */
  --spacing-stack-xl: var(--space-8);    /* Major sections */
  
  /* Inline Gaps */
  --spacing-inline-xs: var(--space-1);   /* Icon to text */
  --spacing-inline-sm: var(--space-2);   /* Tight inline */
  --spacing-inline-md: var(--space-3);   /* Standard inline */
  --spacing-inline-lg: var(--space-4);   /* Large inline */
}
```

---

## 5. Border Radius Tokens

### 5.1 Radius Scale

```css
:root {
  /* No radius */
  --radius-none: 0;
  
  /* Small - Chips, small buttons */
  --radius-sm: 0.25rem;      /* 4px */
  
  /* Medium - Buttons, inputs, badges */
  --radius-md: 0.375rem;      /* 6px */
  
  /* Large - Cards, modals */
  --radius-lg: 0.5rem;       /* 8px */
  
  /* Extra Large - Large cards, panels */
  --radius-xl: 0.75rem;      /* 12px */
  
  /* 2X Large - Page containers */
  --radius-2xl: 1rem;        /* 16px */
  
  /* Full - Avatars, pills */
  --radius-full: 9999px;
}
```

### 5.2 Semantic Radius

```css
:root {
  /* Interactive Elements */
  --radius-button: var(--radius-md);
  --radius-input: var(--radius-md);
  --radius-checkbox: var(--radius-sm);
  --radius-switch: var(--radius-full);
  
  /* Containers */
  --radius-card: var(--radius-lg);
  --radius-modal: var(--radius-xl);
  --radius-dropdown: var(--radius-lg);
  --radius-tooltip: var(--radius-md);
  
  /* Data Display */
  --radius-badge: var(--radius-sm);
  --radius-avatar: var(--radius-full);
  --radius-table: var(--radius-lg);
  
  /* Status Indicators */
  --radius-status-dot: var(--radius-full);
  --radius-progress: var(--radius-full);
}
```

---

## 6. Shadow Tokens

### 6.1 Elevation Scale

```css
:root {
  /* Level 0 - Flat (default) */
  --shadow-none: none;
  
  /* Level 1 - Cards at rest */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  /* Level 2 - Hovered cards, dropdowns */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  
  /* Level 3 - Popovers, small modals */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  /* Level 4 - Modals */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Level 5 - Drawers, large overlays */
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Level 6 - Command palette */
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### 6.2 Semantic Shadows

```css
:root {
  /* Interactive States */
  --shadow-hover: var(--shadow-md);
  --shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.3);  /* Focus ring */
  --shadow-pressed: var(--shadow-sm);
  
  /* Cards */
  --shadow-card: var(--shadow-sm);
  --shadow-card-hover: var(--shadow-md);
  
  /* Modals & Overlays */
  --shadow-modal: var(--shadow-lg);
  --shadow-dropdown: var(--shadow-md);
  --shadow-tooltip: var(--shadow-sm);
  
  /* Navigation */
  --shadow-sidebar: var(--shadow-xl);
  --shadow-drawer: var(--shadow-xl);
}
```

---

## 7. Border Tokens

### 7.1 Border Width

```css
:root {
  --border-width-none: 0;
  --border-width-sm: 1px;
  --border-width-md: 1px;    /* Default */
  --border-width-lg: 2px;
  --border-width-xl: 3px;
}
```

### 7.2 Border Colors

```css
:root {
  /* Following border-width tokens */
  --border-default: var(--color-slate-200);
  --border-subtle: var(--color-slate-100);
  --border-strong: var(--color-slate-300);
  --border-focus: var(--color-primary-500);
  --border-error: var(--color-danger-500);
  --border-success: var(--color-success-500);
}
```

---

## 8. Transition Tokens

### 8.1 Duration Scale

```css
:root {
  /* Instant - Immediate feedback */
  --duration-instant: 0ms;
  
  /* Fast - Micro interactions (hover) */
  --duration-fast: 100ms;
  
  /* Normal - Standard interactions */
  --duration-normal: 150ms;
  
  /* Slow - Modals, drawers */
  --duration-slow: 200ms;
  
  /* Slower - Page transitions */
  --duration-slower: 300ms;
}
```

### 8.2 Easing Functions

```css
:root {
  /* Standard ease */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Enter animations */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  
  /* Exit animations */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  
  /* Bounce effect */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 8.3 Semantic Transitions

```css
:root {
  /* Button/Link hover */
  --transition-colors: color var(--duration-fast) var(--ease-default),
                        background-color var(--duration-fast) var(--ease-default),
                        border-color var(--duration-fast) var(--ease-default);
  
  /* Transform (hover, focus) */
  --transition-transform: transform var(--duration-fast) var(--ease-default);
  
  /* Shadow transitions */
  --transition-shadow: box-shadow var(--duration-normal) var(--ease-default);
  
  /* Layout changes (modals, drawers) */
  --transition-layout: all var(--duration-slow) var(--ease-out);
  
  /* Opacity (fade) */
  --transition-opacity: opacity var(--duration-normal) var(--ease-default);
}
```

### 8.4 Animation Keyframes

```css
:root {
  /* Fade In */
  --animate-fade-in: fadeIn var(--duration-normal) var(--ease-out);
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* Fade Out */
  --animate-fade-out: fadeOut var(--duration-fast) var(--ease-in);
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  /* Scale In (modals, dropdowns) */
  --animate-scale-in: scaleIn var(--duration-normal) var(--ease-out);
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  /* Slide In Up (toasts) */
  --animate-slide-up: slideUp var(--duration-normal) var(--ease-out);
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Slide In Right (drawers) */
  --animate-slide-right: slideRight var(--duration-slow) var(--ease-out);
  @keyframes slideRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  /* Spin (loading) */
  --animate-spin: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Pulse (loading skeleton) */
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
}
```

---

## 9. Icon Tokens

### 9.1 Icon Sizes

```css
:root {
  --icon-xs: 0.75rem;   /* 12px - Inline with text */
  --icon-sm: 1rem;      /* 16px - Standard */
  --icon-md: 1.25rem;   /* 20px - Button icons */
  --icon-lg: 1.5rem;    /* 24px - Section icons */
  --icon-xl: 1.75rem;   /* 28px - Header icons */
  --icon-2xl: 2rem;     /* 32px - Empty state icons */
  --icon-3xl: 2.5rem;   /* 40px - Large icons */
}
```

### 9.2 Icon Usage

```css
:root {
  /* Inline with text - Match text height */
  --icon-inline-size: var(--icon-sm);
  
  /* Button icon - Left of text */
  --icon-button-size: var(--icon-md);
  
  /* Toolbar icons */
  --icon-toolbar-size: var(--icon-md);
  
  /* Table action icons */
  --icon-table-size: var(--icon-sm);
  
  /* Status indicator dots */
  --icon-status-size: var(--icon-xs);
  
  /* Empty state icons */
  --icon-empty-size: var(--icon-2xl);
}
```

---

## 10. Component Size Tokens

### 10.1 Button Sizes

```css
:root {
  /* Small Button */
  --button-sm-height: 2rem;       /* 32px */
  --button-sm-padding-x: 0.75rem; /* 12px */
  --button-sm-font-size: var(--text-xs);
  --button-sm-icon-gap: 0.5rem;
  
  /* Medium Button (Default) */
  --button-md-height: 2.5rem;      /* 40px */
  --button-md-padding-x: 1rem;     /* 16px */
  --button-md-font-size: var(--text-sm);
  --button-md-icon-gap: 0.5rem;
  
  /* Large Button */
  --button-lg-height: 3rem;        /* 48px */
  --button-lg-padding-x: 1.5rem;   /* 24px */
  --button-lg-font-size: var(--text-base);
  --button-lg-icon-gap: 0.75rem;
}
```

### 10.2 Input Sizes

```css
:root {
  /* Small Input */
  --input-sm-height: 2rem;         /* 32px */
  --input-sm-padding-x: 0.75rem;  /* 12px */
  --input-sm-font-size: var(--text-xs);
  
  /* Medium Input (Default) */
  --input-md-height: 2.5rem;       /* 40px */
  --input-md-padding-x: 0.875rem; /* 14px */
  --input-md-font-size: var(--text-sm);
  
  /* Large Input */
  --input-lg-height: 3rem;          /* 48px */
  --input-lg-padding-x: 1rem;      /* 16px */
  --input-lg-font-size: var(--text-base);
}
```

### 10.3 Table Sizes

```css
:root {
  /* Compact Table */
  --table-row-height-compact: 2.5rem;    /* 40px */
  --table-cell-padding-compact: 0.75rem;  /* 12px */
  
  /* Default Table */
  --table-row-height-default: 3rem;       /* 48px */
  --table-cell-padding-default: 1rem;    /* 16px */
  
  /* Comfortable Table */
  --table-row-height-comfortable: 3.5rem; /* 56px */
  --table-cell-padding-comfortable: 1rem; /* 16px */
}
```

### 10.4 Card Sizes

```css
:root {
  /* Compact Card */
  --card-compact-padding: var(--space-3);     /* 12px */
  
  /* Default Card */
  --card-default-padding: var(--space-4);    /* 16px */
  
  /* Large Card */
  --card-large-padding: var(--space-6);       /* 24px */
  
  /* Section Card */
  --card-section-padding: var(--space-5);    /* 20px */
}
```

---

## 11. Layout Tokens

### 11.1 Container Widths

```css
:root {
  --container-xs: 20rem;     /* 320px - Narrow sidebar */
  --container-sm: 24rem;     /* 384px - Mobile */
  --container-md: 28rem;     /* 448px - Small tablet */
  --container-lg: 32rem;     /* 512px - Tablet */
  --container-xl: 36rem;     /* 576px - Small desktop */
  --container-2xl: 42rem;    /* 672px - Standard */
  --container-3xl: 48rem;    /* 768px - Large */
  --container-4xl: 56rem;    /* 896px - Extra large */
  --container-content: 65ch; /* Optimal line length */
}
```

### 11.2 Layout Gaps

```css
:root {
  /* Stack gaps */
  --gap-section: var(--space-8);      /* 32px - Between page sections */
  --gap-card-row: var(--space-6);     /* 24px - Between card rows */
  --gap-card-col: var(--space-4);     /* 16px - Between cards */
  --gap-form-row: var(--space-4);     /* 16px - Form field rows */
  
  /* Grid gaps */
  --gap-grid-compact: var(--space-3); /* 12px */
  --gap-grid-normal: var(--space-4);  /* 16px */
  --gap-grid-relaxed: var(--space-6); /* 24px */
}
```

### 11.3 Sidebar Widths

```css
:root {
  --sidebar-width-collapsed: 4rem;    /* 64px - Icons only */
  --sidebar-width-standard: 16rem;    /* 256px - Standard */
  --sidebar-width-expanded: 20rem;    /* 320px - Expanded */
  --sidebar-width-wide: 24rem;        /* 384px - Wide variant */
}
```

---

## 12. Responsive Breakpoints

### 12.1 Breakpoint Tokens

```css
:root {
  /* Mobile First - Min-width */
  --breakpoint-sm: 640px;   /* Large phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large desktops */
  --breakpoint-3xl: 1920px; /* Ultra-wide */
}
```

### 12.2 Breakpoint Usage

```css
/* Mobile (< 640px) */
@container mobile (max-width: 639px) {
  /* Single column layout */
  /* Stacked navigation */
  /* Simplified tables (card view) */
}

/* Tablet (640px - 1023px) */
@container tablet (min-width: 640px) and (max-width: 1023px) {
  /* 2-column layout */
  /* Collapsible sidebar */
  /* Horizontal scrolling tables */
}

/* Desktop (1024px+) */
@container desktop (min-width: 1024px) {
  /* Full layout */
  /* Fixed sidebar */
  /* Full table views */
}
```

---

## 13. Z-Index Scale

```css
:root {
  --z-base: 0;           /* Default stacking */
  --z-dropdown: 100;     /* Dropdowns */
  --z-sticky: 200;       /* Sticky headers */
  --z-fixed: 300;       /* Fixed navigation */
  --z-modal-backdrop: 400;  /* Modal overlay */
  --z-modal: 500;       /* Modal content */
  --z-popover: 600;     /* Popovers, tooltips */
  --z-tooltip: 700;      /* Tooltips */
  --z-toast: 800;       /* Toast notifications */
  --z-max: 9999;       /* Maximum */
}
```

---

## 14. Dark Mode Tokens

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Surface colors invert */
    --bg-app: var(--color-slate-900);
    --bg-surface: var(--color-slate-800);
    --bg-surface-hover: var(--color-slate-700);
    
    /* Text colors adjust */
    --text-primary: var(--color-slate-100);
    --text-secondary: var(--color-slate-400);
    --text-muted: var(--color-slate-500);
    
    /* Borders lighten */
    --border-default: var(--color-slate-700);
    --border-subtle: var(--color-slate-800);
    
    /* Shadows adjust for dark mode */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  }
}
```

---

## 15. Implementation Notes

### 15.1 CSS Custom Properties

All tokens should be implemented as CSS custom properties in `:root` to enable:
- Runtime theming
- Dark mode support
- Easy override
- Tooling integration

### 15.2 Tailwind Integration

Tokens should map to Tailwind configuration:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          // ... etc
        }
      },
      spacing: {
        '1': 'var(--space-1)',
        // ... etc
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        // ... etc
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        // ... etc
      }
    }
  }
}
```

### 15.3 TypeScript Types

Tokens should have TypeScript type definitions:
```ts
// tokens/colors.ts
export const colors = {
  primary: { /* ... */ },
  semantic: { /* ... */ }
} as const;

export type ColorToken = keyof typeof colors;
```

---

**End of Design Tokens Document**
