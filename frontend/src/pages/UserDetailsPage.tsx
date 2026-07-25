import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { User, Calendar, Eye } from 'lucide-react';
import {
  PageHeader,
  TableContainer,
  SortHeader,
  TableRow,
  TableCell
} from '../components/serviceRequests';

type InventoryAssignment = {
  id: string;
  inventoryId: string;
  status: string;
  assignedDate: string;
  returnedDate?: string;
  inventory: {
    id: string;
    itemNo: string;
    itemName: string;
    serialNumber?: string;
    status: string;
    category: { id: string; name: string };
    subcategory: { id: string; name: string };
  };
  project?: {
    id: string;
    projectName: string;
    projectCode: string;
  };
};

type InventorySummary = {
  totalAssigned: number;
  available: number;
  underRepair: number;
  returned: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  team?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  dateJoined?: string;
  address?: string;
  remarks?: string;
  employeeId?: string;
  roles: { role: { id: string; name: string } }[];
  currentProject?: {
    id: string;
    projectName: string;
    projectCode: string;
    client?: string;
    department?: string;
    status: string;
    startDate?: string;
    expectedEndDate?: string;
    manager?: { id: string; name: string; email: string };
    managerName?: string;
    userProjectRole: string;
  } | null;
  assignedInventory?: InventoryAssignment[];
  inventorySummary?: InventorySummary;
};

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'assignedDate',
    direction: 'desc'
  });

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  async function loadUser() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/users-teams/${id}`);
      setUser(res.data.item || res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getRoleBadgeClass(roleName: string): string {
    if (roleName === 'Super Admin') return 'role-super-admin';
    if (roleName === 'Admin') return 'role-admin';
    if (roleName === 'Manager') return 'role-manager';
    return 'role-employee';
  }

  function getInventoryStatusBadge(status: string): string {
    const statusMap: Record<string, string> = {
      'AVAILABLE': 'status-available',
      'ASSIGNED': 'status-assigned',
      'UNDER_REPAIR': 'status-repair',
      'RETURNED': 'status-returned',
      'RETIRED': 'status-retired',
      'ACTIVE': 'status-assigned',
      'TRANSFERRED': 'status-transferred'
    };
    return statusMap[status] || '';
  }

  function getInventoryStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      'AVAILABLE': 'Available',
      'ASSIGNED': 'Assigned',
      'UNDER_REPAIR': 'Repair',
      'RETURNED': 'Returned',
      'RETIRED': 'Retired',
      'ACTIVE': 'Active',
      'TRANSFERRED': 'Transferred'
    };
    return labelMap[status] || status;
  }

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack user-detail">
          <PageHeader
            title="User Dashboard"
            showBackButton
            onBackClick={() => navigate('/users-teams')}
          />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="workspace">
        <div className="page-stack user-detail">
          <PageHeader
            title="User Dashboard"
            showBackButton
            onBackClick={() => navigate('/users-teams')}
          />
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'User not found.'}</p>
            <button className="btn-secondary" onClick={() => navigate('/users-teams')}>
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryRole = user.roles?.[0]?.role?.name || 'Employee';
  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="workspace">
      <div className="page-stack user-detail">
        {/* Header */}
        <PageHeader
          title="User Dashboard"
          showBackButton
          onBackClick={() => navigate('/users-teams')}
        />

        {/* User Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              {/* Left Section - Avatar, Name, and Meta Info */}
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {userInitials}
                </div>

                {/* User Info */}
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{user.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    {user.department && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{user.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Joined {formatDate(user.dateJoined)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  primaryRole === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                  primaryRole === 'Admin' ? 'bg-blue-100 text-blue-700' :
                  primaryRole === 'Manager' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {primaryRole}
                </span>
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

      <div className="detail-content-grid">
        {/* Main Column */}
        <div className="detail-main">
          {/* Personal Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Personal Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Employee ID</label>
                  <span>{user.employeeId || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Full Name</label>
                  <span>{user.name || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Email</label>
                  <span>{user.email || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Phone Number</label>
                  <span>{user.phoneNumber || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Department</label>
                  <span>{user.department || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Designation</label>
                  <span>{user.designation || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Role</label>
                  <span>
                    <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                      {primaryRole}
                    </span>
                  </span>
                </div>
                <div className="detail-info-item">
                  <label>Status</label>
                  <span>
                    <span className={`status-badge status-${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Employment Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Date Joined</label>
                  <span>{formatDate(user.dateJoined)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Employment Type</label>
                  <span>{user.employmentType || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Team</label>
                  <span>{user.team || '-'}</span>
                </div>
                <div className="detail-info-item full-width">
                  <label>Address</label>
                  <span>{user.address || '-'}</span>
                </div>
                <div className="detail-info-item full-width">
                  <label>Remarks</label>
                  <span>{user.remarks || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Project Information
              </h3>
            </div>
            <div className="detail-card-body">
              {user.currentProject ? (
                <div className="project-info">
                  <div className="project-header">
                    <div className="project-title">
                      <h4>{user.currentProject.projectName}</h4>
                      <span className="project-code">{user.currentProject.projectCode}</span>
                    </div>
                    <span className={`status-badge status-${user.currentProject.status.toLowerCase()}`}>
                      {user.currentProject.status}
                    </span>
                  </div>
                  <div className="project-details">
                    <div className="project-detail-row">
                      <span className="detail-label">Client</span>
                      <span className="detail-value">{user.currentProject.client || '-'}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="detail-label">Project Manager</span>
                      <span className="detail-value">{user.currentProject.manager?.name || user.currentProject.managerName || '-'}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="detail-label">User's Role</span>
                      <span className="detail-value">
                        <span className={`role-badge ${user.currentProject.userProjectRole === 'Project Manager' ? 'role-admin' : 'role-employee'}`}>
                          {user.currentProject.userProjectRole}
                        </span>
                      </span>
                    </div>
                    <div className="project-detail-row">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{user.currentProject.department || '-'}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="detail-label">Start Date</span>
                      <span className="detail-value">{formatDate(user.currentProject.startDate)}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="detail-label">Expected End</span>
                      <span className="detail-value">{formatDate(user.currentProject.expectedEndDate)}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-view-project"
                    onClick={() => navigate(`/projects-environments/${user.currentProject?.id}`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    View Project
                  </button>
                </div>
              ) : (
                <div className="detail-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No project assigned.</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Inventory Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Assigned Inventory
              </h3>
            </div>
            <div className="detail-card-body">
              {user.assignedInventory && user.assignedInventory.length > 0 ? (
                <>
                  {/* Summary Stats */}
                  {user.inventorySummary && (
                    <div className="inventory-summary">
                      <div className="inventory-summary-card">
                        <span className="inventory-summary-value">{user.inventorySummary.totalAssigned}</span>
                        <span className="inventory-summary-label">Assigned</span>
                      </div>
                      <div className="inventory-summary-card available">
                        <span className="inventory-summary-value">{user.inventorySummary.available}</span>
                        <span className="inventory-summary-label">Available</span>
                      </div>
                      <div className="inventory-summary-card repair">
                        <span className="inventory-summary-value">{user.inventorySummary.underRepair}</span>
                        <span className="inventory-summary-label">Repair</span>
                      </div>
                      <div className="inventory-summary-card returned">
                        <span className="inventory-summary-value">{user.inventorySummary.returned}</span>
                        <span className="inventory-summary-label">Returned</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Inventory Table */}
                  <div className="inventory-table-container">
                    <TableContainer loading={false} empty={user.assignedInventory.length === 0} emptyTitle="No inventory" emptyDescription="No inventory assigned to this user">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <SortHeader label="Inventory ID" sortKey="itemNo" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Sub Category" sortKey="subcategory" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Name" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Assigned Date" sortKey="assignedDate" currentSort={sortConfig} onSort={handleSort} />
                            <SortHeader label="Project" sortKey="project" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Array.from(
                            new Map(user.assignedInventory.slice(0, 10).map(a => [a.id, a])).values()
                          ).map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                                  {assignment.inventory.itemNo}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">{assignment.inventory.category?.name || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">{assignment.inventory.subcategory?.name || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium text-slate-900">{assignment.inventory.itemName}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                  assignment.inventory.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                  assignment.inventory.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {getInventoryStatusLabel(assignment.status === 'ACTIVE' ? 'ASSIGNED' : assignment.inventory.status)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-500">{formatDate(assignment.assignedDate)}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">{assignment.project?.projectName || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <button 
                                  className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                  onClick={() => navigate(`/inventory/master/${assignment.inventoryId}`)}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </tbody>
                      </table>
                      {user.assignedInventory.length > 10 && (
                        <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                          Showing 10 of {user.assignedInventory.length} items
                        </div>
                      )}
                    </TableContainer>
                  </div>
                </>
              ) : (
                <div className="detail-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p>No inventory assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Quick Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Quick Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatDateTime(user.updatedAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value">
                  <span className={`role-badge ${getRoleBadgeClass(primaryRole)}`}>
                    {primaryRole}
                  </span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{user.department || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
