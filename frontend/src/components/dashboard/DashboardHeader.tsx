import { RefreshCw, User, ChevronDown, Plus, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useCallback, useState } from 'react';

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
    <header className="bg-white border-b border-slate-200/60 px-6 py-5">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} • {formatDate()}
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Primary Action Button */}
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-200 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            <span>Quick Create</span>
          </button>

          {/* Notifications */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors group"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <button 
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors group"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/30">
              <span className="text-sm font-bold text-white">
                {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.roles?.[0] || 'Employee'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
