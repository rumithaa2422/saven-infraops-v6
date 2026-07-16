import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    client: '',
    ownerName: '',
    description: '',
    department: '',
    technologyStack: '',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    budget: '',
    startDate: '',
    expectedEndDate: '',
    projectType: '',
    projectLocation: '',
    remarks: ''
  });

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
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Project Manager is required';
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
    // Clear error when field is modified
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
      await api.post('/generic/projects', {
        projectName: formData.projectName,
        projectCode: formData.projectCode,
        client: formData.client || null,
        ownerName: formData.ownerName || null,
        description: formData.description || null,
        department: formData.department || null,
        technologyStack: formData.technologyStack || null,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate || null,
        expectedEndDate: formData.expectedEndDate || null,
        projectType: formData.projectType || null,
        projectLocation: formData.projectLocation || null,
        remarks: formData.remarks || null
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
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Basic Information</h3>
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
                  <label>Project Manager *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Enter project manager name"
                    className={errors.ownerName ? 'input-error' : ''}
                  />
                  {errors.ownerName && <span className="error-text">{errors.ownerName}</span>}
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
              </div>
            </div>

            <div className="form-section">
              <h3>Timeline & Budget</h3>
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

            <div className="form-section">
              <h3>Additional Information</h3>
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
    </div>
  );
}
