import { useState, useEffect, useCallback } from 'react';
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

// Apply theme to document
const applyTheme = (theme: string) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

const STORAGE_KEY = 'infraops_preferences';

export function PreferencesSection({ showToast }: Props) {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        setTheme(prefs.theme || 'light');
        setLanguage(prefs.language || 'en');
        setTimezone(prefs.timezone || getBrowserTimezone());
        // Apply saved theme immediately
        applyTheme(prefs.theme || 'light');
      }
      setLoading(false);
    };
    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = useCallback(async () => {
    setSaving(true);
    const preferences = { theme, language, timezone };

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      
      // Apply theme immediately
      applyTheme(theme);
      
      // Try to sync with backend
      try {
        await api.put('/users/me/preferences', preferences);
      } catch {
        // Backend save failed, but localStorage works
      }
      
      showToast('success', 'Preferences saved');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      showToast('error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }, [theme, language, timezone, showToast]);

  // Handle theme change and apply immediately
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
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
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
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
