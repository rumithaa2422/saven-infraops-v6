import { useEffect, useState, useRef } from 'react';
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
  requesterId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Attachment = {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
};

type Comment = {
  id: string;
  requestId: string;
  userId: string | null;
  userName: string;
  message: string;
  createdAt: string;
};

type TimelineEntry = {
  id: string;
  requestId: string;
  action: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
};

const ALLOWED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf,.docx,.xlsx,.txt';

export function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isChangingAssignment, setIsChangingAssignment] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PART 4/6: Permission-based access using granular permissions
  const canManage = hasPermission('tickets:update') || hasPermission('tickets:manage');
  const canDelete = hasPermission('tickets:delete');
  const canAssign = hasPermission('tickets:assign');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;
  
  // Check if user can access full details
  // Super Admin: can access all
  // Admin: can access only if assigned to them
  // Employee: can access only their own requests
  const canAccessFullDetails = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  
  // Check if Admin has restricted access (can see but not full details)
  const isAdminWithRestrictedAccess = isAdmin && request?.assigneeId !== user?.id && !isSuperAdmin;
  
  const canPerformActions = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);
  
  // Check if user can upload attachments (own request or admin with full access)
  const canUpload = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  // Only Super Admin can delete attachments
  const canDeleteAttachment = isSuperAdmin;
  
  // Check if user can view chat (Super Admin or assigned Admin or own request)
  const canViewChat = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  // Check if user can post chat messages (Super Admin, assigned Admin, or own request)
  const canPostChat = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  
  // Check if user can view timeline (Super Admin or assigned Admin)
  const canViewTimeline = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);
  
  // Check if user can view attachments
  const canViewAttachments = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/service-requests/${id}`);
      const loadedRequest = res.data.item;
      
      // Check access permissions
      const requestIsSuperAdmin = user?.roles.includes('Super Admin') ?? false;
      const requestIsAdmin = user?.roles.includes('Admin') ?? false;
      const requestIsEmployee = !requestIsSuperAdmin && !requestIsAdmin;
      
      // Employee can only access their own requests
      if (requestIsEmployee && loadedRequest.requesterId !== user?.id) {
        setError('Access Restricted. You can only view your own service requests.');
        setLoading(false);
        return;
      }
      
      // Admin can only access assigned requests (Super Admin can access all)
      if (requestIsAdmin && !requestIsSuperAdmin && loadedRequest.assigneeId !== user?.id) {
        setError('Access Restricted. You can only view service requests assigned to you.');
        setLoading(false);
        return;
      }
      
      setRequest(loadedRequest);
      setError('');
    } catch {
      setError('Failed to load service request details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAttachments() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/attachments`);
      setAttachments(res.data.attachments);
    } catch {
      setAttachments([]);
    }
  }

  async function loadComments() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/comments`);
      setComments(res.data.comments);
    } catch {
      setComments([]);
    }
  }

  async function loadTimeline() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/timeline`);
      setTimeline(res.data.timeline);
    } catch {
      setTimeline([]);
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
    // Scroll to top of page when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    load();
    loadAdmins();
  }, [id]);

  useEffect(() => {
    if (request) {
      loadAttachments();
      loadComments();
      loadTimeline();
    }
  }, [request?.id]);

  // Note: Removed auto-scroll to bottom when new comments arrive to prevent page jumping

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

  async function sendChatMessage() {
    if (!request || !chatMessage.trim()) return;
    setSendingMessage(true);
    try {
      await api.post(`/service-requests/${request.id}/comments`, {
        message: chatMessage.trim()
      });
      setChatMessage('');
      await loadComments();
    } catch {
      setMessage('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function uploadAttachments(files: FileList) {
    if (!request || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await api.post(`/service-requests/${request.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadAttachments();
      setMessage('Attachments uploaded successfully.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setMessage('Failed to upload attachments.');
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!request) return;
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.delete(`/service-requests/${request.id}/attachments/${attachmentId}`);
      await loadAttachments();
      setMessage('Attachment deleted successfully.');
    } catch {
      setMessage('Failed to delete attachment.');
    }
  }

  function downloadAttachment(attachmentId: string, fileName: string) {
    if (!request) return;
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/service-requests/${request.id}/attachments/${attachmentId}/download`;
    
    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setMessage('Failed to download attachment.');
      });
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
      await loadTimeline();
    } catch {
      setMessage('Assignment failed. Check backend logs.');
    }
  }

  function startChangeAssignment() {
    setPendingAssignee(request?.assigneeId || '');
    setIsChangingAssignment(true);
  }

  function cancelChangeAssignment() {
    setIsChangingAssignment(false);
    setPendingAssignee('');
  }

  async function saveAssignmentChange() {
    if (!request || !pendingAssignee || pendingAssignee === request.assigneeId) {
      cancelChangeAssignment();
      return;
    }
    try {
      const response = await api.patch(`/service-requests/${request.id}/assign`, {
        assigneeId: pendingAssignee
      });
      setRequest(response.data.item);
      setIsChangingAssignment(false);
      setPendingAssignee('');
      setMessage('Assignment changed successfully.');
      await loadTimeline();
    } catch {
      setMessage('Failed to change assignment. Check backend logs.');
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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatChatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-US', {
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
          <div className="detail-sidebar">
            <div className="detail-card">
              <div className="detail-card-body">
                <div className="skeleton" style={{ width: '100%', height: '36px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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
            <span className="detail-ticket-no">{request.ticketNo}</span>
            <span className={`status-badge status-${request.status.toLowerCase()}`}>
              {request.status.replace(/_/g, ' ')}
            </span>
            <span className={`priority-badge priority-${request.priority.toLowerCase()}`}>
              {request.priority}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Requester</span>
              <span className="detail-meta-value">{request.requesterName}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Assigned</span>
              <span className="detail-meta-value">{request.assigneeName || 'Unassigned'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Created</span>
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
              {canAccessFullDetails ? (
                <div className="detail-field">
                  <label>Description</label>
                  <span className="detail-field-value detail-field-text">
                    {request.description || 'No description provided.'}
                  </span>
                </div>
              ) : (
                <div className="detail-field">
                  <label>Description</label>
                  <span className="detail-field-value detail-field-text restricted-text">
                    Access Restricted
                  </span>
                </div>
              )}
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
          {canViewAttachments ? (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Attachments</h3>
              </div>
              <div className="detail-card-body">
                {attachments.length > 0 ? (
                  <div className="attachment-list">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="attachment-item">
                        <div className="attachment-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V8L12 4H6C4.89543 4 4 4.89543 4 6V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 4V8H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name" title={attachment.fileName}>{attachment.fileName}</span>
                          <span className="attachment-meta">
                            {formatFileSize(attachment.fileSize)} - Uploaded {formatDate(attachment.uploadedAt)}
                            {attachment.uploadedByName && ` by ${attachment.uploadedByName}`}
                          </span>
                        </div>
                        <div className="attachment-actions">
                          <button 
                            className="btn-attachment-download"
                            onClick={() => downloadAttachment(attachment.id, attachment.fileName)}
                            title="Download"
                          >
                            Download
                          </button>
                          {canDeleteAttachment && (
                            <button 
                              className="btn-attachment-delete"
                              onClick={() => deleteAttachment(attachment.id)}
                              title="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="empty-state-title">No attachments</p>
                    <p className="empty-state-description">Files uploaded to this request will appear here.</p>
                  </div>
                )}
                {canUpload && (
                  <div className="attachment-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_FILE_TYPES}
                      multiple
                      onChange={(e) => e.target.files && uploadAttachments(e.target.files)}
                      className="file-input"
                      id="attachment-upload"
                    />
                    <label htmlFor="attachment-upload" className="btn-upload">
                      {uploading ? 'Uploading...' : 'Upload Files'}
                    </label>
                    <span className="upload-hint">png, jpg, pdf, docx, xlsx, txt</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Attachments</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-placeholder">
                  <p>Attachments not available</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Card */}
          {canViewChat ? (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Conversation</h3>
              </div>
              <div className="detail-card-body conversation-body">
                <>
                  <div className="conversation-messages">
                    {comments.length === 0 ? (
                      <div className="empty-state">
                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="empty-state-title">No messages yet</p>
                        <p className="empty-state-description">Start the conversation to discuss this request.</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className={`conversation-message ${comment.userId === user?.id ? 'own-message' : ''}`}
                        >
                          <div className="message-header">
                            <span className="message-sender">{comment.userName}</span>
                            <span className="message-time">{formatChatTime(comment.createdAt)}</span>
                          </div>
                          <div className="message-content">
                            {comment.message}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {canPostChat ? (
                    <div className="conversation-input">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
                      />
                      <button 
                        onClick={sendChatMessage}
                        disabled={sendingMessage || !chatMessage.trim()}
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  ) : (
                    <div className="conversation-input-disabled">
                      <span>You cannot reply to this conversation.</span>
                    </div>
                  )}
                </>
              </div>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Conversation</h3>
              </div>
              <div className="detail-card-body">
                <div className="empty-state">
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="empty-state-title">Conversation restricted</p>
                  <p className="empty-state-description">You do not have permission to view this conversation.</p>
                </div>
              </div>
            </div>
          )}

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
                    <p className="empty-state-description">Timeline events will appear as actions are taken on this request.</p>
                  </div>
                ) : (
                  <div className="timeline-list">
                    {timeline.map((entry) => (
                      <div key={entry.id} className="timeline-item">
                        <div className="timeline-marker">
                          <div className="timeline-dot"></div>
                          <div className="timeline-line"></div>
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
          {/* Assignment Section */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Assigned To</h3>
            </div>
            <div className="detail-card-body">
              {/* When not changing assignment */}
              {!isChangingAssignment ? (
                <>
                  {/* Read-only display for assigned tickets or when user cannot assign */}
                  {request?.assigneeName ? (
                    <>
                      <div className="assignment-display">
                        <span className="assignment-value">{request.assigneeName}</span>
                      </div>
                      {/* Change Assignment button - only for Super Admin when ticket is assigned */}
                      {isSuperAdmin && (
                        <button
                          className="btn-change-assignment"
                          onClick={startChangeAssignment}
                        >
                          Change Assignment
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Unassigned - show dropdown only for Super Admin */}
                      {isSuperAdmin ? (
                        <>
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
                        </>
                      ) : (
                        <div className="assignment-display">
                          <span className="assignment-value assignment-unassigned">Unassigned</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Change assignment mode */}
                  <select
                    className="detail-select"
                    value={pendingAssignee}
                    onChange={(e) => setPendingAssignee(e.target.value)}
                  >
                    <option value="">Select Admin...</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                  <div className="assignment-actions">
                    <button
                      className="btn-save-assignment"
                      onClick={saveAssignmentChange}
                      disabled={!pendingAssignee || pendingAssignee === request?.assigneeId}
                    >
                      Save Assignment
                    </button>
                    <button
                      className="btn-cancel-assignment"
                      onClick={cancelChangeAssignment}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(isSuperAdmin || canPerformActions) && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Actions</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-actions">
                  {/* Super Admin: Show all status options */}
                  {isSuperAdmin ? (
                    <>
                      {request.status === 'OPEN' && (
                        <>
                          <button
                            className="btn-action btn-assign"
                            onClick={() => updateStatus({ status: 'ASSIGNED' })}
                          >
                            Assign
                          </button>
                          <button
                            className="btn-action btn-progress"
                            onClick={() => updateStatus({ status: 'IN_PROGRESS' })}
                          >
                            Start Progress
                          </button>
                        </>
                      )}
                      {request.status === 'ASSIGNED' && (
                        <>
                          <button
                            className="btn-action btn-progress"
                            onClick={() => updateStatus({ status: 'IN_PROGRESS' })}
                          >
                            Start Progress
                          </button>
                          <button
                            className="btn-action btn-close"
                            onClick={() => updateStatus({ status: 'CLOSED' })}
                          >
                            Close
                          </button>
                        </>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            className="btn-action btn-waiting"
                            onClick={() => updateStatus({ status: 'WAITING_FOR_USER' })}
                          >
                            Wait for User
                          </button>
                          <button
                            className="btn-action btn-complete"
                            onClick={() => updateStatus({ status: 'COMPLETED' })}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {request.status === 'WAITING_FOR_USER' && (
                        <>
                          <button
                            className="btn-action btn-progress"
                            onClick={() => updateStatus({ status: 'IN_PROGRESS' })}
                          >
                            Resume Progress
                          </button>
                          <button
                            className="btn-action btn-complete"
                            onClick={() => updateStatus({ status: 'COMPLETED' })}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {request.status === 'COMPLETED' && (
                        <button
                          className="btn-action btn-close"
                          onClick={() => updateStatus({ status: 'CLOSED' })}
                        >
                          Close
                        </button>
                      )}
                      {request.status === 'CLOSED' && (
                        <button
                          className="btn-action btn-reopen"
                          onClick={() => updateStatus({ status: 'OPEN' })}
                        >
                          Reopen
                        </button>
                      )}
                    </>
                  ) : (
                    /* Admin: Show workflow-based actions */
                    <>
                      {request.status === 'ASSIGNED' && (
                        <button
                          className="btn-action btn-progress"
                          onClick={() => updateStatus({ status: 'IN_PROGRESS' })}
                        >
                          Start Progress
                        </button>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            className="btn-action btn-waiting"
                            onClick={() => updateStatus({ status: 'WAITING_FOR_USER' })}
                          >
                            Wait for User
                          </button>
                          <button
                            className="btn-action btn-complete"
                            onClick={() => updateStatus({ status: 'COMPLETED' })}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {request.status === 'WAITING_FOR_USER' && (
                        <>
                          <button
                            className="btn-action btn-progress"
                            onClick={() => updateStatus({ status: 'IN_PROGRESS' })}
                          >
                            Resume Progress
                          </button>
                          <button
                            className="btn-action btn-complete"
                            onClick={() => updateStatus({ status: 'COMPLETED' })}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {request.status === 'COMPLETED' && (
                        <button
                          className="btn-action btn-close"
                          onClick={() => updateStatus({ status: 'CLOSED' })}
                        >
                          Close Ticket
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Access Notice for Admins without permission */}
          {isAdmin && !isSuperAdmin && !canPerformActions && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Access Notice</h3>
              </div>
              <div className="detail-card-body">
                <div className="notice notice-warning">
                  This ticket is assigned to another admin. You can only perform actions on tickets assigned to you.
                </div>
              </div>
            </div>
          )}

          {/* Employee Notice */}
          {isEmployee && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Status</h3>
              </div>
              <div className="detail-card-body">
                <div className="notice notice-info">
                  Status changes are managed by the assigned administrator.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
