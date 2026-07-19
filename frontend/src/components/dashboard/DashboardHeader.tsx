import { Bell, RefreshCw, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useState, useCallback } from 'react';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

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

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Greeting */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{formatDate()}</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.roles?.[0] || 'Employee'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-6 top-16 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
          </div>
          <div className="p-4 text-center text-slate-500 text-sm">
            No new notifications
          </div>
        </div>
      )}
    </header>
  );
}
