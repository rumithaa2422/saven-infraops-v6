import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type InventorySummary = {
  totalInventory: number;
  available: number;
  allocated: number;
  lowStock: number;
  expired: number;
  warrantyExpiring: number;
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  status: string;
  currentQty: number;
  location?: string;
  warrantyExpiry?: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
};

type FilterOptions = {
  categories: string[];
  subcategories: string[];
  locations: string[];
  vendors: string[];
  statuses: string[];
};

type SortOption = {
  field: string;
  label: string;
};

export function AccessManagementPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<InventorySummary>({
    totalInventory: 0,
    available: 0,
    allocated: 0,
    lowStock: 0,
    expired: 0,
    warrantyExpiring: 0
  });
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    subcategories: [],
    locations: [],
    vendors: [],
    statuses: []
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState('');
  const [sortBy, setSortBy] = useState('itemName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const sortOptions: SortOption[] = [
    { field: 'itemName', label: 'Name' },
    { field: 'purchaseDate', label: 'Purchase Date' },
    { field: 'warrantyExpiry', label: 'Warranty Expiry' },
    { field: 'currentQty', label: 'Quantity' },
    { field: 'vendor', label: 'Vendor' },
    { field: 'location', label: 'Location' }
  ];

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, searchRes] = await Promise.all([
        api.get('/inventory/analytics'),
        api.get('/inventory/analytics/search', {
          params: {
            search: search || undefined,
            category: selectedCategory || undefined,
            subcategory: selectedSubcategory || undefined,
            location: selectedLocation || undefined,
            status: selectedStatus || undefined,
            warranty: selectedWarranty || undefined,
            sortBy,
            sortOrder
          }
        })
      ]);

      setSummary(analyticsRes.data.summary);
      setFilters(analyticsRes.data.filters);
      setItems(searchRes.data.items);
      setTotalItems(searchRes.data.total);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, selectedSubcategory, selectedLocation, selectedStatus, selectedWarranty, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(true);
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
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedLocation('');
    setSelectedStatus('');
    setSelectedWarranty('');
    setSortBy('itemName');
    setSortOrder('asc');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedWarranty) params.append('warranty', selectedWarranty);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get(`/inventory/analytics/search?${params.toString()}`);
      const dataToExport = response.data.items;

      const csvHeaders = ['Item No', 'Name', 'Brand', 'Model', 'Status', 'Quantity', 'Location', 'Category', 'Subcategory', 'Warranty Expiry'];
      const csvRows = dataToExport.map((item: InventoryItem) => [
        item.itemNo,
        item.itemName,
        item.brand || '',
        item.model || '',
        item.status,
        item.currentQty,
        item.location || '',
        item.category.name,
        item.subcategory.name,
        item.warrantyExpiry || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `asset-management-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const navigateToAction = (action: string) => {
    navigate(`/access-management/${action}`);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWarrantyStatus = (dateStr?: string): { class: string; label: string } => {
    if (!dateStr) return { class: '', label: 'No Warranty' };
    const expiry = new Date(dateStr);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    if (expiry < now) return { class: 'warranty-expired', label: 'Expired' };
    if (expiry <= thirtyDays) return { class: 'warranty-warning', label: 'Expiring Soon' };
    return { class: 'warranty-active', label: 'Active' };
  };

  if (isEmployee) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="access-restricted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 7V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Access Restricted</h2>
            <p>You do not have permission to access Asset Management.</p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || selectedCategory || selectedSubcategory || selectedLocation || selectedStatus || selectedWarranty;

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Asset Management</p>
            <h1>Asset Dashboard</h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card" onClick={() => setSelectedStatus('')}>
            <div className="summary-card-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Total Inventory</span>
              <span className="summary-card-value">{loading ? '...' : summary.totalInventory}</span>
            </div>
          </div>

          <div className="summary-card" onClick={() => { setSelectedStatus('AVAILABLE'); fetchData(); }}>
            <div className="summary-card-icon available">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Available</span>
              <span className="summary-card-value">{loading ? '...' : summary.available}</span>
            </div>
          </div>

          <div className="summary-card" onClick={() => { setSelectedStatus('ASSIGNED'); fetchData(); }}>
            <div className="summary-card-icon assigned">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Assigned</span>
              <span className="summary-card-value">{loading ? '...' : summary.allocated}</span>
            </div>
          </div>

          <div className="summary-card" onClick={() => { setSelectedStatus('MAINTENANCE'); fetchData(); }}>
            <div className="summary-card-icon repair">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Under Repair</span>
              <span className="summary-card-value">{loading ? '...' : summary.lowStock}</span>
            </div>
          </div>

          <div className="summary-card" onClick={() => { setSelectedStatus('RETIRED'); fetchData(); }}>
            <div className="summary-card-icon retired">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Retired</span>
              <span className="summary-card-value">{loading ? '...' : summary.expired}</span>
            </div>
          </div>

          <div className="summary-card" onClick={() => { setSelectedWarranty('expiring'); fetchData(); }}>
            <div className="summary-card-icon warranty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Warranty Expiring</span>
              <span className="summary-card-value">{loading ? '...' : summary.warrantyExpiring}</span>
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
                placeholder="Search assets..."
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
                {sortOptions.map((option) => (
                  <button
                    key={option.field}
                    type="button"
                    className={sortBy === option.field ? 'active' : ''}
                    onClick={() => handleSort(option.field)}
                  >
                    {option.label}
                    {sortBy === option.field && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
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
              <button
                type="button"
                className="toolbar-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {filters.categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                >
                  <option value="">All Subcategories</option>
                  {filters.subcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {filters.locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {filters.statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Warranty</label>
                <select
                  value={selectedWarranty}
                  onChange={(e) => setSelectedWarranty(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring (30 days)</option>
                  <option value="expired">Expired</option>
                  <option value="none">No Warranty</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="filters-actions">
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={() => fetchData()}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigateToAction('assignment')}
              disabled={!isSuperAdmin && !isAdmin}
            >
              <div className="quick-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="quick-action-label">Assignment</span>
              <span className="quick-action-desc">Assign assets to users</span>
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigateToAction('transfer')}
              disabled={!isSuperAdmin && !isAdmin}
            >
              <div className="quick-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 1L21 5L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 23L3 19L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="quick-action-label">Transfer</span>
              <span className="quick-action-desc">Transfer assets between locations</span>
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigateToAction('return')}
              disabled={!isSuperAdmin && !isAdmin}
            >
              <div className="quick-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L7 8V11H11C14.866 11 18 14.134 18 18V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 17V15C21 11.134 17.866 8 14 8H10L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="quick-action-label">Return</span>
              <span className="quick-action-desc">Process asset returns</span>
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigateToAction('repair')}
              disabled={!isSuperAdmin && !isAdmin}
            >
              <div className="quick-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="quick-action-label">Repair</span>
              <span className="quick-action-desc">Submit repair requests</span>
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigateToAction('retired')}
              disabled={!isSuperAdmin}
            >
              <div className="quick-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 14H20M4 10H20M10 4H14M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="quick-action-label">Retired Assets</span>
              <span className="quick-action-desc">View retired assets</span>
            </button>
          </div>
        </div>

        {/* Assets Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Assets</h3>
            <span className="table-count">{totalItems} items</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading assets...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="table-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No assets found</p>
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
                    <th>Asset ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Warranty</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const warranty = getWarrantyStatus(item.warrantyExpiry);
                    return (
                      <tr key={item.id} onClick={() => navigate(`/inventory/master/${item.id}`)}>
                        <td className="asset-id">{item.itemNo}</td>
                        <td>
                          <div className="asset-name-cell">
                            <span className="asset-name">{item.itemName}</span>
                            {item.brand && <span className="asset-brand">{item.brand}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="category-cell">
                            <span>{item.category.name}</span>
                            <small>{item.subcategory.name}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.location || '-'}</td>
                        <td>
                          <span className={`warranty-cell ${warranty.class}`}>
                            {formatDate(item.warrantyExpiry)}
                          </span>
                        </td>
                        <td>{item.currentQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
