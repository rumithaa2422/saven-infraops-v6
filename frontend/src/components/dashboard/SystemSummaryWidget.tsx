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

interface StatCard {
  label: string;
  value: number;
  icon: string;
  variant?: 'default' | 'critical' | 'warning' | 'success';
  subtitle?: string;
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

  // Build stat cards based on available data
  const statCards: StatCard[] = [
    { label: 'Total Users', value: summaryData.totalUsers, icon: '👥', variant: 'default' },
    { label: 'Open Tickets', value: summaryData.openTickets, icon: '🎫', variant: summaryData.highPriorityTickets > 0 ? 'warning' : 'default', subtitle: `${summaryData.unassignedTickets} unassigned` },
    { label: 'Critical Incidents', value: summaryData.criticalIncidents, icon: '🚨', variant: summaryData.criticalIncidents > 0 ? 'critical' : 'success', subtitle: 'SEV1 - Immediate' },
    { label: 'SEV2 Incidents', value: summaryData.sev2Incidents, icon: '⚠️', variant: summaryData.sev2Incidents > 0 ? 'warning' : 'default', subtitle: 'High Priority' },
    { label: 'Open Incidents', value: summaryData.openIncidents, icon: '🔥', variant: 'default', subtitle: `Total: ${summaryData.totalIncidents}` },
    { label: 'Open Problems', value: summaryData.openProblems, icon: '⚠️', variant: 'default' },
    { label: 'Pending Changes', value: summaryData.pendingChanges, icon: '🔄', variant: summaryData.overdueChanges > 0 ? 'warning' : 'default', subtitle: `${summaryData.overdueChanges} overdue` },
    { label: 'Access Requests', value: summaryData.pendingAccessRequests, icon: '🔐', variant: 'default' },
    { label: 'Expiring Licenses', value: summaryData.expiringLicenses, icon: '📜', variant: summaryData.expiringLicenses > 0 ? 'warning' : 'default', subtitle: 'Within 30 days' },
    { label: 'Compliance Docs', value: summaryData.complianceDocuments, icon: '📋', variant: 'success' },
    { label: 'Total Assets', value: summaryData.totalAssets, icon: '🖥️', variant: 'default', subtitle: `${summaryData.availableAssets} available` },
    { label: 'Knowledge Base', value: summaryData.totalKnowledgeBase, icon: '📚', variant: 'success' },
    { label: 'Projects', value: summaryData.totalProjects, icon: '📁', variant: 'default' },
    { label: 'Vendors', value: summaryData.totalVendors, icon: '🏢', variant: 'default' },
    { label: 'SLA Breaches', value: summaryData.slaBreaches, icon: '⏰', variant: summaryData.slaBreaches > 0 ? 'critical' : 'success' },
    { label: 'Roles', value: summaryData.totalRoles, icon: '🔑', variant: 'default' }
  ];

  const getVariantClass = (variant?: string) => {
    switch (variant) {
      case 'critical': return 'stat-card--critical';
      case 'warning': return 'stat-card--warning';
      case 'success': return 'stat-card--success';
      default: return '';
    }
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={`system-summary-widget ${className}`}>
        <div className="widget-header">
          <h2 className="widget-title">System Statistics</h2>
          <span className="stats-updated">Live data from database</span>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card stat-card--skeleton">
              <div className="skeleton-icon"></div>
              <div className="stat-content">
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
        <div className="widget-header">
          <h2 className="widget-title">System Statistics</h2>
        </div>
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
      <div className="widget-header">
        <h2 className="widget-title">System Statistics</h2>
        <span className="stats-updated">Live data from database</span>
      </div>
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className={`stat-card ${getVariantClass(stat.variant)}`}
            title={`${stat.label}: ${stat.value}${stat.subtitle ? ` (${stat.subtitle})` : ''}`}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              {stat.subtitle && <span className="stat-subtitle">{stat.subtitle}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
