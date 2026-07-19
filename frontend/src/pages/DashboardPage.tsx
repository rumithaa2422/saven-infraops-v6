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

export function DashboardPage() {
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
      {/* Section 1: Header */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Section 2: Global Search */}
        <div className="mb-6">
          <DashboardSearch />
        </div>

        {/* Section 3: Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Section 4: My Work */}
        <div className="mb-6" key={`my-work-${refreshKey}`}>
          <MyWorkWidget />
        </div>

        {/* Section 5: Important Alerts */}
        <div className="mb-6" key={`alerts-${refreshKey}`}>
          <AlertWidget />
        </div>

        {/* Section 6: Module Overview - Main Section */}
        <div className="mb-6" key={`modules-${refreshKey}`}>
          <ModuleOverview />
        </div>

        {/* Two Column Layout for Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 7: Recent Activity */}
          <div key={`activity-${refreshKey}`}>
            <RecentActivity />
          </div>

          {/* Two Mini Sections */}
          <div className="space-y-6">
            {/* Section 8: Knowledge Hub */}
            <div key={`knowledge-${refreshKey}`}>
              <KnowledgeHub />
            </div>

            {/* Section 9: Reports Shortcut */}
            <div key={`reports-${refreshKey}`}>
              <ReportsWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
