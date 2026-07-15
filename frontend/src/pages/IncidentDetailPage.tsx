import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Incident = {
  id: string;
  incidentNo: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  impactedService?: string;
  impactedProject?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TimelineEntry = {
  action: string;
  description: string;
  performedByName: string | null;
  createdAt: string;
};

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [takingOwnership, setTakingOwnership] = useState(false);

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;
  
  // Can view timeline: Admin, Super Admin
  const canViewTimeline = isSuperAdmin || isAdmin;
  
  // Can take ownership: Admin, Super Admin (only if not already owned)
  const canTakeOwnership = (isSuperAdmin || isAdmin) && !incident?.ownerName;
  
  // Is already owned
  const isOwned = !!incident?.ownerName;

  // Build timeline from incident data (without database timeline table)
  function buildTimeline(): TimelineEntry[] {
    if (!incident) return [];
    
    const entries: TimelineEntry[] = [];
    
    // Incident Created entry
    entries.push({
      action: 'Incident Created',
      description: `Incident ${incident.incidentNo} was created`,
      performedByName: null,
      createdAt: incident.createdAt || ''
    });
    
    return entries;
  }

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data.item);
      setError('');
    } catch {
      setError('Failed to load incident details.');
    } finally {
      setLoading(false);
    }
  }

  async function takeOwnership() {
    if (!incident || !user) return;
    setTakingOwnership(true);
    try {
      const response = await api.patch(`/incidents/${incident.id}/ownership`, {
        ownerName: user.name
      });
      setIncident(response.data.item);
      setMessage('Ownership taken successfully.');
    } catch {
      setMessage('Failed to take ownership.');
    } finally {
      setTakingOwnership(false);
    }
  }

  useEffect(() => {
    // Scroll to top of page when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    load();
  }, [id]);

  function handleBack() {
    navigate('/incidents');
  }

  function getSeverityClass(severity: string): string {
    switch (severity.toUpperCase()) {
      case 'SEV1': return 'severity-sev1';
      case 'SEV2': return 'severity-sev2';
      case 'SEV3': return 'severity-sev3';
      case 'SEV4': return 'severity-sev4';
      default: return 'severity-sev3';
    }
  }

  function getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'OPEN': return 'status-open';
      case 'ASSIGNED': return 'status-assigned';
      case 'IN_PROGRESS': return 'status-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return 'status-open';
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="detail-header">
          <div className="skeleton skeleton-title"></div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <div className="skeleton skeleton-badge"></div>
              <div className="skeleton skeleton-badge"></div>
            </div>
            <div className="detail-meta-row" style={{ marginTop: '12px' }}>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
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
                <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Incident not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  const timeline = buildTimeline();

  return (
    <div className="page-stack">
      {message && (
        <div className="notice notice-info">{message}</div>
      )}

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
            <span className="detail-ticket-no">{incident.incidentNo}</span>
            <span className={`status-badge ${getStatusClass(incident.status)}`}>
              {incident.status.replace(/_/g, ' ')}
            </span>
            <span className={`priority-badge ${getSeverityClass(incident.severity)}`}>
              {incident.severity}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Owner</span>
              <span className="detail-meta-value">{incident.ownerName || 'Unassigned'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Created</span>
              <span className="detail-meta-value">{formatDate(incident.createdAt)}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Last Updated</span>
              <span className="detail-meta-value">{formatDate(incident.updatedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column - Incident Information */}
        <div className="detail-main">
          {/* Incident Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Incident Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field">
                <label>Title</label>
                <span className="detail-field-value">{incident.title}</span>
              </div>
              <div className="detail-field">
                <label>Description</label>
                <span className="detail-field-value detail-field-text">
                  {incident.description || 'No description provided.'}
                </span>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Impacted Service</label>
                  <span className="detail-field-value">{incident.impactedService || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Impacted Project</label>
                  <span className="detail-field-value">{incident.impactedProject || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Document Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Resolution Document</h3>
            </div>
            <div className="detail-card-body">
              <div className="empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="empty-state-title">No resolution document uploaded.</p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          {canViewTimeline ? (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Timeline</h3>
              </div>
              <div className="detail-card-body timeline-body">
                {timeline.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p className="empty-state-title">No activity yet</p>
                    <p className="empty-state-description">Timeline events will appear as actions are taken on this incident.</p>
                  </div>
                ) : (
                  <div className="timeline-list">
                    {timeline.map((entry, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker">
                          <div className="timeline-dot"></div>
                          {index < timeline.length - 1 && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-action">{entry.action}</span>
                            <span className="timeline-time">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          <p className="timeline-description">{entry.description}</p>
                          {entry.performedByName && (
                            <span className="timeline-user">
                              by {entry.performedByName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Timeline</h3>
              </div>
              <div className="detail-card-body">
                <div className="empty-state">
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="empty-state-title">Timeline restricted</p>
                  <p className="empty-state-description">You do not have permission to view the timeline.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="detail-sidebar">
          {/* Ownership Section */}
          {(isSuperAdmin || isAdmin) && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Ownership</h3>
              </div>
              <div className="detail-card-body">
                {isOwned ? (
                  <div className="ownership-info">
                    <p className="ownership-text">
                      Already assigned to <strong>{incident.ownerName}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="ownership-action">
                    <p className="ownership-text">
                      This incident is not assigned to anyone.
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={takeOwnership}
                      disabled={takingOwnership}
                    >
                      {takingOwnership ? 'Taking Ownership...' : 'Take Ownership'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Status</h3>
            </div>
            <div className="detail-card-body">
              <div className="status-display">
                <span className={`status-badge ${getStatusClass(incident.status)}`}>
                  {incident.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
