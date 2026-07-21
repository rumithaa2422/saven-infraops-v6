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
    <div className="min-h-screen bg-slate-50">
      {/* Page Header - Modern Gradient */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button type="button" onClick={() => navigate('/projects-environments')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:-translate-x-1 transition-transform">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70 mb-1">Projects & Environments</p>
              <h1 className="text-2xl font-bold text-white">Create Project</h1>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Project Information</h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all ${errors.projectName ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.projectName && <span className="text-xs text-red-600 mt-1">{errors.projectName}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Code *</label>
                  <input
                    type="text"
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleChange}
                    placeholder="e.g., PRJ-001"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all ${errors.projectCode ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.projectCode && <span className="text-xs text-red-600 mt-1">{errors.projectCode}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Enter client name"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all ${errors.client ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.client && <span className="text-xs text-red-600 mt-1">{errors.client}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Vendor</label>
                  <select
                    name="primaryVendorId"
                    value={formData.primaryVendorId}
                    onChange={handleChange}
                    disabled={vendorsLoading}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName} ({vendor.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Technology Stack</label>
                  <input
                    type="text"
                    name="technologyStack"
                    value={formData.technologyStack}
                    onChange={handleChange}
                    placeholder="e.g., React, Node.js, PostgreSQL"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Type</label>
                  <select name="projectType" value={formData.projectType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                    <option value="">Select type</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="RESEARCH">Research</option>
                    <option value="CONSULTING">Consulting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Location</label>
                  <input
                    type="text"
                    name="projectLocation"
                    value={formData.projectLocation}
                    onChange={handleChange}
                    placeholder="Enter location"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
            </div>
            <div className="p-6">
              {/* Project Manager */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Project Manager *</label>
                
                {selectedManager ? (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                      {selectedManager.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-slate-900">{selectedManager.name}</span>
                      <span className="text-sm text-slate-500 ml-2">{selectedManager.email}</span>
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Manager</span>
                    </div>
                    <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => setFormData(prev => ({ ...prev, managerId: '' }))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={managerSearch}
                      onChange={(e) => setManagerSearch(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all ${errors.managerId ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                    />
                    {/* Manager Dropdown */}
                    {managerSearch && filteredManagers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
                        {filteredManagers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                            onClick={() => handleManagerSelect(user.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-slate-900 text-sm">{user.name}</span>
                              <span className="text-xs text-slate-500 ml-2">{user.email}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{getUserRole(user)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {managerSearch && filteredManagers.length === 0 && !usersLoading && (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl p-4 text-center text-sm text-slate-500">
                        No users found
                      </div>
                    )}
                    {errors.managerId && <span className="text-xs text-red-600 mt-1">{errors.managerId}</span>}
                  </div>
                )}
              </div>

              {/* Team Members */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-3">Team Members *</label>
                
                {/* Selected Team Members */}
                {selectedTeamMembers.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {selectedTeamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-900 text-sm">{member.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{member.email}</span>
                        </div>
                        <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleTeamMemberToggle(member.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder="Search to add team members..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all ${errors.teamMemberIds ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                />
                {/* Team Members Dropdown */}
                {userSearch && filteredTeamMembers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
                    {filteredTeamMembers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors ${formData.teamMemberIds.includes(user.id) ? 'bg-purple-50' : ''}`}
                        onClick={() => handleTeamMemberToggle(user.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-900 text-sm">{user.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{user.email}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{getUserRole(user)}</span>
                        {formData.teamMemberIds.includes(user.id) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {userSearch && filteredTeamMembers.length === 0 && !usersLoading && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl p-4 text-center text-sm text-slate-500">
                    No users found
                  </div>
                )}
                {errors.teamMemberIds && <span className="text-xs text-red-600 mt-1 block">{errors.teamMemberIds}</span>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 bg-white rounded-2xl p-6 shadow-sm">
            <button
              type="button"
              onClick={() => navigate('/projects-environments')}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : 'Create Project'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
