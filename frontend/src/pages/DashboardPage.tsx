import { HeaderWidget, KpiCardsWidget, SystemHealthWidget, QuickActionsWidget, RecentActivityWidget } from '../components/dashboard';

export function DashboardPage() {
  return (
    <div className="dashboard-container">
      <HeaderWidget />
      
      <div className="dashboard-main">
        <div className="dashboard-left-column">
          <KpiCardsWidget />
          <QuickActionsWidget />
        </div>
        
        <div className="dashboard-right-column">
          <SystemHealthWidget />
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}
