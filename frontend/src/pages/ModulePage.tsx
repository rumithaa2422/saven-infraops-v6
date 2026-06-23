import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../auth/AuthContext';

type ModulePageProps = {
  moduleKey: string;
  title: string;
};

type RecordItem = Record<string, unknown> & { id?: string };

type Field = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
};

type ModuleConfig = {
  referenceKey: string;
  titleKey: string;
  ownerKey?: string;
  statusKey?: string;
  dateKey?: string;
  fields: Field[];
  columns: Field[];
  permissions: {
    create?: string;
    write?: string;
  };
};

const configs: Record<string, ModuleConfig> = {
  incidents: {
    referenceKey: 'incidentNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['SEV1', 'SEV2', 'SEV3', 'SEV4'] },
      { key: 'impactedService', label: 'Impacted Service' },
      { key: 'impactedProject', label: 'Impacted Project' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ],
    columns: [
      { key: 'incidentNo', label: 'Incident' },
      { key: 'title', label: 'Title' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
      { key: 'ownerName', label: 'Owner' }
    ],
    permissions: { create: 'incidents:write', write: 'incidents:write' }
  },
  problems: {
    referenceKey: 'problemNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'ownerName', label: 'Owner' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'rootCause', label: 'Root Cause', type: 'textarea' }
    ],
    columns: [
      { key: 'problemNo', label: 'Problem' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'ownerName', label: 'Owner' }
    ],
    permissions: { create: 'incidents:write', write: 'incidents:write' }
  },
  changes: {
    referenceKey: 'changeNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { key: 'ownerName', label: 'Owner' },
      { key: 'changeWindow', label: 'Change Window', type: 'date' },
      { key: 'rollbackPlan', label: 'Rollback Plan', type: 'textarea' }
    ],
    columns: [
      { key: 'changeNo', label: 'Change' },
      { key: 'title', label: 'Title' },
      { key: 'riskLevel', label: 'Risk' },
      { key: 'status', label: 'Status' },
      { key: 'ownerName', label: 'Owner' }
    ],
    permissions: { create: 'changes:approve', write: 'changes:approve' }
  },
  inventory: {
    referenceKey: 'assetNo',
    titleKey: 'assetType',
    ownerKey: 'assignedToName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'assetType', label: 'Asset Type', required: true },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'serialNo', label: 'Serial No' },
      { key: 'assignedToName', label: 'Assigned To' },
      { key: 'location', label: 'Location' }
    ],
    columns: [
      { key: 'assetNo', label: 'Asset' },
      { key: 'assetType', label: 'Type' },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'status', label: 'Status' },
      { key: 'assignedToName', label: 'Assigned To' }
    ],
    permissions: { create: 'inventory:write', write: 'inventory:write' }
  },
  'access-management': {
    referenceKey: 'requestNo',
    titleKey: 'systemName',
    ownerKey: 'approverName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'requesterName', label: 'Requester', required: true },
      { key: 'accessType', label: 'Access Type', required: true },
      { key: 'systemName', label: 'System Name', required: true },
      { key: 'approverName', label: 'Approver' },
      { key: 'justification', label: 'Justification', type: 'textarea' }
    ],
    columns: [
      { key: 'requestNo', label: 'Request' },
      { key: 'requesterName', label: 'Requester' },
      { key: 'accessType', label: 'Access Type' },
      { key: 'systemName', label: 'System' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'access:approve', write: 'access:approve' }
  },
  compliance: {
    referenceKey: 'controlNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'dueAt',
    fields: [
      { key: 'title', label: 'Control Title', required: true },
      { key: 'controlArea', label: 'Control Area', required: true },
      { key: 'ownerName', label: 'Owner', required: true },
      { key: 'frequency', label: 'Frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'] },
      { key: 'riskRating', label: 'Risk Rating', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
    ],
    columns: [
      { key: 'controlNo', label: 'Control' },
      { key: 'title', label: 'Title' },
      { key: 'controlArea', label: 'Area' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'compliance:write', write: 'compliance:write' }
  },
  'projects-environments': {
    referenceKey: 'projectName',
    titleKey: 'environmentName',
    ownerKey: 'ownerName',
    dateKey: 'createdAt',
    fields: [
      { key: 'projectName', label: 'Project Name', required: true },
      { key: 'environmentName', label: 'Environment', required: true },
      { key: 'serviceName', label: 'Service Name' },
      { key: 'serverName', label: 'Server Name' },
      { key: 'databaseName', label: 'Database Name' },
      { key: 'ownerName', label: 'Owner' }
    ],
    columns: [
      { key: 'projectName', label: 'Project' },
      { key: 'environmentName', label: 'Environment' },
      { key: 'serviceName', label: 'Service' },
      { key: 'serverName', label: 'Server' },
      { key: 'ownerName', label: 'Owner' }
    ],
    permissions: { create: 'settings:write', write: 'settings:write' }
  },
  'vendors-licenses': {
    referenceKey: 'vendorName',
    titleKey: 'licenseName',
    ownerKey: 'ownerName',
    dateKey: 'renewalAt',
    fields: [
      { key: 'vendorName', label: 'Vendor Name', required: true },
      { key: 'licenseName', label: 'License Name', required: true },
      { key: 'licenseCount', label: 'License Count', type: 'number' },
      { key: 'assignedCount', label: 'Assigned Count', type: 'number' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'renewalAt', label: 'Renewal Date', type: 'date' }
    ],
    columns: [
      { key: 'vendorName', label: 'Vendor' },
      { key: 'licenseName', label: 'License' },
      { key: 'licenseCount', label: 'Count' },
      { key: 'assignedCount', label: 'Assigned' },
      { key: 'renewalAt', label: 'Renewal' }
    ],
    permissions: { create: 'settings:write', write: 'settings:write' }
  },
  'knowledge-base': {
    referenceKey: 'category',
    titleKey: 'title',
    ownerKey: 'authorName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Article Title', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'authorName', label: 'Author' },
      { key: 'body', label: 'Body', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'authorName', label: 'Author' }
    ],
    permissions: { create: 'settings:write', write: 'settings:write' }
  },
  'users-teams': {
    referenceKey: 'email',
    titleKey: 'name',
    ownerKey: 'department',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'], required: true },
      { key: 'roleId', label: 'Role', type: 'select', options: ['role-placeholder'] }
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'users:write', write: 'users:write' }
  },
  'reports-analytics': {
    referenceKey: 'title',
    titleKey: 'description',
    ownerKey: 'owner',
    fields: [
      { key: 'title', label: 'Report Name', required: true },
      { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' }
    ],
    columns: [
      { key: 'title', label: 'Report' },
      { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' }
    ],
    permissions: { create: undefined, write: 'dashboard:read' }
  }
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && value.includes('T') && value.endsWith('Z')) return new Date(value).toLocaleDateString();
  return String(value);
}


function getStatusActions(moduleKey: string) {
  if (moduleKey === 'access-management') return [
    { label: 'Approve', value: 'APPROVED' },
    { label: 'Provision', value: 'PROVISIONED' },
    { label: 'Revoke', value: 'REVOKED' }
  ];
  if (moduleKey === 'inventory') return [
    { label: 'Mark Available', value: 'AVAILABLE' },
    { label: 'Mark Assigned', value: 'ASSIGNED' },
    { label: 'Under Repair', value: 'UNDER_REPAIR' }
  ];
  if (moduleKey === 'knowledge-base') return [
    { label: 'Publish', value: 'PUBLISHED' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Archive', value: 'ARCHIVED' }
  ];
  if (moduleKey === 'users-teams') return [];
  return [
    { label: 'Mark In Progress', value: 'IN_PROGRESS' },
    { label: 'Mark Pending', value: 'PENDING_APPROVAL' },
    { label: 'Close', value: 'CLOSED' }
  ];
}

function getInitialForm(fields: Field[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.options?.[0] || '';
    return acc;
  }, {});
}

export function ModulePage({ moduleKey, title }: ModulePageProps) {
  const config = configs[moduleKey] || configs['reports-analytics'];
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(config.fields));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<{id: string; name: string}[]>([]);
  const statusActions = getStatusActions(moduleKey);
  
  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<RecordItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch roles for users-teams module
  useEffect(() => {
    if (moduleKey === 'users-teams') {
      api.get('/roles').then((res) => {
        setRoles(res.data.items || []);
      }).catch(() => {
        setRoles([]);
      });
    }
  }, [moduleKey]);

  const openCount = useMemo(() => items.filter((item) => {
    const value = item[config.statusKey || 'status'];
    return !['CLOSED', 'RESOLVED', 'DISPOSED', 'false', 'No'].includes(String(value));
  }).length, [items, config.statusKey]);
  const dueCount = useMemo(() => items.filter((item) => config.dateKey && item[config.dateKey]).length, [items, config.dateKey]);
  const riskCount = useMemo(() => items.filter((item) => ['HIGH', 'CRITICAL', 'SEV1', 'SEV2'].includes(String(item.priority || item.riskRating || item.severity || ''))).length, [items]);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get(`/${moduleKey}`);
      setItems(response.data.items || []);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('Unable to load records. Check backend, database, and permissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm(getInitialForm(config.fields));
    setSelected(null);
    setCreateOpen(false);
    load();
  }, [moduleKey]);

  async function createRecord(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post(`/${moduleKey}`, form);
      setCreateOpen(false);
      setForm(getInitialForm(config.fields));
      await load();
    } catch {
      setMessage('Create failed. Check mandatory fields and backend logs.');
    }
  }

  async function updateStatus(status: string) {
    if (!selected?.id) return;
    try {
      const response = await api.patch(`/${moduleKey}/${selected.id}`, { status });
      setSelected(response.data.item);
      await load();
    } catch {
      setMessage('Status update failed.');
    }
  }

  function exportCsv() {
    const header = config.columns.map((c) => c.label).join(',');
    const rows = items.map((item) => config.columns.map((c) => `"${formatValue(item[c.key]).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Open delete confirmation dialog
  function openDeleteDialog(user: RecordItem, event: React.MouseEvent) {
    event.stopPropagation();
    setDeletingUser(user);
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  // Confirm and execute delete
  async function confirmDelete() {
    if (!deletingUser?.id || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/users-teams/${deletingUser.id}`);
      setDeleteOpen(false);
      setDeletingUser(null);
      setMessage('User deleted successfully.');
      await load();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  }

  // Close delete dialog
  function closeDeleteDialog() {
    setDeleteOpen(false);
    setDeletingUser(null);
    setDeleteConfirmText('');
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Management</span>
          <h2>{title}</h2>
        </div>
        <div className="action-row">
          <button className="secondary" onClick={load}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          {(config.permissions.create || config.permissions.write) && <button className="secondary" onClick={exportCsv}>Export CSV</button>}
          {config.permissions.create && hasPermission(config.permissions.create) && <button className="primary" onClick={() => setCreateOpen(true)}>Create</button>}
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      <section className="grid cards-3">
        <StatCard label="Active" value={String(openCount)} hint="Current working queue" />
        <StatCard label="Tracked" value={String(items.length)} hint="Loaded records" />
        <StatCard label="Risk / Due" value={String(riskCount || dueCount)} hint="Needs review" />
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={String(item.id || index)} onClick={() => setSelected(item)}>
                {config.columns.map((column) => <td key={column.key}>{formatValue(item[column.key])}</td>)}
                <td>
                  <div className="action-buttons">
                    <button className="link-button" onClick={(event) => { event.stopPropagation(); setSelected(item); }}>Open</button>
                    {moduleKey === 'users-teams' && hasPermission('users:delete') && (
                      <button 
                        className="btn-delete" 
                        onClick={(event) => openDeleteDialog(item, event)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={config.columns.length + 1}>{loading ? 'Loading records...' : 'No records found.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createRecord}>
            <div className="page-title-row">
              <h3>Create {title}</h3>
              <button type="button" className="close" onClick={() => setCreateOpen(false)}>Close</button>
            </div>
            {config.fields.map((field) => {
              // Special handling for roleId in users-teams
              if (field.key === 'roleId' && moduleKey === 'users-teams') {
                return (
                  <label key={field.key}>
                    {field.label}{field.required ? ' *' : ''}
                    <select 
                      value={form[field.key] || ''} 
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} 
                      required={field.required}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              
              return (
                <label key={field.key}>
                  {field.label}{field.required ? ' *' : ''}
                  {field.type === 'textarea' ? (
                    <textarea value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} />
                  ) : field.type === 'select' ? (
                    <select value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required}>
                      {(field.options || []).map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input type={field.type || 'text'} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} />
                  )}
                </label>
              );
            })}
            <button className="primary" type="submit">Save</button>
          </form>
        </div>
      )}

      {selected && (
        <div className="drawer">
          <button className="close" onClick={() => setSelected(null)}>Close</button>
          <span className="eyebrow">{formatValue(selected[config.referenceKey])}</span>
          <h3>{formatValue(selected[config.titleKey])}</h3>
          <div className="record-detail">
            {config.columns.map((column) => (
              <p key={column.key}><strong>{column.label}:</strong> {formatValue(selected[column.key])}</p>
            ))}
          </div>
          {config.statusKey && statusActions.length > 0 && config.permissions.write && hasPermission(config.permissions.write) && (
            <div className="drawer-actions">
              {statusActions.map((action) => (
                <button key={action.value} onClick={() => updateStatus(action.value)}>{action.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && deletingUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete User</h3>
              <button type="button" className="close" onClick={closeDeleteDialog}>Close</button>
            </div>
            
            <div className="warning-box">
              <p><strong>Warning:</strong> This action cannot be undone.</p>
              <p>You are about to delete the user: <strong>{String(deletingUser.name || deletingUser.email)}</strong></p>
              <p>The user will be soft-deleted and will no longer be able to log in.</p>
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
              <button type="button" className="secondary" onClick={closeDeleteDialog}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
