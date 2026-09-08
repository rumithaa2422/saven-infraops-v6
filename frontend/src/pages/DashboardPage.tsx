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
        {/* Compact greeting/overview bar */}
        <div className="dashboard-overview">
          <div className="dashboard-overview-main">
            <div className="dashboard-overview-icon">
              <BarChart3 size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="dashboard-overview-greeting">
                {getGreeting()}, {getUserDisplayName()}
              </p>
              <p className="dashboard-overview-subtitle">
                Here's what's happening across your infrastructure today
              </p>
            </div>
          </div>
          <div className="dashboard-overview-actions">
            <NotificationBell />
            <div className="dashboard-overview-datetime">
              <span className="dashboard-overview-date">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        <section key={`summary-${refreshKey}`}>
          <SummaryCards />
        </section>

        <AnalyticsCharts />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <PermissionGate permission="dashboard:view_activity">
            <div key={`activity-${refreshKey}`}>
              <RecentActivity />
            </div>
          </PermissionGate>

          <div className="space-y-4">
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
