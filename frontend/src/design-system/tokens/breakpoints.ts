/**
 * Design Token: Breakpoints
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// Breakpoint usage
export const breakpointUsage = {
  // Mobile first breakpoints
  mobile: breakpoints.sm,       // 640px and below
  tablet: breakpoints.md,       // 768px - 1023px
  desktop: breakpoints.lg,      // 1024px+
  wide: breakpoints.xl,        // 1280px+
  ultraWide: breakpoints['2xl'], // 1536px+
} as const;

// Grid system
export const gridSystem = {
  xs: { columns: 4, gutter: '16px', container: '100%' },
  sm: { columns: 4, gutter: '16px', container: '100%' },
  md: { columns: 8, gutter: '20px', container: '100%' },
  lg: { columns: 12, gutter: '24px', container: '1280px' },
  xl: { columns: 12, gutter: '24px', container: '1400px' },
} as const;

// Container widths
export const containerWidths = {
  xs: '20rem',     // 320px - Narrow sidebar
  sm: '24rem',     // 384px - Mobile
  md: '28rem',     // 448px - Small tablet
  lg: '32rem',     // 512px - Tablet
  xl: '36rem',     // 576px - Small desktop
  '2xl': '42rem',  // 672px - Standard
  '3xl': '48rem',  // 768px - Large
  '4xl': '56rem',  // 896px - Extra large
  content: '65ch', // Optimal line length
  max: '90rem',   // 1440px - Max page width
} as const;

// Sidebar widths
export const sidebarWidths = {
  collapsed: '4rem',    // 64px - Icons only
  standard: '16rem',    // 256px - Standard
  expanded: '20rem',   // 320px - Expanded
  wide: '24rem',       // 384px - Wide variant
} as const;

// Touch targets
export const touchTargets = {
  minimum: '44px',
  comfortable: '48px',
} as const;

export type BreakpointToken = keyof typeof breakpoints;
