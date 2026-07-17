import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  status: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  status: string;
  managerId?: string;
  manager?: { name: string; email: string };
  teamSize?: number;
};

type AssignmentWithUser = {
  id: string;
  inventory: InventoryItem;
  user: { id: string; name: string; email: string };
  project: { id: string; projectName: string; projectCode: string };
  assignedDate: string;
};

export function ProjectAssetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const [assignedCount, setAssignedCount] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [warrantyExpiring, setWarrantyExpiring] = useState(0);
  const [underRepair, setUnderRepair] = useState(0);

  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadProjectAssignments();
    }
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      const res = await api.get(`/projects-environments/${projectId}`);
      setProjectData(res.data.item);
      setError('');
    } catch {
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectAssignments() {
    try {
      setLoadingAssets(true);
      const res = await api.get('/inventory-assignments', {
        params: { projectId, status: 'ACTIVE' }
      });
      const data = res.data.assignments || [];
      setAssignments(data);
      
      // Count unique users
      const userIds = new Set(data.map((a: AssignmentWithUser) => a.user?.id));
      setUniqueUsers(userIds.size);
      setAssignedCount(data.length);
      
      // Count warranty expiring and repair
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let warrantyCount = 0;
      let repairCount = 0;
      
      data.forEach((assignment: AssignmentWithUser) => {
        const item = assignment.inventory;
        if (item.warrantyExpiry) {
          const expiry = new Date(item.warrantyExpiry);
          if (expiry >= now && expiry <= thirtyDays) {
            warrantyCount++;
          }
        }
        if (item.status === 'UNDER_REPAIR') {
          repairCount++;
        }
      });
      
      setWarrantyExpiring(warrantyCount);
      setUnderRepair(repairCount);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssets(false);
    }
  }

  function handleBack() {
    navigate('/access-management');
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {}, 300));
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.inventory.itemNo.toLowerCase().includes(search.toLowerCase()) ||
    assignment.inventory.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (assignment.inventory.brand?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (assignment.inventory.model?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    assignment.user.name.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="project-assets-page">
          <div className="detail-header">
            <div className="skeleton skeleton-title"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Project not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Asset Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="project-assets-page">
        {/* Page Header */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button className="btn-back" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          </div>
          <div className="detail-header-info">
            <div className="user-header">
              <div className="project-icon-large">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="user-header-content">
                <h1 className="user-name">{projectData.projectName}</h1>
                <div className="user-meta">
                  <span className="user-department">{projectData.projectCode}</span>
                  <span className={`status-badge status-${projectData.status.toLowerCase()}`}>
                    {projectData.status}
                  </span>
                </div>
                {projectData.manager && (
                  <div className="user-email">Manager: {projectData.manager.name}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="user-assets-summary">
          <div className="user-asset-summary-card">
            <div className="user-asset-summary-icon assigned">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="user-asset-summary-content">
              <span className="user-asset-summary-label">Assigned Assets</span>
              <span className="user-asset-summary-value">{assignedCount}</span>
            </div>
          </div>

          <div className="user-asset-summary-card">
            <div className="user-asset-summary-icon project">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="11" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21v-1.5a2 2 0 00-2-2h-1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="user-asset-summary-content">
              <span className="user-asset-summary-label">Users</span>
              <span className="user-asset-summary-value">{uniqueUsers}</span>
            </div>
          </div>

          <div className="user-asset-summary-card">
            <div className="user-asset-summary-icon warranty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="user-asset-summary-content">
              <span className="user-asset-summary-label">Warranty Expiring</span>
              <span className="user-asset-summary-value">{warrantyExpiring}</span>
            </div>
          </div>

          <div className="user-asset-summary-card">
            <div className="user-asset-summary-icon repair">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-asset-summary-content">
              <span className="user-asset-summary-label">Under Repair</span>
              <span className="user-asset-summary-value">{underRepair}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="asset-toolbar">
          <div className="toolbar-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button className="toolbar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Columns
            </button>
            <button className="toolbar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Assets Table */}
        <div className="user-assets-table-container">
          {loadingAssets ? (
            <div className="user-assets-loading">Loading assets...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="user-assets-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No Assets in Project</h3>
              <p>This project has no assets assigned to it.</p>
            </div>
          ) : (
            <table className="user-assets-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Inventory ID</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-user-avatar">
                          {assignment.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span>{assignment.user?.name || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="asset-item-id">{assignment.inventory.itemNo}</span>
                    </td>
                    <td>{assignment.inventory.itemName}</td>
                    <td>{assignment.inventory.category?.name || '-'}</td>
                    <td>{assignment.inventory.brand || '-'}</td>
                    <td>
                      <span className={`status-badge status-${assignment.inventory.status.toLowerCase()}`}>
                        {assignment.inventory.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{formatDate(assignment.assignedDate)}</td>
                    <td>
                      <button 
                        className="asset-action-btn"
                        onClick={() => navigate(`/access-management/${assignment.inventory.id}`)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
