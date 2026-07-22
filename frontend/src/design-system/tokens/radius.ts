/**
 * Design Token: Border Radius
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px - Subtle rounding
  md: '0.375rem',  // 6px - Default small
  lg: '0.5rem',    // 8px - Default medium
  xl: '0.75rem',   // 12px - Cards, modals
  '2xl': '1rem',   // 16px - Large containers
  full: '9999px',  // Pill shapes
} as const;

// Radius usage contexts
export const radiusContext = {
  // Buttons
  button: radius.md,
  buttonSm: radius.sm,

  // Inputs
  input: radius.md,
  inputSm: radius.sm,

  // Cards
  card: radius.lg,
  cardSm: radius.md,

  // Badges
  badge: radius.sm,
  badgePill: radius.full,

  // Dialogs
  dialog: radius.xl,

  // Avatar
  avatar: radius.full,

  // Checkbox
  checkbox: radius.sm,

  // Dropdown
  dropdown: radius.lg,

  // Tooltip
  tooltip: radius.md,
} as const;

export type RadiusToken = keyof typeof radius;
