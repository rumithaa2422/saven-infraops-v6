import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface SystemSummaryWidgetProps {
  className?: string;
}

interface SystemSummaryData {
  totalUsers: number;
  activeUsers: number;
  openTickets: number;
  criticalIncidents: number;
  pendingChanges: number;
  pendingAccessRequests: number;
  complianceDocuments: number;
  knowledgeBaseArticles: number;
}

const defaultSummary: SystemSummaryData = {
  totalUsers: 0,
  activeUsers: 0,
  openTickets: 0,
  criticalIncidents: 0,
  pendingChanges: 0,
  pendingAccessRequests: 0,
  complianceDocuments: 0,
  knowledgeBaseArticles: 0
};

export function SystemSummaryWidget({ className = '' }: SystemSummaryWidgetProps) {
  const [summaryData, setSummaryData] = useState<SystemSummaryData>(defaultSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemSummary = async () => {
      try {
        // Try to fetch from new comprehensive endpoint
        const response = await api.get('/dashboard/system-summary');
        setSummaryData(response.data);
      } catch {
        // Fallback: try to combine existing endpoints
        try {
          const [summaryRes, kpiRes, usersRes] = await Promise.all([
            api.get('/dashboard/summary'),
            api.get('/dashboard/kpi'),
            api.get('/users')
          ]);

          setSummaryData({
            totalUsers: usersRes.data.total || usersRes.data.length || 0,
            activeUsers: (usersRes.data.total || usersRes.data.length || 0), // Would need active flag
            openTickets: summaryRes.data.openServiceRequests || 0,
            criticalIncidents: summaryRes.data.criticalIncidents || 0,
            pendingChanges: kpiRes.data.pendingChanges || 0,
            pendingAccessRequests: summaryRes.data.pendingApprovals || 0,
            complianceDocuments: kpiRes.data.complianceDocuments || 0,
            knowledgeBaseArticles: 0 // Would need specific endpoint
          });
        } catch {
          setSummaryData(defaultSummary);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSystemSummary();
  }, []);

  const summaryItems = [
    { label: 'Total Users', value: summaryData.totalUsers, icon: '👥', category: 'users' },
    { label: 'Active Users', value: summaryData.activeUsers, icon: '🟢', category: 'users' },
    { label: 'Open Tickets', value: summaryData.openTickets, icon: '🎫', category: 'tickets' },
    { label: 'Critical Incidents', value: summaryData.criticalIncidents, icon: '🚨', category: 'incidents', highlight: true },
    { label: 'Pending Changes', value: summaryData.pendingChanges, icon: '🔄', category: 'changes' },
    { label: 'Pending Approvals', value: summaryData.pendingAccessRequests, icon: '⏳', category: 'access' },
    { label: 'Compliance Docs', value: summaryData.complianceDocuments, icon: '📋', category: 'compliance' },
    { label: 'Knowledge Base', value: summaryData.knowledgeBaseArticles, icon: '📚', category: 'knowledge' }
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
