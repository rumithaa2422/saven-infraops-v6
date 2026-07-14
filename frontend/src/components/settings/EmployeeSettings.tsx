import { useState, useCallback, useEffect } from 'react';
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

// Main EmployeeSettings component
export function EmployeeSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
    myTickets: true,
    myRequests: true,
    assignedIncidents: true
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile and preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, prefsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/users/me/preferences')
        ]);
        
        const profileData = profileRes.data;
        setProfile({
          name: profileData.name || user?.name || '',
          email: profileData.email || user?.email || '',
          phone: profileData.phoneNumber || ''
        });
        
        const prefsData = prefsRes.data;
        setPreferences({
          theme: prefsData.theme || 'light',
          language: prefsData.language || 'en',
          timezone: prefsData.timezone || 'UTC'
        });
        
        setNotifications({
          myTickets: prefsData.notifyMyTickets ?? true,
          myRequests: prefsData.notifyMyRequests ?? true,
          assignedIncidents: prefsData.notifyAssignedIncidents ?? true
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Show message helper
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Save profile
  const saveProfile = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/me', {
        name: profile.name,
        phoneNumber: profile.phone
      });
      showMessage('success', 'Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/me/preferences', {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        notifyMyTickets: notifications.myTickets,
        notifyMyRequests: notifications.myRequests,
        notifyAssignedIncidents: notifications.assignedIncidents
      });
      showMessage('success', 'Preferences saved successfully');
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      showMessage('error', err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }, [preferences, notifications]);

  // Save notifications only
  const saveNotifications = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/me/preferences', {
        notifyMyTickets: notifications.myTickets,
        notifyMyRequests: notifications.myRequests,
        notifyAssignedIncidents: notifications.assignedIncidents
      });
      showMessage('success', 'Notification settings saved');
    } catch (err: any) {
      console.error('Failed to save notifications:', err);
      showMessage('error', err.response?.data?.message || 'Failed to save notifications');
    } finally {
      setSaving(false);
    }
  }, [notifications]);

  // Change password
  const changePassword = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }
    
    if (!passwordForm.currentPassword) {
      showMessage('error', 'Current password is required');
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
      showMessage('success', 'Password changed successfully');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      showMessage('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }, [passwordForm]);

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <div>
            <span className="eyebrow">My Settings</span>
            <h2>Personal Settings</h2>
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
          <span className="eyebrow">My Settings</span>
          <h2>Personal Settings</h2>
        </div>
        {message && (
          <div className={`settings-message settings-message--${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="settings-grid-container settings-grid-container--employee">
        {/* My Profile Section */}
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
              label="My Tickets"
              description="Notify me of updates to my submitted tickets"
              checked={notifications.myTickets}
              onChange={(v) => setNotifications(prev => ({ ...prev, myTickets: v }))}
            />
            <ToggleSetting
              label="My Requests"
              description="Notify me of updates to my service requests"
              checked={notifications.myRequests}
              onChange={(v) => setNotifications(prev => ({ ...prev, myRequests: v }))}
            />
            <ToggleSetting
              label="Assigned Incidents"
              description="Notify me when an incident is assigned to me"
              checked={notifications.assignedIncidents}
              onChange={(v) => setNotifications(prev => ({ ...prev, assignedIncidents: v }))}
            />
            <button 
              className="settings-save-btn"
              onClick={saveNotifications}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Notifications'}
            </button>
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
      </div>
    </div>
  );
}
