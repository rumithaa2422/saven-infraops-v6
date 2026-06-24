import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

// Phase 5B.1: Enhanced Role type with user count
type Role = {
  id: string;
  name: string;
  description: string | null;
  permissionCount: number;
  userCount: number;
  createdAt: string;
};

type Permission = {
  id: string;
  code: string;
  description: string | null;
};

// Phase 5B.1: Module configuration with groups and icons
type ModuleGroup = {
  label: string;
  modules: {
    label: string;
    icon: string;
    permissions: string[];
  }[];
};

const moduleGroups: ModuleGroup[] = [
  {
    label: 'Core Operations',
    modules: [
      { label: 'Dashboard', icon: '📊', permissions: ['dashboard:view'] },
      { label: 'Service Requests', icon: '🎫', permissions: ['tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign'] },
      { label: 'Incidents', icon: '🚨', permissions: ['incidents:view', 'incidents:create', 'incidents:manage'] },
      { label: 'Changes', icon: '🔄', permissions: ['changes:view', 'changes:create', 'changes:approve', 'changes:manage'] }
    ]
  },
  {
    label: 'Asset Management',
    modules: [
      { label: 'Inventory', icon: '📦', permissions: ['inventory:view', 'inventory:create', 'inventory:manage', 'inventory:delete'] },
      { label: 'Projects & Environments', icon: '🖥️', permissions: ['projects:view', 'projects:create', 'projects:manage'] },
      { label: 'Vendors & Licenses', icon: '📄', permissions: ['vendors:view', 'vendors:create', 'vendors:manage'] },
      { label: 'Access Management', icon: '🔑', permissions: ['access:view', 'access:request', 'access:approve', 'access:revoke'] }
    ]
  },
  {
    label: 'Governance',
    modules: [
      { label: 'Compliance', icon: '✓', permissions: ['compliance:view', 'compliance:create', 'compliance:manage', 'compliance:audit'] },
      { label: 'Knowledge Base', icon: '📚', permissions: ['kb:view'] },
      { label: 'Reports & Analytics', icon: '📈', permissions: ['reports:view'] }
    ]
  },
  {
    label: 'Administration',
    modules: [
      { label: 'Users & Teams', icon: '👥', permissions: ['users:view', 'users:create', 'users:manage', 'users:delete'] },
      { label: 'Roles & Permissions', icon: '🔐', permissions: ['roles:view', 'roles:create', 'roles:manage', 'roles:delete'] },
      { label: 'Settings', icon: '⚙️', permissions: ['settings:view', 'settings:manage'] },
      { label: 'AI Assistant', icon: '🤖', permissions: ['ai:ask'] }
    ]
  }
];

// Flat module config for compatibility
const moduleConfig = moduleGroups.flatMap(group => group.modules);

export function RolesPermissionsPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Phase 5B.1: Search and selection state
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editPermissionSearch, setEditPermissionSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [createPermissionSearch, setCreatePermissionSearch] = useState('');
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

  // Phase 5B.1: Filter roles by search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    (role.description?.toLowerCase().includes(roleSearch.toLowerCase()) ?? false)
  );

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
    setCreatePermissionSearch('');
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditingRole(null);
    setEditName('');
    setEditDescription('');
    setEditPermissions([]);
    setEditPermissionSearch('');
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

      {/* Phase 5B.1: Two-column layout */}
      <div className="roles-layout">
        {/* Left: Role Summary Panel */}
        <aside className="role-summary-panel">
          <div className="panel-header">
            <h3>Role Summary</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="role-list">
            {filteredRoles.length === 0 && (
              <p className="no-results">No roles found.</p>
            )}
            {filteredRoles.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole?.id === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              >
                <div className="role-card-header">
                  <strong>{role.name}</strong>
                  {role.name === 'Super Admin' && <span className="protected-badge">Protected</span>}
                </div>
                <div className="role-card-meta">
                  <span className="meta-item">📋 {role.permissionCount} permissions</span>
                  <span className="meta-item">👥 {role.userCount || 0} users</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Main content */}
        <main className="role-main-content">
          {selectedRole ? (
            /* Phase 5B.1: Role Detail Panel */
            <div className="role-detail-panel">
              <div className="detail-header">
                <div>
                  <h3>{selectedRole.name}</h3>
                  <p className="detail-description">{selectedRole.description || 'No description'}</p>
                </div>
                {hasPermission('users:write') && (
                  <button className="secondary" onClick={() => openEdit(selectedRole)}>
                    Edit Role
                  </button>
                )}
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="stat-label">Permissions</span>
                  <span className="stat-value">{selectedRole.permissionCount}</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-label">Users</span>
                  <span className="stat-value">{selectedRole.userCount || 0}</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-label">Categories</span>
                  <span className="stat-value">{moduleGroups.length}</span>
                </div>
              </div>
              <div className="detail-section">
                <h4>Permission Categories</h4>
                <div className="category-list">
                  {moduleGroups.map(group => (
                    <span key={group.label} className="category-chip">{group.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Table view */
            <section className="module-table">
              <table>
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map(role => (
                    <tr key={role.id} onClick={() => setSelectedRole(role)} style={{cursor: 'pointer'}}>
                      <td><strong>{role.name}</strong></td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <span className="permission-badge">{role.permissionCount} permissions</span>
                      </td>
                      <td>
                        <span className="permission-badge">{role.userCount || 0} users</span>
                      </td>
                      <td>
                        {hasPermission('users:write') && (
                          <div className="action-buttons">
                            <button className="secondary small" onClick={(e) => { e.stopPropagation(); openEdit(role); }}>
                              Edit
                            </button>
                            <button
                              className="secondary small danger"
                              onClick={(e) => { e.stopPropagation(); deleteRole(role); }}
                              disabled={role.name === 'Super Admin'}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRoles.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="empty-row">No roles found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>

      {/* Create Role Modal - Phase 5B.1: Enhanced */}
      {createOpen && (
        <div className="modal-backdrop">
          <form className="modal wide enhanced" onSubmit={createRole}>
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

            {/* Phase 5B.1: Permission Search */}
            <div className="permission-search-bar">
              <input
                type="text"
                placeholder="Search permissions..."
                value={createPermissionSearch}
                onChange={(e) => setCreatePermissionSearch(e.target.value)}
              />
              <span className="perm-count">{createPermissions.length} selected</span>
            </div>

            {/* Phase 5B.1: Grouped Module Permissions */}
            <div className="module-groups">
              {moduleGroups.map(group => {
                const visibleModules = group.modules.filter(m =>
                  createPermissionSearch === '' ||
                  m.label.toLowerCase().includes(createPermissionSearch.toLowerCase()) ||
                  m.permissions.some(p => p.toLowerCase().includes(createPermissionSearch.toLowerCase()))
                );
                if (createPermissionSearch !== '' && visibleModules.length === 0) return null;

                return (
                  <div key={group.label} className="module-group">
                    <div className="group-header">
                      <span className="group-label">{group.label}</span>
                    </div>
                    <div className="group-modules">
                      {visibleModules.map(module => {
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
                                <span className="module-icon">{module.icon}</span>
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

      {/* Edit Role Modal - Phase 5B.1: Enhanced */}
      {editOpen && editingRole && (
        <div className="modal-backdrop">
          <form className="modal wide enhanced" onSubmit={saveEdit}>
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

            {/* Phase 5B.1: Permission Search */}
            <div className="permission-search-bar">
              <input
                type="text"
                placeholder="Search permissions..."
                value={editPermissionSearch}
                onChange={(e) => setEditPermissionSearch(e.target.value)}
              />
              <span className="perm-count">{editPermissions.length} selected</span>
            </div>

            {/* Phase 5B.1: Grouped Module Permissions */}
            <div className="module-groups">
              {moduleGroups.map(group => {
                const visibleModules = group.modules.filter(m =>
                  editPermissionSearch === '' ||
                  m.label.toLowerCase().includes(editPermissionSearch.toLowerCase()) ||
                  m.permissions.some(p => p.toLowerCase().includes(editPermissionSearch.toLowerCase()))
                );
                if (editPermissionSearch !== '' && visibleModules.length === 0) return null;

                return (
                  <div key={group.label} className="module-group">
                    <div className="group-header">
                      <span className="group-label">{group.label}</span>
                    </div>
                    <div className="group-modules">
                      {visibleModules.map(module => {
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
                                <span className="module-icon">{module.icon}</span>
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
