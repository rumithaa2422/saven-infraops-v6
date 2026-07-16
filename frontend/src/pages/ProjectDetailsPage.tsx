import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

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
  createdAt: string;
  updatedAt: string;
};

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

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
      const res = await api.get(`/generic/projects/${id}`);
      setProject(res.data);
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
      await api.delete(`/generic/projects/${id}`);
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

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="detail-header">
            <div className="skeleton skeleton-title"></div>
            <div className="detail-header-info">
              <div className="detail-title-row">
                <div className="skeleton skeleton-badge"></div>
                <div className="skeleton skeleton-badge"></div>
              </div>
            </div>
          </div>
          <div className="detail-content-grid">
            <div className="detail-main">
              <div className="detail-card">
                <div className="detail-card-body">
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ marginTop: '16px' }}></div>
                  <div className="skeleton skeleton-text"></div>
                </div>
              </div>
            </div>
            <div className="detail-sidebar">
              <div className="detail-card">
                <div className="detail-card-body">
                  <div className="skeleton" style={{ width: '100%', height: '36px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'Project not found.'}</p>
            <button className="btn-back" onClick={handleBack}>
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button className="btn-back" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            {isSuperAdmin && (
              <>
                <button className="btn-edit" onClick={() => navigate(`/projects-environments/${id}/edit`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H19C20.1046 22 21 21.1046 21 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <span className="detail-ticket-no">{project.projectCode}</span>
              <span className={`status-badge status-${project.status.toLowerCase().replace('_', '')}`}>
                {project.status.replace(/_/g, ' ')}
              </span>
              <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                {project.priority}
              </span>
            </div>
            <div className="detail-meta-row">
              <span className="detail-meta-item">
                <span className="detail-meta-label">Project Manager</span>
                <span className="detail-meta-value">{project.ownerName || 'Unassigned'}</span>
              </span>
              <span className="detail-meta-item">
                <span className="detail-meta-label">Client</span>
                <span className="detail-meta-value">{project.client || '-'}</span>
              </span>
              <span className="detail-meta-item">
                <span className="detail-meta-label">Created</span>
                <span className="detail-meta-value">{formatDateTime(project.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="detail-content-grid">
          {/* Main Content */}
          <div className="detail-main">
            {/* Project Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Project Information</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-grid">
                  <div className="detail-field">
                    <label>Project Name</label>
                    <span>{project.projectName}</span>
                  </div>
                  <div className="detail-field">
                    <label>Project Code</label>
                    <span className="detail-id">{project.projectCode}</span>
                  </div>
                  <div className="detail-field">
                    <label>Client</label>
                    <span>{project.client || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Project Manager</label>
                    <span>{project.ownerName || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Department</label>
                    <span>{project.department || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Technology Stack</label>
                    <span>{project.technologyStack || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Project Type</label>
                    <span>{project.projectType?.replace(/_/g, ' ') || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Project Location</label>
                    <span>{project.projectLocation || '-'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Start Date</label>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  <div className="detail-field">
                    <label>Expected End Date</label>
                    <span>{formatDate(project.expectedEndDate)}</span>
                  </div>
                  <div className="detail-field">
                    <label>Actual End Date</label>
                    <span>{formatDate(project.actualEndDate)}</span>
                  </div>
                  <div className="detail-field">
                    <label>Budget</label>
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Description */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Description</h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Remarks */}
            {project.remarks && (
              <div className="detail-card">
                <div className="detail-card-header">
                  <h3>Remarks</h3>
                </div>
                <div className="detail-card-body">
                  <p className="detail-description">{project.remarks}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Timeline</h3>
              </div>
              <div className="detail-card-body">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-icon created">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-action">Project Created</span>
                      <span className="timeline-date">{formatDateTime(project.createdAt)}</span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon updated">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H19C20.1046 22 21 21.1046 21 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-action">Project Updated</span>
                      <span className="timeline-date">{formatDateTime(project.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            {/* Project Statistics */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Project Statistics</h3>
              </div>
              <div className="detail-card-body">
                <div className="stat-row">
                  <span className="stat-label">Members</span>
                  <span className="stat-value">-</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Inventory</span>
                  <span className="stat-value">-</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Licenses</span>
                  <span className="stat-value">-</span>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Quick Info</h3>
              </div>
              <div className="detail-card-body">
                <div className="info-row">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDateTime(project.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Project</h3>
              <button type="button" className="close" onClick={() => setShowDeleteConfirm(false)}>Close</button>
            </div>
            
            {deleteError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                {deleteError}
              </div>
            )}
            
            <div className="warning-box">
              <p>Are you sure you want to delete this project?</p>
              <p><strong>{project.projectName}</strong> ({project.projectCode})</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
