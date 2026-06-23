import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

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

// Module configuration with child permissions
const moduleConfig = [
  {
    label: 'Dashboard',
    permissions: ['dashboard:view']
  },
  {
    label: 'Service Requests',
    permissions: ['tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign']
  },
  {
    label: 'Incidents',
    permissions: ['incidents:view', 'incidents:create', 'incidents:manage']
  },
  {
    label: 'Changes',
    permissions: ['changes:view', 'changes:create', 'changes:approve', 'changes:manage']
  },
  {
    label: 'Inventory',
    permissions: ['inventory:view', 'inventory:create', 'inventory:manage', 'inventory:delete']
  },
  {
    label: 'Access Management',
    permissions: ['access:view', 'access:request', 'access:approve', 'access:revoke']
  },
  {
    label: 'Compliance',
    permissions: ['compliance:view', 'compliance:create', 'compliance:manage', 'compliance:audit']
  },
  {
    label: 'Projects & Environments',
    permissions: ['projects:view', 'projects:create', 'projects:manage']
  },
  {
    label: 'Vendors & Licenses',
    permissions: ['vendors:view', 'vendors:create', 'vendors:manage']
  },
  {
    label: 'Reports & Analytics',
    permissions: ['reports:view']
  },
  {
    label: 'Knowledge Base',
    permissions: ['kb:view']
  },
  {
    label: 'Users & Teams',
    permissions: ['users:view', 'users:create', 'users:manage', 'users:delete']
  },
  {
    label: 'Roles & Permissions',
    permissions: ['roles:view', 'roles:create', 'roles:manage', 'roles:delete']
  },
  {
    label: 'Settings',
    permissions: ['settings:view', 'settings:manage']
  },
  {
    label: 'AI Assistant',
    permissions: ['ai:ask']
  }
];

export function RolesPermissionsPage() {
  const { hasPermission } = useAuth();
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

  // Helper: Check if all permissions in a module are selected
  function isModuleChecked(modulePermissions: string[], selectedPermissions: string[]): boolean {
    if (modulePermissions.length === 0) return false;
    return modulePermissions.every(perm => selectedPermissions.includes(perm));
  }

  // Helper: Check if some permissions in a module are selected (indeterminate state)
  function isModuleIndeterminate(modulePermissions: string[], selectedPermissions: string[]): boolean {
    if (modulePermissions.length === 0) return false;
    const checked = modulePermissions.filter(perm => selectedPermissions.includes(perm)).length;
    return checked > 0 && checked < modulePermissions.length;
  }

  // Toggle module: select/deselect all child permissions
  function toggleModule(modulePermissions: string[], isCreate: boolean) {
    const allSelected = modulePermissions.every(perm => 
      isCreate ? createPermissions.includes(perm) : editPermissions.includes(perm)
    );

    if (isCreate) {
      if (allSelected) {
        setCreatePermissions(prev => prev.filter(p => !modulePermissions.includes(p)));
      } else {
        setCreatePermissions(prev => [...new Set([...prev, ...modulePermissions])]);
      }
    } else {
      if (allSelected) {
        setEditPermissions(prev => prev.filter(p => !modulePermissions.includes(p)));
      } else {
        setEditPermissions(prev => [...new Set([...prev, ...modulePermissions])]);
      }
    }
  }

  // Toggle single permission
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
      await api.patch(`/roles/${editingRole.id}`, {
        name: editName,
        description: editDescription
      });
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

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateName('');
    setCreateDescription('');
    setCreatePermissions([]);
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditingRole(null);
    setEditName('');
    setEditDescription('');
    setEditPermissions([]);
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
          {hasPermission('users:write') && (
            <button className="primary" onClick={() => setCreateOpen(true)}>
              Create Role
            </button>
          )}
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
            <div className="stat-value">{moduleConfig.length}</div>
            <div className="stat-label">Modules</div>
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
                  {hasPermission('users:write') && (
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
                  )}
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
              <button type="button" className="close" onClick={closeCreateModal}>Close</button>
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

            <h4>Module Permissions</h4>
            <p className="hint">Enable a module to grant all its permissions, or select individual permissions below.</p>
            
            <div className="module-permissions-grid">
              {moduleConfig.map(module => {
                const isChecked = isModuleChecked(module.permissions, createPermissions);
                const isIndeterminate = isModuleIndeterminate(module.permissions, createPermissions);
                
                return (
                  <div key={module.label} className={`module-card ${isChecked ? 'module-active' : ''}`}>
                    <div className="module-header">
                      <label className="module-checkbox">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                          onChange={() => toggleModule(module.permissions, true)}
                        />
                        <span className="module-label">{module.label}</span>
                      </label>
                    </div>
                    <div className="module-permissions">
                      {module.permissions.map(perm => (
                        <label key={perm} className="permission-item">
                          <input
                            type="checkbox"
                            checked={createPermissions.includes(perm)}
                            onChange={() => togglePermission(perm, true)}
                          />
                          <span className="perm-code">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeCreateModal}>
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
              <button type="button" className="close" onClick={closeEditModal}>Close</button>
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

            <h4>Module Permissions</h4>
            <p className="hint">Enable a module to grant all its permissions, or select individual permissions below.</p>

            <div className="module-permissions-grid">
              {moduleConfig.map(module => {
                const isChecked = isModuleChecked(module.permissions, editPermissions);
                const isIndeterminate = isModuleIndeterminate(module.permissions, editPermissions);
                
                return (
                  <div key={module.label} className={`module-card ${isChecked ? 'module-active' : ''}`}>
                    <div className="module-header">
                      <label className="module-checkbox">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                          onChange={() => toggleModule(module.permissions, false)}
                        />
                        <span className="module-label">{module.label}</span>
                      </label>
                    </div>
                    <div className="module-permissions">
                      {module.permissions.map(perm => (
                        <label key={perm} className="permission-item">
                          <input
                            type="checkbox"
                            checked={editPermissions.includes(perm)}
                            onChange={() => togglePermission(perm, false)}
                          />
                          <span className="perm-code">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeEditModal}>
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
