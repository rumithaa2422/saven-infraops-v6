import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export type KpiData = {
  totalIncidents: number;
  openProblems: number;
  pendingChanges: number;
  complianceDocuments: number;
};

type KpiCardProps = {
  label: string;
  value: number;
  icon: string;
  color: string;
};

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ backgroundColor: color }}>
        <span>{icon}</span>
      </div>
      <div className="kpi-content">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
      </div>
    </div>
  );
}

const fallbackData: KpiData = {
  totalIncidents: 0,
  openProblems: 0,
  pendingChanges: 0,
  complianceDocuments: 0
};

export function KpiCardsWidget() {
  const [kpiData, setKpiData] = useState<KpiData>(fallbackData);

  useEffect(() => {
    async function fetchKpiData() {
      try {
        const [incidentsRes, problemsRes, changesRes, complianceRes] = await Promise.all([
          api.get('/incidents').catch(() => ({ data: { items: [] } })),
          api.get('/problems').catch(() => ({ data: { items: [] } })),
          api.get('/changes').catch(() => ({ data: { items: [] } })),
          api.get('/compliance').catch(() => ({ data: { items: [] } }))
        ]);

        const totalIncidents = incidentsRes.data.items?.length || 0;
        const openProblems = problemsRes.data.items?.filter((p: any) => p.status !== 'CLOSED' && p.status !== 'RESOLVED').length || 0;
        const pendingChanges = changesRes.data.items?.filter((c: any) => c.status === 'PENDING_APPROVAL').length || 0;
        const complianceDocuments = complianceRes.data.items?.length || 0;

        setKpiData({ totalIncidents, openProblems, pendingChanges, complianceDocuments });
      } catch {
        setKpiData(fallbackData);
      }
    }

    fetchKpiData();
  }, []);

  const kpiCards = [
    { label: 'Total Incidents', value: kpiData.totalIncidents, icon: 'IN', color: 'var(--brand-soft)' },
    { label: 'Open Problems', value: kpiData.openProblems, icon: 'PR', color: '#fff4df' },
    { label: 'Pending Changes', value: kpiData.pendingChanges, icon: 'CH', color: '#e4f8ef' },
    { label: 'Compliance Documents', value: kpiData.complianceDocuments, icon: 'CO', color: '#ffe8e5' }
  ];

  return (
    <section className="kpi-section">
      <h3 className="section-title">Key Performance Indicators</h3>
      <div className="kpi-grid">
        {kpiCards.map((card, index) => (
          <KpiCard
            key={index}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>
    </section>
  );
}
