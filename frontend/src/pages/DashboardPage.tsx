import { useState, useCallback, useEffect } from 'react';
import {
  AlertWidget,
  RecentActivity,
  KnowledgeHub,
  SummaryCards,
  AnalyticsCharts
} from '../components/dashboard';
import { PermissionGate } from '../components/permissions';
import { NotificationBell } from '../components/NotificationBell';
import { useAuth } from '../auth/AuthContext';
import { BarChart3 } from 'lucide-react';

export function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="workspace">
      <div className="page-stack dashboard">
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <BarChart3 size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-white">
                {getGreeting()}, {getUserDisplayName()}
              </p>
            </div>
          </div>
          <div className="page-header-actions">
            <NotificationBell />
            <div className="flex flex-col items-center justify-center h-14 px-4 rounded-lg bg-white border border-slate-200 shadow-sm min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-base font-bold text-slate-800 leading-tight">
                {currentTime.toLocaleDateString('en-US', { day: 'numeric' })} {currentTime.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center h-14 px-4 rounded-lg bg-white border border-slate-200 shadow-sm min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
              <span className="text-base font-bold text-slate-800 font-mono leading-tight">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        <section key={`summary-${refreshKey}`}>
          <SummaryCards />
        </section>

        <AnalyticsCharts />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PermissionGate permission="dashboard:view_activity">
            <div key={`activity-${refreshKey}`}>
              <RecentActivity />
            </div>
          </PermissionGate>

          <div className="space-y-6">
            <PermissionGate permission="kb:view">
              <div key={`knowledge-${refreshKey}`}>
                <KnowledgeHub />
              </div>
            </PermissionGate>

            <div key={`alerts-${refreshKey}`}>
              <AlertWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
