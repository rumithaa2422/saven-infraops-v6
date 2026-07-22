/**
 * ActivityFeed Component Types
 * Enterprise Design System V2
 */

export type ActivityType = 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'status_changed';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: {
    name: string;
    avatar?: string;
  };
  link?: string;
  metadata?: Record<string, any>;
}

export interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}

export default ActivityFeedProps;
