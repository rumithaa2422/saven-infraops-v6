import { FormEvent, useEffect, useState } from 'react';
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
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  // Permission checks
  const canCreate = hasPermission('tickets:create');
  const canManage = hasPermission('tickets:manage');
  const canAssign = hasPermission('tickets:assign');

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

  async function updateSelected(payload: Partial<ServiceRequest> & { comment?: string }) {
    if (!selected) return;
    try {
      const response = await api.patch(`/service-requests/${selected.id}`, payload);
      setSelected(response.data.item);
      setComment('');
      await load();
    } catch {
      setMessage('Action failed. Check backend logs and user permission.');
    }
  }

  function exportCsv() {
    const header = ['Ticket', 'Title', 'Category', 'Priority', 'Status', 'Requester', 'Assignee'].join(',');
    const rows = items.map((item) => [item.ticketNo, item.title, item.category, item.priority, item.status, item.requesterName, item.assigneeName || ''].map((value) => `"${value.replace(/"/g, '""')}"`).join(','));
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
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td>{item.ticketNo}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td><span className={`pill ${item.priority.toLowerCase()}`}>{item.priority}</span></td>
                <td>{item.status}</td>
                <td>{item.requesterName}</td>
                <td>{item.assigneeName || 'Unassigned'}</td>
                <td><button className="link-button" onClick={(event) => { event.stopPropagation(); setSelected(item); }}>Open</button></td>
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

      {selected && (
        <div className="drawer">
          <button className="close" onClick={() => setSelected(null)}>Close</button>
          <span className="eyebrow">{selected.ticketNo}</span>
          <h3>{selected.title}</h3>
          <p>Category: {selected.category}</p>
          <p>Priority: {selected.priority}</p>
          <p>Status: {selected.status}</p>
          <p>Requester: {selected.requesterName}</p>
          <p>Assignee: {selected.assigneeName || 'Unassigned'}</p>
          <p>Description: {selected.description || '-'}</p>
          {canManage && (
            <div className="drawer-actions">
              {canAssign && <button onClick={() => updateSelected({ status: 'ASSIGNED', assigneeName: selected.assigneeName || 'Infra Team' })}>Assign</button>}
              <button onClick={() => updateSelected({ priority: 'CRITICAL', status: 'IN_PROGRESS' })}>Escalate</button>
              <button onClick={() => updateSelected({ status: 'WAITING_FOR_USER' })}>Wait for User</button>
              <button onClick={() => updateSelected({ status: 'CLOSED' })}>Close</button>
            </div>
          )}
          {canManage && (
            <div className="comment-box">
              <label>Add Comment<textarea value={comment} onChange={(e) => setComment(e.target.value)} /></label>
              <button className="secondary" onClick={() => updateSelected({ comment })} disabled={!comment.trim()}>Save Comment</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
