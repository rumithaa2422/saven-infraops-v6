import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';

interface SystemSummaryWidgetProps {
  className?: string;
}

interface SystemSummaryData {
  totalUsers: number;
  totalRoles: number;
  openTickets: number;
  unassignedTickets: number;
  highPriorityTickets: number;
  slaBreaches: number;
  totalIncidents: number;
  criticalIncidents: number;
  sev2Incidents: number;
  openIncidents: number;
  openProblems: number;
  pendingChanges: number;
  overdueChanges: number;
  pendingAccessRequests: number;
  expiringLicenses: number;
  complianceDocuments: number;
  totalAssets: number;
  availableAssets: number;
  totalProjects: number;
  totalVendors: number;
  totalKnowledgeBase: number;
}

const defaultSummary: SystemSummaryData = {
  totalUsers: 0,
  totalRoles: 0,
  openTickets: 0,
  unassignedTickets: 0,
  highPriorityTickets: 0,
  slaBreaches: 0,
  totalIncidents: 0,
  criticalIncidents: 0,
  sev2Incidents: 0,
  openIncidents: 0,
  openProblems: 0,
  pendingChanges: 0,
  overdueChanges: 0,
  pendingAccessRequests: 0,
  expiringLicenses: 0,
  complianceDocuments: 0,
  totalAssets: 0,
  availableAssets: 0,
  totalProjects: 0,
  totalVendors: 0,
  totalKnowledgeBase: 0
};

interface SummaryItem {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
  warning?: boolean;
}

export function SystemSummaryWidget({ className = '' }: SystemSummaryWidgetProps) {
  const [summaryData, setSummaryData] = useState<SystemSummaryData>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/summary');
      setSummaryData(response.data);
    } catch (err) {
      console.error('Failed to fetch system summary:', err);
      setError('Unable to load dashboard data');
      setSummaryData(defaultSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemSummary();
  }, [fetchSystemSummary]);

  // Build summary items dynamically based on available data
  const summaryItems: SummaryItem[] = [
    { label: 'Total Users', value: summaryData.totalUsers, icon: '👥' },
    { label: 'Open Tickets', value: summaryData.openTickets, icon: '🎫', warning: summaryData.highPriorityTickets > 0 },
    { label: 'Critical Incidents', value: summaryData.criticalIncidents, icon: '🚨', highlight: true, warning: summaryData.criticalIncidents > 0 },
    { label: 'SEV2 Incidents', value: summaryData.sev2Incidents, icon: '⚠️', warning: summaryData.sev2Incidents > 0 },
    { label: 'Pending Changes', value: summaryData.pendingChanges, icon: '🔄', warning: summaryData.overdueChanges > 0 },
    { label: 'Access Requests', value: summaryData.pendingAccessRequests, icon: '🔐' },
    { label: 'Compliance Docs', value: summaryData.complianceDocuments, icon: '📋' },
    { label: 'Knowledge Base', value: summaryData.totalKnowledgeBase, icon: '📚' }
  ];

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={`system-summary-widget ${className}`}>
        <h2 className="widget-title">System Summary</h2>
        <div className="summary-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="summary-item summary-item--skeleton">
              <div className="summary-icon skeleton-icon"></div>
              <div className="summary-content">
                <div className="skeleton-value"></div>
                <div className="skeleton-label"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <div className={`system-summary-widget ${className}`}>
        <h2 className="widget-title">System Summary</h2>
        <div className="summary-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button onClick={fetchSystemSummary} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`system-summary-widget ${className}`}>
      <h2 className="widget-title">System Summary</h2>
      <div className="summary-grid">
        {summaryItems.map((item, index) => (
          <div 
            key={index} 
            className={`summary-item ${item.highlight ? 'summary-item--highlight' : ''} ${item.warning ? 'summary-item--warning' : ''}`}
            title={`${item.label}: ${item.value}`}
          >
            <div className="summary-icon">{item.icon}</div>
            <div className="summary-content">
              <span className="summary-value">{item.value}</span>
              <span className="summary-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
