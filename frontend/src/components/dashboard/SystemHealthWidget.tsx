export type SystemStatus = {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastChecked?: Date;
};

type SystemHealthCardProps = {
  name: string;
  status: 'healthy' | 'warning' | 'error';
};

function SystemHealthCard({ name, status }: SystemHealthCardProps) {
  const statusColors = {
    healthy: { bg: '#e4f8ef', text: '#197a4b' },
    warning: { bg: '#fff4df', text: '#aa6b00' },
    error: { bg: '#ffe8e5', text: '#c0392b' }
  };

  const colors = statusColors[status];

  return (
    <div className="health-card">
      <span className="health-name">{name}</span>
      <span 
        className="health-badge"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        Healthy
      </span>
    </div>
  );
}

// Initial systems with status for Phase 1 (all healthy)
const initialSystems: SystemStatus[] = [
  { name: 'API Server', status: 'healthy' },
  { name: 'Database', status: 'healthy' },
  { name: 'AI Assistant', status: 'healthy' },
  { name: 'Compliance Repository', status: 'healthy' }
];

export function SystemHealthWidget() {
  return (
    <section className="health-section">
      <h3 className="section-title">System Health</h3>
      <div className="health-grid">
        {initialSystems.map((system, index) => (
          <SystemHealthCard
            key={index}
            name={system.name}
            status={system.status}
          />
        ))}
      </div>
    </section>
  );
}
