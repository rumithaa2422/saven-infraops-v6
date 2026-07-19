import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AlertTriangle, Clock, Key, Package, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AlertData {
  criticalIncidents: number;
  slaBreaches: number;
  expiringLicenses: number;
  pendingAccessRequests: number;
  overdueChanges: number;
}

interface AlertItem {
  id: string;
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  path: string;
  severity: 'critical' | 'warning' | 'info';
  condition: (data: AlertData) => boolean;
}

export function AlertWidget() {
  const navigate = useNavigate();
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/summary');
      setAlertData({
        criticalIncidents: response.data.criticalIncidents || 0,
        slaBreaches: response.data.slaBreaches || 0,
        expiringLicenses: response.data.expiringLicenses || 0,
        pendingAccessRequests: response.data.pendingAccessRequests || 0,
        overdueChanges: response.data.overdueChanges || 0
      });
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Unable to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const alertItems: AlertItem[] = [
    {
      id: 'critical-incidents',
      label: 'Critical Incidents',
      value: alertData?.criticalIncidents || 0,
      icon: ShieldAlert,
      path: '/incidents?severity=SEV1',
      severity: 'critical',
      condition: (d) => d.criticalIncidents > 0
    },
    {
      id: 'sla-breaches',
      label: 'SLA Breaches',
      value: alertData?.slaBreaches || 0,
      icon: Clock,
      path: '/service-requests?filter=overdue',
      severity: 'critical',
      condition: (d) => d.slaBreaches > 0
    },
    {
      id: 'expiring-licenses',
      label: 'Expiring Licenses',
      value: alertData?.expiringLicenses || 0,
      icon: Package,
      path: '/vendors-licenses?filter=expiring',
      severity: 'warning',
      condition: (d) => d.expiringLicenses > 0
    },
    {
      id: 'pending-access',
      label: 'Pending Access',
      value: alertData?.pendingAccessRequests || 0,
      icon: Key,
      path: '/access-management?filter=pending',
      severity: 'info',
      condition: (d) => d.pendingAccessRequests > 0
    },
    {
      id: 'overdue-changes',
      label: 'Overdue Changes',
      value: alertData?.overdueChanges || 0,
      icon: AlertTriangle,
      path: '/changes?filter=overdue',
      severity: 'warning',
      condition: (d) => d.overdueChanges > 0
    }
  ];

  const activeAlerts = alertItems.filter(item => item.condition(alertData || {
    criticalIncidents: 0,
    slaBreaches: 0,
    expiringLicenses: 0,
    pendingAccessRequests: 0,
    overdueChanges: 0
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Important Alerts</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 flex-1 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Important Alerts</h2>
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">All clear! No urgent items require attention.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Important Alerts</h2>
      <div className="flex flex-wrap gap-2">
        {activeAlerts.map((alert) => {
          const Icon = alert.icon;
          const severityStyles = {
            critical: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
            warning: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
            info: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
          };
          return (
            <button
              key={alert.id}
              onClick={() => navigate(alert.path)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
                transition-colors ${severityStyles[alert.severity]}
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{alert.value} {alert.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
