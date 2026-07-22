/**
 * Design Token: Spacing
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// Common spacing contexts
export const spacingContext = {
  // Section spacing
  sectionGap: '24px',
  sectionGapLarge: '32px',

  // Card spacing
  cardPadding: '20px',
  cardGap: '16px',

  // Component spacing
  componentGap: '16px',
  formFieldGap: '16px',

  // Toolbar spacing
  toolbarGap: '12px',

  // Content density
  tableRowHeight: '48px',
  tableCellPadding: '16px',
  buttonHeight: '40px',
  buttonHeightSm: '32px',
  inputHeight: '40px',
} as const;

// Page padding responsive
export const pagePadding = {
  mobile: '16px',
  tablet: '24px',
  desktop: '32px',
} as const;

export type SpacingToken = keyof typeof spacing;
