import { 
  HeaderWidget, 
  SystemSummaryWidget,
  MyTasksWidget,
  SystemHealthWidget, 
  QuickActionsWidget, 
  RecentActivityWidget,
  ModuleShortcutsWidget
} from '../components/dashboard';

export function DashboardPage() {
  return (
    <div className="dashboard-container">
      <HeaderWidget />
      
      <div className="dashboard-main">
        {/* Left Column - Primary Content */}
        <div className="dashboard-left-column">
          <SystemSummaryWidget />
          <MyTasksWidget />
          <QuickActionsWidget />
        </div>
        
        {/* Right Column - Secondary Content */}
        <div className="dashboard-right-column">
          <SystemHealthWidget />
          <RecentActivityWidget />
        </div>
      </div>

      {/* Full Width - Module Shortcuts */}
      <ModuleShortcutsWidget />
    </div>
  );
}
