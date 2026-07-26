import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QuickActions,
  MyWorkWidget,
  AlertWidget,
  ModuleOverview,
  RecentActivity,
  KnowledgeHub,
  ReportsWidget,
  SummaryCards
} from '../components/dashboard';
import { PermissionGate } from '../components/permissions';
import { useAuth } from '../auth/AuthContext';
import { 
  Bell, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  X,
  ChevronRight
} from 'lucide-react';

// Notification types
interface Notification {
  id: string;
  icon: 'alert' | 'success' | 'info' | 'warning';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

export function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      icon: 'alert',
      title: 'Low Stock Alert',
      description: 'Dell Laptop XPS 15 has only 2 units remaining',
      time: '5 min ago',
      isRead: false
    },
    {
      id: '2',
      icon: 'success',
      title: 'Service Request Resolved',
      description: 'Ticket #SR-2024-156 has been completed',
      time: '1 hour ago',
      isRead: false
    },
    {
      id: '3',
      icon: 'info',
      title: 'New Assignment',
      description: 'You have been assigned to Project Alpha',
      time: '2 hours ago',
      isRead: true
    },
    {
      id: '4',
      icon: 'warning',
      title: 'Warranty Expiring',
      description: '3 assets warranty expiring within 30 days',
      time: '3 hours ago',
      isRead: true
    }
  ]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    return user?.email?.split('@')[0] || 'User';
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  // Get notification icon
  const getNotificationIcon = (icon: Notification['icon']) => {
    switch (icon) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="workspace">
      <div className="page-stack dashboard">
        {/* Dashboard Header */}
        <div className="page-header">
          <div className="page-header-left">
            {/* Analytics Icon */}
            <div className="page-header-icon">
              <BarChart3 size={20} />
            </div>
            
            {/* Welcome Section */}
            <div className="flex flex-col">
              {/* Greeting */}
              <p className="text-base font-bold text-white">
                {getGreeting()}, {getUserDisplayName()}
              </p>
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="page-header-actions">
            {/* Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded hover:bg-slate-200 transition-colors"
                      >
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-brand-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.description}</p>
                              <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/notifications');
                      }}
                      className="w-full flex items-center justify-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium py-1 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      View all notifications
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current Date Card */}
            <div className="flex flex-col items-center justify-center h-14 px-4 rounded-lg bg-white border border-slate-200 shadow-sm min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-base font-bold text-slate-800 leading-tight">
                {currentTime.toLocaleDateString('en-US', { day: 'numeric' })} {currentTime.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Current Time Card */}
            <div className="flex flex-col items-center justify-center h-14 px-4 rounded-lg bg-white border border-slate-200 shadow-sm min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
              <span className="text-base font-bold text-slate-800 font-mono leading-tight">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards Section */}
        <section key={`summary-${refreshKey}`}>
          <SummaryCards />
        </section>

        {/* Quick Actions Section */}
        <section key={`quick-${refreshKey}`}>
          <QuickActions />
        </section>

        {/* Two Column Layout: My Work + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* My Work Widget - Takes 2 columns */}
          <PermissionGate permission="dashboard:view_my_tasks">
            <div className="xl:col-span-2" key={`my-work-${refreshKey}`}>
              <MyWorkWidget />
            </div>
          </PermissionGate>

          {/* Alerts Widget */}
          <div key={`alerts-${refreshKey}`}>
            <AlertWidget />
          </div>
        </div>

        {/* Module Overview Section */}
        <section key={`modules-${refreshKey}`}>
          <ModuleOverview />
        </section>

        {/* Bottom Section: Activity + Knowledge Hub + Reports */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <PermissionGate permission="dashboard:view_activity">
            <div key={`activity-${refreshKey}`}>
              <RecentActivity />
            </div>
          </PermissionGate>

          {/* Right Column: Knowledge Hub + Reports */}
          <div className="space-y-6">
            <PermissionGate permission="kb:view">
              <div key={`knowledge-${refreshKey}`}>
                <KnowledgeHub />
              </div>
            </PermissionGate>

            <PermissionGate permission="reports:view">
              <div key={`reports-${refreshKey}`}>
                <ReportsWidget />
              </div>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}
