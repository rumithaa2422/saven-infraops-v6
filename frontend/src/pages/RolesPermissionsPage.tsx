import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

// ============================================
// TYPE DEFINITIONS
// ============================================

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
  createdAt?: string;
};

type PermissionMetadata = {
  code: string;
  module: string;
  action: string;
  displayName: string;
  description: string;
  category: 'view' | 'action' | 'manage' | 'admin';
  sortOrder: number;
};

type PermissionModule = {
  name: string;
  key: string;
  description: string;
  icon: string;
  permissions: PermissionMetadata[];
  categories: string[];
  totalPermissions: number;
  enabledPermissions: number;
};

type GroupedPermissions = {
  modules: PermissionModule[];
  totalModules: number;
  totalPermissions: number;
};

type RolePermissionsResponse = {
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  permissions: GroupedPermissions;
  assignedPermissions: string[];
};

type PermissionStats = {
  totalPermissions: number;
  totalRoles: number;
  totalModules: number;
  totalCategories: number;
  // Phase 6: Dynamic Role Management stats
  systemRoles?: number;
  customRoles?: number;
  activeRoles?: number;
  inactiveRoles?: number;
};

type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

// ============================================
// COMPONENTS
// ============================================

// Toast Container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;
  
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-row-grid">
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
      </div>
      <div className="skeleton-accordion">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-accordion-item">
            <div className="skeleton-header"></div>
            <div className="skeleton-content">
              {[1, 2, 3].map(j => (
                <div key={j} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error State
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠</div>
      <h3>Unable to Load Permissions</h3>
      <p>{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>Retry</button>
    </div>
  );
}

// Module Status Badge
function ModuleStatusBadge({ enabled, total }: { enabled: number; total: number }) {
  if (enabled === total && total > 0) {
    return <span className="module-badge badge-success">{enabled}/{total}</span>;
  } else if (enabled > 0) {
    return <span className="module-badge badge-warning">{enabled}/{total}</span>;
  }
  return <span className="module-badge badge-disabled">{enabled}/{total}</span>;
}

// Permission Toggle Switch
function PermissionToggle({ 
  permission, 
  enabled, 
  onChange,
  disabled 
}: { 
  permission: PermissionMetadata; 
  enabled: boolean; 
  onChange: (code: string, enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`permission-row ${enabled ? 'enabled' : ''}`}>
      <div className="permission-info">
        <span className="permission-name">{permission.displayName}</span>
        <span className="permission-description">{permission.description}</span>
        <span className="permission-code">{permission.code}</span>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(permission.code, e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

// Module Accordion
function ModuleAccordion({ 
  module, 
  assignedPermissions,
  expandedModules,
  toggleModule,
  togglePermission,
  isAllExpanded,
  onBulkAction,
  disabled
}: {
  module: PermissionModule;
  assignedPermissions: Set<string>;
  expandedModules: Set<string>;
  toggleModule: (key: string) => void;
  togglePermission: (code: string, enabled: boolean) => void;
  isAllExpanded: boolean;
  onBulkAction: (moduleKey: string, enable: boolean) => void;
  disabled?: boolean;
}) {
  const isExpanded = expandedModules.has(module.key);
  const allEnabled = module.permissions.every(p => assignedPermissions.has(p.code));
  
  // Group permissions by category
  const viewPerms = module.permissions.filter(p => p.category === 'view');
  const actionPerms = module.permissions.filter(p => p.category === 'action');
  const managePerms = module.permissions.filter(p => p.category === 'manage');
  
  return (
    <div className={`module-accordion ${isExpanded || isAllExpanded ? 'expanded' : ''}`}>
      <div className="module-accordion-header" onClick={() => toggleModule(module.key)}>
        <div className="module-header-left">
          <span className="module-icon">{module.icon}</span>
          <span className="module-name">{module.name}</span>
          <ModuleStatusBadge enabled={module.enabledPermissions} total={module.totalPermissions} />
        </div>
        <div className="module-header-right">
          <button 
            className="btn btn-outline btn-sm module-bulk-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBulkAction(module.key, !allEnabled);
            }}
            disabled={disabled}
          >
            {allEnabled ? 'Disable All' : 'Enable All'}
          </button>
          <span className="expand-icon">{isExpanded || isAllExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {(isExpanded || isAllExpanded) && (
        <div className="module-accordion-content">
          {viewPerms.length > 0 && (
            <div className="permission-category">
              <div className="category-label">View</div>
              {viewPerms.map(perm => (
                <PermissionToggle
                  key={perm.code}
                  permission={perm}
                  enabled={assignedPermissions.has(perm.code)}
                  onChange={togglePermission}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
          
          {actionPerms.length > 0 && (
            <div className="permission-category">
              <div className="category-label">Actions</div>
              {actionPerms.map(perm => (
                <PermissionToggle
                  key={perm.code}
                  permission={perm}
                  enabled={assignedPermissions.has(perm.code)}
                  onChange={togglePermission}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
          
          {managePerms.length > 0 && (
            <div className="permission-category">
              <div className="category-label">Management</div>
              {managePerms.map(perm => (
                <PermissionToggle
                  key={perm.code}
                  permission={perm}
                  enabled={assignedPermissions.has(perm.code)}
                  onChange={togglePermission}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Confirmation Dialog
function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Apply Changes',
  cancelText = 'Cancel'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREATE ROLE MODAL
// ============================================

function CreateRoleModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (role: Role) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Role name is required');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Role name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Role name must be 50 characters or less');
      return;
    }

    // Check for system role names
    const systemNames = ['Super Admin', 'Admin', 'Employee'];
    if (systemNames.some(n => n.toLowerCase() === trimmedName.toLowerCase())) {
      setError('This role name is reserved for system roles');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/roles', {
        name: trimmedName,
        description: description.trim() || undefined,
        permissions: [] // Start with no permissions
      });
      
      const newRole: Role = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        isSystem: false,
        isActive: true,
        permissionCount: 0,
        userCount: 0
      };
      
      resetForm();
      onSuccess(newRole);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create role';
      if (err.response?.status === 400) {
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div className="dialog create-role-modal" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Create New Role</h3>
          <button className="dialog-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="form-error">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="roleName" className="form-label">
                Role Name <span className="required">*</span>
              </label>
              <input
                id="roleName"
                type="text"
                className="form-input"
                placeholder="e.g., Support Agent, Department Manager"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
                disabled={submitting}
                autoFocus
              />
              <div className="form-hint">
                3-50 characters. Cannot use reserved names (Super Admin, Admin, Employee).
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="roleDescription" className="form-label">
                Description
              </label>
              <textarea
                id="roleDescription"
                className="form-textarea"
                placeholder="Brief description of this role's purpose..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={submitting}
              />
              <div className="form-hint">
                Optional. Max 500 characters. ({description.length}/500)
              </div>
            </div>
          </div>
          <div className="dialog-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export function RolesPermissionsPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions | null>(null);
  const [assignedPermissions, setAssignedPermissions] = useState<Set<string>>(new Set());
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set());
  
  // UI State
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Can user create roles?
  const canCreateRole = hasPermission('roles:create');
  
  // Can user edit?
  const canEdit = isSuperAdmin;
  
  // ============================================
  // TOAST MANAGEMENT
  // ============================================
  
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // ============================================
  // DATA LOADING
  // ============================================
  
  const loadStats = async () => {
    try {
      const response = await api.get('/roles/stats');
      const currentStats = stats || { totalPermissions: 0, totalModules: 0, totalCategories: 0 };
      setStats({
        ...response.data,
        totalPermissions: currentStats.totalPermissions,
        totalModules: currentStats.totalModules,
        totalCategories: currentStats.totalCategories
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };
  
  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      const rolesData = response.data.items || [];
      setRoles(rolesData);
      
      // Auto-select first role if none selected
      if (!selectedRoleId && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };
  
  const loadRolePermissions = async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<RolePermissionsResponse>(`/roles/${roleId}/permissions/detailed`);
      const data = response.data;
      
      setSelectedRole(data.role as Role);
      setGroupedPermissions(data.permissions);
      setAssignedPermissions(new Set(data.assignedPermissions));
      setOriginalPermissions(new Set(data.assignedPermissions));
      setHasChanges(false);
      
      // Expand first module by default
      if (data.permissions.modules.length > 0) {
        setExpandedModules(new Set([data.permissions.modules[0].key]));
      }
      
    } catch (err: any) {
      console.error('Failed to load role permissions:', err);
      setError(err.response?.data?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([loadStats(), loadRoles()]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadData();
  }, []);
  
  // Load permissions when role changes
  useEffect(() => {
    if (selectedRoleId) {
      loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleRoleChange = (roleId: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    setSelectedRoleId(roleId);
  };

  const handleRoleCreated = async (newRole: Role) => {
    setCreateModalOpen(false);
    addToast('success', `Role "${newRole.name}" created successfully`);
    
    // Refresh the roles list and stats
    await loadRoles();
    await loadStats();
    
    // Select the newly created role
    setSelectedRoleId(newRole.id);
  };
  
  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };
  
  const handlePermissionToggle = (code: string, enabled: boolean) => {
    setAssignedPermissions(prev => {
      const next = new Set(prev);
      if (enabled) {
        next.add(code);
      } else {
        next.delete(code);
      }
      return next;
    });
    
    // Check if changes were made
    const newSet = new Set(assignedPermissions);
    if (enabled) {
      newSet.add(code);
    } else {
      newSet.delete(code);
    }
    setHasChanges(!setsEqual(newSet, originalPermissions));
  };
  
  const handleBulkModuleAction = (moduleKey: string, enable: boolean) => {
    const module = groupedPermissions?.modules.find(m => m.key === moduleKey);
    if (!module) return;
    
    const newAssigned = new Set(assignedPermissions);
    for (const perm of module.permissions) {
      if (enable) {
        newAssigned.add(perm.code);
      } else {
        newAssigned.delete(perm.code);
      }
    }
    setAssignedPermissions(newAssigned);
    setHasChanges(!setsEqual(newAssigned, originalPermissions));
  };
  
  const handleEnableAll = () => {
    if (!groupedPermissions) return;
    
    const allPerms = new Set<string>();
    for (const module of groupedPermissions.modules) {
      for (const perm of module.permissions) {
        allPerms.add(perm.code);
      }
    }
    setAssignedPermissions(allPerms);
    setHasChanges(!setsEqual(allPerms, originalPermissions));
  };
  
  const handleDisableAll = () => {
    setAssignedPermissions(new Set());
    setHasChanges(!setsEqual(new Set(), originalPermissions));
  };
  
  const handleCancel = () => {
    if (!confirm('Discard all changes?')) return;
    setAssignedPermissions(new Set(originalPermissions));
    setHasChanges(false);
  };
  
  const handleSave = async () => {
    if (!selectedRoleId) return;
    
    setSaving(true);
    try {
      // Calculate delta
      const added: string[] = [];
      const removed: string[] = [];
      
      for (const perm of assignedPermissions) {
        if (!originalPermissions.has(perm)) {
          added.push(perm);
        }
      }
      
      for (const perm of originalPermissions) {
        if (!assignedPermissions.has(perm)) {
          removed.push(perm);
        }
      }
      
      // Send delta update
      const payload: { added?: string[]; removed?: string[] } = {};
      if (added.length > 0) payload.added = added;
      if (removed.length > 0) payload.removed = removed;
      
      await api.put(`/roles/${selectedRoleId}/permissions/delta`, payload);
      
      addToast('success', 'Permissions updated successfully');
      setConfirmDialogOpen(false);
      
      // Reload to get fresh data
      await loadRolePermissions(selectedRoleId);
      
      // Also reload roles to update counts
      await loadRoles();
      
    } catch (err: any) {
      console.error('Failed to save permissions:', err);
      addToast('error', err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };
  
  // Filter modules by search
  const filteredModules = useMemo(() => {
    if (!groupedPermissions) return [];
    if (!searchQuery.trim()) return groupedPermissions.modules;
    
    const query = searchQuery.toLowerCase();
    return groupedPermissions.modules.filter(module => 
      module.name.toLowerCase().includes(query) ||
      module.permissions.some(p => 
        p.displayName.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    );
  }, [groupedPermissions, searchQuery]);
  
  // ============================================
  // RENDER
  // ============================================
  
  if (!hasPermission('roles:view') && !hasPermission('users:read')) {
    return (
      <div className="page-container">
        <div className="alert alert-error">You do not have permission to view this page.</div>
      </div>
    );
  }
  
  return (
    <div className="page-container roles-permissions-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <CreateRoleModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleRoleCreated}
      />
      
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Roles & Permissions</h1>
          <p className="header-subtitle">Configure role-based access across every module</p>
        </div>
        <div className="header-actions">
          {canCreateRole && (
            <button 
              className="btn btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <span className="btn-icon">+</span>
              Add Role
            </button>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🎭</span>
            <div className="stat-content">
              <span className="stat-value">{stats.totalRoles}</span>
              <span className="stat-label">Total Roles</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🖥️</span>
            <div className="stat-content">
              <span className="stat-value">{stats.systemRoles ?? 0}</span>
              <span className="stat-label">System Roles</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✨</span>
            <div className="stat-content">
              <span className="stat-value">{stats.customRoles ?? 0}</span>
              <span className="stat-label">Custom Roles</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔓</span>
            <div className="stat-content">
              <span className="stat-value">{stats.activeRoles ?? stats.totalRoles}</span>
              <span className="stat-label">Active Roles</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Role Selector */}
      <div className="role-selector-section">
        <label className="role-selector-label">Select Role</label>
        <div className="role-selector">
          {roles.map(role => (
            <button
              key={role.id}
              className={`role-option ${selectedRoleId === role.id ? 'selected' : ''} ${!role.isActive ? 'inactive' : ''}`}
              onClick={() => handleRoleChange(role.id)}
            >
              <div className="role-option-header">
                <span className="role-name">{role.name}</span>
                {role.isSystem && <span className="role-badge badge-system">System</span>}
                {!role.isActive && <span className="role-badge badge-inactive">Inactive</span>}
              </div>
              <span className="role-meta">
                {role.permissionCount} permissions · {role.userCount} users
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Permission Editor */}
      <div className="permission-editor">
        {/* Toolbar */}
        <div className="permission-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          
          <div className="toolbar-actions">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setIsAllExpanded(!isAllExpanded)}
            >
              {isAllExpanded ? 'Collapse All' : 'Expand All'}
            </button>
            {canEdit && (
              <>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleEnableAll}
                  disabled={loading}
                >
                  Enable All
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleDisableAll}
                  disabled={loading}
                >
                  Disable All
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="permission-content">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => selectedRoleId && loadRolePermissions(selectedRoleId)} />
          ) : filteredModules.length === 0 ? (
            <div className="no-results">
              <p>No permissions match your search.</p>
            </div>
          ) : (
            <div className="modules-list">
              {filteredModules.map(module => (
                <ModuleAccordion
                  key={module.key}
                  module={module}
                  assignedPermissions={assignedPermissions}
                  expandedModules={expandedModules}
                  toggleModule={toggleModule}
                  togglePermission={handlePermissionToggle}
                  isAllExpanded={isAllExpanded}
                  onBulkAction={handleBulkModuleAction}
                  disabled={!canEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky Footer */}
      {canEdit && (
        <div className={`sticky-footer ${hasChanges ? 'has-changes' : ''}`}>
          <div className="footer-content">
            <div className="footer-left">
              {hasChanges && (
                <span className="unsaved-indicator">● Unsaved Changes</span>
              )}
            </div>
            <div className="footer-right">
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleSave}
        title="Apply Permission Changes?"
        message={`This will update the permissions for the "${selectedRole?.name}" role and affect all ${selectedRole?.name} users.`}
        confirmText="Apply Changes"
        cancelText="Cancel"
      />
      
      {/* View-only notice for non-Super Admin */}
      {!canEdit && (
        <div className="view-only-notice">
          <span className="notice-icon">ℹ</span>
          <span>You have view-only access. Only Super Admin can modify permissions.</span>
        </div>
      )}
    </div>
  );
}
