/**
 * Avatar Component
 * Enterprise Design System V2
 */

import React, { forwardRef, useMemo, useState } from 'react';
import type { AvatarProps, AvatarGroupProps, AvatarSize } from './types';
import styles from './Avatar.module.css';

// Size values for AvatarGroup
const AVATAR_SIZES: Record<AvatarSize, string> = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '48px',
  xl: '64px',
};

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2);
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

/**
 * Avatar component - user profile picture
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      status,
      fallback,
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    
    const classNames = useMemo(() => {
      const classes = [styles.avatar, styles[`avatar--${size}`], styles[`avatar--${shape}`]];
      if (className) {
        classes.push(className);
      }
      return classes.join(' ');
    }, [size, shape, className]);

    const initials = useMemo(() => {
      if (name) return getInitials(name);
      return '?';
    }, [name]);

    return (
      <div ref={ref} className={classNames} title={name} {...props}>
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={styles.avatar__image}
            onError={() => setImageError(true)}
          />
        ) : fallback ? (
          <div className={styles.avatar__fallback}>{fallback}</div>
        ) : (
          <div className={styles.avatar__fallback}>{initials}</div>
        )}
        {status && <span className={`${styles.avatar__status} ${styles[`avatar__status--${status}`]}`} />}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Avatar Group component - multiple avatars stacked
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 5,
  size = 'md',
  overlap = true,
  className = '',
  ...props
}) => {
  const childArray = React.Children.toArray(children);
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  const containerClassNames = useMemo(() => {
    const classes = [styles.avatarGroup];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  const moreClassNames = useMemo(() => {
    const classes = [styles.avatarGroup__more, styles[`avatar--${size}`]];
    if (overlap) {
      classes.push(styles['avatarGroup__more--overlap']);
    }
    return classes.join(' ');
  }, [size, overlap]);

  return (
    <div className={containerClassNames} {...props}>
      {visibleAvatars.map((child, index) => {
        const childClassNames = useMemo(() => {
          const classes = [styles.avatarGroup__item, styles[`avatar--${size}`]];
          if (overlap) {
            classes.push(styles['avatarGroup__item--overlap']);
          }
          return classes.join(' ');
        }, [size, overlap]);
        
        if (React.isValidElement(child)) {
          return (
            <div key={index} className={childClassNames}>
              {React.cloneElement(child as React.ReactElement<AvatarProps>, { size, shape: 'circle' })}
            </div>
          );
        }
        return child;
      })}
      {remainingCount > 0 && (
        <div className={moreClassNames} style={{ width: AVATAR_SIZES[size], height: AVATAR_SIZES[size] }}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';

// Named exports
export const AvatarSizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export default Avatar;
