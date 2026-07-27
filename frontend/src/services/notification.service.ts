/**
 * Notification Service
 * 
 * Provides real-time notification functionality using Server-Sent Events (SSE).
 */

import { api } from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceModule?: string;
  referenceId?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

type NotificationListener = (notification: Notification) => void;
type UnreadCountListener = (count: number) => void;
type ConnectionListener = (connected: boolean) => void;

class NotificationService {
  private eventSource: EventSource | null = null;
  private notificationListeners: NotificationListener[] = [];
  private unreadCountListeners: UnreadCountListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUserId: string | null = null;

  /**
   * Start the SSE connection for real-time notifications
   */
  connect(userId: string): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.currentUserId = userId;
    this.createEventSource();
  }

  private createEventSource(): void {
    if (!this.currentUserId) return;

    // Use fetch-based SSE to support authentication headers
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
    const url = `${baseUrl}/api/notifications/stream`;

    // Create EventSource with token in query param (since SSE doesn't support custom headers)
    const token = localStorage.getItem('token');
    const eventSourceUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;

    try {
      this.eventSource = new EventSource(eventSourceUrl);
      
      this.eventSource.onopen = () => {
        console.log('Notification SSE connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      };

      this.eventSource.onerror = (error) => {
        console.error('Notification SSE error:', error);
        this.notifyConnectionListeners(false);
        this.handleReconnect();
      };

      // Listen for new notifications
      this.eventSource.addEventListener('notification', (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          console.log('New notification received:', notification);
          this.notifyNotificationListeners(notification);
        } catch (e) {
          console.error('Failed to parse notification:', e);
        }
      });

      // Listen for unread count updates
      this.eventSource.addEventListener('unread-count', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyUnreadCountListeners(data.count);
        } catch (e) {
          console.error('Failed to parse unread count:', e);
        }
      });

      // Listen for connection confirmation
      this.eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Notification SSE connected for user:', data.userId);
        } catch (e) {
          console.error('Failed to parse connected event:', e);
        }
      });
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting to notification stream in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.currentUserId) {
          this.createEventSource();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for notification stream');
    }
  }

  /**
   * Disconnect from the SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.notifyConnectionListeners(false);
    this.currentUserId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to new notifications
   */
  onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to unread count changes
   */
  onUnreadCountChange(listener: UnreadCountListener): () => void {
    this.unreadCountListeners.push(listener);
    return () => {
      this.unreadCountListeners = this.unreadCountListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  private notifyNotificationListeners(notification: Notification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (e) {
        console.error('Error in notification listener:', e);
      }
    });
  }

  private notifyUnreadCountListeners(count: number): void {
    this.unreadCountListeners.forEach(listener => {
      try {
        listener(count);
      } catch (e) {
        console.error('Error in unread count listener:', e);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (e) {
        console.error('Error in connection listener:', e);
      }
    });
  }

  // API Methods

  async fetchNotifications(options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', String(options.limit));
    
    const res = await api.get(`/notifications?${params.toString()}`);
    return res.data.notifications || [];
  }

  async fetchUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.count || 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
