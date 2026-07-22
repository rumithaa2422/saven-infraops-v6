/**
 * Design Tokens CSS Variables
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

import { colors, statusColors, priorityColors, semanticColors } from '../tokens/colors';
import { spacing, spacingContext, pagePadding } from '../tokens/spacing';
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from '../tokens/typography';
import { radius, radiusContext } from '../tokens/radius';
import { shadows, shadowsContext, zIndex } from '../tokens/shadows';
import { breakpoints, breakpointUsage, gridSystem, containerWidths, sidebarWidths, touchTargets } from '../tokens/breakpoints';
import { duration, easing, keyframes, iconSizes } from '../tokens/motion';

export const designTokensCSS = `
:root {
  /* ============================================
   * COLORS
   * ============================================ */
  
  /* Primary Colors */
  --color-primary-50: ${colors.primary[50]};
  --color-primary-100: ${colors.primary[100]};
  --color-primary-200: ${colors.primary[200]};
  --color-primary-300: ${colors.primary[300]};
  --color-primary-400: ${colors.primary[400]};
  --color-primary-500: ${colors.primary[500]};
  --color-primary-600: ${colors.primary[600]};
  --color-primary-700: ${colors.primary[700]};
  --color-primary-800: ${colors.primary[800]};
  --color-primary-900: ${colors.primary[900]};
  
  /* Success Colors */
  --color-success-50: ${colors.success[50]};
  --color-success-100: ${colors.success[100]};
  --color-success-200: ${colors.success[200]};
  --color-success-300: ${colors.success[300]};
  --color-success-400: ${colors.success[400]};
  --color-success-500: ${colors.success[500]};
  --color-success-600: ${colors.success[600]};
  --color-success-700: ${colors.success[700]};
  --color-success-800: ${colors.success[800]};
  --color-success-900: ${colors.success[900]};
  
  /* Warning Colors */
  --color-warning-50: ${colors.warning[50]};
  --color-warning-100: ${colors.warning[100]};
  --color-warning-200: ${colors.warning[200]};
  --color-warning-300: ${colors.warning[300]};
  --color-warning-400: ${colors.warning[400]};
  --color-warning-500: ${colors.warning[500]};
  --color-warning-600: ${colors.warning[600]};
  --color-warning-700: ${colors.warning[700]};
  --color-warning-800: ${colors.warning[800]};
  --color-warning-900: ${colors.warning[900]};
  
  /* Danger Colors */
  --color-danger-50: ${colors.danger[50]};
  --color-danger-100: ${colors.danger[100]};
  --color-danger-200: ${colors.danger[200]};
  --color-danger-300: ${colors.danger[300]};
  --color-danger-400: ${colors.danger[400]};
  --color-danger-500: ${colors.danger[500]};
  --color-danger-600: ${colors.danger[600]};
  --color-danger-700: ${colors.danger[700]};
  --color-danger-800: ${colors.danger[800]};
  --color-danger-900: ${colors.danger[900]};
  
  /* Info Colors */
  --color-info-50: ${colors.info[50]};
  --color-info-100: ${colors.info[100]};
  --color-info-200: ${colors.info[200]};
  --color-info-300: ${colors.info[300]};
  --color-info-400: ${colors.info[400]};
  --color-info-500: ${colors.info[500]};
  --color-info-600: ${colors.info[600]};
  --color-info-700: ${colors.info[700]};
  --color-info-800: ${colors.info[800]};
  --color-info-900: ${colors.info[900]};
  
  /* Slate Colors */
  --color-slate-50: ${colors.slate[50]};
  --color-slate-100: ${colors.slate[100]};
  --color-slate-200: ${colors.slate[200]};
  --color-slate-300: ${colors.slate[300]};
  --color-slate-400: ${colors.slate[400]};
  --color-slate-500: ${colors.slate[500]};
  --color-slate-600: ${colors.slate[600]};
  --color-slate-700: ${colors.slate[700]};
  --color-slate-800: ${colors.slate[800]};
  --color-slate-900: ${colors.slate[900]};
  --color-slate-950: ${colors.slate[950]};
  
  /* Status Colors */
  --status-new-bg: ${statusColors.new.bg};
  --status-new-text: ${statusColors.new.text};
  --status-new-border: ${statusColors.new.border};
  --status-new-dot: ${statusColors.new.dot};
  --status-assigned-bg: ${statusColors.assigned.bg};
  --status-assigned-text: ${statusColors.assigned.text};
  --status-assigned-border: ${statusColors.assigned.border};
  --status-assigned-dot: ${statusColors.assigned.dot};
  --status-progress-bg: ${statusColors.inProgress.bg};
  --status-progress-text: ${statusColors.inProgress.text};
  --status-progress-border: ${statusColors.inProgress.border};
  --status-progress-dot: ${statusColors.inProgress.dot};
  --status-waiting-bg: ${statusColors.waiting.bg};
  --status-waiting-text: ${statusColors.waiting.text};
  --status-waiting-border: ${statusColors.waiting.border};
  --status-waiting-dot: ${statusColors.waiting.dot};
  --status-resolved-bg: ${statusColors.resolved.bg};
  --status-resolved-text: ${statusColors.resolved.text};
  --status-resolved-border: ${statusColors.resolved.border};
  --status-resolved-dot: ${statusColors.resolved.dot};
  --status-closed-bg: ${statusColors.closed.bg};
  --status-closed-text: ${statusColors.closed.text};
  --status-closed-border: ${statusColors.closed.border};
  --status-closed-dot: ${statusColors.closed.dot};
  --status-blocked-bg: ${statusColors.blocked.bg};
  --status-blocked-text: ${statusColors.blocked.text};
  --status-blocked-border: ${statusColors.blocked.border};
  --status-blocked-dot: ${statusColors.blocked.dot};
  
  /* Priority Colors */
  --priority-critical-bg: ${priorityColors.critical.bg};
  --priority-critical-text: ${priorityColors.critical.text};
  --priority-critical-border: ${priorityColors.critical.border};
  --priority-high-bg: ${priorityColors.high.bg};
  --priority-high-text: ${priorityColors.high.text};
  --priority-high-border: ${priorityColors.high.border};
  --priority-medium-bg: ${priorityColors.medium.bg};
  --priority-medium-text: ${priorityColors.medium.text};
  --priority-medium-border: ${priorityColors.medium.border};
  --priority-low-bg: ${priorityColors.low.bg};
  --priority-low-text: ${priorityColors.low.text};
  --priority-low-border: ${priorityColors.low.border};
  
  /* Semantic Colors */
  --bg-app: ${semanticColors.bg.app};
  --bg-surface: ${semanticColors.bg.surface};
  --bg-surface-hover: ${semanticColors.bg.surfaceHover};
  --bg-surface-active: ${semanticColors.bg.surfaceActive};
  --bg-surface-raised: ${semanticColors.bg.surfaceRaised};
  --border-default: ${semanticColors.border.default};
  --border-subtle: ${semanticColors.border.subtle};
  --border-strong: ${semanticColors.border.strong};
  --border-focus: ${semanticColors.border.focus};
  --text-primary: ${semanticColors.text.primary};
  --text-secondary: ${semanticColors.text.secondary};
  --text-muted: ${semanticColors.text.muted};
  --text-disabled: ${semanticColors.text.disabled};
  --text-inverse: ${semanticColors.text.inverse};
  --overlay-light: ${semanticColors.overlay.light};
  --overlay-medium: ${semanticColors.overlay.medium};
  --overlay-dark: ${semanticColors.overlay.dark};
  --overlay-scrim: ${semanticColors.overlay.scrim};

  /* ============================================
   * SPACING
   * ============================================ */
  --space-0: ${spacing[0]};
  --space-1: ${spacing[1]};
  --space-2: ${spacing[2]};
  --space-3: ${spacing[3]};
  --space-4: ${spacing[4]};
  --space-5: ${spacing[5]};
  --space-6: ${spacing[6]};
  --space-8: ${spacing[8]};
  --space-10: ${spacing[10]};
  --space-12: ${spacing[12]};
  --space-16: ${spacing[16]};
  --space-20: ${spacing[20]};
  --space-24: ${spacing[24]};
  
  /* ============================================
   * TYPOGRAPHY
   * ============================================ */
  --font-sans: ${fontFamily.sans};
  --font-mono: ${fontFamily.mono};
  --text-xs: ${fontSize.xs};
  --text-sm: ${fontSize.sm};
  --text-base: ${fontSize.base};
  --text-lg: ${fontSize.lg};
  --text-xl: ${fontSize.xl};
  --text-2xl: ${fontSize['2xl']};
  --text-3xl: ${fontSize['3xl']};
  --text-4xl: ${fontSize['4xl']};
  --font-normal: ${fontWeight.normal};
  --font-medium: ${fontWeight.medium};
  --font-semibold: ${fontWeight.semibold};
  --font-bold: ${fontWeight.bold};

  /* ============================================
   * BORDER RADIUS
   * ============================================ */
  --radius-none: ${radius.none};
  --radius-sm: ${radius.sm};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --radius-xl: ${radius.xl};
  --radius-2xl: ${radius['2xl']};
  --radius-full: ${radius.full};

  /* ============================================
   * SHADOWS
   * ============================================ */
  --shadow-none: ${shadows.none};
  --shadow-xs: ${shadows.xs};
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
  --shadow-2xl: ${shadows['2xl']};
  --shadow-inner: ${shadows.inner};

  /* ============================================
   * Z-INDEX
   * ============================================ */
  --z-base: ${zIndex.base};
  --z-dropdown: ${zIndex.dropdown};
  --z-sticky: ${zIndex.sticky};
  --z-fixed: ${zIndex.fixed};
  --z-modal-backdrop: ${zIndex.modalBackdrop};
  --z-modal: ${zIndex.modal};
  --z-popover: ${zIndex.popover};
  --z-tooltip: ${zIndex.tooltip};
  --z-toast: ${zIndex.toast};

  /* ============================================
   * BREAKPOINTS
   * ============================================ */
  --breakpoint-xs: ${breakpoints.xs};
  --breakpoint-sm: ${breakpoints.sm};
  --breakpoint-md: ${breakpoints.md};
  --breakpoint-lg: ${breakpoints.lg};
  --breakpoint-xl: ${breakpoints.xl};
  --breakpoint-2xl: ${breakpoints['2xl']};

  /* ============================================
   * LAYOUT
   * ============================================ */
  --container-max: ${containerWidths.max};
  --sidebar-width-collapsed: ${sidebarWidths.collapsed};
  --sidebar-width-standard: ${sidebarWidths.standard};
  --sidebar-width-expanded: ${sidebarWidths.expanded};

  /* ============================================
   * COMPONENT SIZES
   * ============================================ */
  --button-height: ${spacingContext.buttonHeight};
  --button-height-sm: ${spacingContext.buttonHeightSm};
  --input-height: ${spacingContext.inputHeight};
  --table-row-height: ${spacingContext.tableRowHeight};
  --touch-target: ${touchTargets.minimum};
  
  /* ============================================
   * MOTION
   * ============================================ */
  --duration-fast: ${duration.fast};
  --duration-normal: ${duration.normal};
  --duration-slow: ${duration.slow};
  --ease-out: ${easing.easeOut};
  --ease-in-out: ${easing.easeInOut};
  --ease-linear: ${easing.linear};
  
  /* ============================================
   * ICON SIZES
   * ============================================ */
  --icon-xs: ${iconSizes.xs};
  --icon-sm: ${iconSizes.sm};
  --icon-md: ${iconSizes.md};
  --icon-lg: ${iconSizes.lg};
  --icon-xl: ${iconSizes.xl};
  --icon-2xl: ${iconSizes['2xl']};
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
  
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

/**
 * Design Tokens Object
 * Exported as a structured object for programmatic access
 */
export const designTokens = {
  colors,
  statusColors,
  priorityColors,
  semanticColors,
  spacing,
  spacingContext,
  pagePadding,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  radius,
  radiusContext,
  shadows,
  shadowsContext,
  zIndex,
  breakpoints,
  breakpointUsage,
  gridSystem,
  containerWidths,
  sidebarWidths,
  touchTargets,
  duration,
  easing,
  keyframes,
  iconSizes,
  iconUsage: {
    inline: iconSizes.sm,
    button: iconSizes.md,
    toolbar: iconSizes.md,
    table: iconSizes.sm,
    status: iconSizes.xs,
    empty: iconSizes['2xl'],
  },
};

export type DesignTokens = typeof designTokens;
