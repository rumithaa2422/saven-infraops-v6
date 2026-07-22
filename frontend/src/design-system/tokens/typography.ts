/**
 * Design Token: Typography
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace",
} as const;

export const fontSize = {
  xs: '0.75rem',    // 12px - Labels, captions
  sm: '0.875rem',   // 14px - Body text
  base: '1rem',     // 16px - Large body
  lg: '1.125rem',   // 18px - Subheadings
  xl: '1.25rem',    // 20px - Section titles
  '2xl': '1.5rem',  // 24px - Page titles
  '3xl': '1.875rem', // 30px - Display
  '4xl': '2.25rem', // 36px - Hero
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  tight: '-0.01em',
  normal: '0',
  wide: '0.05em',
} as const;

// Typography scale for specific use cases
export const typographyScale = {
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: 1.4,
    letterSpacing: letterSpacing.normal,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 1.4,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  tableHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.4,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    letterSpacing: letterSpacing.normal,
  },
  buttonSm: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
