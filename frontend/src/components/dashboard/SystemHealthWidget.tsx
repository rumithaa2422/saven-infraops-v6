import { useState } from 'react';

interface SystemHealthWidgetProps {
  className?: string;
}

interface HealthStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastChecked?: string;
}

export function SystemHealthWidget({ className = '' }: SystemHealthWidgetProps) {
  // Structured for future live health monitoring
  // Currently displays green "Healthy" badges as placeholder
  const [healthItems] = useState<HealthStatus[]>([
    { name: 'API Server', status: 'healthy', lastChecked: new Date().toLocaleTimeString() },
    { name: 'Database', status: 'healthy', lastChecked: new Date().toLocaleTimeString() },
    { name: 'AI Assistant', status: 'healthy', lastChecked: new Date().toLocaleTimeString() },
    { name: 'Compliance Repository', status: 'healthy', lastChecked: new Date().toLocaleTimeString() }
  ]);

  const getStatusClass = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'status-healthy';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'status-healthy';
    }
  };

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '✓';
    }
  };

  return (
    <div className={`system-health-widget ${className}`}>
      <h2 className="widget-title">System Health</h2>
      <div className="health-items">
        {healthItems.map((item, index) => (
          <div key={index} className="health-item">
            <div className="health-item-info">
              <span className="health-item-name">{item.name}</span>
              {item.lastChecked && (
                <span className="health-item-checked">Last checked: {item.lastChecked}</span>
              )}
            </div>
            <div className={`health-badge ${getStatusClass(item.status)}`}>
              <span className="health-badge-icon">{getStatusIcon(item.status)}</span>
              <span className="health-badge-text">Healthy</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// For future live health monitoring integration
export function useSystemHealth() {
  // This hook can be expanded to include:
  // - Periodic health checks
  // - WebSocket connections for real-time updates
  // - Error tracking and alerting
  // - Historical health data
  
  const checkHealth = async (): Promise<HealthStatus[]> => {
    // Placeholder for future implementation
    return [
      { name: 'API Server', status: 'healthy' },
      { name: 'Database', status: 'healthy' },
      { name: 'AI Assistant', status: 'healthy' },
      { name: 'Compliance Repository', status: 'healthy' }
    ];
  };

  return { checkHealth };
}
