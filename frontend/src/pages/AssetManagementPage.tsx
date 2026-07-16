import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Asset = {
  id: string;
  assetNo: string;
  assetType: string;
  make?: string;
  model?: string;
  serialNo?: string;
  status: string;
  assignedToName?: string;
  location?: string;
  warrantyEndAt?: string;
  createdAt: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
};

type AssetStats = {
  total: number;
  available: number;
  assigned: number;
  underRepair: number;
  retired: number;
  damaged: number;
  lost: number;
};

export function AssetManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load data
  async function loadData() {
    try {
      setLoading(true);
      
      const [assetsRes, statsRes] = await Promise.all([
        api.get('/assets', {
          params: {
            search: search || undefined,
            status: statusFilter || undefined
          }
        }),
        api.get('/assets/stats')
      ]);
      
      setAssets(assetsRes.data.assets || []);
      setStats(statsRes.data.stats);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isEmployee) {
      setError('Access Restricted. You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    loadData();
  }, [statusFilter, isEmployee]);

  // Search debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      loadData();
    }, 300);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search]);

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Asset];
      let bVal = b[sortBy as keyof Asset];
      
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      return sortOrder === 'asc' 
        ? (aVal < bVal ? -1 : 1)
        : (aVal > bVal ? -1 : 1);
    });

    return result;
  }, [assets, sortBy, sortOrder]);

  function handleSortChange(value: string) {
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  }

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  function handleOpen(asset: Asset) {
    navigate(`/assets/${asset.id}`);
  }

  function handleCreateAsset() {
    navigate('/assets/create');
  }

  function handleExport() {
    const headers = ['Asset ID', 'Asset Name', 'Category', 'Sub Category', 'Make', 'Model', 'Serial Number', 'Status', 'Assigned To', 'Location', 'Warranty Expiry', 'Created Date'];
    const rows = filteredAssets.map(asset => [
      asset.assetNo,
      asset.assetType,
      asset.category?.name || '',
      asset.subcategory?.name || '',
      asset.make || '',
      asset.model || '',
      asset.serialNo || '',
      asset.status,
      asset.assignedToName || '',
      asset.location || '',
      asset.warrantyEndAt ? new Date(asset.warrantyEndAt).toLocaleDateString() : '',
      new Date(asset.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assets-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'AVAILABLE': 'status-active',
      'ASSIGNED': 'status-assigned',
      'UNDER_REPAIR': 'status-warning',
      'DAMAGED': 'status-danger',
      'LOST': 'status-danger',
      'RETIRED': 'status-inactive',
      'DISPOSED': 'status-inactive'
    };
    return statusMap[status] || '';
  }

  function getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  if (isEmployee) {
    return (
      <div className="page-stack">
        <div className="access-restricted">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Access Restricted</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="page-title">Asset Management</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="summary-card-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{stats?.total || 0}</span>
            <span className="summary-card-label">Total Assets</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon available">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{stats?.available || 0}</span>
            <span className="summary-card-label">Available</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon assigned">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{stats?.assigned || 0}</span>
            <span className="summary-card-label">Assigned</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon maintenance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{stats?.underRepair || 0}</span>
            <span className="summary-card-label">Under Maintenance</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon retired">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{stats?.retired || 0}</span>
            <span className="summary-card-label">Retired</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="listing-toolbar">
        <div className="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>
          <div className="sort-dropdown">
            <select 
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="assetNo_asc">Asset ID A-Z</option>
              <option value="assetNo_desc">Asset ID Z-A</option>
              <option value="assetType_asc">Name A-Z</option>
              <option value="assetType_desc">Name Z-A</option>
              <option value="status_asc">Status A-Z</option>
            </select>
          </div>
          <button className="icon-btn" onClick={handleRefresh} disabled={loading || refreshing} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spinning' : ''}>
              <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1174 3.22621 13.1248 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 2V6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="secondary" onClick={handleExport}>
            Export
          </button>
          {isSuperAdmin && (
            <button className="primary" onClick={handleCreateAsset}>
              + Create Asset
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="notice notice-error">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="listing-loading">
          <div className="spinner"></div>
          <span>Loading assets...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="listing-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <p>{search || statusFilter ? 'No assets found matching your filters' : 'No assets yet. Click "Create Asset" to add your first asset.'}</p>
        </div>
      ) : (
        <div className="listing-table-container">
          <table className="listing-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Warranty Expiry</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} onClick={() => handleOpen(asset)}>
                  <td className="asset-id">{asset.assetNo}</td>
                  <td className="asset-name">
                    <div className="asset-name-cell">
                      <span className="asset-type">{asset.assetType}</span>
                      {asset.make && asset.model && (
                        <span className="asset-model">{asset.make} {asset.model}</span>
                      )}
                    </div>
                  </td>
                  <td>{asset.category?.name || '-'}</td>
                  <td>{asset.subcategory?.name || '-'}</td>
                  <td>{asset.serialNo || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(asset.status)}`}>
                      {getStatusLabel(asset.status)}
                    </span>
                  </td>
                  <td>{formatDate(asset.warrantyEndAt)}</td>
                  <td>{formatDate(asset.createdAt)}</td>
                  <td>
                    <button 
                      className="btn-open"
                      onClick={(e) => { e.stopPropagation(); handleOpen(asset); }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
