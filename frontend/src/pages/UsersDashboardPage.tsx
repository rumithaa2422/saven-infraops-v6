import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';

type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  status: string;
  createdAt: string;
  employeeId?: string;
  roles: { role: { id: string; name: string } }[];
};

type Role = {
  id: string;
  name: string;
};

type UserSummary = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  managers: number;
  employees: number;
};

export function UsersDashboardPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const canCreate = isSuperAdmin;
  const canExport = isSuperAdmin || isAdmin;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; user: User | null }>({ show: false, user: null });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Summary state
  const [summary, setSummary] = useState<UserSummary>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
    managers: 0,
    employees: 0
  });

  // Unique values
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/users-teams', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          department: departmentFilter || undefined,
          role: roleFilter || undefined,
          sortBy,
          sortOrder
        }
      });

      let userList: User[] = res.data.items || res.data || [];
      
      // Calculate summary
      const totalUsers = userList.length;
      const activeUsers = userList.filter(u => u.status === 'ACTIVE').length;
      const inactiveUsers = userList.filter(u => u.status === 'INACTIVE').length;
      
      let admins = 0, managers = 0, employees = 0;
      userList.forEach(u => {
        const roleNames = u.roles?.map(r => r.role?.name) || [];
        if (roleNames.includes('Super Admin')) admins++;
        else if (roleNames.includes('Admin')) admins++;
        else if (roleNames.includes('Manager')) managers++;
        else employees++;
      });

      setSummary({
        totalUsers,
        activeUsers,
        inactiveUsers,
        admins,
        managers,
        employees
      });

      // Extract unique departments
      setDepartments([...new Set(userList.map(u => u.department).filter(Boolean))] as string[]);

      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, departmentFilter, roleFilter, sortBy, sortOrder]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data.items || res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRefresh = () => {
    fetchUsers(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatusFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleExport = async () => {
    try {
      // Prepare export data with all user fields
      const exportData = users.map((user) => {
        const nameParts = user.name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          'Employee ID': user.employeeId || '',
          'First Name': firstName,
          'Last Name': lastName,
          'Email': user.email || '',
          'Phone Number': user.phoneNumber || '',
          'Department': user.department || '',
          'Designation': (user as any).designation || '',
          'Role': user.roles?.[0]?.role?.name || '',
          'Reporting Manager': (user as any).reportingManager || '',
          'Employment Type': (user as any).employmentType || '',
          'Joining Date': (user as any).dateJoined ? new Date((user as any).dateJoined).toISOString().split('T')[0] : '',
          'Status': user.status || '',
          'Address': (user as any).address || '',
          'Remarks': (user as any).remarks || ''
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Employee ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Department
        { wch: 20 }, // Designation
        { wch: 15 }, // Role
        { wch: 20 }, // Reporting Manager
        { wch: 15 }, // Employment Type
        { wch: 15 }, // Joining Date
        { wch: 12 }, // Status
        { wch: 30 }, // Address
        { wch: 30 }, // Remarks
      ];

      // Download Excel file
      XLSX.writeFile(workbook, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    
    // Prevent self-deletion
    if (deleteDialog.user.id === user?.id) {
      setDeleteError('You cannot delete your own account.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await api.delete(`/users-teams/${deleteDialog.user.id}`);
      setDeleteDialog({ show: false, user: null });
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeClass = (roleName: string): string => {
    if (roleName === 'Super Admin') return 'role-super-admin';
    if (roleName === 'Admin') return 'role-admin';
    if (roleName === 'Manager') return 'role-manager';
    return 'role-employee';
  };

  const hasActiveFilters = search || statusFilter || departmentFilter || roleFilter;

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply search
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.department?.toLowerCase().includes(searchLower) ||
        u.roles?.some(r => r.role?.name?.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [users, searchInput]);

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Users & Teams</p>
            <h1>Users Dashboard</h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="user-summary-cards">
          <div className="user-summary-card" onClick={() => { setStatusFilter(''); fetchUsers(); }}>
            <div className="user-summary-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Total Users</span>
              <span className="user-summary-value">{loading ? '...' : summary.totalUsers}</span>
            </div>
          </div>

          <div className="user-summary-card" onClick={() => { setStatusFilter('ACTIVE'); fetchUsers(); }}>
            <div className="user-summary-icon active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Active Users</span>
              <span className="user-summary-value">{loading ? '...' : summary.activeUsers}</span>
            </div>
          </div>

          <div className="user-summary-card" onClick={() => { setStatusFilter('INACTIVE'); fetchUsers(); }}>
            <div className="user-summary-icon inactive">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Inactive Users</span>
              <span className="user-summary-value">{loading ? '...' : summary.inactiveUsers}</span>
            </div>
          </div>

          <div className="user-summary-card">
            <div className="user-summary-icon admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L15 18L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12C3 12 6 9 12 9C18 9 21 12 21 12C21 12 18 15 12 15C6 15 3 18 3 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Administrators</span>
              <span className="user-summary-value">{loading ? '...' : summary.admins}</span>
            </div>
          </div>

          <div className="user-summary-card">
            <div className="user-summary-icon manager">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Managers</span>
              <span className="user-summary-value">{loading ? '...' : summary.managers}</span>
            </div>
          </div>

          <div className="user-summary-card">
            <div className="user-summary-icon employee">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-summary-content">
              <span className="user-summary-label">Employees</span>
              <span className="user-summary-value">{loading ? '...' : summary.employees}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button
              type="button"
              className={`toolbar-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filters
            </button>

            <button type="button" className="toolbar-btn" onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            {canExport && (
              <button type="button" className="toolbar-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Export
              </button>
            )}

            {isSuperAdmin && (
              <button type="button" className="toolbar-btn" onClick={() => navigate('/users-teams/import-export')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Import / Export
              </button>
            )}

            {canCreate && (
              <button type="button" className="toolbar-btn primary" onClick={() => navigate('/users-teams/create')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create User
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-row">
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Department</label>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={`${sortBy}_${sortOrder}`} onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <option value="createdAt_desc">Newest First</option>
                  <option value="createdAt_asc">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="department_asc">Department (A-Z)</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="filters-actions">
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Users</h3>
            <span className="table-count">{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 && !hasActiveFilters ? (
            <div className="table-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No users found.</p>
              {canCreate && (
                <button type="button" className="primary" onClick={() => navigate('/users-teams/create')}>
                  Create User
                </button>
              )}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="table-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No users match your filters</p>
              <button type="button" className="secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th onClick={() => handleSort('createdAt')} className="sortable">
                      Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const primaryRole = u.roles?.[0]?.role?.name || 'Employee';
                    const isOwnAccount = u.id === user?.id;
                    return (
                      <tr key={u.id}>
                        <td className="user-cell" onClick={() => navigate(`/users-teams/${u.id}`)}>
                          <div className="user-avatar">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{u.name}</span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </td>
                        <td className="mono muted">{u.employeeId || '-'}</td>
                        <td onClick={() => navigate(`/users-teams/${u.id}`)}>{u.department || '-'}</td>
                        <td onClick={() => navigate(`/users-teams/${u.id}`)}>
                          <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                            {primaryRole}
                          </span>
                        </td>
                        <td onClick={() => navigate(`/users-teams/${u.id}`)}>
                          <span className={`status-badge status-${u.status.toLowerCase()}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="muted" onClick={() => navigate(`/users-teams/${u.id}`)}>{formatDate(u.createdAt)}</td>
                        <td className="actions-cell">
                          <button
                            className="btn-open"
                            onClick={(e) => { e.stopPropagation(); navigate(`/users-teams/${u.id}`); }}
                          >
                            Open
                          </button>
                          {(isSuperAdmin || isAdmin) && (
                            <button
                              className="btn-edit"
                              onClick={(e) => { e.stopPropagation(); navigate(`/users-teams/${u.id}/edit`); }}
                            >
                              Edit
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              className="btn-delete"
                              onClick={(e) => { e.stopPropagation(); setDeleteDialog({ show: true, user: u }); }}
                              disabled={isOwnAccount}
                              title={isOwnAccount ? 'You cannot delete your own account' : 'Delete user'}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialog.show && (
          <div className="modal-overlay" onClick={() => setDeleteDialog({ show: false, user: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{deleteDialog.user?.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              {deleteError && <div className="alert alert-error">{deleteError}</div>}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteDialog({ show: false, user: null })}>
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleDeleteUser} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
