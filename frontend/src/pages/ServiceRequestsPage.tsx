import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function ServiceRequestsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
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

  // Permission checks
  const canCreate = hasPermission('tickets:create');
  const canDelete = hasPermission('tickets:manage');

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
      await api.post('/service-requests', form);
      setCreateOpen(false);
      setForm(initialForm);
      await load();
    } catch {
      setMessage('Create request failed. Check mandatory fields and backend logs.');
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
      <div className="page-title-row">
        <div>
          <span className="eyebrow">ITSM</span>
          <h2>Service Requests</h2>
        </div>
        <div className="action-row">
          <button className="secondary" onClick={load}>Refresh</button>
          {canCreate && <button className="secondary" onClick={exportCsv}>Export CSV</button>}
          {canCreate && <button className="primary" onClick={() => setCreateOpen(true)}>Create Request</button>}
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      <div className="table-card">
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
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.ticketNo}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td><span className={`pill ${item.priority.toLowerCase()}`}>{item.priority}</span></td>
                <td>{item.status}</td>
                <td>{item.requesterName}</td>
                <td>{item.assigneeName || 'Unassigned'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="link-button" onClick={() => navigate(`/service-requests/${item.id}`)} title="Open">Open</button>
                    {canDelete && <button className="btn-delete" onClick={(event) => openDeleteDialog(item, event)} title="Delete">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={8}>No records loaded. Check backend and database seed.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createRequest}>
            <div className="page-title-row">
              <h3>Create Service Request</h3>
              <button type="button" className="close" onClick={() => setCreateOpen(false)}>Close</button>
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
            <button className="primary" type="submit">Save Request</button>
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
