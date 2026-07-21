import { useState, useCallback } from 'react';
import {
  DashboardHeader,
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

export function DashboardPage() {
  const { hasPermission } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Purple Gradient like ServiceRequestsPage */}
      <PermissionGate permission="dashboard:view">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </PermissionGate>

      {/* Main Content - Same styling as ServiceRequestsPage */}
      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        
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
      </main>
    </div>
  );
}
