/**
 * Validation Utilities
 * Enterprise Design System V2
 */

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate required field
 */
export function required(message = 'This field is required'): ValidationRule {
  return {
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    message,
  };
}

/**
 * Validate minimum length
 */
export function minLength(min: number, message?: string): ValidationRule<string> {
  return {
    validate: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  };
}

/**
 * Validate maximum length
 */
export function maxLength(max: number, message?: string): ValidationRule<string> {
  return {
    validate: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  };
}

/**
 * Validate email format
 */
export function email(message = 'Please enter a valid email'): ValidationRule<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    validate: (value) => !value || emailRegex.test(value),
    message,
  };
}

/**
 * Validate URL format
 */
export function url(message = 'Please enter a valid URL'): ValidationRule<string> {
  const urlRegex = /^https?:\/\/.+/;
  return {
    validate: (value) => !value || urlRegex.test(value),
    message,
  };
}

/**
 * Validate minimum value
 */
export function min(minValue: number, message?: string): ValidationRule<number> {
  return {
    validate: (value) => value === undefined || value === null || value >= minValue,
    message: message || `Must be at least ${minValue}`,
  };
}

/**
 * Validate maximum value
 */
export function max(maxValue: number, message?: string): ValidationRule<number> {
  return {
    validate: (value) => value === undefined || value === null || value <= maxValue,
    message: message || `Must be no more than ${maxValue}`,
  };
}

/**
 * Validate pattern
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidationRule<string> {
  return {
    validate: (value) => !value || regex.test(value),
    message,
  };
}

/**
 * Validate with custom function
 */
export function custom<T>(
  fn: (value: T) => boolean,
  message: string
): ValidationRule<T> {
  return {
    validate: fn,
    message,
  };
}

/**
 * Run validation on a value
 */
export function validate<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default {
  required,
  minLength,
  maxLength,
  email,
  url,
  min,
  max,
  pattern,
  custom,
  validate,
};
