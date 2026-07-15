import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type ServiceRequest = {
  id: string;
  ticketNo: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  priority: string;
  status: string;
  requesterName: string;
  assigneeName?: string;
  assigneeId?: string;
  projectName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AdminUser = {
  id: string;
  name: string;
};

export function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const canManage = hasPermission('tickets:manage');
  const canAssign = hasPermission('tickets:assign');
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const canPerformActions = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/service-requests/${id}`);
      setRequest(res.data.item);
      setError('');
    } catch {
      setError('Failed to load service request details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAdmins() {
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data);
    } catch {
      setAdmins([]);
    }
  }

  useEffect(() => {
    load();
    loadAdmins();
  }, [id]);

  async function updateStatus(payload: Partial<ServiceRequest>) {
    if (!request) return;
    try {
      const response = await api.patch(`/service-requests/${request.id}`, payload);
      setRequest(response.data.item);
      setMessage('Status updated successfully.');
    } catch {
      setMessage('Failed to update status. Check backend logs.');
    }
  }

  async function addComment(commentText: string) {
    if (!request || !commentText.trim()) return;
    try {
      await api.patch(`/service-requests/${request.id}`, { comment: commentText });
      setComment('');
      setMessage('Comment added successfully.');
    } catch {
      setMessage('Failed to add comment. Check backend logs.');
    }
  }

  async function assignTicket() {
    if (!request || !selectedAssignee) return;
    try {
      const response = await api.patch(`/service-requests/${request.id}/assign`, {
        assigneeId: selectedAssignee
      });
      setRequest(response.data.item);
      setSelectedAssignee('');
      setMessage('Ticket assigned successfully.');
    } catch {
      setMessage('Assignment failed. Check backend logs.');
    }
  }

  function handleBack() {
    navigate('/service-requests');
  }

  function getPriorityClass(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'pill-critical';
      case 'HIGH': return 'pill-high';
      case 'MEDIUM': return 'pill-medium';
      case 'LOW': return 'pill-low';
      default: return 'pill-medium';
    }
  }

  function getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'WAITING_FOR_USER': return 'status-waiting';
      case 'CLOSED': return 'status-closed';
      case 'CANCELLED': return 'status-cancelled';
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
        <div className="detail-loading">
          <span>Loading service request details...</span>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <p>{error || 'Service request not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Service Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {message && (
        <div className="notice">{message}</div>
      )}

      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="detail-header-info">
          <div className="detail-title-row">
            <span className="detail-ticket-no">{request.ticketNo}</span>
            <span className={`detail-badge ${getStatusClass(request.status)}`}>
              {request.status.replace(/_/g, ' ')}
            </span>
            <span className={`detail-badge ${getPriorityClass(request.priority)}`}>
              {request.priority}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Requester:</span>
              <span className="detail-meta-value">{request.requesterName}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Assigned:</span>
              <span className="detail-meta-value">{request.assigneeName || 'Unassigned'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Created:</span>
              <span className="detail-meta-value">{formatDate(request.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column - Request Information */}
        <div className="detail-main">
          {/* Request Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Request Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field">
                <label>Title</label>
                <span className="detail-field-value">{request.title}</span>
              </div>
              <div className="detail-field">
                <label>Description</label>
                <span className="detail-field-value detail-field-text">
                  {request.description || 'No description provided.'}
                </span>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Category</label>
                  <span className="detail-field-value">{request.category}</span>
                </div>
                <div className="detail-field">
                  <label>Sub Category</label>
                  <span className="detail-field-value">{request.subCategory || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Project</label>
                  <span className="detail-field-value">{request.projectName || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Attachments</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 8V16C16 18.2091 17.7909 20 20 20H28C30.2091 20 32 18.2091 32 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M24 26L20 30M24 26L28 30M24 26V34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No attachments</p>
                <span>Files will appear here when added.</span>
              </div>
            </div>
          </div>

          {/* Conversation Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Conversation</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V30C40 32.2091 38.2091 34 36 34H16L8 40V12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 18H34M14 26H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>No conversations</p>
                <span>Comments and updates will appear here.</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Timeline</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2"/>
                  <path d="M24 16V24L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>No timeline events</p>
                <span>Activity history will appear here.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="detail-sidebar">
          {/* Assignment Section */}
          {isSuperAdmin && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Assigned To</h3>
              </div>
              <div className="detail-card-body">
                <select
                  className="detail-select"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  <option value="">Select Admin...</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-assign"
                  onClick={assignTicket}
                  disabled={!selectedAssignee}
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canPerformActions && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Actions</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-actions">
                  <button
                    className="btn-action btn-escalate"
                    onClick={() => updateStatus({ priority: 'CRITICAL', status: 'IN_PROGRESS' })}
                  >
                    Escalate
                  </button>
                  <button
                    className="btn-action btn-waiting"
                    onClick={() => updateStatus({ status: 'WAITING_FOR_USER' })}
                  >
                    Wait for User
                  </button>
                  <button
                    className="btn-action btn-close"
                    onClick={() => updateStatus({ status: 'CLOSED' })}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comment Section */}
          {canPerformActions && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Add Comment</h3>
              </div>
              <div className="detail-card-body">
                <textarea
                  className="detail-textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={4}
                />
                <button
                  className="btn-comment"
                  onClick={() => addComment(comment)}
                  disabled={!comment.trim()}
                >
                  Save Comment
                </button>
              </div>
            </div>
          )}

          {/* Access Notice for Admins */}
          {isAdmin && !isSuperAdmin && !canPerformActions && (
            <div className="detail-card">
              <div className="detail-card-body">
                <div className="detail-access-notice">
                  <p>This ticket is assigned to another admin or is unassigned.</p>
                  <p>You can only perform actions on tickets assigned to you.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
