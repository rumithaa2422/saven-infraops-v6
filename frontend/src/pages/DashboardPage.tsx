import { useState, useCallback, useEffect } from 'react';
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
import { Bell } from 'lucide-react';

export function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  
  // Mock notification count - UI placeholder
  const notificationCount = 0;

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

  return (
    <div className="workspace">
      <div className="page-stack dashboard">
        {/* Dashboard Header */}
        <div className="page-header">
          <div className="page-header-left">
            {/* Dashboard Icon */}
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            
            {/* Title Section */}
            <div>
              {/* Greeting */}
              <p className="text-sm text-slate-500 mb-0.5">
                {getGreeting()}, <span className="font-medium text-slate-700">{getUserDisplayName()}</span>
              </p>
              {/* Dashboard Title */}
              <h1 className="page-header-title">Dashboard</h1>
              {/* Subtitle */}
              <p className="page-header-subtitle">Monitor your organization's operations and stay informed with real-time insights</p>
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="page-header-actions">
            {/* Notification Button */}
            <button
              className="relative p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              title="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Current Date */}
            <div className="hidden sm:flex flex-col items-end justify-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Current Time */}
            <div className="hidden md:flex flex-col items-end justify-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Time</span>
              <span className="text-sm font-semibold text-slate-700 font-mono">
                {formatTime(currentTime)}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
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
