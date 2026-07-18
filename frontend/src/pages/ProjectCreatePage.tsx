import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: { role: { name: string } }[];
};

type VendorOption = {
  id: string;
  vendorName: string;
  vendorCode: string;
};

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');

  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    client: '',
    department: '',
    technologyStack: '',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    budget: '',
    startDate: '',
    expectedEndDate: '',
    projectType: '',
    projectLocation: '',
    description: '',
    remarks: '',
    managerId: '',
    teamMemberIds: [] as string[],
    primaryVendorId: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/users-teams');
      setUsers(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      setVendorsLoading(true);
      const response = await api.get('/vendors?status=ACTIVE&per_page=1000');
      setVendors(response.data.vendors || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchVendors();
  }, [fetchUsers, fetchVendors]);

  const filteredManagers = users.filter(u => {
    const search = managerSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.department?.toLowerCase().includes(search) ?? false)
    );
  });

  const filteredTeamMembers = users.filter(u => {
    const search = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.department?.toLowerCase().includes(search) ?? false)
    );
  });

  const getUserRole = (user: User): string => {
    return user.roles?.[0]?.role?.name || 'Employee';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project Name is required';
    }
    if (!formData.projectCode.trim()) {
      newErrors.projectCode = 'Project Code is required';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'Client Name is required';
    }
    if (!formData.managerId) {
      newErrors.managerId = 'Project Manager is required';
    }
    if (formData.teamMemberIds.length === 0) {
      newErrors.teamMemberIds = 'At least one team member is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
    }
    if (!formData.expectedEndDate) {
      newErrors.expectedEndDate = 'Expected End Date is required';
    }
    if (formData.startDate && formData.expectedEndDate && formData.startDate >= formData.expectedEndDate) {
      newErrors.expectedEndDate = 'Expected End Date must be after Start Date';
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

  const handleManagerSelect = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      managerId: userId,
      teamMemberIds: prev.teamMemberIds.filter(id => id !== userId) // Remove from team if selected as manager
    }));
    setManagerSearch('');
    setErrors(prev => ({ ...prev, managerId: '' }));
  };

  const handleTeamMemberToggle = (userId: string) => {
    if (userId === formData.managerId) return; // Can't add manager as team member
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(userId)
        ? prev.teamMemberIds.filter(id => id !== userId)
        : [...prev.teamMemberIds, userId]
    }));
    setErrors(prev => ({ ...prev, teamMemberIds: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedManager = users.find(u => u.id === formData.managerId);
      await api.post('/projects-environments', {
        projectName: formData.projectName,
        projectCode: formData.projectCode,
        client: formData.client || null,
        ownerName: selectedManager?.name || null,
        department: formData.department || null,
        technologyStack: formData.technologyStack || null,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate || null,
        expectedEndDate: formData.expectedEndDate || null,
        projectType: formData.projectType || null,
        projectLocation: formData.projectLocation || null,
        description: formData.description || null,
        remarks: formData.remarks || null,
        managerId: formData.managerId,
        teamMemberIds: formData.teamMemberIds,
        primaryVendorId: formData.primaryVendorId || null
      });
      
      navigate('/projects-environments');
    } catch (err: any) {
      if (err.response?.data?.message?.includes('already exists')) {
        if (err.response.data.message.includes('code')) {
          setErrors({ projectCode: 'Project code already exists' });
        } else if (err.response.data.message.includes('name')) {
          setErrors({ projectName: 'Project name already exists' });
        }
      } else {
        setError(err.response?.data?.message || 'Failed to create project');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedManager = users.find(u => u.id === formData.managerId);
  const selectedTeamMembers = users.filter(u => formData.teamMemberIds.includes(u.id));

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <button type="button" className="back-btn" onClick={() => navigate('/projects-environments')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div>
            <p className="eyebrow">Projects & Environments</p>
            <h1>Create Project</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-cards-container">
          {/* Project Information Card */}
          <div className="form-card">
            <h3 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Project Information
            </h3>

            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className={errors.projectName ? 'input-error' : ''}
                  />
                  {errors.projectName && <span className="error-text">{errors.projectName}</span>}
                </div>

                <div className="form-group">
                  <label>Project Code *</label>
                  <input
                    type="text"
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleChange}
                    placeholder="e.g., PRJ-001"
                    className={errors.projectCode ? 'input-error' : ''}
                  />
                  {errors.projectCode && <span className="error-text">{errors.projectCode}</span>}
                </div>

                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Enter client name"
                    className={errors.client ? 'input-error' : ''}
                  />
                  {errors.client && <span className="error-text">{errors.client}</span>}
                </div>

                <div className="form-group">
                  <label>Primary Vendor</label>
                  <select
                    name="primaryVendorId"
                    value={formData.primaryVendorId}
                    onChange={handleChange}
                    disabled={vendorsLoading}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName} ({vendor.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                  />
                </div>

                <div className="form-group">
                  <label>Technology Stack</label>
                  <input
                    type="text"
                    name="technologyStack"
                    value={formData.technologyStack}
                    onChange={handleChange}
                    placeholder="e.g., React, Node.js, PostgreSQL"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Project Type</label>
                  <select name="projectType" value={formData.projectType} onChange={handleChange}>
                    <option value="">Select type</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="RESEARCH">Research</option>
                    <option value="CONSULTING">Consulting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Project Location</label>
                  <input
                    type="text"
                    name="projectLocation"
                    value={formData.projectLocation}
                    onChange={handleChange}
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Management Card */}
          <div className="form-card">
            <h3 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Team Management
            </h3>

            {/* Project Manager */}
            <div className="form-section">
              <label className="section-label">Project Manager *</label>
              
              {selectedManager ? (
                <div className="selected-user-card">
                  <div className="user-avatar">
                    {selectedManager.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{selectedManager.name}</span>
                    <span className="user-details">{selectedManager.email}</span>
                    <span className="user-role-badge">Manager</span>
                  </div>
                  <button type="button" className="remove-btn" onClick={() => setFormData(prev => ({ ...prev, managerId: '' }))}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="user-selector">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className={errors.managerId ? 'input-error' : ''}
                  />
                  {errors.managerId && <span className="error-text">{errors.managerId}</span>}
                  
                  {managerSearch && (
                    <div className="user-dropdown">
                      {usersLoading ? (
                        <div className="dropdown-loading">Loading...</div>
                      ) : filteredManagers.length === 0 ? (
                        <div className="dropdown-empty">No users found</div>
                      ) : (
                        filteredManagers.map(u => (
                          <div
                            key={u.id}
                            className="user-option"
                            onClick={() => handleManagerSelect(u.id)}
                          >
                            <div className="user-avatar small">{u.name.charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                              <span className="user-name">{u.name}</span>
                              <span className="user-details">{u.email} • {u.department || 'No department'}</span>
                            </div>
                            <span className="user-role">{getUserRole(u)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="form-section">
              <label className="section-label">Team Members *</label>
              
              {/* Selected Team Members */}
              {selectedTeamMembers.length > 0 && (
                <div className="selected-users-list">
                  {selectedTeamMembers.map(member => (
                    <div key={member.id} className="selected-user-card">
                      <div className="user-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{member.name}</span>
                        <span className="user-details">{member.email}</span>
                        <span className="user-role">{getUserRole(member)}</span>
                      </div>
                      <button type="button" className="remove-btn" onClick={() => handleTeamMemberToggle(member.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="user-selector">
                <input
                  type="text"
                  placeholder="Search to add team members..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={errors.teamMemberIds ? 'input-error' : ''}
                />
                {errors.teamMemberIds && <span className="error-text">{errors.teamMemberIds}</span>}
                
                {userSearch && (
                  <div className="user-dropdown">
                    {usersLoading ? (
                      <div className="dropdown-loading">Loading...</div>
                    ) : filteredTeamMembers.length === 0 ? (
                      <div className="dropdown-empty">No users found</div>
                    ) : (
                      filteredTeamMembers
                        .filter(u => u.id !== formData.managerId && !formData.teamMemberIds.includes(u.id))
                        .map(u => (
                          <div
                            key={u.id}
                            className="user-option"
                            onClick={() => handleTeamMemberToggle(u.id)}
                          >
                            <div className="user-avatar small">{u.name.charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                              <span className="user-name">{u.name}</span>
                              <span className="user-details">{u.email} • {u.department || 'No department'}</span>
                            </div>
                            <span className="user-role">{getUserRole(u)}</span>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline & Budget Card */}
          <div className="form-card">
            <h3 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Timeline & Budget
            </h3>

            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={errors.startDate ? 'input-error' : ''}
                  />
                  {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label>Expected End Date *</label>
                  <input
                    type="date"
                    name="expectedEndDate"
                    value={formData.expectedEndDate}
                    onChange={handleChange}
                    className={errors.expectedEndDate ? 'input-error' : ''}
                  />
                  {errors.expectedEndDate && <span className="error-text">{errors.expectedEndDate}</span>}
                </div>

                <div className="form-group">
                  <label>Budget</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="Enter budget amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Card */}
          <div className="form-card">
            <h3 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Additional Information
            </h3>

            <div className="form-section">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional remarks"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => navigate('/projects-environments')}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
