/**
 * ActivityFeed Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import type { ActivityFeedProps, Activity, ActivityType } from './types';
import styles from './ActivityFeed.module.css';

// Activity type icons
const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  created: Plus,
  updated: Edit2,
  deleted: Trash2,
  commented: MessageSquare,
  assigned: UserCheck,
  status_changed: RefreshCw,
};

// Activity type labels
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  commented: 'commented on',
  assigned: 'assigned',
  status_changed: 'changed status of',
};

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * ActivityFeed component - recent activity list
 */
export function ActivityFeed({
  activities,
  limit,
  showLoadMore = false,
  onLoadMore,
  onActivityClick,
  className = '',
}: ActivityFeedProps): React.ReactElement {
  const displayedActivities = useMemo(() => {
    if (limit && limit > 0) {
      return activities.slice(0, limit);
    }
    return activities;
  }, [activities, limit]);

  const classNames = useMemo(() => {
    const classes = [styles.activityFeed];
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [className]);

  const renderActivity = (activity: Activity) => {
    const Icon = ACTIVITY_ICONS[activity.type];
    const actionLabel = ACTIVITY_LABELS[activity.type];
    
    const content = (
      <div className={styles.activityFeed__item}>
        {activity.user?.avatar ? (
          <Avatar
            src={activity.user.avatar}
            name={activity.user.name}
            size="sm"
            className={styles.activityFeed__avatar}
          />
        ) : (
          <div className={`${styles.activityFeed__typeIcon} ${styles[`activityFeed__typeIcon--${activity.type}`]}`}>
            {Icon && <Icon size={12} />}
          </div>
        )}
        <div className={styles.activityFeed__content}>
          <div className={styles.activityFeed__header}>
            <p className={styles.activityFeed__title}>
              {activity.user && <strong>{activity.user.name}</strong>}
              {' '}{actionLabel}{' '}
              <span>{activity.title}</span>
            </p>
            <span className={styles.activityFeed__timestamp}>
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
          {activity.description && (
            <p className={styles.activityFeed__description}>{activity.description}</p>
          )}
        </div>
      </div>
    );

    if (activity.link || onActivityClick) {
      return (
        <a
          key={activity.id}
          href={activity.link || '#'}
          className={styles.activityFeed__link}
          onClick={(e) => {
            if (!activity.link) {
              e.preventDefault();
            }
            onActivityClick?.(activity);
          }}
        >
          {content}
        </a>
      );
    }

    return <div key={activity.id}>{content}</div>;
  };

  return (
    <div className={classNames}>
      {displayedActivities.map(renderActivity)}
      
      {showLoadMore && activities.length > (limit || 0) && (
        <div className={styles.activityFeed__loadMore}>
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
