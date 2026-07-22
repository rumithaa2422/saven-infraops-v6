/**
 * Button Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';
import React from 'react';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconPosition = 'left' | 'right';

// Base props
export interface ButtonBaseProps {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button label */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Icon component to display */
  icon?: LucideIcon;
  /** Icon position */
  iconPosition?: ButtonIconPosition;
  /** Full width button */
  fullWidth?: boolean;
}

// HTML button props
export interface ButtonHTMLProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonBaseProps {}

// Link button props
export interface ButtonLinkProps extends ButtonBaseProps {
  /** Link href - renders as anchor tag */
  href?: string;
  /** Open link in new tab */
  target?: string;
  /** Link rel attribute */
  rel?: string;
}

// Union type for button variants
export type ButtonProps = ButtonHTMLProps;

export default ButtonProps;
