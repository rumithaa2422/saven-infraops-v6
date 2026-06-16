import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';

const fallback = {
  openServiceRequests: 0,
  criticalIncidents: 0,
  slaBreaches: 0,
  pendingCompliance: 0,
  availableAssets: 0,
  pendingApprovals: 0
};

export function DashboardPage() {
  const [summary, setSummary] = useState(fallback);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setSummary(res.data)).catch(() => setSummary(fallback));
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">AI-first operations</span>
          <h2>What do you want to check today?</h2>
          <p>Use the menu for structured work. Use the command bar for fast answers and guided actions.</p>
        </div>
      </section>

      <section className="grid cards-3">
        <StatCard label="Open Service Requests" value={summary.openServiceRequests} hint="Across all teams" />
        <StatCard label="Critical Incidents" value={summary.criticalIncidents} hint="Needs attention" />
        <StatCard label="SLA Breaches" value={summary.slaBreaches} hint="Review today" />
        <StatCard label="Pending Compliance" value={summary.pendingCompliance} hint="Due or overdue" />
        <StatCard label="Available Assets" value={summary.availableAssets} hint="Ready for allocation" />
        <StatCard label="Pending Approvals" value={summary.pendingApprovals} hint="Access and changes" />
      </section>
    </div>
  );
}
