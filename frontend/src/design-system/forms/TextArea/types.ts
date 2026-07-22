/**
 * TextArea Component Types
 * Enterprise Design System V2
 */

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  rows?: number;
  showCount?: boolean;
  maxLength?: number;
  fullWidth?: boolean;
}

export default TextAreaProps;
