import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client?: string;
  ownerName?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type ProjectSummary = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHold: number;
  delayed: number;
};

export function ProjectDashboardPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectSummary>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHold: 0,
    delayed: 0
  });

  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('projectName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    client: '',
    ownerName: '',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/generic/projects', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          sortBy,
          sortOrder
        }
      });

      let projectList = res.data.records || res.data || [];
      
      // Calculate summary
      const totalProjects = projectList.length;
      const activeProjects = projectList.filter((p: Project) => p.status === 'ACTIVE').length;
      const completedProjects = projectList.filter((p: Project) => p.status === 'COMPLETED').length;
      const onHold = projectList.filter((p: Project) => p.status === 'ON_HOLD').length;
      const delayed = projectList.filter((p: Project) => p.status === 'DELAYED').length;

      setSummary({
        totalProjects,
        activeProjects,
        completedProjects,
        onHold,
        delayed
      });

      setProjects(projectList);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleRefresh = () => {
    fetchProjects(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('projectName');
    setSortOrder('asc');
  };

  const handleExport = async () => {
    try {
      const csvHeaders = ['Project Code', 'Project Name', 'Client', 'Project Manager', 'Status', 'Priority', 'Start Date', 'End Date'];
      const csvRows = projects.map(p => [
        p.projectCode,
        p.projectName,
        p.client || '',
        p.ownerName || '',
        p.status,
        p.priority,
        p.startDate || '',
        p.endDate || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/generic/projects', formData);
      setCreateOpen(false);
      setFormData({
        projectName: '',
        projectCode: '',
        client: '',
        ownerName: '',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        startDate: '',
        endDate: '',
        description: ''
      });
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setSaving(false);
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

  const hasActiveFilters = search || statusFilter || priorityFilter;

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Projects & Environments</p>
            <h1>Project Dashboard</h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="project-summary-cards">
          <div className="project-summary-card" onClick={() => { setStatusFilter(''); fetchProjects(); }}>
            <div className="project-summary-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Total Projects</span>
              <span className="project-summary-value">{loading ? '...' : summary.totalProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('ACTIVE'); fetchProjects(); }}>
            <div className="project-summary-icon active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12H2M5.45 5.11L2 12V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V12L18.55 5.11C18.3844 4.77678 18.1293 4.49617 17.8141 4.30017C17.4988 4.10416 17.1354 4.00001 16.765 4H7.24C6.86957 4.00001 6.50622 4.10416 6.19097 4.30017C5.87573 4.49617 5.62064 4.77678 5.45 5.11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Active Projects</span>
              <span className="project-summary-value">{loading ? '...' : summary.activeProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('COMPLETED'); fetchProjects(); }}>
            <div className="project-summary-icon completed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Completed</span>
              <span className="project-summary-value">{loading ? '...' : summary.completedProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('ON_HOLD'); fetchProjects(); }}>
            <div className="project-summary-icon onhold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 15V9M18 10C18 13.866 14.4183 17 10 17C5.58172 17 2 13.866 2 10C2 6.13401 5.58172 3 10 3C14.4183 3 18 6.13401 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">On Hold</span>
              <span className="project-summary-value">{loading ? '...' : summary.onHold}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('DELAYED'); fetchProjects(); }}>
            <div className="project-summary-icon delayed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 7V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 3L12 5L14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Delayed</span>
              <span className="project-summary-value">{loading ? '...' : summary.delayed}</span>
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
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>

            <div className="sort-dropdown">
              <button type="button" className="toolbar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sort
              </button>
              <div className="sort-dropdown-content">
                <button className={sortBy === 'projectName' ? 'active' : ''} onClick={() => handleSort('projectName')}>
                  Name {sortBy === 'projectName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'projectCode' ? 'active' : ''} onClick={() => handleSort('projectCode')}>
                  Code {sortBy === 'projectCode' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'status' ? 'active' : ''} onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'priority' ? 'active' : ''} onClick={() => handleSort('priority')}>
                  Priority {sortBy === 'priority' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spin' : ''}>
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            {isSuperAdmin && (
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
              <button type="button" className="toolbar-btn primary" onClick={() => setCreateOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Priority</label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="filters-actions">
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={() => fetchProjects()}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Projects Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Projects</h3>
            <span className="table-count">{projects.length} items</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="table-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No projects found</p>
              {hasActiveFilters && (
                <button type="button" className="secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project Code</th>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Project Manager</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} onClick={() => navigate(`/projects-environments/${project.id}`)}>
                      <td className="project-code">{project.projectCode}</td>
                      <td className="project-name">{project.projectName}</td>
                      <td>{project.client || '-'}</td>
                      <td>{project.ownerName || '-'}</td>
                      <td>
                        <span className={`status-badge status-${project.status.toLowerCase()}`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td>{formatDate(project.startDate)}</td>
                      <td>{formatDate(project.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {createOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Create Project</h3>
              <button type="button" className="close" onClick={() => setCreateOpen(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Project Code *</label>
                  <input
                    type="text"
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Client</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Project Manager</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
