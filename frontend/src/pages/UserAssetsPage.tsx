import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

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
  assignedTo?: { id: string; name: string; email: string };
  projectName?: string;
  projectCode?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  status: string;
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  status: string;
};

export function UserAssetsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignedAssets, setAssignedAssets] = useState<InventoryItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [warrantyExpiring, setWarrantyExpiring] = useState(0);
  const [underRepair, setUnderRepair] = useState(0);

  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (userId) {
      loadUser();
      loadUserAssignments();
    }
  }, [userId]);

  async function loadUser() {
    try {
      setLoading(true);
      // Use the generic users endpoint
      const res = await api.get(`/generic/users/${userId}`);
      const user = res.data;
      // Extract role from the roles array
      const role = user.roles?.[0]?.role?.name || user.roles?.[0]?.name || 'Employee';
      setUserData({ ...user, role });
      setError('');
    } catch {
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserAssignments() {
    try {
      setLoadingAssets(true);
      const res = await api.get('/inventory-assignments', {
        params: { userId, status: 'ACTIVE' }
      });
      const assignments = res.data.assignments || [];
      
      // Extract inventory items from assignments
      const assets = assignments.map((a: any) => ({
        ...a.inventory,
        assignedTo: a.user,
        projectName: a.project?.projectName,
        projectCode: a.project?.projectCode
      }));
      
      setAssignedAssets(assets);
      
      // Count warranty expiring
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let warrantyCount = 0;
      let repairCount = 0;
      const projectIds = new Set<string>();
      
      assets.forEach((item: InventoryItem) => {
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
      
      // Get unique project IDs from assignments
      assignments.forEach((assignment: any) => {
        if (assignment.project?.id) {
          projectIds.add(assignment.project.id);
        }
      });
      
      setWarrantyExpiring(warrantyCount);
      setUnderRepair(repairCount);
      setUserProjects(Array.from(projectIds).map((id: string) => assignments.find((a: any) => a.project?.id === id)?.project).filter(Boolean));
    } catch {
      setAssignedAssets([]);
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
    const timeout = setTimeout(() => {
      // Search is instant since we filter locally
    }, 300);
    setSearchTimeout(timeout);
  }

  const filteredAssets = assignedAssets.filter(item =>
    item.itemNo.toLowerCase().includes(search.toLowerCase()) ||
    item.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (item.brand?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (item.model?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getWarrantyStatus(expiry?: string): { label: string; class: string } {
    if (!expiry) return { label: 'No Warranty', class: 'warranty-none' };
    const expiryDate = new Date(expiry);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    if (expiryDate < now) {
      return { label: 'Expired', class: 'warranty-expired' };
    } else if (expiryDate <= thirtyDays) {
      return { label: 'Expiring Soon', class: 'warranty-warning' };
    }
    return { label: 'Active', class: 'warranty-active' };
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="user-assets-page">
          <div className="detail-header">
            <div className="skeleton skeleton-title"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'User not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Asset Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="user-assets-page">
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
              <div className="user-avatar-large">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-header-content">
                <h1 className="user-name">{userData.name}</h1>
                <div className="user-meta">
                  <span className="user-department">{userData.department || 'No Department'}</span>
                  <span className="user-role-badge">{userData.role || 'Employee'}</span>
                  <span className={`status-badge status-${userData.status.toLowerCase()}`}>
                    {userData.status}
                  </span>
                </div>
                <div className="user-email">{userData.email}</div>
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
              <span className="user-asset-summary-value">{assignedAssets.length}</span>
            </div>
          </div>

          <div className="user-asset-summary-card">
            <div className="user-asset-summary-icon project">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="user-asset-summary-content">
              <span className="user-asset-summary-label">Projects</span>
              <span className="user-asset-summary-value">{userProjects.length}</span>
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
          ) : filteredAssets.length === 0 ? (
            <div className="user-assets-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No Assets Assigned</h3>
              <p>This user has no assets assigned to them.</p>
            </div>
          ) : (
            <table className="user-assets-table">
              <thead>
                <tr>
                  <th>Inventory ID</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Project</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span className="asset-item-id">{item.itemNo}</span>
                    </td>
                    <td>{item.itemName}</td>
                    <td>{item.category?.name || '-'}</td>
                    <td>{item.brand || '-'}</td>
                    <td>{item.model || '-'}</td>
                    <td>{item.projectName || '-'}</td>
                    <td>{formatDate(item.purchaseDate)}</td>
                    <td>
                      <span className={`status-badge status-${item.status.toLowerCase()}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="asset-action-btn"
                        onClick={() => navigate(`/access-management/${item.id}`)}
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
