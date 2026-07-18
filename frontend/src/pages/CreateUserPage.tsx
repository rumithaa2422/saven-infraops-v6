import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Role = {
  id: string;
  name: string;
};

const DEPARTMENTS = ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'];
const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Intern', 'Consultant'];

export function CreateUserPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
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
    dateJoined: ''
  });

  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const response = await api.get('/roles');
      const roleData = response.data.items || response.data || [];
      setRoles(roleData);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    setLoading(true);
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
        dateJoined: formData.dateJoined
      };

      await api.post('/auth/register', payload);
      navigate('/users-teams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="form-page">
        <div className="form-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>You do not have permission to create users.</p>
          <button className="btn-back" onClick={() => navigate('/users-teams')}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      {/* Header */}
      <div className="form-header">
        <button className="btn-back-top" onClick={() => navigate('/users-teams')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Users
        </button>
        <h1>Create User</h1>
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

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/users-teams')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
