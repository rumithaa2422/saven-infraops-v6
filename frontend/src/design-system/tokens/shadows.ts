/**
 * Design Token: Shadows
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Shadow usage contexts
export const shadowsContext = {
  // Card shadows
  card: shadows.sm,
  cardHover: shadows.md,
  cardRaised: shadows.md,

  // Dropdown shadows
  dropdown: shadows.lg,

  // Modal shadows
  modal: shadows.xl,

  // Tooltip shadows
  tooltip: shadows.md,

  // Focus ring
  focus: `0 0 0 2px var(--color-primary-200)`,

  // Focus within (for focus traps)
  focusWithin: `0 0 0 2px var(--color-primary-200)`,
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

export type ShadowToken = keyof typeof shadows;
export type ZIndexToken = keyof typeof zIndex;
