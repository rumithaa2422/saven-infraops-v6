import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client: string;
  ownerName: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  description?: string;
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
          </div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <span className="detail-ticket-no">{project.projectCode}</span>
              <span className={`status-badge status-${project.status.toLowerCase()}`}>
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
            {/* Project Overview */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Project Overview</h3>
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
                    <label>Status</label>
                    <span className={`status-badge status-${project.status.toLowerCase()}`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="detail-field">
                    <label>Priority</label>
                    <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                      {project.priority}
                    </span>
                  </div>
                  <div className="detail-field">
                    <label>Start Date</label>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  <div className="detail-field">
                    <label>End Date</label>
                    <span>{formatDate(project.endDate)}</span>
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
    </div>
  );
}
