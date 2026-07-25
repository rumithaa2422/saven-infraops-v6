import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Role = {
  id: string;
  name: string;
};

const DEPARTMENTS = ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'];
const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Intern', 'Consultant'];

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const isOwnProfile = currentUser?.id === id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    roleId: '',
    employmentType: '',
    dateJoined: '',
    status: 'ACTIVE',
    address: '',
    remarks: ''
  });

  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/users-teams/${id}`);
      const user = response.data.item || response.data;
      
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        employeeId: user.employeeId || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        department: user.department || '',
        designation: user.designation || '',
        roleId: user.roles?.[0]?.role?.id || '',
        employmentType: user.employmentType || '',
        dateJoined: user.dateJoined ? user.dateJoined.split('T')[0] : '',
        status: user.status,
        address: user.address || '',
        remarks: user.remarks || ''
      });
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.items || response.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchRoles();
  }, [fetchUser, fetchRoles]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
    }
    if (!formData.employmentType) {
      newErrors.employmentType = 'Employment Type is required';
    }
    if (!formData.dateJoined) {
      newErrors.dateJoined = 'Joining Date is required';
    }
    if (formData.phoneNumber && !/^[\d\s\-+()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        employeeId: formData.employeeId,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        department: formData.department,
        designation: formData.designation,
        roleId: formData.roleId,
        employmentType: formData.employmentType,
        dateJoined: formData.dateJoined,
        status: formData.status,
        address: formData.address || undefined,
        remarks: formData.remarks || undefined
      };

      await api.patch(`/users-teams/${id}`, payload);
      navigate(`/users-teams/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="form-page">
        <div className="form-loading">
          <div className="spinner"></div>
          <span>Loading user...</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && !isOwnProfile) {
    return (
      <div className="form-page">
        <div className="form-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>You do not have permission to edit this user.</p>
          <button className="btn-back" onClick={() => navigate('/users-teams')}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack edit-user">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-secondary" onClick={() => navigate(`/users-teams/${id}`)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">Edit User</h1>
              <p className="page-header-subtitle">Update user information</p>
            </div>
          </div>
        </div>

      <form className="form-content" onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="form-card">
          <div className="form-card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Basic Information
            </h2>
          </div>
          <div className="form-card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
              <div className="form-group">
                <label>Employee ID <span className="required">*</span></label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g., EMP001"
                  className={errors.employeeId ? 'error' : ''}
                />
                {errors.employeeId && <span className="error-message">{errors.employeeId}</span>}
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className={errors.phoneNumber ? 'error' : ''}
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Organization Information */}
        <div className="form-card">
          <div className="form-card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Organization Information
            </h2>
          </div>
          <div className="form-card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Department <span className="required">*</span></label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={errors.department ? 'error' : ''}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.department && <span className="error-message">{errors.department}</span>}
              </div>
              <div className="form-group">
                <label>Designation <span className="required">*</span></label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer"
                  className={errors.designation ? 'error' : ''}
                />
                {errors.designation && <span className="error-message">{errors.designation}</span>}
              </div>
              <div className="form-group">
                <label>Role <span className="required">*</span></label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  disabled={rolesLoading}
                  className={errors.roleId ? 'error' : ''}
                >
                  <option value="">Select Role</option>
                  {rolesLoading ? (
                    <option value="" disabled>Loading roles...</option>
                  ) : (
                    roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  )}
                </select>
                {errors.roleId && <span className="error-message">{errors.roleId}</span>}
              </div>
              <div className="form-group">
                <label>Employment Type <span className="required">*</span></label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className={errors.employmentType ? 'error' : ''}
                >
                  <option value="">Select Employment Type</option>
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.employmentType && <span className="error-message">{errors.employmentType}</span>}
              </div>
              <div className="form-group">
                <label>Joining Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="dateJoined"
                  value={formData.dateJoined}
                  onChange={handleChange}
                  className={errors.dateJoined ? 'error' : ''}
                />
                {errors.dateJoined && <span className="error-message">{errors.dateJoined}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Status */}
        <div className="form-card">
          <div className="form-card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Status
            </h2>
          </div>
          <div className="form-card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Additional Information */}
        <div className="form-card">
          <div className="form-card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Additional Information
            </h2>
          </div>
          <div className="form-card-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address (optional)"
                  rows={3}
                />
              </div>
              <div className="form-group full-width">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/users-teams/${id}`)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
