import { RefreshCw, User, ChevronDown, Plus, Bell, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCallback, useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
};

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count and recent notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }
    
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formatDate = useCallback(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      if (actionUrl) {
        setShowNotifications(false);
        navigate(actionUrl);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Title and Subtitle */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white truncate">Dashboard</h1>
              <span className="hidden md:inline-flex px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-white/70 mt-0.5">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} • {formatDate()}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Primary Action Button */}
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-purple-700 text-sm font-semibold rounded-xl shadow-sm shadow-black/10 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            <span>Quick Create</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-white/10 transition-colors group text-white"
              title="Notifications"
            >
              <Bell className="w-5 h-5 group-hover:text-white/80 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                {/* Dropdown Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
                        className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                          !notification.isRead ? 'bg-purple-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* View All Link */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button 
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors group text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5 group-hover:text-white/80 transition-colors" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 text-white"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-white/70">{user?.roles?.[0] || 'Employee'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-white/70 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
