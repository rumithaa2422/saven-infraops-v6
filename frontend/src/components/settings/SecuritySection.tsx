import { useState } from 'react';
import { api } from '../../services/api';

interface Props {
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function SecuritySection({ showToast }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    // Validate
    if (!currentPassword) {
      showToast('error', 'Current password is required');
      return;
    }

    if (!newPassword) {
      showToast('error', 'New password is required');
      return;
    }

    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      showToast('success', 'Password updated successfully');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      const message = err.response?.data?.message || 'Failed to change password';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-section-content">
      <div className="section-header">
        <h3>Security</h3>
        <p>Manage your account security</p>
      </div>

      <div className="form-card">
        <div className="security-section">
          <h4 className="security-title">Change Password</h4>
          <p className="security-desc">Update your password to keep your account secure</p>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <span className="form-hint">Minimum 8 characters</span>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleChangePassword}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="security-section">
          <h4 className="security-title">Active Sessions</h4>
          <p className="security-desc">Devices where you're currently logged in</p>

          <div className="session-item">
            <div className="session-info">
              <span className="session-device">Current Session</span>
              <span className="session-detail">This device</span>
            </div>
            <span className="session-badge session-badge--active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
