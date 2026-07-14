import { useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

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

// Input field component
function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="input-setting">
      <label className="input-label">{label}</label>
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field"
      />
    </div>
  );
}

// Toggle setting component
function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description?: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
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
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="select-setting">
      <label className="select-label">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="select-input"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Main ManagerSettings component
export function ManagerSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    incidentAssigned: true,
    changeApproval: true,
    accessRequests: true,
    slaAlerts: true
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Save profile
  const saveProfile = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/me', {
        name: profile.name,
        phoneNumber: profile.phone
      });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/settings/user-preferences', {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone
      });
      setMessage({ type: 'success', text: 'Preferences saved' });
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Change password
  const changePassword = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully' });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  }, [passwordForm]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <span className="eyebrow">My Settings</span>
          <h2>Manager Settings</h2>
        </div>
        {message && (
          <div className={`settings-message settings-message--${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="settings-grid-container">
        {/* Profile Section */}
        <SettingsSection
          title="My Profile"
          description="Your personal information"
          icon="👤"
        >
          <div className="settings-form">
            <InputField
              label="Full Name"
              value={profile.name}
              onChange={(v) => setProfile(prev => ({ ...prev, name: v }))}
              placeholder="Enter your name"
            />
            <InputField
              label="Email Address"
              value={profile.email}
              onChange={(v) => setProfile(prev => ({ ...prev, email: v }))}
              type="email"
              placeholder="your@email.com"
              disabled
            />
            <InputField
              label="Phone Number"
              value={profile.phone}
              onChange={(v) => setProfile(prev => ({ ...prev, phone: v }))}
              type="tel"
              placeholder="+1 (555) 123-4567"
            />
            <button 
              className="settings-save-btn"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection
          title="Preferences"
          description="Customize your experience"
          icon="⚙️"
        >
          <div className="settings-form">
            <SelectSetting
              label="Theme"
              value={preferences.theme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System Default' }
              ]}
              onChange={(v) => setPreferences(prev => ({ ...prev, theme: v }))}
            />
            <SelectSetting
              label="Language"
              value={preferences.language}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' }
              ]}
              onChange={(v) => setPreferences(prev => ({ ...prev, language: v }))}
            />
            <SelectSetting
              label="Time Zone"
              value={preferences.timezone}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time' },
                { value: 'America/Los_Angeles', label: 'Pacific Time' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Asia/Tokyo', label: 'Tokyo' }
              ]}
              onChange={(v) => setPreferences(prev => ({ ...prev, timezone: v }))}
            />
            <button 
              className="settings-save-btn"
              onClick={savePreferences}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection
          title="Notifications"
          description="Configure your notification preferences"
          icon="🔔"
        >
          <div className="settings-form">
            <ToggleSetting
              label="Incident Assigned"
              description="Notify me when an incident is assigned to me"
              checked={notifications.incidentAssigned}
              onChange={(v) => setNotifications(prev => ({ ...prev, incidentAssigned: v }))}
            />
            <ToggleSetting
              label="Change Approval"
              description="Notify me of change request approvals"
              checked={notifications.changeApproval}
              onChange={(v) => setNotifications(prev => ({ ...prev, changeApproval: v }))}
            />
            <ToggleSetting
              label="Access Requests"
              description="Notify me of access request updates"
              checked={notifications.accessRequests}
              onChange={(v) => setNotifications(prev => ({ ...prev, accessRequests: v }))}
            />
            <ToggleSetting
              label="SLA Alerts"
              description="Notify me of approaching SLA breaches"
              checked={notifications.slaAlerts}
              onChange={(v) => setNotifications(prev => ({ ...prev, slaAlerts: v }))}
            />
          </div>
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection
          title="Security"
          description="Manage your account security"
          icon="🔒"
        >
          <div className="settings-form">
            <h4 className="settings-subsection-title">Change Password</h4>
            <InputField
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(v) => setPasswordForm(prev => ({ ...prev, currentPassword: v }))}
              type="password"
              placeholder="Enter current password"
            />
            <InputField
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(v) => setPasswordForm(prev => ({ ...prev, newPassword: v }))}
              type="password"
              placeholder="Enter new password"
            />
            <InputField
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(v) => setPasswordForm(prev => ({ ...prev, confirmPassword: v }))}
              type="password"
              placeholder="Confirm new password"
            />
            <button 
              className="settings-save-btn"
              onClick={changePassword}
              disabled={saving}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </SettingsSection>

        {/* Active Sessions (Info Only) */}
        <SettingsSection
          title="Active Sessions"
          description="Devices where you're currently logged in"
          icon="📱"
        >
          <div className="sessions-list">
            <div className="session-item">
              <div className="session-info">
                <span className="session-device">Current Session</span>
                <span className="session-detail">This device • Active now</span>
              </div>
              <span className="session-status session-status--active">Active</span>
            </div>
          </div>
          <p className="settings-note">
            Session management will be available in a future update.
          </p>
        </SettingsSection>
      </div>
    </div>
  );
}
