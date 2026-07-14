import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Props {
  showToast: (type: 'success' | 'error', message: string) => void;
}

const STORAGE_KEY = 'infraops_user_notifications';

interface NotificationSettings {
  emailServiceRequests: boolean;
  emailIncidents: boolean;
  emailChanges: boolean;
  emailAccess: boolean;
  browserEnabled: boolean;
}

export function NotificationsSection({ showToast }: Props) {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailServiceRequests: true,
    emailIncidents: true,
    emailChanges: true,
    emailAccess: true,
    browserEnabled: false
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notifications from localStorage or API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Try to load from API first
        const response = await api.get('/users/me/preferences');
        const prefs = response.data;
        
        setNotifications({
          emailServiceRequests: prefs.notifyServiceRequests ?? true,
          emailIncidents: prefs.notifyIncidents ?? true,
          emailChanges: prefs.notifyChanges ?? true,
          emailAccess: prefs.notifyAccess ?? true,
          browserEnabled: prefs.browserEnabled ?? false
        });
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveNotifications = async () => {
    setSaving(true);
    const settings = { ...notifications };

    try {
      // Try to save to API first
      await api.put('/users/me/preferences', {
        notifyServiceRequests: settings.emailServiceRequests,
        notifyIncidents: settings.emailIncidents,
        notifyChanges: settings.emailChanges,
        notifyAccess: settings.emailAccess,
        browserEnabled: settings.browserEnabled
      });
      // Also save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast('success', 'Notification settings saved');
    } catch (err: any) {
      // If API fails, save to localStorage only
      console.error('Failed to save notifications to API:', err);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast('success', 'Settings saved locally');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-section-content">
        <div className="settings-loading-inline">
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section-content">
      <div className="section-header">
        <h3>Notifications</h3>
        <p>Choose how you want to be notified</p>
      </div>

      <div className="form-card">
        <div className="notification-group">
          <h4 className="notification-group-title">Email Notifications</h4>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Service Requests</span>
              <span className="toggle-desc">Receive updates about your service requests</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.emailServiceRequests}
                onChange={() => handleToggle('emailServiceRequests')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Assigned Incidents</span>
              <span className="toggle-desc">Get notified when incidents are assigned to you</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.emailIncidents}
                onChange={() => handleToggle('emailIncidents')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Change Approvals</span>
              <span className="toggle-desc">Receive change request approval notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.emailChanges}
                onChange={() => handleToggle('emailChanges')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Access Requests</span>
              <span className="toggle-desc">Get notified about access request updates</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.emailAccess}
                onChange={() => handleToggle('emailAccess')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="notification-group">
          <h4 className="notification-group-title">Browser Notifications</h4>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Enable Browser Notifications</span>
              <span className="toggle-desc">Get real-time notifications in your browser</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.browserEnabled}
                onChange={() => handleToggle('browserEnabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={saveNotifications}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
