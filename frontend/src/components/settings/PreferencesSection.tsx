import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Props {
  showToast: (type: 'success' | 'error', message: string) => void;
}

// Get browser timezone
const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

const STORAGE_KEY = 'infraops_user_preferences';

export function PreferencesSection({ showToast }: Props) {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage or API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Try to load from API first
        const response = await api.get('/users/me/preferences');
        const prefs = response.data;
        
        setTheme(prefs.theme || 'system');
        setLanguage(prefs.language || 'en');
        setTimezone(prefs.timezone || getBrowserTimezone());
        setDateFormat(prefs.dateFormat || 'MM/DD/YYYY');
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const prefs = JSON.parse(stored);
          setTheme(prefs.theme || 'system');
          setLanguage(prefs.language || 'en');
          setTimezone(prefs.timezone || getBrowserTimezone());
          setDateFormat(prefs.dateFormat || 'MM/DD/YYYY');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    const preferences = { theme, language, timezone, dateFormat };

    try {
      // Try to save to API first
      await api.put('/users/me/preferences', preferences);
      // Also save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      showToast('success', 'Preferences saved successfully');
    } catch (err: any) {
      // If API fails, save to localStorage only
      console.error('Failed to save preferences to API:', err);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      showToast('success', 'Preferences saved locally');
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ];

  if (loading) {
    return (
      <div className="settings-section-content">
        <div className="settings-loading-inline">
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section-content">
      <div className="section-header">
        <h3>Preferences</h3>
        <p>Customize your experience</p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="form-label">Theme</label>
          <select
            className="form-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            className="form-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es" disabled>Spanish (Coming Soon)</option>
            <option value="fr" disabled>French (Coming Soon)</option>
            <option value="de" disabled>German (Coming Soon)</option>
          </select>
          <span className="form-hint">Additional languages coming soon</span>
        </div>

        <div className="form-group">
          <label className="form-label">Time Zone</label>
          <select
            className="form-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date Format</label>
          <select
            className="form-select"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={savePreferences}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
