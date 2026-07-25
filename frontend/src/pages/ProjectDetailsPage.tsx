import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { Eye } from 'lucide-react';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell
} from '../components/serviceRequests';

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: { role: { name: string } }[];
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client?: string;
  ownerName?: string;
  description?: string;
  department?: string;
  technologyStack?: string;
  priority: string;
  status: string;
  budget?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  projectType?: string;
  projectLocation?: string;
  remarks?: string;
  managerId?: string;
  teamMemberIds?: string;
  manager?: User | null;
  teamMembers?: User[];
  createdAt: string;
  updatedAt: string;
};

type Assignment = {
  id: string;
  inventory: {
    id: string;
    itemNo: string;
    itemName: string;
    status: string;
    warrantyExpiry?: string;
    category?: { id: string; name: string };
    subcategory?: { id: string; name: string };
  };
  user?: { id: string; name: string; email: string };
  project?: { id: string; projectName: string; projectCode: string };
  assignedDate: string;
  status: string;
};

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Assigned Inventory state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilterStatus, setInventoryFilterStatus] = useState('');
  const [inventoryFilterUser, setInventoryFilterUser] = useState('');

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
    loadProject();
  }, [id]);

  useEffect(() => {
    if (project?.id) {
      loadAssignments();
    }
  }, [project?.id]);

  async function loadAssignments() {
    if (!id) return;
    try {
      setLoadingAssignments(true);
      const res = await api.get('/inventory-assignments', {
        params: { projectId: id, status: 'ACTIVE' }
      });
      setAssignments(res.data.assignments || []);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function loadProject() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects-environments/${id}`);
      setProject(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate('/projects-environments');
  }

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/projects-environments/${id}`);
      navigate('/projects-environments');
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

  function formatCurrency(value?: number): string {
    if (!value) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  function getUserRole(user: User): string {
    return user.roles?.[0]?.role?.name || 'Employee';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'DELAYED': return 'danger';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'danger';
      default: return 'default';
    }
  }

  // Calculate inventory summary
  const inventorySummary = {
    total: assignments.length,
    users: new Set(assignments.filter(a => a.user?.id).map(a => a.user!.id)).size,
    underRepair: assignments.filter(a => a.inventory.status === 'UNDER_REPAIR').length,
    warrantyExpiring: (() => {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return assignments.filter(a => {
        if (!a.inventory.warrantyExpiry) return false;
        const expiry = new Date(a.inventory.warrantyExpiry);
        return expiry >= now && expiry <= thirtyDays;
      }).length;
    })()
  };

  // Filter assignments based on search and filters
  function filterAssignments(): Assignment[] {
    let result = [...assignments];
    
    if (inventorySearch) {
      const searchLower = inventorySearch.toLowerCase();
      result = result.filter(a =>
        a.inventory.itemNo.toLowerCase().includes(searchLower) ||
        a.inventory.itemName.toLowerCase().includes(searchLower) ||
        a.user?.name?.toLowerCase().includes(searchLower) ||
        a.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    
    if (inventoryFilterStatus) {
      result = result.filter(a => a.inventory.status === inventoryFilterStatus);
    }
    
    if (inventoryFilterUser) {
      const userLower = inventoryFilterUser.toLowerCase();
      result = result.filter(a =>
        a.user?.name?.toLowerCase().includes(userLower) ||
        a.user?.email?.toLowerCase().includes(userLower)
      );
    }
    
    return result;
  }

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack project-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-secondary" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '16px', marginTop: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="workspace">
        <div className="page-stack project-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-secondary" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h1 className="page-header-title">Error</h1>
              </div>
            </div>
          </div>
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'Project not found.'}</p>
            <button className="btn-secondary" onClick={handleBack}>
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const teamSize = (project.manager ? 1 : 0) + (project.teamMembers?.length || 0);

  return (
    <div className="workspace">
      <div className="page-stack project-detail">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-secondary" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">{project.projectName}</h1>
              <p className="page-header-subtitle">{project.projectCode} • {project.department || 'Project'}</p>
            </div>
          </div>
          <div className="page-header-actions">
            <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
            {(isSuperAdmin || isAdmin) && (
              <button className="btn-secondary" onClick={() => navigate(`/projects-environments/${id}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-main">
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
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Project Name</label>
                  <span>{project.projectName || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Code</label>
                  <span className="mono">{project.projectCode || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Client</label>
                  <span>{project.client || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Department</label>
                  <span>{project.department || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Type</label>
                  <span>{project.projectType?.replace(/_/g, ' ') || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Technology Stack</label>
                  <span>{project.technologyStack || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Start Date</label>
                  <span>{formatDate(project.startDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Expected End Date</label>
                  <span>{formatDate(project.expectedEndDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Budget</label>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Location</label>
                  <span>{project.projectLocation || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          {project.description && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Description
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.description}</p>
              </div>
            </div>
          )}

          {/* Remarks Card */}
          {project.remarks && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Remarks
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.remarks}</p>
              </div>
            </div>
          )}

          {/* Assigned Inventory Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Assigned Inventory
              </h3>
              <span className="detail-card-count">{loadingAssignments ? '...' : inventorySummary.total}</span>
            </div>
            <div className="detail-card-body">
              {/* Summary Stats */}
              <div className="inventory-summary-stats">
                <div className="inventory-stat">
                  <span className="inventory-stat-value">{loadingAssignments ? '...' : inventorySummary.total}</span>
                  <span className="inventory-stat-label">Total</span>
                </div>
                <div className="inventory-stat">
                  <span className="inventory-stat-value">{loadingAssignments ? '...' : inventorySummary.users}</span>
                  <span className="inventory-stat-label">Users</span>
                </div>
                <div className="inventory-stat warning">
                  <span className="inventory-stat-value">{loadingAssignments ? '...' : inventorySummary.underRepair}</span>
                  <span className="inventory-stat-label">Under Repair</span>
                </div>
                <div className="inventory-stat warning">
                  <span className="inventory-stat-value">{loadingAssignments ? '...' : inventorySummary.warrantyExpiring}</span>
                  <span className="inventory-stat-label">Warranty Expiring</span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="inventory-toolbar">
                <div className="inventory-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by ID, Item Name, User..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
                <div className="inventory-filters">
                  <select
                    value={inventoryFilterStatus}
                    onChange={(e) => setInventoryFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filter by User..."
                    value={inventoryFilterUser}
                    onChange={(e) => setInventoryFilterUser(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              {loadingAssignments ? (
                <div className="inventory-loading">
                  <div className="spinner small"></div>
                  <span>Loading inventory...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="inventory-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p>No inventory assigned to this project.</p>
                </div>
              ) : (
                <TableContainer loading={false} empty={filterAssignments().length === 0} emptyTitle="No inventory" emptyDescription="No inventory assigned to this project">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <SortHeader label="Inventory ID" sortKey="itemNo" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Item Name" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Subcategory" sortKey="subcategory" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Assigned User" sortKey="user" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Assigned Date" sortKey="assignedDate" currentSort={sortConfig} onSort={handleSort} />
                        <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filterAssignments().map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                              {assignment.inventory.itemNo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-slate-900">{assignment.inventory.itemName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{assignment.inventory.category?.name || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{assignment.inventory.subcategory?.name || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{assignment.user?.name || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">{formatDate(assignment.assignedDate)}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                              assignment.inventory.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                              assignment.inventory.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {assignment.inventory.status.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <button
                              className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              onClick={() => navigate(`/access-management/${assignment.inventory.id}`)}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="detail-sidebar">
          {/* Quick Info Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Quick Info
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Priority</span>
                <span className={`priority-badge priority-${getPriorityColor(project.priority)}`}>{project.priority}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{formatDate(project.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatDateTime(project.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Team Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Team
              </h3>
              <span className="detail-card-count">{teamSize}</span>
            </div>
            <div className="detail-card-body">
              {/* Manager Section */}
              <div className="team-section">
                <h4 className="team-section-title">Project Manager</h4>
                {project.manager ? (
                  <div className="team-member-card manager">
                    <div className="member-avatar">
                      {project.manager.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{project.manager.name}</span>
                      <span className="member-details">{project.manager.email}</span>
                      {project.manager.department && (
                        <span className="member-details">{project.manager.department}</span>
                      )}
                      <span className="member-role-badge manager">Manager</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-team">No manager assigned</p>
                )}
              </div>

              {/* Team Members Section */}
              <div className="team-section">
                <h4 className="team-section-title">Team Members ({project.teamMembers?.length || 0})</h4>
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <div className="team-members-list">
                    {project.teamMembers.map(member => (
                      <div key={member.id} className="team-member-card">
                        <div className="member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-details">{member.email}</span>
                          {member.department && (
                            <span className="member-details">{member.department}</span>
                          )}
                          <span className="member-role">{getUserRole(member)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-team">No team members assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button type="button" className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  {deleteError}
                </div>
              )}
              <div className="warning-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Are you sure you want to delete this project?</p>
                <p><strong>{project.projectName}</strong> ({project.projectCode})</p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
