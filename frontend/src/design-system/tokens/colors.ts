/**
 * Design Token: Colors
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const colors = {
  // Primary - Blue
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Success - Green
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning - Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger - Red
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Info - Indigo
  info: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Neutral - Slate
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

// Status colors
export const statusColors = {
  new: {
    bg: colors.primary[50],
    text: colors.primary[700],
    border: colors.primary[200],
    dot: colors.primary[500],
  },
  assigned: {
    bg: '#F5F3FF',
    text: '#7C3AED',
    border: '#DDD6FE',
    dot: '#8B5CF6',
  },
  inProgress: {
    bg: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[200],
    dot: colors.warning[500],
  },
  waiting: {
    bg: '#FFF7ED',
    text: '#C2410C',
    border: '#FED7AA',
    dot: '#F97316',
  },
  resolved: {
    bg: colors.success[50],
    text: colors.success[700],
    border: colors.success[200],
    dot: colors.success[500],
  },
  closed: {
    bg: colors.slate[100],
    text: colors.slate[600],
    border: colors.slate[200],
    dot: colors.slate[400],
  },
  blocked: {
    bg: colors.danger[50],
    text: colors.danger[700],
    border: colors.danger[200],
    dot: colors.danger[500],
  },
} as const;

// Priority colors
export const priorityColors = {
  critical: {
    bg: colors.danger[50],
    text: colors.danger[700],
    border: colors.danger[200],
  },
  high: {
    bg: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[200],
  },
  medium: {
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  low: {
    bg: colors.slate[100],
    text: colors.slate[600],
    border: colors.slate[200],
  },
} as const;

// Semantic surface colors
export const semanticColors = {
  bg: {
    app: colors.slate[50],
    surface: '#FFFFFF',
    surfaceHover: colors.slate[50],
    surfaceActive: colors.slate[100],
    surfaceRaised: '#FFFFFF',
  },
  border: {
    default: colors.slate[200],
    subtle: colors.slate[100],
    strong: colors.slate[300],
    focus: colors.primary[500],
  },
  text: {
    primary: colors.slate[900],
    secondary: colors.slate[600],
    muted: colors.slate[400],
    disabled: colors.slate[300],
    inverse: '#FFFFFF',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(15, 23, 42, 0.6)',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type StatusColorKey = keyof typeof statusColors;
export type PriorityColorKey = keyof typeof priorityColors;
