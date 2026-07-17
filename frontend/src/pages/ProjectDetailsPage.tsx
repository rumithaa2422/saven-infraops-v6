import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: { role: { name: string } }[];
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client?: string;
  ownerName?: string;
  description?: string;
  department?: string;
  technologyStack?: string;
  priority: string;
  status: string;
  budget?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  projectType?: string;
  projectLocation?: string;
  remarks?: string;
  managerId?: string;
  teamMemberIds?: string;
  manager?: User | null;
  teamMembers?: User[];
  createdAt: string;
  updatedAt: string;
};

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects-environments/${id}`);
      setProject(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate('/projects-environments');
  }

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/projects-environments/${id}`);
      navigate('/projects-environments');
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

  function formatCurrency(value?: number): string {
    if (!value) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  function getUserRole(user: User): string {
    return user.roles?.[0]?.role?.name || 'Employee';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'DELAYED': return 'danger';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'danger';
      default: return 'default';
    }
  }

  // Access check for Employee
  if (isEmployee) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Access Restricted. You do not have permission to view this page.</p>
          <button className="btn-back" onClick={() => navigate('/projects-environments')}>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <div className="detail-breadcrumb">
            <span>Loading...</span>
          </div>
        </div>
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Project not found'}</p>
          <button className="btn-back" onClick={() => navigate('/projects-environments')}>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const teamSize = (project.teamMembers?.length || 0) + (project.manager ? 1 : 0);

  return (
    <div className="detail-page">
      {/* Back Button - Top Left */}
      <button className="btn-back-top" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <span onClick={handleBack} style={{ cursor: 'pointer' }}>Projects</span>
          <span>/</span>
          <span>{project.projectName}</span>
        </div>
        <div className="detail-actions">
          {isSuperAdmin && (
            <>
              <button className="btn-secondary" onClick={() => navigate(`/projects-environments/${id}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
                  <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Edit
              </button>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="detail-title-section">
        <div className="detail-title-left">
          <div className="detail-ticket-id">{project.projectCode}</div>
          <h1 className="detail-title">{project.projectName}</h1>
          <div className="detail-meta">
            <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
            <span className={`priority-badge priority-${getPriorityColor(project.priority)}`}>{project.priority}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-main">
          {/* Overview Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Overview
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Project Name</label>
                  <span>{project.projectName || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Code</label>
                  <span className="mono">{project.projectCode || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Client</label>
                  <span>{project.client || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Department</label>
                  <span>{project.department || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Type</label>
                  <span>{project.projectType?.replace(/_/g, ' ') || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Technology Stack</label>
                  <span>{project.technologyStack || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Start Date</label>
                  <span>{formatDate(project.startDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Expected End Date</label>
                  <span>{formatDate(project.expectedEndDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Budget</label>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Location</label>
                  <span>{project.projectLocation || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          {project.description && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Description
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.description}</p>
              </div>
            </div>
          )}

          {/* Remarks Card */}
          {project.remarks && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Remarks
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.remarks}</p>
              </div>
            </div>
          )}

          {/* Inventory Placeholder Card */}
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
                <h4>Assigned Inventory</h4>
                <p>No inventory has been assigned to this project yet.</p>
              </div>
            </div>
          </div>

          {/* Licenses Placeholder Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5C15 3.89543 15.8954 3 17 3C18.1046 3 19 3.89543 19 5V7H15V5Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 7H19V9C19 11.2091 17.2091 13 15 13H9C6.79086 13 5 11.2091 5 9V7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7V13H15V15H9V21H7V7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Licenses
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5C15 3.89543 15.8954 3 17 3C18.1046 3 19 3.89543 19 5V7H15V5Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 7H19V9C19 11.2091 17.2091 13 15 13H9C6.79086 13 5 11.2091 5 9V7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7V13H15V15H9V21H7V7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h4>Licenses</h4>
                <p>No licenses assigned.</p>
              </div>
            </div>
          </div>

          {/* Documents Placeholder Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Documents
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V12M9 15L12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>Documents</h4>
                <p>No documents uploaded.</p>
                <button className="btn-secondary" disabled style={{ marginTop: '12px', opacity: 0.5 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload Document
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Timeline
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-timeline">
                <div className="timeline-item">
                  <div className="timeline-icon success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-action">Project Created</span>
                    <span className="timeline-date">{formatDateTime(project.createdAt)}</span>
                  </div>
                </div>
                {project.updatedAt !== project.createdAt && (
                  <div className="timeline-item">
                    <div className="timeline-icon info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
                        <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-action">Project Updated</span>
                      <span className="timeline-date">{formatDateTime(project.updatedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="detail-sidebar">
          {/* Team Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Team
              </h3>
              <span className="detail-card-count">{teamSize}</span>
            </div>
            <div className="detail-card-body">
              {/* Manager Section */}
              <div className="team-section">
                <h4 className="team-section-title">Project Manager</h4>
                {project.manager ? (
                  <div className="team-member-card manager">
                    <div className="member-avatar">
                      {project.manager.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{project.manager.name}</span>
                      <span className="member-details">{project.manager.email}</span>
                      {project.manager.department && (
                        <span className="member-details">{project.manager.department}</span>
                      )}
                      <span className="member-role-badge manager">Manager</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-team">No manager assigned</p>
                )}
              </div>

              {/* Team Members Section */}
              <div className="team-section">
                <h4 className="team-section-title">Team Members ({project.teamMembers?.length || 0})</h4>
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <div className="team-members-list">
                    {project.teamMembers.map(member => (
                      <div key={member.id} className="team-member-card">
                        <div className="member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-details">{member.email}</span>
                          {member.department && (
                            <span className="member-details">{member.department}</span>
                          )}
                          <span className="member-role">{getUserRole(member)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-team">No team members assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Quick Info
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Priority</span>
                <span className={`priority-badge priority-${getPriorityColor(project.priority)}`}>{project.priority}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{formatDate(project.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatDateTime(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button type="button" className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  {deleteError}
                </div>
              )}
              <div className="warning-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Are you sure you want to delete this project?</p>
                <p><strong>{project.projectName}</strong> ({project.projectCode})</p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
