import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

// Types
interface SystemSetting {
  id: string;
  group: string;
  key: string;
  value: string;
  isSecret: boolean;
  updatedBy?: string;
}

interface SystemInfo {
  appVersion: string;
  backendVersion: string;
  frontendVersion: string;
  environment: string;
  databaseStatus: string;
  aiStatus: string;
  serverTime: string;
  buildDate: string;
}

interface IntegrationStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  detail: string;
}

// Permission check helper
function usePermissionCheck() {
  const { hasPermission } = useAuth();
  
  const canManage = hasPermission('set:manage');
  const canView = hasPermission('set:view') || canManage;
  const isSuperAdmin = hasPermission('sys:admin');
  
  return { canManage, canView, isSuperAdmin };
}

// Section wrapper component
function SettingsSection({ 
  title, 
  description, 
  icon, 
  children, 
  className = '' 
}: { 
  title: string; 
  description?: string; 
  icon: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`settings-section ${className}`}>
      <div className="settings-section-header">
        <div className="settings-section-icon">{icon}</div>
        <div className="settings-section-info">
          <h3 className="settings-section-title">{title}</h3>
          {description && <p className="settings-section-desc">{description}</p>}
        </div>
      </div>
      <div className="settings-section-content">
        {children}
      </div>
    </div>
  );
}

// Info row component
function InfoRow({ label, value, variant }: { label: string; value: string; variant?: 'success' | 'warning' | 'error' }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${variant ? `info-value--${variant}` : ''}`}>{value}</span>
    </div>
  );
}

// Toggle setting component
function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}: { 
  label: string; 
  description?: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-setting">
      <div className="toggle-setting-info">
        <span className="toggle-setting-label">{label}</span>
        {description && <span className="toggle-setting-desc">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

// Select setting component
function SelectSetting({
  label,
  value,
  options,
  onChange,
  disabled = false
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="select-setting">
      <label className="select-label">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="select-input"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Input setting component
function InputSetting({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  secret = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  secret?: boolean;
}) {
  return (
    <div className="input-setting">
      <label className="input-label">{label}</label>
      <input 
        type={secret ? 'password' : type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field"
      />
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const labels = {
    healthy: 'Connected',
    warning: 'Warning',
    error: 'Disconnected'
  };
  
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-dot"></span>
      {labels[status]}
    </span>
  );
}

// Main SuperAdminSettings component
export function SuperAdminSettings() {
  const { canManage } = usePermissionCheck();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [orgSettings, setOrgSettings] = useState({
    companyName: '',
    supportEmail: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en'
  });

  const [authSettings, setAuthSettings] = useState({
    passwordMinLength: '8',
    sessionTimeout: '30',
    mfaEnabled: false,
    lockoutAttempts: '5',
    lockoutDuration: '15'
  });

  const [aiSettings, setAiSettings] = useState({
    provider: 'OpenAI',
    model: 'gpt-4',
    status: 'Active'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    incidentAlerts: true,
    changeApprovals: true,
    accessRequests: true,
    slaBreaches: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    auditLogging: true,
    jwtLifetime: '24',
    uploadLimit: '10',
    allowedTypes: 'pdf,doc,docx,jpg,png',
    retentionDays: '365'
  });

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, healthRes] = await Promise.all([
        api.get('/settings'),
        api.get('/dashboard/health')
      ]);
      
      setSettings(settingsRes.data.items || []);
      
      // Parse settings into categories
      const items = settingsRes.data.items || [];
      const getSetting = (key: string, defaultVal: string = '') => {
        const item = items.find((s: SystemSetting) => s.key === key);
        return item ? item.value : defaultVal;
      };
      
      setOrgSettings({
        companyName: getSetting('company_name', 'InfraOps'),
        supportEmail: getSetting('support_email', 'support@infraops.com'),
        timezone: getSetting('timezone', 'UTC'),
        dateFormat: getSetting('date_format', 'MM/DD/YYYY'),
        currency: getSetting('currency', 'USD'),
        language: getSetting('language', 'en')
      });

      setAuthSettings({
        passwordMinLength: getSetting('password_min_length', '8'),
        sessionTimeout: getSetting('session_timeout', '30'),
        mfaEnabled: getSetting('mfa_enabled', 'false') === 'true',
        lockoutAttempts: getSetting('lockout_attempts', '5'),
        lockoutDuration: getSetting('lockout_duration', '15')
      });

      setAiSettings({
        provider: getSetting('ai_provider', 'OpenAI'),
        model: getSetting('ai_model', 'gpt-4'),
        status: 'Active'
      });

      setNotificationSettings({
        emailEnabled: getSetting('notify_email', 'true') === 'true',
        incidentAlerts: getSetting('notify_incidents', 'true') === 'true',
        changeApprovals: getSetting('notify_changes', 'true') === 'true',
        accessRequests: getSetting('notify_access', 'true') === 'true',
        slaBreaches: getSetting('notify_sla', 'true') === 'true'
      });

      setSecuritySettings({
        auditLogging: getSetting('audit_logging', 'true') === 'true',
        jwtLifetime: getSetting('jwt_lifetime', '24'),
        uploadLimit: getSetting('upload_limit_mb', '10'),
        allowedTypes: getSetting('allowed_file_types', 'pdf,doc,docx,jpg,png'),
        retentionDays: getSetting('data_retention_days', '365')
      });

      // System info from health endpoint
      if (healthRes.data) {
        const dbStatus = healthRes.data.services?.find((s: any) => s.name === 'Database');
        setSystemInfo({
          appVersion: getSetting('app_version', '1.0.0'),
          backendVersion: getSetting('backend_version', '1.0.0'),
          frontendVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
          environment: import.meta.env.MODE || 'development',
          databaseStatus: dbStatus?.status === 'healthy' ? 'Connected' : 'Disconnected',
          aiStatus: healthRes.data.services?.find((s: any) => s.name === 'AI Assistant')?.status === 'healthy' ? 'Available' : 'Unavailable',
          serverTime: new Date().toISOString(),
          buildDate: getSetting('build_date', 'N/A')
        });

        setIntegrations([
          { name: 'Email Service', status: 'healthy', detail: 'SMTP configured' },
          { name: 'AI Provider', status: 'healthy', detail: aiSettings.provider },
          { name: 'Database', status: dbStatus?.status || 'healthy', detail: 'MySQL connected' },
          { name: 'Storage', status: 'healthy', detail: 'Local storage' }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save a setting
  const saveSetting = async (key: string, value: string) => {
    if (!canManage) return;
    
    setSaving(true);
    try {
      await api.put(`/settings/${key}`, { value });
      // Refresh settings after save
      await fetchSettings();
    } catch (err) {
      console.error('Failed to save setting:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <div>
            <span className="eyebrow">Administration</span>
            <h2>Settings</h2>
          </div>
        </div>
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>System Settings</h2>
        </div>
        {saving && <span className="saving-indicator">Saving...</span>}
      </div>

      <div className="settings-grid-container">
        {/* Organization Settings */}
        <SettingsSection
          title="Organization Settings"
          description="Configure your organization's basic information"
          icon="🏢"
        >
          <div className="settings-form">
            <InputSetting
              label="Company Name"
              value={orgSettings.companyName}
              onChange={(v) => setOrgSettings(prev => ({ ...prev, companyName: v }))}
              disabled={!canManage}
            />
            <InputSetting
              label="Support Email"
              value={orgSettings.supportEmail}
              onChange={(v) => setOrgSettings(prev => ({ ...prev, supportEmail: v }))}
              type="email"
              disabled={!canManage}
            />
            <SelectSetting
              label="Time Zone"
              value={orgSettings.timezone}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time' },
                { value: 'America/Los_Angeles', label: 'Pacific Time' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Asia/Tokyo', label: 'Tokyo' }
              ]}
              onChange={(v) => {
                setOrgSettings(prev => ({ ...prev, timezone: v }));
                saveSetting('timezone', v);
              }}
              disabled={!canManage}
            />
            <SelectSetting
              label="Date Format"
              value={orgSettings.dateFormat}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
              ]}
              onChange={(v) => {
                setOrgSettings(prev => ({ ...prev, dateFormat: v }));
                saveSetting('date_format', v);
              }}
              disabled={!canManage}
            />
            <SelectSetting
              label="Currency"
              value={orgSettings.currency}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'JPY', label: 'JPY (¥)' }
              ]}
              onChange={(v) => {
                setOrgSettings(prev => ({ ...prev, currency: v }));
                saveSetting('currency', v);
              }}
              disabled={!canManage}
            />
            {canManage && (
              <button 
                className="settings-save-btn"
                onClick={() => {
                  saveSetting('company_name', orgSettings.companyName);
                  saveSetting('support_email', orgSettings.supportEmail);
                }}
                disabled={saving}
              >
                Save Organization Settings
              </button>
            )}
          </div>
        </SettingsSection>

        {/* User & Authentication Settings */}
        <SettingsSection
          title="User & Authentication"
          description="Configure authentication and security policies"
          icon="🔐"
        >
          <div className="settings-form">
            <InputSetting
              label="Minimum Password Length"
              value={authSettings.passwordMinLength}
              onChange={(v) => setAuthSettings(prev => ({ ...prev, passwordMinLength: v }))}
              type="number"
              disabled={!canManage}
            />
            <InputSetting
              label="Session Timeout (minutes)"
              value={authSettings.sessionTimeout}
              onChange={(v) => setAuthSettings(prev => ({ ...prev, sessionTimeout: v }))}
              type="number"
              disabled={!canManage}
            />
            <ToggleSetting
              label="Multi-Factor Authentication"
              description="Require MFA for all users"
              checked={authSettings.mfaEnabled}
              onChange={(v) => {
                setAuthSettings(prev => ({ ...prev, mfaEnabled: v }));
                saveSetting('mfa_enabled', String(v));
              }}
              disabled={!canManage}
            />
            <InputSetting
              label="Account Lockout Attempts"
              value={authSettings.lockoutAttempts}
              onChange={(v) => setAuthSettings(prev => ({ ...prev, lockoutAttempts: v }))}
              type="number"
              disabled={!canManage}
            />
            <InputSetting
              label="Lockout Duration (minutes)"
              value={authSettings.lockoutDuration}
              onChange={(v) => setAuthSettings(prev => ({ ...prev, lockoutDuration: v }))}
              type="number"
              disabled={!canManage}
            />
            {canManage && (
              <button 
                className="settings-save-btn"
                onClick={() => {
                  saveSetting('password_min_length', authSettings.passwordMinLength);
                  saveSetting('session_timeout', authSettings.sessionTimeout);
                  saveSetting('lockout_attempts', authSettings.lockoutAttempts);
                  saveSetting('lockout_duration', authSettings.lockoutDuration);
                }}
                disabled={saving}
              >
                Save Authentication Settings
              </button>
            )}
          </div>
        </SettingsSection>

        {/* AI Settings */}
        <SettingsSection
          title="AI Settings"
          description="Configure AI assistant integration"
          icon="🤖"
        >
          <div className="settings-form">
            <div className="info-row">
              <span className="info-label">AI Provider</span>
              <span className="info-value">{aiSettings.provider}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Model Name</span>
              <span className="info-value">{aiSettings.model}</span>
            </div>
            <div className="info-row">
              <span className="info-label">API Status</span>
              <StatusBadge status="healthy" />
            </div>
            <p className="settings-note">
              AI configuration is managed through environment variables. API keys are not exposed for security reasons.
            </p>
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notification Settings"
          description="Configure system notification preferences"
          icon="🔔"
        >
          <div className="settings-form">
            <ToggleSetting
              label="Email Notifications"
              description="Send email notifications"
              checked={notificationSettings.emailEnabled}
              onChange={(v) => {
                setNotificationSettings(prev => ({ ...prev, emailEnabled: v }));
                saveSetting('notify_email', String(v));
              }}
              disabled={!canManage}
            />
            <ToggleSetting
              label="Incident Alerts"
              description="Notify on incident creation and updates"
              checked={notificationSettings.incidentAlerts}
              onChange={(v) => {
                setNotificationSettings(prev => ({ ...prev, incidentAlerts: v }));
                saveSetting('notify_incidents', String(v));
              }}
              disabled={!canManage}
            />
            <ToggleSetting
              label="Change Approval Notifications"
              description="Notify on change request status changes"
              checked={notificationSettings.changeApprovals}
              onChange={(v) => {
                setNotificationSettings(prev => ({ ...prev, changeApprovals: v }));
                saveSetting('notify_changes', String(v));
              }}
              disabled={!canManage}
            />
            <ToggleSetting
              label="Access Request Notifications"
              description="Notify on access request updates"
              checked={notificationSettings.accessRequests}
              onChange={(v) => {
                setNotificationSettings(prev => ({ ...prev, accessRequests: v }));
                saveSetting('notify_access', String(v));
              }}
              disabled={!canManage}
            />
            <ToggleSetting
              label="SLA Breach Alerts"
              description="Notify when tickets approach SLA breach"
              checked={notificationSettings.slaBreaches}
              onChange={(v) => {
                setNotificationSettings(prev => ({ ...prev, slaBreaches: v }));
                saveSetting('notify_sla', String(v));
              }}
              disabled={!canManage}
            />
          </div>
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection
          title="Security Settings"
          description="Configure security and data policies"
          icon="🛡️"
        >
          <div className="settings-form">
            <ToggleSetting
              label="Audit Logging"
              description="Log all user actions for compliance"
              checked={securitySettings.auditLogging}
              onChange={(v) => {
                setSecuritySettings(prev => ({ ...prev, auditLogging: v }));
                saveSetting('audit_logging', String(v));
              }}
              disabled={!canManage}
            />
            <InputSetting
              label="JWT Token Lifetime (hours)"
              value={securitySettings.jwtLifetime}
              onChange={(v) => setSecuritySettings(prev => ({ ...prev, jwtLifetime: v }))}
              type="number"
              disabled={!canManage}
            />
            <InputSetting
              label="File Upload Limit (MB)"
              value={securitySettings.uploadLimit}
              onChange={(v) => setSecuritySettings(prev => ({ ...prev, uploadLimit: v }))}
              type="number"
              disabled={!canManage}
            />
            <InputSetting
              label="Allowed File Types"
              value={securitySettings.allowedTypes}
              onChange={(v) => setSecuritySettings(prev => ({ ...prev, allowedTypes: v }))}
              placeholder="pdf,doc,docx,jpg,png"
              disabled={!canManage}
            />
            <InputSetting
              label="Data Retention (days)"
              value={securitySettings.retentionDays}
              onChange={(v) => setSecuritySettings(prev => ({ ...prev, retentionDays: v }))}
              type="number"
              disabled={!canManage}
            />
            {canManage && (
              <button 
                className="settings-save-btn"
                onClick={() => {
                  saveSetting('jwt_lifetime', securitySettings.jwtLifetime);
                  saveSetting('upload_limit_mb', securitySettings.uploadLimit);
                  saveSetting('allowed_file_types', securitySettings.allowedTypes);
                  saveSetting('data_retention_days', securitySettings.retentionDays);
                }}
                disabled={saving}
              >
                Save Security Settings
              </button>
            )}
          </div>
        </SettingsSection>

        {/* Integrations */}
        <SettingsSection
          title="Integrations"
          description="External services and integrations status"
          icon="🔌"
        >
          <div className="integrations-list">
            {integrations.map((integration, index) => (
              <div key={index} className="integration-item">
                <div className="integration-info">
                  <span className="integration-name">{integration.name}</span>
                  <span className="integration-detail">{integration.detail}</span>
                </div>
                <StatusBadge status={integration.status} />
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* System Information */}
        <SettingsSection
          title="System Information"
          description="Application version and environment details (read-only)"
          icon="ℹ️"
        >
          <div className="settings-form">
            <InfoRow label="Application Version" value={systemInfo?.appVersion || 'N/A'} />
            <InfoRow label="Backend Version" value={systemInfo?.backendVersion || 'N/A'} />
            <InfoRow label="Frontend Version" value={systemInfo?.frontendVersion || 'N/A'} />
            <InfoRow label="Environment" value={systemInfo?.environment || 'development'} />
            <InfoRow 
              label="Database Status" 
              value={systemInfo?.databaseStatus || 'Unknown'}
              variant={systemInfo?.databaseStatus === 'Connected' ? 'success' : 'error'}
            />
            <InfoRow 
              label="AI Status" 
              value={systemInfo?.aiStatus || 'Unknown'}
              variant={systemInfo?.aiStatus === 'Available' ? 'success' : 'warning'}
            />
            <InfoRow label="Server Time" value={systemInfo?.serverTime ? new Date(systemInfo.serverTime).toLocaleString() : 'N/A'} />
            <InfoRow label="Build Date" value={systemInfo?.buildDate || 'N/A'} />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
