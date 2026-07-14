import { useState } from 'react';
import { api } from '../../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  department: string | null;
  roles: string[];
}

interface Props {
  profile: UserProfile | null;
  onProfileUpdate: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function MyProfileSection({ profile, onProfileUpdate, showToast }: Props) {
  const [name, setName] = useState(profile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  // Update local state when profile changes
  if (profile && name !== profile.name && !saving) {
    setName(profile.name);
  }
  if (profile && phoneNumber !== (profile.phoneNumber || '') && !saving) {
    setPhoneNumber(profile.phoneNumber || '');
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/me', {
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null
      });
      showToast('success', 'Profile updated successfully');
      onProfileUpdate();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      showToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatRoles = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'User';
    return roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()).join(', ');
  };

  return (
    <div className="settings-section-content">
      <div className="section-header">
        <h3>My Profile</h3>
        <p>Manage your personal information</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <span>👤</span>
        </div>
        <div className="profile-info">
          <h4>{profile?.name || 'User'}</h4>
          <p>{profile?.email || ''}</p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={profile?.email || ''}
            disabled
          />
          <span className="form-hint">Email cannot be changed</span>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Department</label>
          <input
            type="text"
            className="form-input"
            value={profile?.department || 'Not assigned'}
            disabled
          />
          <span className="form-hint">Contact admin to change department</span>
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <input
            type="text"
            className="form-input"
            value={formatRoles(profile?.roles || [])}
            disabled
          />
          <span className="form-hint">Contact admin to change role</span>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
