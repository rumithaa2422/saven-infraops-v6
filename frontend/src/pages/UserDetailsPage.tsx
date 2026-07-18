import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  team?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  dateJoined?: string;
  roles: { role: { id: string; name: string } }[];
};

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, [id]);

  async function loadUser() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/users-teams/${id}`);
      setUser(res.data.item || res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getRoleBadgeClass(roleName: string): string {
    if (roleName === 'Super Admin') return 'role-super-admin';
    if (roleName === 'Admin') return 'role-admin';
    if (roleName === 'Manager') return 'role-manager';
    return 'role-employee';
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">
          <div className="spinner"></div>
          <span>Loading user...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'User not found'}</p>
          <button className="btn-back" onClick={() => navigate('/users-teams')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const primaryRole = user.roles?.[0]?.role?.name || 'Employee';
  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="detail-page">
      {/* Back Button */}
      <button className="btn-back-top" onClick={() => navigate('/users-teams')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Users
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-row">
          <div className="detail-avatar">
            {userInitials}
          </div>
          <div className="detail-title-info">
            <h1 className="detail-title">{user.name}</h1>
            <div className="detail-meta-tags">
              <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                {primaryRole}
              </span>
              <span className={`status-badge status-${user.status.toLowerCase()}`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
        <div className="detail-meta-row">
          {user.department && (
            <div className="detail-meta-item">
              <span className="detail-meta-label">Department</span>
              <span className="detail-meta-value">{user.department}</span>
            </div>
          )}
          {user.designation && (
            <div className="detail-meta-item">
              <span className="detail-meta-label">Designation</span>
              <span className="detail-meta-value">{user.designation}</span>
            </div>
          )}
          <div className="detail-meta-item">
            <span className="detail-meta-label">Email</span>
            <span className="detail-meta-value">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="detail-content-grid">
        {/* Main Column */}
        <div className="detail-main">
          {/* Personal Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Personal Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Full Name</label>
                  <span>{user.name}</span>
                </div>
                <div className="detail-info-item">
                  <label>Email</label>
                  <span>{user.email}</span>
                </div>
                <div className="detail-info-item">
                  <label>Phone Number</label>
                  <span>{user.phoneNumber || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Department</label>
                  <span>{user.department || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Designation</label>
                  <span>{user.designation || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Role</label>
                  <span>
                    <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                      {primaryRole}
                    </span>
                  </span>
                </div>
                <div className="detail-info-item">
                  <label>Status</label>
                  <span>
                    <span className={`status-badge status-${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Employment Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Date Joined</label>
                  <span>{formatDate(user.dateJoined)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Employment Type</label>
                  <span>{user.employmentType || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Team</label>
                  <span>{user.team || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Project Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Not assigned to any project.</p>
              </div>
            </div>
          </div>

          {/* Assigned Inventory Card - Placeholder */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Assigned Inventory
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <p>Inventory information will appear once assets are assigned.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Quick Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Quick Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatDateTime(user.updatedAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value">
                  <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                    {primaryRole}
                  </span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{user.department || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
