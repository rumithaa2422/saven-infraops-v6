import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendor?: string;
  location?: string;
  currentQty: number;
  minStock?: number;
  status: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  warrantyMonths?: number;
  createdAt: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
};

export function InventoryMasterListingPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate summary stats
  const stats = {
    total: items.length,
    available: items.filter(i => i.currentQty > 0).length,
    lowStock: items.filter(i => i.minStock && i.currentQty < i.minStock).length,
    warrantyExpiring: items.filter(i => {
      if (!i.warrantyExpiry) return false;
      const expiry = new Date(i.warrantyExpiry);
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);
      return expiry >= now && expiry <= thirtyDays;
    }).length,
    expired: items.filter(i => {
      if (!i.warrantyExpiry) return false;
      return new Date(i.warrantyExpiry) < new Date();
    }).length
  };

  async function loadItems() {
    try {
      setLoading(true);
      const res = await api.get('/inventory-master', {
        params: { search: search || undefined }
      });
      setItems(res.data.items || []);
      setError('');
    } catch {
      setError('Failed to load inventory items');
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
    loadItems();
  }, [isEmployee]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      loadItems();
    }, 300);
    setSearchTimeout(timeout);
  }

  function handleRefresh() {
    setRefreshing(true);
    setSearch('');
    loadItems();
  }

  function handleRowClick(item: InventoryItem) {
    navigate(`/inventory/master/${item.id}`);
  }

  function handleOpen(item: InventoryItem) {
    navigate(`/inventory/master/${item.id}`);
  }

  function handleExport() {
    // Create CSV content
    const headers = ['Item No', 'Item Name', 'Category', 'Subcategory', 'Brand', 'Vendor', 'Current Qty', 'Min Stock', 'Location', 'Status', 'Warranty Expiry'];
    const rows = items.map(item => [
      item.itemNo,
      item.itemName,
      item.category?.name || '',
      item.subcategory?.name || '',
      item.brand || '',
      item.vendor || '',
      item.currentQty.toString(),
      item.minStock?.toString() || '',
      item.location || '',
      item.status,
      item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-master-${new Date().toISOString().split('T')[0]}.csv`;
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

  function getWarrantyStatus(expiry?: string): { label: string; class: string } {
    if (!expiry) return { label: '-', class: '' };
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

  if (isEmployee) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Access Restricted. You do not have permission to view this page.'}</p>
          <button className="btn-back" onClick={() => navigate('/inventory')}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Page Header */}
      <div className="listing-header">
        <div className="listing-title-row">
          <div className="listing-title">
            <h1>Inventory Master</h1>
            <span className="listing-count">{stats.total} items</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="summary-card-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Total Inventory</span>
            <span className="summary-card-value">{stats.total}</span>
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
            <span className="summary-card-label">Available</span>
            <span className="summary-card-value">{stats.available}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.74C2.88 20.92 3.23 21.01 3.59 21.01H20.41C20.77 21.01 21.12 20.92 21.43 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.94 2.85C11.58 2.85 11.23 2.94 10.92 3.12C10.61 3.3 10.35 3.56 10.17 3.86L10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Low Stock</span>
            <span className="summary-card-value">{stats.lowStock}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Warranty Expiring</span>
            <span className="summary-card-value">{stats.warrantyExpiring}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon danger">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Expired</span>
            <span className="summary-card-value">{stats.expired}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="listing-toolbar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="toolbar-actions">
          <button className="icon-btn" onClick={handleRefresh} disabled={loading || refreshing} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spinning' : ''}>
              <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1174 3.22621 13.1248 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 2V6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="secondary" onClick={handleExport}>
            Export
          </button>
          {(isSuperAdmin || isAdmin) && (
            <button className="primary" onClick={() => navigate('/inventory/create')}>
              + Create Inventory
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="listing-table-container">
        {loading ? (
          <div className="listing-loading">
            <div className="spinner"></div>
            <span>Loading inventory items...</span>
          </div>
        ) : error ? (
          <div className="listing-error">
            <p>{error}</p>
            <button className="btn-secondary" onClick={loadItems}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="listing-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>No inventory items found</p>
            {search && <p className="empty-hint">Try adjusting your search</p>}
          </div>
        ) : (
          <table className="listing-table">
            <thead>
              <tr>
                <th>Inventory ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Brand</th>
                <th>Vendor</th>
                <th>Current Qty</th>
                <th>Min Stock</th>
                <th>Location</th>
                <th>Status</th>
                <th>Warranty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const warrantyStatus = getWarrantyStatus(item.warrantyExpiry);
                const isLowStock = item.minStock && item.currentQty < item.minStock;
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item)}
                    className={isLowStock ? 'low-stock-row' : ''}
                  >
                    <td>
                      <span className="item-id">{item.itemNo}</span>
                    </td>
                    <td>
                      <span className="item-name">{item.itemName}</span>
                    </td>
                    <td>{item.category?.name || '-'}</td>
                    <td>{item.subcategory?.name || '-'}</td>
                    <td>{item.brand || '-'}</td>
                    <td>{item.vendor || '-'}</td>
                    <td>
                      <span className={isLowStock ? 'qty-low' : ''}>
                        {item.currentQty}
                      </span>
                    </td>
                    <td>{item.minStock ?? '-'}</td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <span className={`status-badge status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={warrantyStatus.class}>
                        {warrantyStatus.label}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-open"
                        onClick={(e) => { e.stopPropagation(); handleOpen(item); }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
