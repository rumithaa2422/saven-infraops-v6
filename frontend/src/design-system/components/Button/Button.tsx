/**
 * Button Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { ButtonProps, ButtonVariant, ButtonSize } from './types';
import styles from './Button.module.css';

/**
 * Button component with multiple variants and sizes
 * 
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * // Loading button
 * <Button variant="primary" loading loadingText="Saving...">
 *   Save
 * </Button>
 * 
 * // Icon button
 * <Button variant="ghost" icon={Plus} aria-label="Add new" />
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      loadingText,
      tooltip,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Determine if button should be icon-only
    const isIconOnly = useMemo(() => {
      return !children && Icon !== undefined;
    }, [children, Icon]);

    // Build class names
    const classNames = useMemo(() => {
      const classes = [styles.button];
      
      // Variant
      classes.push(styles[`button--${variant}`]);
      
      // Size
      classes.push(styles[`button--${size}`]);
      
      // Icon only
      if (isIconOnly) {
        classes.push(styles['button--iconOnly']);
      }
      
      // Full width
      if (fullWidth) {
        classes.push(styles['button--fullWidth']);
      }
      
      // Loading
      if (loading) {
        classes.push(styles['button--loading']);
      }
      
      // Tooltip
      if (tooltip) {
        classes.push(styles['button__tooltip']);
      }
      
      // Custom class
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [variant, size, isIconOnly, fullWidth, loading, tooltip, className]);

    // Render icon
    const renderIcon = () => {
      if (!Icon) return null;
      
      const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
      
      if (loading) {
        return (
          <Loader2 
            className={styles.button__spinner} 
            size={iconSize}
            aria-hidden="true"
          />
        );
      }
      
      return <Icon size={iconSize} aria-hidden="true" />;
    };

    // Render content
    const renderContent = () => {
      if (loading && loadingText) {
        return (
          <>
            {Icon && iconPosition === 'left' && renderIcon()}
            <span>{loadingText}</span>
          </>
        );
      }
      
      if (loading) {
        return renderIcon();
      }
      
      return (
        <>
          {Icon && iconPosition === 'left' && renderIcon()}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && renderIcon()}
        </>
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...(tooltip ? { 'data-tooltip': tooltip } : {})}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Named exports for variants and sizes
export const ButtonVariants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'link'];
export const ButtonSizes: ButtonSize[] = ['sm', 'md', 'lg'];

export default Button;
