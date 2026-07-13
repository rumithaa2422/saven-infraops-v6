import {
  HeaderWidget,
  KpiCardsWidget,
  SystemHealthWidget,
  QuickActionsWidget,
  RecentActivityWidget
} from '../components/dashboard';

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <HeaderWidget />
      <div className="dashboard-content">
        <div className="dashboard-main">
          <KpiCardsWidget />
          <div className="dashboard-row">
            <SystemHealthWidget />
            <QuickActionsWidget />
          </div>
        </div>
        <aside className="dashboard-sidebar">
          <RecentActivityWidget />
        </aside>
      </div>
    </div>
  );
}
