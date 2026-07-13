import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface KpiData {
  totalIncidents: number;
  openProblems: number;
  pendingChanges: number;
  complianceDocuments: number;
}

interface KpiCardsWidgetProps {
  className?: string;
}

const defaultKpiData: KpiData = {
  totalIncidents: 0,
  openProblems: 0,
  pendingChanges: 0,
  complianceDocuments: 0
};

export function KpiCardsWidget({ className = '' }: KpiCardsWidgetProps) {
  const [kpiData, setKpiData] = useState<KpiData>(defaultKpiData);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const response = await api.get('/dashboard/kpi');
        setKpiData(response.data);
      } catch {
        // API might not exist yet, keep default values
        setKpiData(defaultKpiData);
      }
    };

    fetchKpiData();
  }, []);

  const kpiCards = [
    {
      label: 'Total Incidents',
      value: kpiData.totalIncidents,
      icon: '🚨',
      color: 'danger'
    },
    {
      label: 'Open Problems',
      value: kpiData.openProblems,
      icon: '⚠️',
      color: 'warning'
    },
    {
      label: 'Pending Changes',
      value: kpiData.pendingChanges,
      icon: '🔄',
      color: 'info'
    },
    {
      label: 'Compliance Documents',
      value: kpiData.complianceDocuments,
      icon: '📋',
      color: 'success'
    }
  ];

  return (
    <div className={`kpi-cards-widget ${className}`}>
      <h2 className="widget-title">Key Performance Indicators</h2>
      <div className="kpi-cards-grid">
        {kpiCards.map((card, index) => (
          <div key={index} className={`kpi-card kpi-card--${card.color}`}>
            <div className="kpi-card-icon">{card.icon}</div>
            <div className="kpi-card-content">
              <span className="kpi-card-label">{card.label}</span>
              <strong className="kpi-card-value">{card.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
