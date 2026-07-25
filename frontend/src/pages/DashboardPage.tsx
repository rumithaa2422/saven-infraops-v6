import { useState, useCallback } from 'react';
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

export function DashboardPage() {
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
    <div className="workspace">
      <div className="page-stack dashboard">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 className="page-header-title">Dashboard</h1>
          </div>
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
