/**
 * Input Component Types
 * Enterprise Design System V2
 */

import { LucideIcon } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export interface InputWrapperProps {
  children: React.ReactNode;
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default InputProps;
