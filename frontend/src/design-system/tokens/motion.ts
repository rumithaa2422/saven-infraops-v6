/**
 * Design Token: Motion
 * Enterprise Design System V2
 * Based on UI_STYLE_GUIDE.md specifications
 */

export const duration = {
  instant: '50ms',
  fast: '100ms',
  normal: '150ms',
  slow: '200ms',
  slower: '300ms',
  slowest: '500ms',
} as const;

export const easing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

// Animation durations by type
export const motionDuration = {
  micro: duration.fast,        // 100ms - Hover, focus
  standard: duration.normal,  // 150ms - Modals, dropdowns
  complex: duration.slow,     // 200ms - Page transitions
} as const;

// Common animation keyframes
export const keyframes = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  slideInFromRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideInFromLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideInFromTop: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInFromBottom: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
} as const;

// Icon sizes
export const iconSizes = {
  xs: '0.75rem',   // 12px - Inline with text
  sm: '1rem',      // 16px - Standard
  md: '1.25rem',   // 20px - Button icons
  lg: '1.5rem',    // 24px - Section icons
  xl: '1.75rem',   // 28px - Header icons
  '2xl': '2rem',   // 32px - Empty state icons
  '3xl': '2.5rem', // 40px - Large icons
} as const;

// Icon usage contexts
export const iconUsage = {
  inline: iconSizes.sm,
  button: iconSizes.md,
  toolbar: iconSizes.md,
  table: iconSizes.sm,
  status: iconSizes.xs,
  empty: iconSizes['2xl'],
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
