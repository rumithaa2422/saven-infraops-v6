import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissionCount: number;
  createdAt: string;
};

type Permission = {
  id: string;
  code: string;
  description: string | null;
};

type PermissionGroupType = {
  label: string;
  permissions: Permission[];
};

const permissionGroups: PermissionGroupType[] = [
  { label: 'Dashboard', permissions: [] },
  { label: 'Service Requests', permissions: [] },
  { label: 'Incidents', permissions: [] },
  { label: 'Changes', permissions: [] },
  { label: 'Inventory', permissions: [] },
  { label: 'Access Management', permissions: [] },
  { label: 'Compliance', permissions: [] },
  { label: 'Settings', permissions: [] },
  { label: 'Users & Teams', permissions: [] },
  { label: 'AI Assistant', permissions: [] }
];

const permissionToGroup: Record<string, string> = {
  'dashboard:read': 'Dashboard',
  'tickets:read': 'Service Requests',
  'tickets:write': 'Service Requests',
  'tickets:assign': 'Service Requests',
  'incidents:read': 'Incidents',
  'incidents:write': 'Incidents',
  'changes:read': 'Changes',
  'changes:approve': 'Changes',
  'inventory:read': 'Inventory',
  'inventory:write': 'Inventory',
  'access:read': 'Access Management',
  'access:approve': 'Access Management',
  'compliance:read': 'Compliance',
  'compliance:write': 'Compliance',
  'settings:read': 'Settings',
  'settings:write': 'Settings',
  'users:read': 'Users & Teams',
  'users:write': 'Users & Teams',
  'ai:ask': 'AI Assistant'
};

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Group permissions by category
  const groupedPermissions = permissionGroups.map(group => ({
    ...group,
    permissions: permissions.filter(p => permissionToGroup[p.code] === group.label)
  }));

  async function loadData() {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions')
      ]);
      setRoles(rolesRes.data.items || []);
      setPermissions(permissionsRes.data.items || []);
      setMessage('');
    } catch {
      setRoles([]);
      setPermissions([]);
      setMessage('Unable to load data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function openEdit(role: Role) {
    try {
      const res = await api.get(`/roles/${role.id}`);
      const roleData = res.data;
      setEditingRole(role);
      setEditName(roleData.name);
      setEditDescription(roleData.description || '');
      setEditPermissions(roleData.permissions || []);
      setEditOpen(true);
    } catch {
      setMessage('Failed to load role details.');
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingRole) return;
    setSaving(true);
    try {
      // Update role name/description
      await api.patch(`/roles/${editingRole.id}`, {
        name: editName,
        description: editDescription
      });

      // Update permissions
      await api.patch(`/roles/${editingRole.id}/permissions`, {
        permissions: editPermissions
      });

      setEditOpen(false);
      await loadData();
      setMessage('Role updated successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to update role.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(role: Role) {
    if (role.name === 'Super Admin') {
      setMessage('Cannot delete the Super Admin role.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/roles/${role.id}`);
      await loadData();
      setMessage('Role deleted successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to delete role.');
    }
  }

  async function createRole(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      await api.post('/roles', {
        name: createName,
        description: createDescription,
        permissions: createPermissions
      });
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreatePermissions([]);
      await loadData();
      setMessage('Role created successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to create role.');
    } finally {
      setCreating(false);
    }
  }

  function togglePermission(perm: string, isCreate: boolean) {
    if (isCreate) {
      setCreatePermissions(prev =>
        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
      );
    } else {
      setEditPermissions(prev =>
        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
      );
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>Roles & Permissions</h2>
        </div>
        <div className="action-row">
          <button className="secondary" onClick={loadData}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="primary" onClick={() => setCreateOpen(true)}>
            Create Role
          </button>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <section className="grid cards-3">
          <div className="stat-card">
            <div className="stat-value">{roles.length}</div>
            <div className="stat-label">Total Roles</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{permissions.length}</div>
            <div className="stat-label">Total Permissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{permissionGroups.length}</div>
            <div className="stat-label">Permission Groups</div>
          </div>
        </section>
      )}

      <section className="module-table">
        <table>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td><strong>{role.name}</strong></td>
                <td>{role.description || '-'}</td>
                <td>
                  <span className="permission-badge">{role.permissionCount} permissions</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="secondary small" onClick={() => openEdit(role)}>
                      Edit
                    </button>
                    <button
                      className="secondary small danger"
                      onClick={() => deleteRole(role)}
                      disabled={role.name === 'Super Admin'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="empty-row">No roles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Create Role Modal */}
      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal wide" onSubmit={createRole}>
            <div className="page-title-row">
              <h3>Create Role</h3>
              <button type="button" className="close" onClick={() => setCreateOpen(false)}>Close</button>
            </div>

            <div className="form-row">
              <label>
                Role Name *
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  required
                />
              </label>
              <label>
                Description
                <input
                  type="text"
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                />
              </label>
            </div>

            <h4>Permissions</h4>
            <div className="permissions-grid">
              {groupedPermissions.map(group => (
                <div key={group.label} className="permission-group">
                  <h5>{group.label}</h5>
                  {group.permissions.length === 0 ? (
                    <p className="no-permissions">No permissions</p>
                  ) : (
                    group.permissions.map(perm => (
                      <label key={perm.id} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={createPermissions.includes(perm.code)}
                          onChange={() => togglePermission(perm.code, true)}
                        />
                        <span className="perm-code">{perm.code}</span>
                      </label>
                    ))
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Role Modal */}
      {editOpen && editingRole && (
        <div className="modal-backdrop">
          <form className="modal wide" onSubmit={saveEdit}>
            <div className="page-title-row">
              <h3>Edit Role: {editingRole.name}</h3>
              <button type="button" className="close" onClick={() => setEditOpen(false)}>Close</button>
            </div>

            <div className="form-row">
              <label>
                Role Name *
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </label>
              <label>
                Description
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                />
              </label>
            </div>

            <h4>Permissions</h4>
            <div className="permissions-grid">
              {groupedPermissions.map(group => (
                <div key={group.label} className="permission-group">
                  <h5>{group.label}</h5>
                  {group.permissions.length === 0 ? (
                    <p className="no-permissions">No permissions</p>
                  ) : (
                    group.permissions.map(perm => (
                      <label key={perm.id} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm.code)}
                          onChange={() => togglePermission(perm.code, false)}
                        />
                        <span className="perm-code">{perm.code}</span>
                      </label>
                    ))
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
