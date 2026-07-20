import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AlertTriangle, Clock, Key, Package, ShieldAlert, CheckCircle2, Bell } from 'lucide-react';

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
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-50">
            <Bell className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Important Alerts</h2>
            <p className="text-sm text-slate-500">Items requiring attention</p>
          </div>
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 flex-1 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All Clear!</h2>
            <p className="text-sm text-slate-500">No urgent items require attention</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Everything is running smoothly</span>
        </div>
      </div>
    );
  }

  const severityConfig = {
    critical: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      text: 'text-red-600',
      hover: 'hover:bg-red-100'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      text: 'text-amber-600',
      hover: 'hover:bg-amber-100'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100'
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm shadow-amber-500/20">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Important Alerts</h2>
          <p className="text-sm text-slate-500">{activeAlerts.length} item{activeAlerts.length > 1 ? 's' : ''} requiring attention</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {activeAlerts.map((alert) => {
          const Icon = alert.icon;
          const config = severityConfig[alert.severity];
          return (
            <button
              key={alert.id}
              onClick={() => navigate(alert.path)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border ${config.border}
                ${config.bg} ${config.hover} transition-all duration-300
                hover:shadow-md hover:-translate-y-0.5 group
              `}
            >
              <div className={`p-2.5 rounded-xl ${config.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-lg font-bold ${config.text}`}>{alert.value}</span>
                <span className="text-sm font-medium text-slate-700 ml-2">{alert.label}</span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
                {alert.severity.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
