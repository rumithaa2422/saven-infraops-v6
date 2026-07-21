import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { ModalLayout } from '../components/inventory/Modal';

type Category = {
  id: string;
  name: string;
  description?: string;
  status: string;
  subcategories: {
    id: string;
    name: string;
    description?: string;
    status: string;
  }[];
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendor?: string;
  invoiceNo?: string;
  purchaseCost?: number;
  warrantyMonths?: number;
  location?: string;
  currentQty: number;
  status: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  createdAt: string;
  categoryId: string;
  subcategoryId: string;
  subcategory?: { id: string; name: string };
  assignedTo?: { id: string; name: string; email: string };
  projectName?: string;
};

type SummaryStats = {
  totalInventory: number;
  assigned: number;
  available: number;
  underRepair: number;
  retired: number;
  lost: number;
  warrantyExpiring: number;
};

type FilterState = {
  category: string;
  subcategory: string;
  status: string;
  location: string;
  vendor: string;
};

type CategoryWithCount = {
  id: string;
  name: string;
  description?: string;
  status: string;
  subcategories: {
    id: string;
    name: string;
    description?: string;
    status: string;
    inventoryCount: number;
  }[];
  inventoryCount: number;
};

export function AssetManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  // Summary stats
  const [stats, setStats] = useState<SummaryStats>({
    totalInventory: 0,
    assigned: 0,
    available: 0,
    underRepair: 0,
    retired: 0,
    lost: 0,
    warrantyExpiring: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // All inventory items (for counting)
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [loadingAllItems, setLoadingAllItems] = useState(true);

  // Categories with counts
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'items'>('categories');

  // Search and filters
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    subcategory: '',
    status: '',
    location: '',
    vendor: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Tab state
  const [activeTab, setActiveTab] = useState<'inventory' | 'user' | 'project'>('inventory');

  // Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    inventoryId: '',
    userId: '',
    projectId: '',
    remarks: ''
  });
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; projectName: string; projectCode: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');

  // Load stats and categories on mount
  useEffect(() => {
    loadStatsAndItems();
  }, []);

  // Load categories after allItems is available (for subcategory counts)
  useEffect(() => {
    if (allItems.length > 0) {
      loadCategories();
    }
  }, [allItems.length]);

  // Load items when search, filters, sort change
  useEffect(() => {
    if (currentView === 'items') {
      loadItemsForCurrentView();
    }
  }, [search, filters, sortBy, sortOrder, selectedCategory, selectedSubcategory]);

  async function loadStatsAndItems() {
    try {
      setLoadingStats(true);
      setLoadingAllItems(true);
      const res = await api.get('/inventory-master', {
        params: { pageSize: 10000 }
      });
      const items = res.data.items || [];
      setAllItems(items);
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      let warrantyExpiring = 0;
      items.forEach((item: InventoryItem) => {
        if (item.warrantyExpiry) {
          const expiryDate = new Date(item.warrantyExpiry);
          if (expiryDate <= thirtyDaysFromNow && expiryDate >= now) {
            warrantyExpiring++;
          }
        }
      });

      setStats({
        totalInventory: items.length,
        assigned: items.filter((i: InventoryItem) => i.status === 'ASSIGNED').length,
        available: items.filter((i: InventoryItem) => i.status === 'AVAILABLE').length,
        underRepair: items.filter((i: InventoryItem) => i.status === 'UNDER_REPAIR').length,
        retired: items.filter((i: InventoryItem) => i.status === 'RETIRED').length,
        lost: items.filter((i: InventoryItem) => i.status === 'LOST').length,
        warrantyExpiring
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
      setLoadingAllItems(false);
    }
  }

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await api.get('/inventory/categories');
      const cats: Category[] = res.data.categories || [];
      
      // Use inventoryCount from API for categories, calculate from allItems for subcategories
      const catsWithCounts: CategoryWithCount[] = cats.map(cat => ({
        ...cat,
        inventoryCount: (cat as any).inventoryCount || 0,
        subcategories: cat.subcategories.map(sub => ({
          ...sub,
          inventoryCount: allItems.filter(item => item.subcategoryId === sub.id).length
        }))
      }));
      
      setCategories(catsWithCounts);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  function loadItemsForCurrentView() {
    setLoadingItems(true);
    
    try {
      let filteredItems = [...allItems];
      
      // Filter by category if selected
      if (selectedCategory) {
        filteredItems = filteredItems.filter(item => item.categoryId === selectedCategory);
      }
      
      // Filter by subcategory if selected
      if (selectedSubcategory) {
        filteredItems = filteredItems.filter(item => item.subcategoryId === selectedSubcategory);
      }
      
      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.itemNo.toLowerCase().includes(searchLower) ||
          item.itemName.toLowerCase().includes(searchLower) ||
          (item.brand?.toLowerCase().includes(searchLower)) ||
          (item.model?.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (filters.status) {
        filteredItems = filteredItems.filter(item => item.status === filters.status);
      }
      
      // Apply location filter
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.location?.toLowerCase().includes(locationLower)
        );
      }
      
      // Apply vendor filter
      if (filters.vendor) {
        const vendorLower = filters.vendor.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.vendor?.toLowerCase().includes(vendorLower)
        );
      }
      
      // Apply sorting
      filteredItems.sort((a, b) => {
        let aVal: any = a[sortBy as keyof InventoryItem];
        let bVal: any = b[sortBy as keyof InventoryItem];
        
        if (sortBy === 'warrantyExpiry' || sortBy === 'purchaseDate' || sortBy === 'createdAt') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      setItems(filteredItems);
    } finally {
      setLoadingItems(false);
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
  }

  function handleCategoryClick(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setCurrentView('subcategories');
    setSearch('');
    setFilters({ category: '', subcategory: '', status: '', location: '', vendor: '' });
  }

  function handleSubcategoryClick(subcategoryId: string) {
    setSelectedSubcategory(subcategoryId);
    setCurrentView('items');
    setSearch('');
    setFilters({ category: '', subcategory: '', status: '', location: '', vendor: '' });
  }

  function handleBreadcrumb() {
    if (currentView === 'items') {
      setCurrentView('subcategories');
      setSelectedSubcategory(null);
      setItems([]);
    } else if (currentView === 'subcategories') {
      setCurrentView('categories');
      setSelectedCategory(null);
    }
    setSearch('');
    setFilters({ category: '', subcategory: '', status: '', location: '', vendor: '' });
  }

  function handleRefresh() {
    loadStatsAndItems();
    loadCategories();
    if (currentView === 'items') {
      loadItemsForCurrentView();
    }
  }

  // Assignment Modal Functions
  async function openAssignmentModal() {
    setShowAssignmentModal(true);
    setAssignmentError('');
    setAssignmentSuccess('');
    setAssignmentForm({ inventoryId: '', userId: '', projectId: '', remarks: '' });
    
    // Load available inventory items
    setLoadingInventory(true);
    try {
      const res = await api.get('/inventory-master', { 
        params: { status: 'AVAILABLE' } 
      });
      setAvailableInventory(res.data.items || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setAssignmentError('Failed to load available inventory items');
    } finally {
      setLoadingInventory(false);
    }
    
    // Load users from /api/users-teams endpoint
    setLoadingUsers(true);
    try {
      const res = await api.get('/users-teams');
      // Extract users from the items array returned by generic module
      const userList = res.data.items || res.data || [];
      setUsers(userList.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email
      })));
    } catch (err) {
      console.error('Failed to load users:', err);
      setAssignmentError('Failed to load users list');
    } finally {
      setLoadingUsers(false);
    }
    
    // Load projects from /api/inventory-assignments/projects endpoint
    setLoadingProjects(true);
    try {
      const res = await api.get('/inventory-assignments/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setAssignmentError('Failed to load projects list');
    } finally {
      setLoadingProjects(false);
    }
  }

  function closeAssignmentModal() {
    setShowAssignmentModal(false);
    setAssignmentError('');
    setAssignmentSuccess('');
    setAssignmentForm({ inventoryId: '', userId: '', projectId: '', remarks: '' });
  }

  async function handleAssignmentSubmit() {
    if (!assignmentForm.inventoryId) {
      setAssignmentError('Please select an inventory item');
      return;
    }
    if (!assignmentForm.userId) {
      setAssignmentError('Please select a user');
      return;
    }
    if (!assignmentForm.projectId) {
      setAssignmentError('Please select a project');
      return;
    }
    
    setSubmitting(true);
    setAssignmentError('');
    
    try {
      await api.post('/inventory-assignments', {
        inventoryId: assignmentForm.inventoryId,
        userId: assignmentForm.userId,
        projectId: assignmentForm.projectId,
        remarks: assignmentForm.remarks
      });
      
      setAssignmentSuccess('Inventory assigned successfully!');
      setTimeout(() => {
        closeAssignmentModal();
        handleRefresh();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to assign inventory:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to assign inventory');
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    if (items.length === 0) return;
    
    const headers = ['Inventory ID', 'Item Name', 'Brand', 'Model', 'Current Qty', 'Status', 'Warranty Expiry', 'Location', 'Vendor'];
    const rows = items.map((item: InventoryItem) => [
      item.itemNo,
      item.itemName,
      item.brand || '',
      item.model || '',
      item.currentQty,
      item.status,
      item.warrantyExpiry || '',
      item.location || '',
      item.vendor || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-management-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(field: string, order: 'asc' | 'desc') {
    setSortBy(field);
    setSortOrder(order);
  }

  function handleFilterApply() {
    loadItemsForCurrentView();
    setShowFilters(false);
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get current subcategories for selected category
  const currentSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const category = categories.find(c => c.id === selectedCategory);
    return category?.subcategories || [];
  }, [selectedCategory, categories]);

  // Get current category name
  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category?.name || '';
  }, [selectedCategory, categories]);

  // Get current subcategory name
  const currentSubcategoryName = useMemo(() => {
    if (!selectedSubcategory) return '';
    for (const cat of categories) {
      const sub = cat.subcategories.find(s => s.id === selectedSubcategory);
      if (sub) return sub.name;
    }
    return '';
  }, [selectedSubcategory, categories]);

  return (
    <div className="asset-management-page">
      {/* Page Header */}
      <div className="asset-header">
        <div className="asset-header-left">
          <div className="asset-header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1>Asset Management</h1>
            <p className="asset-subtitle">Manage inventory allocation across users and projects.</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button className="btn-primary-asset" onClick={openAssignmentModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Assign Inventory
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="asset-summary-cards">
        <div className="asset-summary-card">
          <div className="asset-summary-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Total Inventory</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.totalInventory}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon assigned">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Assigned</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.assigned}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon available">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Available</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.available}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon repair">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Under Repair</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.underRepair}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon retired">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Retired</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.retired}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon lost">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Lost</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.lost}</span>
          </div>
        </div>

        <div className="asset-summary-card">
          <div className="asset-summary-icon warranty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="asset-summary-content">
            <span className="asset-summary-label">Warranty Expiring</span>
            <span className="asset-summary-value">{loadingStats ? '-' : stats.warrantyExpiring}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="asset-tabs">
        <button 
          className={`asset-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          By Inventory
        </button>
        <button 
          className={`asset-tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          By User
        </button>
        <button 
          className={`asset-tab ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          By Project
        </button>
      </div>

      {/* By Inventory Tab Content */}
      {activeTab === 'inventory' && (
        <div className="asset-content">
          {/* Breadcrumb */}
          {currentView !== 'categories' && (
            <div className="asset-breadcrumb">
              <button className="breadcrumb-item" onClick={handleBreadcrumb}>
                Categories
              </button>
              {currentView === 'subcategories' && selectedCategory && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current">{currentCategoryName}</span>
                </>
              )}
              {currentView === 'items' && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <button className="breadcrumb-item" onClick={() => { setCurrentView('subcategories'); setSelectedSubcategory(null); }}>
                    {currentCategoryName}
                  </button>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current">{currentSubcategoryName}</span>
                </>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="asset-toolbar">
            <div className="asset-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder={currentView === 'items' ? 'Search by ID, Name, Brand, Model...' : 'Search...'}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="asset-toolbar-actions">
              <button className="asset-toolbar-btn" onClick={() => setShowFilters(!showFilters)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Filter
                {(filters.status || filters.location || filters.vendor) && <span className="filter-indicator"></span>}
              </button>

              <div className="asset-sort-dropdown">
                <button className="asset-toolbar-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Sort
                </button>
                <div className="asset-sort-menu">
                  <button onClick={() => handleSort('createdAt', 'desc')}>
                    Newest {sortBy === 'createdAt' && sortOrder === 'desc' ? '✓' : ''}
                  </button>
                  <button onClick={() => handleSort('createdAt', 'asc')}>
                    Oldest {sortBy === 'createdAt' && sortOrder === 'asc' ? '✓' : ''}
                  </button>
                  <button onClick={() => handleSort('warrantyExpiry', 'asc')}>
                    Warranty {sortBy === 'warrantyExpiry' ? '✓' : ''}
                  </button>
                  <button onClick={() => handleSort('purchaseDate', 'desc')}>
                    Purchase Date {sortBy === 'purchaseDate' ? '✓' : ''}
                  </button>
                  <button onClick={() => handleSort('itemName', 'asc')}>
                    Name (A-Z) {sortBy === 'itemName' && sortOrder === 'asc' ? '✓' : ''}
                  </button>
                </div>
              </div>

              <button className="asset-toolbar-btn" onClick={handleRefresh}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </button>

              <button className="asset-toolbar-btn" onClick={handleExport} disabled={items.length === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="asset-filters-panel">
              <div className="asset-filter-group">
                <label>Status</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNDER_REPAIR">Under Repair</option>
                  <option value="RETIRED">Retired</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
              <div className="asset-filter-group">
                <label>Location</label>
                <input 
                  type="text" 
                  placeholder="Filter by location"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>
              <div className="asset-filter-group">
                <label>Vendor</label>
                <input 
                  type="text" 
                  placeholder="Filter by vendor"
                  value={filters.vendor}
                  onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                />
              </div>
              <button className="asset-filter-apply" onClick={handleFilterApply}>
                Apply Filters
              </button>
            </div>
          )}

          {/* Categories View */}
          {currentView === 'categories' && (
            <div className="asset-categories-grid">
              {(loading || loadingAllItems) ? (
                <div className="asset-loading">
                  <div className="spinner"></div>
                  <span>Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="asset-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>No categories found</p>
                </div>
              ) : (
                categories.map(category => (
                  <div 
                    key={category.id} 
                    className="asset-category-card"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="asset-category-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="asset-category-info">
                      <h3>{category.name}</h3>
                      <span>{category.inventoryCount} inventory</span>
                    </div>
                    <svg className="asset-category-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subcategories View */}
          {currentView === 'subcategories' && (
            <div className="asset-subcategories-grid">
              {loading ? (
                <div className="asset-loading">
                  <div className="spinner"></div>
                  <span>Loading subcategories...</span>
                </div>
              ) : currentSubcategories.length === 0 ? (
                <div className="asset-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>No subcategories found</p>
                </div>
              ) : (
                currentSubcategories.map(sub => (
                  <div 
                    key={sub.id} 
                    className="asset-subcategory-card"
                    onClick={() => handleSubcategoryClick(sub.id)}
                  >
                    <div className="asset-subcategory-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9H15M9 13H15M9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="asset-subcategory-info">
                      <h3>{sub.name}</h3>
                      <span>{sub.inventoryCount} inventory</span>
                    </div>
                    <svg className="asset-subcategory-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Items Table View */}
          {currentView === 'items' && (
            <div className="asset-items-section">
              {loadingItems ? (
                <div className="asset-loading">
                  <div className="spinner"></div>
                  <span>Loading items...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="asset-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>{search || filters.status || filters.location || filters.vendor ? 'No matching items found' : 'No items in this subcategory'}</p>
                </div>
              ) : (
                <div className="asset-table-wrapper">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>Inventory ID</th>
                        <th>Item Name</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Current Qty</th>
                        <th>Status</th>
                        <th>Warranty</th>
                        <th>Location</th>
                        <th>Assigned User</th>
                        <th>Project</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <span className="asset-item-id">{item.itemNo}</span>
                          </td>
                          <td>{item.itemName}</td>
                          <td>{item.brand || '-'}</td>
                          <td>{item.model || '-'}</td>
                          <td>{item.currentQty}</td>
                          <td>
                            <span className={`asset-status-badge status-${item.status.toLowerCase().replace('_', '-')}`}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>{formatDate(item.warrantyExpiry)}</td>
                          <td>{item.location || '-'}</td>
                          <td>{item.assignedTo?.name || '-'}</td>
                          <td>{item.projectName || '-'}</td>
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
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* By User Tab */}
      {activeTab === 'user' && (
        <UserView />
      )}

      {/* By Project Tab */}
      {activeTab === 'project' && (
        <ProjectView />
      )}

      {/* Assign Inventory Modal */}
      <ModalLayout
        isOpen={showAssignmentModal}
        onClose={closeAssignmentModal}
        title="Assign Inventory"
        subtitle="Assign an available inventory item to a user and project"
        icon="📦"
        size="lg"
      >
        <div className="space-y-5">
          {/* Error Message */}
          {assignmentError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {assignmentError}
            </div>
          )}
          
          {/* Success Message */}
          {assignmentSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {assignmentSuccess}
            </div>
          )}

          {/* Inventory Item Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Inventory Item <span className="text-red-500">*</span>
            </label>
            {loadingInventory ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
                <span className="ml-2 text-sm text-slate-500">Loading available items...</span>
              </div>
            ) : availableInventory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
                No available inventory items found. All items may already be assigned or in non-assignable status.
              </div>
            ) : (
              <select
                value={assignmentForm.inventoryId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, inventoryId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
              >
                <option value="">Select an inventory item...</option>
                {availableInventory.map((item: InventoryItem) => (
                  <option key={item.id} value={item.id}>
                    {item.itemNo} - {item.itemName} {item.brand ? `(${item.brand})` : ''} - Qty: {item.currentQty}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign To User <span className="text-red-500">*</span>
            </label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
                <span className="ml-2 text-sm text-slate-500">Loading users...</span>
              </div>
            ) : (
              <select
                value={assignmentForm.userId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
              >
                <option value="">Select a user...</option>
                {users.map((user: { id: string; name: string; email: string }) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign To Project <span className="text-red-500">*</span>
            </label>
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
                <span className="ml-2 text-sm text-slate-500">Loading projects...</span>
              </div>
            ) : (
              <select
                value={assignmentForm.projectId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, projectId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
              >
                <option value="">Select a project...</option>
                {projects.map((project: { id: string; projectName: string; projectCode: string }) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName} ({project.projectCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={assignmentForm.remarks}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, remarks: e.target.value })}
              placeholder="Add any remarks or notes for this assignment..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeAssignmentModal}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignmentSubmit}
              disabled={submitting || loadingInventory || loadingUsers || loadingProjects}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Assigning...
                </span>
              ) : 'Assign Inventory'}
            </button>
          </div>
        </div>
      </ModalLayout>
    </div>
  );
}

// User View Component
function UserView() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'assets'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      // Load users with their assignment counts from users-teams endpoint
      // Response format: { items: [...] }
      const res = await api.get('/users-teams');
      const userList = res.data.items || [];
      
      // Get assignment counts for each user
      const usersWithCounts = await Promise.all(
        userList.map(async (user: any) => {
          try {
            const assignRes = await api.get('/inventory-assignments', { 
              params: { userId: user.id, status: 'ACTIVE' } 
            });
            const assignments = assignRes.data.assignments || [];
            const projectIds = new Set(assignments.map((a: any) => a.project?.id).filter(Boolean));
            // Extract role from the roles array
            const role = user.roles?.[0]?.role?.name || 'Employee';
            return {
              ...user,
              role,
              assignedAssets: assignments.length,
              projectCount: projectIds.size
            };
          } catch {
            return { ...user, role: 'Employee', assignedAssets: 0, projectCount: 0 };
          }
        })
      );
      
      setUsers(usersWithCounts);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      (user.department?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'department') {
        comparison = (a.department || '').localeCompare(b.department || '');
      } else if (sortBy === 'assets') {
        comparison = a.assignedAssets - b.assignedAssets;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  function toggleSort(field: 'name' | 'department' | 'assets') {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div className="asset-content">
      {/* Toolbar */}
      <div className="asset-toolbar">
        <div className="asset-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="asset-toolbar-actions">
          <div className="asset-sort-dropdown">
            <button className="asset-toolbar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <div className="asset-sort-menu">
              <button onClick={() => toggleSort('name')}>
                Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => toggleSort('department')}>
                Department {sortBy === 'department' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => toggleSort('assets')}>
                Assigned Assets {sortBy === 'assets' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>
          <button className="asset-toolbar-btn" onClick={loadUsers}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="user-assets-grid-loading">
          <div className="spinner"></div>
          <span>Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="user-assets-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3>No Users Found</h3>
          <p>No users match your search criteria.</p>
        </div>
      ) : (
        <div className="user-cards-grid">
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              className="user-card"
              onClick={() => navigate(`/access-management/user/${user.id}`)}
            >
              <div className="user-card-header">
                <div className="user-card-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-card-info">
                  <h3 className="user-card-name">{user.name}</h3>
                  <span className="user-card-department">{user.department || 'No Department'}</span>
                </div>
              </div>
              <div className="user-card-meta">
                <span className="user-card-role">{user.role || 'Employee'}</span>
              </div>
              <div className="user-card-stats">
                <div className="user-card-stat">
                  <span className="stat-value">{user.assignedAssets}</span>
                  <span className="stat-label">Assets</span>
                </div>
                <div className="user-card-stat">
                  <span className="stat-value">{user.projectCount}</span>
                  <span className="stat-label">Projects</span>
                </div>
              </div>
              <div className="user-card-footer">
                <span className="user-card-email">{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Project View Component
function ProjectView() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'manager' | 'assets'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      // Response format: { items: [...] }
      const res = await api.get('/projects-environments');
      const projectList = res.data.items || [];
      
      // Get assignment counts for each project
      const projectsWithCounts = await Promise.all(
        projectList.map(async (project: any) => {
          try {
            const assignRes = await api.get('/inventory-assignments', { 
              params: { projectId: project.id, status: 'ACTIVE' } 
            });
            const assignments = assignRes.data.assignments || [];
            const userIds = new Set(assignments.map((a: any) => a.user?.id).filter(Boolean));
            return {
              ...project,
              assignedAssets: assignments.length,
              teamSize: userIds.size
            };
          } catch {
            return { ...project, assignedAssets: 0, teamSize: 0 };
          }
        })
      );
      
      setProjects(projectsWithCounts);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects
    .filter(project => 
      project.projectName.toLowerCase().includes(search.toLowerCase()) ||
      project.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      (project.manager?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.projectName.localeCompare(b.projectName);
      } else if (sortBy === 'manager') {
        comparison = (a.manager?.name || '').localeCompare(b.manager?.name || '');
      } else if (sortBy === 'assets') {
        comparison = a.assignedAssets - b.assignedAssets;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  function toggleSort(field: 'name' | 'manager' | 'assets') {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div className="asset-content">
      {/* Toolbar */}
      <div className="asset-toolbar">
        <div className="asset-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="asset-toolbar-actions">
          <div className="asset-sort-dropdown">
            <button className="asset-toolbar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <div className="asset-sort-menu">
              <button onClick={() => toggleSort('name')}>
                Project Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => toggleSort('manager')}>
                Manager {sortBy === 'manager' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => toggleSort('assets')}>
                Assigned Assets {sortBy === 'assets' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>
          <button className="asset-toolbar-btn" onClick={loadProjects}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="user-assets-grid-loading">
          <div className="spinner"></div>
          <span>Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="user-assets-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>No Projects Found</h3>
          <p>No projects match your search criteria.</p>
        </div>
      ) : (
        <div className="user-cards-grid">
          {filteredProjects.map(project => (
            <div 
              key={project.id} 
              className="user-card"
              onClick={() => navigate(`/access-management/project/${project.id}`)}
            >
              <div className="user-card-header">
                <div className="user-card-avatar project">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="user-card-info">
                  <h3 className="user-card-name">{project.projectName}</h3>
                  <span className="user-card-department">{project.projectCode}</span>
                </div>
              </div>
              <div className="user-card-meta">
                <span className={`status-badge status-${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
              </div>
              <div className="user-card-stats">
                <div className="user-card-stat">
                  <span className="stat-value">{project.assignedAssets}</span>
                  <span className="stat-label">Assets</span>
                </div>
                <div className="user-card-stat">
                  <span className="stat-value">{project.teamSize}</span>
                  <span className="stat-label">Team</span>
                </div>
              </div>
              <div className="user-card-footer">
                {project.manager && (
                  <span className="user-card-email">Manager: {project.manager.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
