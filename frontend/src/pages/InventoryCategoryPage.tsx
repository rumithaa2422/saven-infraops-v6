import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Subcategory = {
  id: string;
  name: string;
  description?: string;
  status: string;
};

type Category = {
  id: string;
  name: string;
  description?: string;
  status: string;
  subcategories: Subcategory[];
};

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
  createdAt: string;
  categoryId: string;
  subcategoryId: string;
  subcategory: { id: string; name: string };
};

type FilterState = {
  subcategory: string;
  vendor: string;
  brand: string;
  location: string;
  warranty: string;
  status: string;
  stock: string;
  purchaseYear: string;
};

export function InventoryCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    subcategory: '',
    vendor: '',
    brand: '',
    location: '',
    warranty: '',
    status: '',
    stock: '',
    purchaseYear: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<string>('itemName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Subcategory Management State
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '' });
  const [subcategoryError, setSubcategoryError] = useState('');
  const [subcategorySaving, setSubcategorySaving] = useState(false);
  const [subcategoryDeleting, setSubcategoryDeleting] = useState<string | null>(null);

  // Load category and items
  async function loadData() {
    if (!categoryId) return;
    try {
      setLoading(true);
      
      // Load category details
      const catRes = await api.get(`/inventory/categories/${categoryId}`);
      setCategory(catRes.data.category);

      // Load all items for this category
      const itemsRes = await api.get('/inventory-master', {
        params: { categoryId }
      });
      setItems(itemsRes.data.items || []);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load category details');
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
  }, [categoryId, isEmployee]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by selected subcategory
    if (selectedSubcategory) {
      result = result.filter(item => item.subcategoryId === selectedSubcategory);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemNo.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.vendor?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by subcategory (when not selected)
    if (!selectedSubcategory && filters.subcategory) {
      result = result.filter(item => item.subcategoryId === filters.subcategory);
    }

    // Filter by vendor
    if (filters.vendor) {
      result = result.filter(item => 
        item.vendor?.toLowerCase().includes(filters.vendor.toLowerCase())
      );
    }

    // Filter by brand
    if (filters.brand) {
      result = result.filter(item => 
        item.brand?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    // Filter by location
    if (filters.location) {
      result = result.filter(item => 
        item.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by warranty status
    if (filters.warranty) {
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);
      
      result = result.filter(item => {
        if (!item.warrantyExpiry) return filters.warranty === 'none';
        const expiry = new Date(item.warrantyExpiry);
        
        if (filters.warranty === 'expired') return expiry < now;
        if (filters.warranty === 'expiring') return expiry >= now && expiry <= thirtyDays;
        if (filters.warranty === 'active') return expiry > thirtyDays;
        return true;
      });
    }

    // Filter by status
    if (filters.status) {
      result = result.filter(item => item.status === filters.status);
    }

    // Filter by stock
    if (filters.stock) {
      if (filters.stock === 'low') {
        result = result.filter(item => item.minStock && item.currentQty < item.minStock);
      } else if (filters.stock === 'in') {
        result = result.filter(item => item.currentQty > 0);
      }
    }

    // Filter by purchase year
    if (filters.purchaseYear) {
      result = result.filter(item => {
        if (!item.purchaseDate) return false;
        const year = new Date(item.purchaseDate).getFullYear().toString();
        return year === filters.purchaseYear;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        case 'brand':
          comparison = (a.brand || '').localeCompare(b.brand || '');
          break;
        case 'vendor':
          comparison = (a.vendor || '').localeCompare(b.vendor || '');
          break;
        case 'purchaseDate':
          comparison = new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
          break;
        case 'warrantyExpiry':
          comparison = new Date(a.warrantyExpiry || 0).getTime() - new Date(b.warrantyExpiry || 0).getTime();
          break;
        case 'currentQty':
          comparison = a.currentQty - b.currentQty;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, selectedSubcategory, search, filters, sortBy, sortOrder]);

  // Calculate summary stats for displayed items
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    return {
      total: filteredItems.length,
      available: filteredItems.filter(i => i.currentQty > 0).length,
      lowStock: filteredItems.filter(i => i.minStock && i.currentQty < i.minStock).length,
      warrantyExpiring: filteredItems.filter(i => {
        if (!i.warrantyExpiry) return false;
        const expiry = new Date(i.warrantyExpiry);
        return expiry >= now && expiry <= thirtyDays;
      }).length,
      expired: filteredItems.filter(i => {
        if (!i.warrantyExpiry) return false;
        return new Date(i.warrantyExpiry) < now;
      }).length
    };
  }, [filteredItems]);

  // Get inventory count per subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.subcategoryId] = (counts[item.subcategoryId] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Get unique vendors from items
  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    items.forEach(item => {
      if (item.vendor) vendors.add(item.vendor);
    });
    return Array.from(vendors).sort();
  }, [items]);

  // Get unique brands from items
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    items.forEach(item => {
      if (item.brand) brands.add(item.brand);
    });
    return Array.from(brands).sort();
  }, [items]);

  // Get unique purchase years
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    items.forEach(item => {
      if (item.purchaseDate) {
        years.add(new Date(item.purchaseDate).getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [items]);

  // Get active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    
    if (selectedSubcategory) {
      const sub = category?.subcategories.find(s => s.id === selectedSubcategory);
      chips.push({ key: 'subcategory', label: sub?.name || 'Subcategory', value: selectedSubcategory });
    }
    
    if (filters.warranty) {
      const labels: Record<string, string> = {
        active: 'Warranty Active',
        expiring: 'Warranty Expiring',
        expired: 'Warranty Expired',
        none: 'No Warranty'
      };
      chips.push({ key: 'warranty', label: labels[filters.warranty] || filters.warranty, value: filters.warranty });
    }
    
    if (filters.status) {
      chips.push({ key: 'status', label: `Status: ${filters.status}`, value: filters.status });
    }
    
    if (filters.stock) {
      const labels: Record<string, string> = {
        low: 'Low Stock',
        in: 'In Stock'
      };
      chips.push({ key: 'stock', label: labels[filters.stock] || filters.stock, value: filters.stock });
    }
    
    if (filters.vendor) {
      chips.push({ key: 'vendor', label: `Vendor: ${filters.vendor}`, value: filters.vendor });
    }
    
    if (filters.brand) {
      chips.push({ key: 'brand', label: `Brand: ${filters.brand}`, value: filters.brand });
    }
    
    if (filters.purchaseYear) {
      chips.push({ key: 'purchaseYear', label: `Year: ${filters.purchaseYear}`, value: filters.purchaseYear });
    }
    
    return chips;
  }, [selectedSubcategory, filters, category]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      // Search is applied via useMemo
    }, 300);
    setSearchTimeout(timeout);
  }

  function handleRefresh() {
    setRefreshing(true);
    setSearch('');
    setFilters({
      subcategory: '',
      vendor: '',
      brand: '',
      location: '',
      warranty: '',
      status: '',
      stock: '',
      purchaseYear: ''
    });
    setSelectedSubcategory(null);
    loadData();
  }

  function handleClearFilters() {
    setFilters({
      subcategory: '',
      vendor: '',
      brand: '',
      location: '',
      warranty: '',
      status: '',
      stock: '',
      purchaseYear: ''
    });
    setSelectedSubcategory(null);
  }

  function removeFilterChip(key: string) {
    if (key === 'subcategory') {
      setSelectedSubcategory(null);
    } else {
      setFilters(prev => ({ ...prev, [key]: '' }));
    }
  }

  function handleSortChange(value: string) {
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  }

  function handleRowClick(item: InventoryItem) {
    navigate(`/inventory/master/${item.id}`);
  }

  function handleOpen(item: InventoryItem) {
    navigate(`/inventory/master/${item.id}`);
  }

  function handleCreateInventory() {
    const params = new URLSearchParams();
    params.set('categoryId', categoryId || '');
    if (selectedSubcategory) {
      params.set('subcategoryId', selectedSubcategory);
    }
    navigate(`/inventory/create?${params.toString()}`);
  }

  function handleExport() {
    const headers = ['Item No', 'Item Name', 'Subcategory', 'Brand', 'Vendor', 'Current Qty', 'Min Stock', 'Location', 'Status', 'Warranty Expiry'];
    const rows = filteredItems.map(item => [
      item.itemNo,
      item.itemName,
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
    link.download = `${category?.name || 'inventory'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
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

  function toggleSubcategory(subId: string) {
    if (selectedSubcategory === subId) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subId);
    }
  }

  // Subcategory Management Functions
  function openSubcategoryForm(sub?: Subcategory) {
    if (sub) {
      setEditingSubcategory(sub);
      setSubcategoryForm({ name: sub.name, description: sub.description || '' });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({ name: '', description: '' });
    }
    setSubcategoryError('');
    setShowSubcategoryForm(true);
  }

  function closeSubcategoryForm() {
    setShowSubcategoryForm(false);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: '', description: '' });
    setSubcategoryError('');
  }

  async function handleSaveSubcategory(e: React.FormEvent) {
    e.preventDefault();
    
    if (!subcategoryForm.name.trim()) {
      setSubcategoryError('Subcategory name is required');
      return;
    }

    try {
      setSubcategorySaving(true);
      setSubcategoryError('');

      if (editingSubcategory) {
        // Update existing subcategory
        await api.patch(`/inventory/subcategories/${editingSubcategory.id}`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null
        });
      } else {
        // Create new subcategory
        await api.post(`/inventory/categories/${categoryId}/subcategories`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null
        });
      }

      // Reload data
      await loadData();
      closeSubcategoryForm();
    } catch (err: any) {
      setSubcategoryError(err.response?.data?.message || `Failed to ${editingSubcategory ? 'update' : 'create'} subcategory`);
    } finally {
      setSubcategorySaving(false);
    }
  }

  async function handleDeleteSubcategory(subId: string) {
    const sub = category?.subcategories.find(s => s.id === subId);
    const count = subcategoryCounts[subId] || 0;
    
    if (count > 0) {
      setSubcategoryError(`Cannot delete. This subcategory contains ${count} inventory item${count > 1 ? 's' : ''}.`);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${sub?.name}"?`);
    if (!confirmed) return;

    try {
      setSubcategoryDeleting(subId);
      await api.delete(`/inventory/subcategories/${subId}`);
      await loadData();
      setSubcategoryError('');
    } catch (err: any) {
      setSubcategoryError(err.response?.data?.message || 'Failed to delete subcategory');
    } finally {
      setSubcategoryDeleting(null);
    }
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

  if (loading) {
    return (
      <div className="page-stack">
        <div className="listing-header">
          <div className="skeleton skeleton-title"></div>
        </div>
        <div className="summary-cards-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="summary-card">
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
              <div className="summary-card-content">
                <div className="skeleton" style={{ width: '80px', height: '14px' }}></div>
                <div className="skeleton" style={{ width: '40px', height: '24px', marginTop: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Category not found.'}</p>
          <button className="btn-back" onClick={() => navigate('/inventory')}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/inventory')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="detail-header-info">
          <div className="detail-title-row">
            <span className="detail-ticket-no">{category.name}</span>
            <span className={`status-badge status-${category.status.toLowerCase()}`}>
              {category.status}
            </span>
          </div>
          {category.description && (
            <p className="detail-description">{category.description}</p>
          )}
        </div>
      </div>

      {/* Subcategory Management Section */}
      <div className="subcategory-manage-section">
        <div className="subcategory-manage-header">
          <div className="subcategory-manage-title">
            <h3>Subcategories</h3>
            {isSuperAdmin && (
              <button 
                className="btn-link-sm primary"
                onClick={() => openSubcategoryForm()}
              >
                + Create Subcategory
              </button>
            )}
          </div>
          {subcategoryError && !showSubcategoryForm && (
            <div className="subcategory-error">{subcategoryError}</div>
          )}
        </div>

        {/* Create/Edit Subcategory Form */}
        {showSubcategoryForm && (
          <div className="subcategory-form-container">
            <form onSubmit={handleSaveSubcategory} className="subcategory-form">
              <h4>{editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Subcategory Name *</label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                    placeholder="Enter subcategory name"
                    disabled={subcategorySaving}
                  />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <input
                    type="text"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    placeholder="Enter description"
                    disabled={subcategorySaving}
                  />
                </div>
              </div>
              {subcategoryError && (
                <div className="form-error">{subcategoryError}</div>
              )}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeSubcategoryForm}
                  disabled={subcategorySaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={subcategorySaving}
                >
                  {subcategorySaving ? 'Saving...' : editingSubcategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategory List */}
        <div className="subcategory-list">
          {category.subcategories.length === 0 ? (
            <p className="subcategory-empty">No subcategories yet. Click "Create Subcategory" to add one.</p>
          ) : (
            <div className="subcategory-items">
              {category.subcategories.map(sub => (
                <div
                  key={sub.id}
                  className={`subcategory-item ${selectedSubcategory === sub.id ? 'selected' : ''}`}
                  onClick={() => toggleSubcategory(sub.id)}
                >
                  <div className="subcategory-item-info">
                    <span 
                      className="subcategory-item-name"
                      onClick={(e) => { e.stopPropagation(); toggleSubcategory(sub.id); }}
                    >
                      {sub.name}
                    </span>
                    <span className="subcategory-item-count">
                      {subcategoryCounts[sub.id] || 0} Inventories
                    </span>
                  </div>
                  {isSuperAdmin && !showSubcategoryForm && (
                    <div className="subcategory-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-icon-sm"
                        onClick={() => openSubcategoryForm(sub)}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon-sm btn-icon-danger"
                        onClick={() => handleDeleteSubcategory(sub.id)}
                        disabled={subcategoryDeleting === sub.id}
                        title="Delete"
                      >
                        {subcategoryDeleting === sub.id ? (
                          <span className="spinner-sm"></span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 3.5h11M4.5 3.5V2a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1.5M11 3.5v8a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="summary-card-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-label">Total</span>
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
            <span className="summary-card-label">Warranty Due</span>
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
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder={selectedSubcategory ? "Search in selected subcategory..." : "Search in category..."}
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="toolbar-actions">
          <button 
            className={`icon-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filter"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="sort-dropdown">
            <select 
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="itemName_asc">Name A-Z</option>
              <option value="itemName_desc">Name Z-A</option>
              <option value="currentQty_desc">Qty High-Low</option>
              <option value="currentQty_asc">Qty Low-High</option>
              <option value="purchaseDate_desc">Purchase Newest</option>
              <option value="purchaseDate_asc">Purchase Oldest</option>
              <option value="warrantyExpiry_asc">Warranty Earliest</option>
              <option value="warrantyExpiry_desc">Warranty Latest</option>
            </select>
          </div>
          {activeFilterChips.length > 0 && (
            <button className="secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
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
            <button className="primary" onClick={handleCreateInventory}>
              + Create Inventory
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="filter-chips">
          {activeFilterChips.map(chip => (
            <span key={chip.key} className="filter-chip">
              {chip.label}
              <button 
                className="filter-chip-remove"
                onClick={() => removeFilterChip(chip.key)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-row">
            {!selectedSubcategory && (
              <div className="filter-group">
                <label>Subcategory</label>
                <select
                  value={filters.subcategory}
                  onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}
                >
                  <option value="">All Subcategories</option>
                  {category.subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Stock</label>
              <select
                value={filters.stock}
                onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
              >
                <option value="">All</option>
                <option value="low">Low Stock</option>
                <option value="in">In Stock</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Warranty</label>
              <select
                value={filters.warranty}
                onChange={(e) => setFilters({ ...filters, warranty: e.target.value })}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring in 30 Days</option>
                <option value="expired">Expired</option>
                <option value="none">No Warranty</option>
              </select>
            </div>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label>Vendor</label>
              <select
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
              >
                <option value="">All Vendors</option>
                {uniqueVendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              >
                <option value="">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Purchase Year</label>
              <select
                value={filters.purchaseYear}
                onChange={(e) => setFilters({ ...filters, purchaseYear: e.target.value })}
              >
                <option value="">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="listing-table-container">
        {loading ? (
          <div className="listing-loading">
            <div className="spinner"></div>
            <span>Loading inventory items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="listing-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>{search || filters.vendor || filters.brand || filters.location || filters.warranty || filters.status || filters.stock || filters.purchaseYear || selectedSubcategory ? 'No matching items found' : 'No inventory items in this category'}</p>
            {search && <p className="empty-hint">Try adjusting your search</p>}
          </div>
        ) : (
          <table className="listing-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('itemName')} className="sortable">
                  Item Name {sortBy === 'itemName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Subcategory</th>
                <th onClick={() => handleSort('brand')} className="sortable">
                  Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('vendor')} className="sortable">
                  Vendor {sortBy === 'vendor' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('currentQty')} className="sortable">
                  Qty {sortBy === 'currentQty' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Location</th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('warrantyExpiry')} className="sortable">
                  Warranty {sortBy === 'warrantyExpiry' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
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
                      <br/>
                      <span className="item-name">{item.itemName}</span>
                    </td>
                    <td>{item.subcategory?.name || '-'}</td>
                    <td>{item.brand || '-'}</td>
                    <td>{item.vendor || '-'}</td>
                    <td>
                      <span className={isLowStock ? 'qty-low' : ''}>
                        {item.currentQty}
                      </span>
                    </td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <span className={`status-badge status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={warrantyStatus.class}>
                        {item.warrantyExpiry ? formatDate(item.warrantyExpiry) : '-'}
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
