import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

// Enhanced Role type with status
type Role = {
  id: string;
  name: string;
  description: string | null;
  permissionCount: number;
  userCount: number;
  createdAt: string;
  status?: 'active' | 'inactive';
};

type Permission = {
  id: string;
  code: string;
  description: string | null;
};

// Phase 5B.2: Module configuration for permissions
const moduleGroups = [
  {
    label: 'Core Operations',
    modules: [
      { label: 'Dashboard', permissions: ['dashboard:view'] },
      { label: 'Service Requests', permissions: ['tickets:view', 'tickets:create', 'tickets:manage', 'tickets:assign'] },
      { label: 'Incidents', permissions: ['incidents:view', 'incidents:create', 'incidents:manage'] },
      { label: 'Problems', permissions: ['problems:view', 'problems:create', 'problems:manage'] },
      { label: 'Changes', permissions: ['changes:view', 'changes:create', 'changes:approve', 'changes:manage'] }
    ]
  },
  {
    label: 'Asset Management',
    modules: [
      { label: 'Inventory', permissions: ['inventory:view', 'inventory:create', 'inventory:manage', 'inventory:delete'] },
      { label: 'Projects', permissions: ['projects:view', 'projects:create', 'projects:manage'] },
      { label: 'Vendors', permissions: ['vendors:view', 'vendors:create', 'vendors:manage'] },
      { label: 'Access', permissions: ['access:view', 'access:request', 'access:approve', 'access:revoke'] }
    ]
  },
  {
    label: 'Governance',
    modules: [
      { label: 'Compliance', permissions: ['compliance:view', 'compliance:create', 'compliance:manage', 'compliance:audit'] },
      { label: 'Knowledge Base', permissions: ['kb:view'] },
      { label: 'Reports', permissions: ['reports:view', 'reports:export'] }
    ]
  },
  {
    label: 'Administration',
    modules: [
      { label: 'Users', permissions: ['users:view', 'users:create', 'users:manage', 'users:delete', 'users:export'] },
      { label: 'Roles', permissions: ['roles:view', 'roles:create', 'roles:manage', 'roles:delete'] },
      { label: 'Settings', permissions: ['settings:view', 'settings:manage'] }
    ]
  }
];

// Flat list of all permissions for mapping
const allModuleLabels = moduleGroups.flatMap(group => 
  group.modules.map(m => m.label)
);

// Get module label from permission code
function getModuleLabel(permCode: string): string {
  for (const group of moduleGroups) {
    for (const mod of group.modules) {
      if (mod.permissions.includes(permCode)) {
        return mod.label;
      }
    }
  }
  return permCode.split(':')[0];
}

// Role permission display component
function RolePermissionChips({ rolePermissions, permissionCount, maxVisible = 4 }: { 
  rolePermissions: string[]; 
  permissionCount: number;
  maxVisible?: number 
}) {
  // Use actual permissions if available, otherwise use placeholder
  const permissions = rolePermissions.length > 0 ? rolePermissions : [];
  
  if (permissions.length === 0 && permissionCount === 0) {
    return <span className="no-permissions">No permissions</span>;
  }

  // Get unique module labels from permissions
  const uniqueModules = [...new Set(permissions.map(p => getModuleLabel(p)))];
  const visible = uniqueModules.slice(0, maxVisible);
  const remaining = uniqueModules.length - maxVisible;

  return (
    <div className="permission-chips">
      {visible.map(label => (
        <span key={label} className="permission-chip">{label}</span>
      ))}
      {remaining > 0 && (
        <span className="permission-chip more">+{remaining} More</span>
      )}
    </div>
  );
}

export function RolesPermissionsPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper functions
  function isModuleChecked(modulePermissions: string[], selectedPermissions: string[]): boolean {
    return modulePermissions.every(perm => selectedPermissions.includes(perm));
  }

  function isModuleIndeterminate(modulePermissions: string[], selectedPermissions: string[]): boolean {
    const checked = modulePermissions.filter(perm => selectedPermissions.includes(perm)).length;
    return checked > 0 && checked < modulePermissions.length;
  }

  function toggleModule(modulePermissions: string[]) {
    const allSelected = modulePermissions.every(perm => formPermissions.includes(perm));
    if (allSelected) {
      setFormPermissions(prev => prev.filter(p => !modulePermissions.includes(p)));
    } else {
      setFormPermissions(prev => [...new Set([...prev, ...modulePermissions])]);
    }
  }

  function togglePermission(perm: string) {
    setFormPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  async function loadData() {
    setLoading(true);
    try {
      const rolesRes = await api.get('/roles');
      const rolesData = rolesRes.data.items || [];
      setRoles(rolesData);
      
      // Load permissions for each role to get module labels
      const permMap: Record<string, string[]> = {};
      for (const role of rolesData) {
        try {
          const detailRes = await api.get(`/roles/${role.id}`);
          permMap[role.id] = detailRes.data.permissions || [];
        } catch {
          permMap[role.id] = [];
        }
      }
      setRolePermissions(permMap);
      setMessage('');
    } catch {
      setRoles([]);
      setMessage('Unable to load data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setModalMode('create');
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setFormPermissions([]);
    setPermissionSearch('');
    setModalOpen(true);
  }

  async function openEdit(role: Role) {
    try {
      const res = await api.get(`/roles/${role.id}`);
      const roleData = res.data;
      setModalMode('edit');
      setEditingRole(role);
      setFormName(roleData.name);
      setFormDescription(roleData.description || '');
      setFormStatus((role as any).status || 'active');
      setFormPermissions(roleData.permissions || []);
      setPermissionSearch('');
      setModalOpen(true);
    } catch {
      setMessage('Failed to load role details.');
    }
  }

  async function saveRole(event: FormEvent) {
    event.preventDefault();
    if (!formName.trim()) return;
    
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await api.post('/roles', {
          name: formName,
          description: formDescription,
          permissions: formPermissions
        });
        setMessage('Role created successfully.');
      } else if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, {
          name: formName,
          description: formDescription
        });
        await api.patch(`/roles/${editingRole.id}/permissions`, {
          permissions: formPermissions
        });
        setMessage('Role updated successfully.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to save role.');
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

  function closeModal() {
    setModalOpen(false);
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setFormPermissions([]);
    setPermissionSearch('');
  }

  // Filter modules based on search
  const filteredGroups = moduleGroups.map(group => ({
    ...group,
    modules: group.modules.filter(m =>
      permissionSearch === '' ||
      m.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      m.permissions.some(p => p.toLowerCase().includes(permissionSearch.toLowerCase()))
    )
  })).filter(g => g.modules.length > 0 || permissionSearch === '');

  return (
    <div className="page-container roles-page">
      {/* Page Header - Phase 5B.2 */}
      <div className="page-header">
        <div className="header-left">
          <h1>Roles & Permissions</h1>
          <p className="header-subtitle">Manage user roles and their access permissions</p>
        </div>
        <div className="header-right">
          {hasPermission('users:write') && (
            <button className="btn btn-primary" onClick={openCreate}>
              <span className="btn-icon">+</span>
              Add Role
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice notice-info">{message}</div>}

      {/* Main Content - Single Table Layout - Phase 5B.2 */}
      <div className="page-content">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="roles-table">
              <thead>
                <tr>
                  <th className="col-name">Role Name</th>
                  <th className="col-description">Description</th>
                  <th className="col-permissions">Menu Access</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td className="col-name">
                      <div className="role-name-cell">
                        <span className="role-name">{role.name}</span>
                        {role.name === 'Super Admin' && (
                          <span className="protected-badge">Protected</span>
                        )}
                      </div>
                    </td>
                    <td className="col-description">
                      <span className="role-description">{role.description || '-'}</span>
                    </td>
                    <td className="col-permissions">
                      <RolePermissionChips 
                        rolePermissions={rolePermissions[role.id] || []}
                        permissionCount={role.permissionCount}
                      />
                      <span className="perm-count">{role.permissionCount} permissions</span>
                    </td>
                    <td className="col-status">
                      <span className="status-badge active">Active</span>
                    </td>
                    <td className="col-actions">
                      {hasPermission('users:write') && (
                        <div className="action-buttons">
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => openEdit(role)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
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
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">No roles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Role Modal - Phase 5B.2 */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Add Role' : 'Edit Role'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form className="modal-body" onSubmit={saveRole}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role-name">Role Name *</label>
                  <input
                    id="role-name"
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    disabled={editingRole?.name === 'Super Admin'}
                    placeholder="Enter role name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role-status">Status</label>
                  <select
                    id="role-status"
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role-description">Description</label>
                <textarea
                  id="role-description"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Enter role description"
                />
              </div>

              <div className="permissions-section">
                <div className="permissions-header">
                  <label>Permissions</label>
                  <div className="permission-search">
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={permissionSearch}
                      onChange={e => setPermissionSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="permissions-selected">
                  <span>{formPermissions.length} permission(s) selected</span>
                </div>

                <div className="permissions-list">
                  {filteredGroups.map(group => (
                    <div key={group.label} className="permission-group">
                      <div className="group-title">{group.label}</div>
                      <div className="group-modules">
                        {group.modules.map(module => {
                          const isChecked = isModuleChecked(module.permissions, formPermissions);
                          const isIndeterminate = isModuleIndeterminate(module.permissions, formPermissions);
                          
                          return (
                            <div key={module.label} className="module-item">
                              <label className="module-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                  onChange={() => toggleModule(module.permissions)}
                                />
                                <span className="module-label">{module.label}</span>
                              </label>
                              <div className="module-permissions">
                                {module.permissions.map(perm => (
                                  <label key={perm} className="permission-item">
                                    <input
                                      type="checkbox"
                                      checked={formPermissions.includes(perm)}
                                      onChange={() => togglePermission(perm)}
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
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="no-results">No permissions match your search.</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Role' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
