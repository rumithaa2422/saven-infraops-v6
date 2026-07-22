/**
 * Card Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { 
  CardProps, 
  CardVariant, 
  CardPadding,
  CardHeaderProps,
  CardFooterProps,
  CardSectionProps,
  SummaryCardProps 
} from './types';
import styles from './Card.module.css';

/**
 * Card component - container for grouped content
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      interactive = false,
      hoverable = false,
      header,
      footer,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = useMemo(() => {
      const classes = [styles.card];
      
      classes.push(styles[`card--${variant}`]);
      classes.push(styles[`card--padding-${padding}`]);
      
      if (interactive) {
        classes.push(styles['card--interactive']);
      } else if (hoverable) {
        classes.push(styles['card--hoverable']);
      }
      
      if (className) {
        classes.push(className);
      }
      
      return classes.join(' ');
    }, [variant, padding, interactive, hoverable, className]);

    return (
      <div ref={ref} className={classNames} tabIndex={interactive ? 0 : undefined} {...props}>
        {header && <div className={styles.card__header}>{header}</div>}
        <div className={styles.card__body}>{children}</div>
        {footer && <div className={styles.card__footer}>{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header component
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  const classNames = useMemo(() => {
    const classes = [styles.card__header];
    if (title || subtitle) {
      classes.push(styles['card__header--withTitle']);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [title, subtitle, className]);

  return (
    <div className={classNames} {...props}>
      {children || (
        <>
          <div>
            {title && <h3 className={styles.card__headerTitle}>{title}</h3>}
            {subtitle && <p className={styles.card__headerSubtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.card__headerAction}>{action}</div>}
        </>
      )}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * Card Footer component
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  align = 'right',
  children,
  className = '',
  ...props
}) => {
  const classNames = useMemo(() => {
    const classes = [styles.card__footer, styles[`card__footer--${align}`]];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [align, className]);

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

/**
 * Card Section component
 */
export const CardSection: React.FC<CardSectionProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const classNames = useMemo(() => {
    const classes = [styles.card__section];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  return (
    <div className={classNames} {...props}>
      {(title || description) && (
        <>
          {title && (
            <h4 className={styles.card__sectionTitle}>
              {Icon && <span className={styles.card__sectionIcon}><Icon size={16} /></span>}
              {title}
            </h4>
          )}
          {description && <p className={styles.card__sectionDescription}>{description}</p>}
        </>
      )}
      {children}
    </div>
  );
};

CardSection.displayName = 'CardSection';

/**
 * Summary Card component - displays key metrics
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'primary',
  trend,
  onClick,
  className = '',
  ...props
}) => {
  const cardClassNames = useMemo(() => {
    const classes = [styles.summaryCard];
    if (onClick) {
      classes.push(styles['summaryCard--clickable']);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [onClick, className]);

  const iconClassNames = useMemo(() => {
    return [styles.summaryCard__icon, styles[`summaryCard__icon--${iconColor}`]].join(' ');
  }, [iconColor]);

  const trendClassNames = useMemo(() => {
    const classes = [styles.summaryCard__trend];
    if (trend) {
      classes.push(styles[`summaryCard__trend--${trend.direction}`]);
    }
    return classes.join(' ');
  }, [trend]);

  const renderTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.direction === 'up') {
      return <TrendingUp size={14} />;
    } else if (trend.direction === 'down') {
      return <TrendingDown size={14} />;
    }
    return <Minus size={14} />;
  };

  return (
    <div
      className={cardClassNames}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      {...props}
    >
      <div className={styles.summaryCard__header}>
        <p className={styles.summaryCard__title}>{title}</p>
        {Icon && (
          <div className={iconClassNames}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className={styles.summaryCard__value}>{value}</div>
      {subtitle && <p className={styles.summaryCard__subtitle}>{subtitle}</p>}
      {trend && (
        <div className={trendClassNames}>
          {renderTrendIcon()}
          <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          {trend.label && <span>{trend.label}</span>}
        </div>
      )}
    </div>
  );
};

SummaryCard.displayName = 'SummaryCard';

// Named exports for types
export const CardVariants: CardVariant[] = ['default', 'compact', 'bordered', 'elevated'];
export const CardPaddings: CardPadding[] = ['none', 'sm', 'md', 'lg'];

export default Card;
