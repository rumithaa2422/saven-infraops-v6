import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Bell, 
  CheckCircle, 
  FileText, 
  Clock,
  User,
  AlertCircle,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '../components/serviceRequests';

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceModule?: string;
  referenceId?: string;
  actionUrl?: string;
  createdAt: string;
};

type FilterType = 'all' | 'unread' | 'read';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllAsRead() {
    setMarkingAllRead(true);
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  }

  function getIcon(module?: string) {
    switch (module) {
      case 'ServiceRequest':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  function getDateGroup(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (notificationDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return 'Older';
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const group = getDateGroup(notification.createdAt);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  // Sort groups: Today first, then Yesterday, then Older
  const groupOrder = ['Today', 'Yesterday', 'Older'];
  const sortedGroups = Object.keys(groupedNotifications).sort((a, b) => {
    return groupOrder.indexOf(a) - groupOrder.indexOf(b);
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={markAllAsRead}
                loading={markingAllRead}
                className="bg-white hover:bg-white/90 text-purple-700 border-0"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="w-4 h-4 text-white/70" />
            <div className="flex gap-1 bg-white/10 backdrop-blur-sm p-1 rounded-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === 'all' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  filter === 'unread' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === 'read' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Read
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              {filter === 'all' ? 'No notifications' : filter === 'unread' ? 'No unread notifications' : 'No read notifications'}
            </h2>
            <p className="text-sm text-slate-500">
              {filter === 'all' ? "You're all caught up! New notifications will appear here." : 'Check back later for notifications.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map(group => (
              <div key={group}>
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">{group}</h3>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs text-slate-400">
                    {groupedNotifications[group].length} {groupedNotifications[group].length === 1 ? 'notification' : 'notifications'}
                  </span>
                </div>

                {/* Timeline Style Notifications */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200"></div>

                  <div className="space-y-3">
                    {groupedNotifications[group].map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`relative pl-12 transition-all ${
                          !notification.isRead ? 'opacity-100' : 'opacity-80'
                        }`}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-3 top-4 w-5 h-5 rounded-full border-2 border-white ${
                          !notification.isRead 
                            ? 'bg-purple-500' 
                            : 'bg-slate-300'
                        }`}></div>

                        <div
                          className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                            notification.isRead 
                              ? 'border-slate-200' 
                              : 'border-purple-200 shadow-sm'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getIcon(notification.referenceModule)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${
                                    notification.isRead ? 'text-slate-600' : 'text-slate-900'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs text-slate-400">
                                      {formatTime(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!notification.isRead && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
