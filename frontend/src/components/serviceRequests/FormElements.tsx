import React from 'react';
import { LucideIcon } from 'lucide-react';

// Form Section Component
interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, icon: Icon, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="p-1.5 rounded-lg bg-slate-100">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
        )}
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {title}
        </h4>
      </div>
      {description && (
        <p className="text-sm text-slate-500 pl-7">{description}</p>
      )}
      <div className="pl-0 md:pl-7 space-y-4">
        {children}
      </div>
    </div>
  );
}

// Form Row Component
interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
}

export function Input({ label, error, hint, icon: Icon, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 rounded-xl border text-sm
            placeholder:text-slate-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-300'
              : 'border-slate-200 hover:border-slate-300'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 rounded-xl border text-sm resize-none
          placeholder:text-slate-400 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error
            ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-300'
            : 'border-slate-200 hover:border-slate-300'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-xl border text-sm appearance-none
          bg-white transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error
            ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-300'
            : 'border-slate-200 hover:border-slate-300'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors"
        {...props}
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/25 hover:shadow-brand-600/40',
    secondary: 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/25',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2'
  };

  const IconEl = Icon && (
    <Icon className={`w-4 h-4 ${size === 'sm' ? 'w-3.5 h-3.5' : ''}`} />
  );

  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200
        hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {iconPosition === 'left' && IconEl}
          {children}
          {iconPosition === 'right' && IconEl}
        </>
      )}
    </button>
  );
}

// Action Buttons Group
interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionButtonsProps {
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  className?: string;
}

export function ActionButtons({ primaryAction, secondaryActions = [], className = '' }: ActionButtonsProps) {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {secondaryActions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'secondary'}
          icon={action.icon}
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
        >
          {action.label}
        </Button>
      ))}
      {primaryAction && (
        <Button
          variant={primaryAction.variant || 'primary'}
          icon={primaryAction.icon}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          loading={primaryAction.loading}
        >
          {primaryAction.label}
        </Button>
      )}
    </div>
  );
}
