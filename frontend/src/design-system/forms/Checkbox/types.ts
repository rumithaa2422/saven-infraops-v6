/**
 * Checkbox Component Types
 * Enterprise Design System V2
 */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

export interface CheckboxGroupProps {
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default CheckboxProps;
