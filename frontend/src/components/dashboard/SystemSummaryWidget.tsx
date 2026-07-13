import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface SystemSummaryWidgetProps {
  className?: string;
}

interface SystemSummaryData {
  totalUsers: number;
  totalRoles: number;
  openTickets: number;
  slaBreaches: number;
  totalIncidents: number;
  criticalIncidents: number;
  openIncidents: number;
  openProblems: number;
  pendingChanges: number;
  pendingAccessRequests: number;
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
  slaBreaches: 0,
  totalIncidents: 0,
  criticalIncidents: 0,
  openIncidents: 0,
  openProblems: 0,
  pendingChanges: 0,
  pendingAccessRequests: 0,
  complianceDocuments: 0,
  totalAssets: 0,
  availableAssets: 0,
  totalProjects: 0,
  totalVendors: 0,
  totalKnowledgeBase: 0
};

export function SystemSummaryWidget({ className = '' }: SystemSummaryWidgetProps) {
  const [summaryData, setSummaryData] = useState<SystemSummaryData>(defaultSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemSummary = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setSummaryData(response.data);
      } catch {
        // Use default values if API fails
        setSummaryData(defaultSummary);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemSummary();
  }, []);

  // Display 8 key metrics from the summary
  const summaryItems = [
    { label: 'Total Users', value: summaryData.totalUsers, icon: '👥', highlight: false },
    { label: 'Open Tickets', value: summaryData.openTickets, icon: '🎫', highlight: false },
    { label: 'Critical Incidents', value: summaryData.criticalIncidents, icon: '🚨', highlight: true },
    { label: 'Open Incidents', value: summaryData.openIncidents, icon: '⚠️', highlight: false },
    { label: 'Pending Changes', value: summaryData.pendingChanges, icon: '🔄', highlight: false },
    { label: 'Access Requests', value: summaryData.pendingAccessRequests, icon: '🔐', highlight: false },
    { label: 'Compliance Docs', value: summaryData.complianceDocuments, icon: '📋', highlight: false },
    { label: 'Knowledge Base', value: summaryData.totalKnowledgeBase, icon: '📚', highlight: false }
  ];

  if (loading) {
    return (
      <div className={`system-summary-widget ${className}`}>
        <h2 className="widget-title">System Summary</h2>
        <div className="summary-loading">Loading...</div>
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
            className={`summary-item ${item.highlight ? 'summary-item--highlight' : ''}`}
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
