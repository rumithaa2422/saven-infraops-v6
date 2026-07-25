import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../services/api';
import { MyProfileSection } from '../components/settings/MyProfileSection';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { Toast } from '../components/settings/Toast';

type SettingsTab = 'profile' | 'preferences';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  department: string | null;
  roles: string[];
}

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      setProfile({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        phoneNumber: response.data.phoneNumber,
        department: response.data.department,
        roles: user?.roles || []
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      showToast('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Show toast helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Navigation items
  const navItems: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="settings-page-new">
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack settings">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">Settings</h1>
              <p className="page-header-subtitle">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="settings-page-new">
          {/* Left Navigation */}
          <div className="settings-nav">
        <div className="settings-nav-header">
          <span className="eyebrow">Settings</span>
          <h2>Account Settings</h2>
        </div>
        <nav className="settings-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="settings-nav-footer">
          <div className="user-info-mini">
            <span className="user-avatar-small">👤</span>
            <span className="user-name-small">{profile?.name || user?.name || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="settings-content">
        {activeTab === 'profile' && (
          <MyProfileSection 
            profile={profile} 
            onProfileUpdate={fetchProfile}
            showToast={showToast}
          />
        )}
        {activeTab === 'preferences' && (
          <PreferencesSection showToast={showToast} />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
        </div>
      </div>
    </div>
  );
}
