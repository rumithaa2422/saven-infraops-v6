import { 
  HeaderWidget, 
  SystemSummaryWidget,
  SystemHealthWidget, 
  RecentActivityWidget
} from '../components/dashboard';

export function DashboardPage() {
  return (
    <div className="dashboard-container">
      <HeaderWidget />
      
      <div className="dashboard-main">
        {/* Main Content - Statistics */}
        <div className="dashboard-left-column">
          <SystemSummaryWidget />
        </div>
        
        {/* Right Column - System Health & Activity */}
        <div className="dashboard-right-column">
          <SystemHealthWidget />
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}
