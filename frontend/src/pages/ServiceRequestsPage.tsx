import { FormEvent, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PermissionGate } from '../components/permissions';

/**
 * PART 2: Service Requests Permission Enforcement
 * 
 * This module now enforces granular permissions:
 * - tickets:view - View tickets (list and details)
 * - tickets:create - Create new tickets
 * - tickets:edit - Edit ticket details
 * - tickets:delete - Delete tickets
 * - tickets:assign - Assign tickets to users
 * - tickets:update_status - Change ticket status
 * - tickets:comment - Post comments
 * - tickets:upload_attachment - Upload attachments
 * - tickets:download_attachment - Download attachments
 * - tickets:export - Export tickets to CSV
 */

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
};

type SummaryStats = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
};

const initialForm = {
  title: '',
  description: '',
  category: 'Network',
  subCategory: '',
  priority: 'MEDIUM',
  requesterName: '',
  projectName: ''
};

const ALLOWED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf,.docx,.xlsx,.txt';

export function ServiceRequestsPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate summary statistics
  const summaryStats: SummaryStats = {
    total: items.length,
    open: items.filter(item => item.status === 'OPEN' || item.status === 'NEW' || item.status === 'ASSIGNED').length,
    inProgress: items.filter(item => item.status === 'IN_PROGRESS' || item.status === 'IN_PROGRESS').length,
    closed: items.filter(item => item.status === 'CLOSED' || item.status === 'RESOLVED').length
  };

  // PART 2: Permission checks using granular permissions
  const canView = hasPermission('tickets:view');
  const canCreate = hasPermission('tickets:create');
  const canEdit = hasPermission('tickets:edit');
  const canDelete = hasPermission('tickets:delete');
  const canAssign = hasPermission('tickets:assign');
  const canUpdateStatus = hasPermission('tickets:update_status');
  const canComment = hasPermission('tickets:comment');
  const canUploadAttachment = hasPermission('tickets:upload_attachment');
  const canExport = hasPermission('tickets:export');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  // Check if Admin can open a specific ticket
  function canAdminOpenTicket(item: ServiceRequest): boolean {
    if (isSuperAdmin) return true;
    if (isAdmin) return item.assigneeId === user?.id;
    return true; // Employees can always try to open their own
  }

  // Handle opening a ticket with permission check
  function handleOpenTicket(item: ServiceRequest) {
    if (!canAdminOpenTicket(item)) {
      setMessage('Access Restricted. You can only open tickets assigned to you.');
      return;
    }
    navigate(`/service-requests/${item.id}`);
  }

  async function load() {
    try {
      const res = await api.get('/service-requests');
      setItems(res.data.items);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('No records loaded. Check backend, MySQL, seed data, and login token.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createRequest(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await api.post('/service-requests', form);
      const requestId = response.data.item.id;
      
      // Upload attachments if any
      if (selectedFiles && selectedFiles.length > 0) {
        setUploading(true);
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
        try {
          await api.post(`/service-requests/${requestId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch {
          // Continue even if attachment upload fails
          console.error('Attachment upload failed');
        }
        setUploading(false);
      }
      
      setCreateOpen(false);
      setForm(initialForm);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await load();
    } catch {
      setMessage('Create request failed. Check mandatory fields and backend logs.');
    }
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }
  
  function clearCreateForm() {
    setCreateOpen(false);
    setForm(initialForm);
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Open edit modal
  function openEditDialog(request: ServiceRequest, event: React.MouseEvent) {
    event.stopPropagation();
    setEditingRequest(request);
    setForm({
      title: request.title,
      description: request.description || '',
      category: request.category,
      subCategory: request.subCategory || '',
      priority: request.priority,
      requesterName: request.requesterName,
      projectName: request.projectName || ''
    });
    setEditOpen(true);
  }

  // Handle edit form submit
  async function updateRequest(event: FormEvent) {
    event.preventDefault();
    if (!editingRequest?.id) return;
    try {
      await api.put(`/service-requests/${editingRequest.id}`, form);
      setEditOpen(false);
      setEditingRequest(null);
      setForm(initialForm);
      await load();
    } catch {
      setMessage('Update failed. Check backend logs.');
    }
  }

  // Close edit modal
  function closeEditDialog() {
    setEditOpen(false);
    setEditingRequest(null);
    setForm(initialForm);
  }

  // Open delete confirmation dialog
  function openDeleteDialog(request: ServiceRequest, event: React.MouseEvent) {
    event.stopPropagation();
    setDeletingRequest(request);
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  // Confirm and execute delete
  async function confirmDelete() {
    if (!deletingRequest?.id || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/service-requests/${deletingRequest.id}`);
      setDeleteOpen(false);
      setDeletingRequest(null);
      await load();
      setMessage('Request deleted successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  }

  // Close delete dialog
  function closeDeleteDialog() {
    setDeleteOpen(false);
    setDeletingRequest(null);
    setDeleteConfirmText('');
  }

  function exportCsv() {
    const header = ['Ticket No', 'Title', 'Category', 'Sub Category', 'Priority', 'Status', 'Requester', 'Assignee', 'Project', 'Description'].join(',');
    const rows = items.map((item) => [
      item.ticketNo,
      item.title,
      item.category,
      item.subCategory || '',
      item.priority,
      item.status,
      item.requesterName,
      item.assigneeName || '',
      item.projectName || '',
      item.description || ''
    ].map((value) => `"${value.replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'service-requests.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <span className="eyebrow">ITSM</span>
          <h2>Service Requests</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="summary-card-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Total Requests</span>
            <span className="summary-card-value">{summaryStats.total}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Open Requests</span>
            <span className="summary-card-value">{summaryStats.open}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">In Progress</span>
            <span className="summary-card-value">{summaryStats.inProgress}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon available">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Closed Requests</span>
            <span className="summary-card-value">{summaryStats.closed}</span>
          </div>
        </div>
      </div>

      {message && <div className={`alert ${message.includes('Failed') || message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

      {/* Toolbar */}
      <div className="listing-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={load}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Refresh
          </button>
          {canExport && (
            <button className="toolbar-btn" onClick={exportCsv}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2"/></svg>
              Export
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <PermissionGate permission="tickets:create">
            <button className="toolbar-btn primary" onClick={() => setCreateOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Create Request
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>All Requests</h3>
          <span className="table-count">{items.length} request{items.length !== 1 ? 's' : ''}</span>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="empty-state-title">No service requests</p>
            <p className="empty-state-description">Create a new service request to get started.</p>
            <PermissionGate permission="tickets:create">
              <div className="empty-state-action">
                <button className="primary" onClick={() => setCreateOpen(true)}>Create Request</button>
              </div>
            </PermissionGate>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Assignee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isRestricted = isAdmin && !canAdminOpenTicket(item);
                  return (
                    <tr key={item.id} className={isRestricted ? 'restricted-row' : ''} onClick={() => !isRestricted && handleOpenTicket(item)}>
                      <td><span className="project-code">{item.ticketNo}</span></td>
                      <td><span className="project-name">{item.title}</span></td>
                      <td>{item.category}</td>
                      <td><span className={`priority-badge priority-${item.priority.toLowerCase()}`}>{item.priority}</span></td>
                      <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status.replace(/_/g, ' ')}</span></td>
                      <td>{item.requesterName}</td>
                      <td>{item.assigneeName || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          {isRestricted ? (
                            <span className="restricted-badge">Restricted</span>
                          ) : (
                            <>
                              <button className="link-button" onClick={() => handleOpenTicket(item)} title="Open">Open</button>
                              <PermissionGate permission="tickets:delete">
                                <button className="btn-delete" onClick={(event) => openDeleteDialog(item, event)} title="Delete">Delete</button>
                              </PermissionGate>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createRequest}>
            <div className="page-title-row">
              <h3>Create Service Request</h3>
              <button type="button" className="close" onClick={clearCreateForm}>Close</button>
            </div>
            <label>Title *<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Category *<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></label>
            <label>Sub Category<input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} /></label>
            <label>Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
              </select>
            </label>
            <label>Requester *<input value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} required /></label>
            <label>Project<input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} /></label>
            <div className="file-upload-section">
              <label className="file-upload-label">Attachments</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES}
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="file-upload-hint">
                Allowed: png, jpg, jpeg, pdf, docx, xlsx, txt (max 25MB per file)
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="selected-files">
                  {selectedFiles.length} file(s) selected
                </div>
              )}
            </div>
            <button className="primary" type="submit" disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Request'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && editingRequest && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={updateRequest}>
            <div className="page-title-row">
              <h3>Edit Service Request</h3>
              <button type="button" className="close" onClick={closeEditDialog}>Close</button>
            </div>
            <label>Title *<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Category *<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></label>
            <label>Sub Category<input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} /></label>
            <label>Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
              </select>
            </label>
            <label>Requester *<input value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} required /></label>
            <label>Project<input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeEditDialog}>Cancel</button>
              <button className="primary" type="submit">Update</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && deletingRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Record?</h3>
              <button type="button" className="close" onClick={closeDeleteDialog}>Close</button>
            </div>

            <div className="warning-box">
              <p>Are you sure you want to delete this record?</p>
              <p>This action cannot be undone.</p>
            </div>

            <div className="form-group">
              <label>
                Type <strong>DELETE</strong> to confirm:
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteDialog}>Cancel</button>
              <button
                type="button"
                className="danger"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
