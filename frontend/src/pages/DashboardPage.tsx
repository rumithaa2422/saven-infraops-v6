import { useState, useCallback } from 'react';
import {
  DashboardHeader,
  DashboardSearch,
  QuickActions,
  MyWorkWidget,
  AlertWidget,
  ModuleOverview,
  RecentActivity,
  KnowledgeHub,
  ReportsWidget
} from '../components/dashboard';
import { PermissionGate } from '../components/permissions';
import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { hasPermission } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Section 1: Header - requires dashboard:view */}
      <PermissionGate permission="dashboard:view">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </PermissionGate>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Section 2: Global Search */}
        <div className="mb-6">
          <DashboardSearch />
        </div>

        {/* Section 3: Quick Actions - requires any relevant permission */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Section 4: My Work - requires dashboard:view_my_tasks */}
        <PermissionGate permission="dashboard:view_my_tasks">
          <div className="mb-6" key={`my-work-${refreshKey}`}>
            <MyWorkWidget />
          </div>
        </PermissionGate>

        {/* Section 5: Important Alerts */}
        <div className="mb-6" key={`alerts-${refreshKey}`}>
          <AlertWidget />
        </div>

        {/* Section 6: Module Overview - Main Section - requires dashboard:view */}
        <div className="mb-6" key={`modules-${refreshKey}`}>
          <ModuleOverview />
        </div>

        {/* Two Column Layout for Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 7: Recent Activity - requires dashboard:view_activity */}
          <PermissionGate permission="dashboard:view_activity">
            <div key={`activity-${refreshKey}`}>
              <RecentActivity />
            </div>
          </PermissionGate>

          {/* Two Mini Sections */}
          <div className="space-y-6">
            {/* Section 8: Knowledge Hub - requires kb:view */}
            <PermissionGate permission="kb:view">
              <div key={`knowledge-${refreshKey}`}>
                <KnowledgeHub />
              </div>
            </PermissionGate>

            {/* Section 9: Reports Shortcut - requires reports:view */}
            <PermissionGate permission="reports:view">
              <div key={`reports-${refreshKey}`}>
                <ReportsWidget />
              </div>
            </PermissionGate>
          </div>
        </div>
      </main>
    </div>
  );
}
