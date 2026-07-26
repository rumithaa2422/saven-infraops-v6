import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { ModalLayout } from '../components/inventory/Modal';
import { SummaryCards } from '../components/common/SummaryCards';
import { Eye, Edit2, Trash2, Package, Users, ClipboardCheck, Wrench, ArrowRightLeft, AlertTriangle, LayoutGrid, User, FolderOpen, Search, SlidersHorizontal, Download, RefreshCw, X, ArrowUpDown } from 'lucide-react';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  TabNavigation
} from '../components/serviceRequests';

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

  // Summary cards data for Asset Management
  const summaryCards = useMemo(() => [
    {
      icon: Package,
      iconBgColor: 'bg-gradient-to-br from-slate-100 to-slate-50',
      iconColor: 'text-slate-600',
      value: loadingStats ? '-' : stats.totalInventory,
      label: 'Total Inventory'
    },
    {
      icon: Users,
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      value: loadingStats ? '-' : stats.assigned,
      label: 'Assigned'
    },
    {
      icon: ClipboardCheck,
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconColor: 'text-emerald-600',
      value: loadingStats ? '-' : stats.available,
      label: 'Available'
    },
    {
      icon: Wrench,
      iconBgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-600',
      value: loadingStats ? '-' : stats.underRepair,
      label: 'Under Repair'
    },
    {
      icon: ArrowRightLeft,
      iconBgColor: 'bg-gradient-to-br from-orange-100 to-orange-50',
      iconColor: 'text-orange-600',
      value: loadingStats ? '-' : stats.retired,
      label: 'Retired'
    },
    {
      icon: AlertTriangle,
      iconBgColor: 'bg-gradient-to-br from-red-100 to-red-50',
      iconColor: 'text-red-600',
      value: loadingStats ? '-' : stats.lost,
      label: 'Lost'
    },
    {
      icon: Package,
      iconBgColor: 'bg-gradient-to-br from-purple-100 to-purple-50',
      iconColor: 'text-purple-600',
      value: loadingStats ? '-' : stats.warrantyExpiring,
      label: 'Warranty Expiring'
    }
  ], [stats, loadingStats]);

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
  
  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

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

      // Calculate stats using same logic as assignment modal
      // Items without active assignment that have assignable status
      const availableItems = items.filter((i: InventoryItem) => {
        const hasNoActiveAssignment = !i.assignedTo;
        const isAssignableStatus = !['UNDER_REPAIR', 'RETIRED', 'LOST', 'DAMAGED'].includes(i.status);
        return hasNoActiveAssignment && isAssignableStatus;
      });

      setStats({
        totalInventory: items.length,
        assigned: items.filter((i: InventoryItem) => i.assignedTo || i.status === 'ASSIGNED').length,
        available: availableItems.length,
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
    
    // Load all inventory items (no status filter)
    // Backend returns items with their assignment status via 'assignedTo' field
    setLoadingInventory(true);
    try {
      const res = await api.get('/inventory-master');
      const allItems = res.data.items || [];
      
      // Filter items that are available for assignment:
      // - No active assignment (assignedTo is null)
      // - Status is not in NON_ASSIGNABLE_STATUSES (UNDER_REPAIR, RETIRED, LOST, DAMAGED)
      const availableItems = allItems.filter((item: InventoryItem) => {
        const hasNoActiveAssignment = !item.assignedTo;
        const isAssignableStatus = !['UNDER_REPAIR', 'RETIRED', 'LOST', 'DAMAGED', 'ASSIGNED'].includes(item.status);
        return hasNoActiveAssignment && isAssignableStatus;
      });
      
      setAvailableInventory(availableItems);
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
    setSortConfig({ key: field, direction: order });
  }

  // Wrapper for SortHeader component
  function handleSortByKey(key: string) {
    const currentDirection = sortConfig.key === key ? sortConfig.direction : 'asc';
    handleSort(key, currentDirection === 'asc' ? 'desc' : 'asc');
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
    <div className="workspace">
      <div className="page-stack asset-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">Asset Management</h1>
              <p className="page-header-subtitle">Manage inventory allocation across users and projects.</p>
            </div>
          </div>
          <div className="page-header-actions">
            {isSuperAdmin && (
              <button className="btn-primary" onClick={openAssignmentModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Assign Inventory
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

      {/* Tabs */}
      <TabNavigation
        tabs={[
          { id: 'inventory', label: 'By Inventory', icon: LayoutGrid },
          { id: 'user', label: 'By User', icon: User },
          { id: 'project', label: 'By Project', icon: FolderOpen }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'inventory' | 'user' | 'project')}
        className="mb-5"
      />

      {/* By Inventory Tab Content */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
          {/* Toolbar - Modern Design */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row gap-3 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={currentView === 'items' ? 'Search by ID, Name, Brand, Model...' : 'Search...'}
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
                  />
                  {search && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                    showFilters || filters.status || filters.location || filters.vendor
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter
                  {(filters.status || filters.location || filters.vendor) && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/30 text-white text-xs rounded-md">
                      {[filters.status, filters.location, filters.vendor].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative group">
                  <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button onClick={() => handleSort('createdAt', 'desc')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                      Newest
                      {sortBy === 'createdAt' && sortOrder === 'desc' && <span className="text-indigo-600">✓</span>}
                    </button>
                    <button onClick={() => handleSort('createdAt', 'asc')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                      Oldest
                      {sortBy === 'createdAt' && sortOrder === 'asc' && <span className="text-indigo-600">✓</span>}
                    </button>
                    <button onClick={() => handleSort('warrantyExpiry', 'asc')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'warrantyExpiry' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                      Warranty
                      {sortBy === 'warrantyExpiry' && <span className="text-indigo-600">✓</span>}
                    </button>
                    <button onClick={() => handleSort('purchaseDate', 'desc')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'purchaseDate' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                      Purchase Date
                      {sortBy === 'purchaseDate' && <span className="text-indigo-600">✓</span>}
                    </button>
                    <button onClick={() => handleSort('itemName', 'asc')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'itemName' && sortOrder === 'asc' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                      Name (A-Z)
                      {sortBy === 'itemName' && sortOrder === 'asc' && <span className="text-indigo-600">✓</span>}
                    </button>
                  </div>
                </div>

                {/* Refresh */}
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                {/* Export */}
                <button
                  onClick={handleExport}
                  disabled={items.length === 0}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Status:</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    >
                      <option value="">All Status</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="UNDER_REPAIR">Under Repair</option>
                      <option value="RETIRED">Retired</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Location:</label>
                    <input
                      type="text"
                      placeholder="Filter by location"
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>

                  {/* Vendor Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Vendor:</label>
                    <input
                      type="text"
                      placeholder="Filter by vendor"
                      value={filters.vendor}
                      onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>

                  {/* Clear Filters */}
                  {(filters.status || filters.location || filters.vendor) && (
                    <button
                      onClick={() => setFilters({...filters, status: '', location: '', vendor: ''})}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

            {/* Content Area */}
            <div className="p-4">
              {/* Breadcrumb */}
              {currentView !== 'categories' && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium" onClick={handleBreadcrumb}>
                    Categories
                  </button>
                  {currentView === 'subcategories' && selectedCategory && (
                    <>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-700 font-medium">{currentCategoryName}</span>
                    </>
                  )}
                  {currentView === 'items' && (
                    <>
                      <span className="text-slate-400">/</span>
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => { setCurrentView('subcategories'); setSelectedSubcategory(null); }}>
                        {currentCategoryName}
                      </button>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-700 font-medium">{currentSubcategoryName}</span>
                    </>
                  )}
                </div>
              )}

              {/* Categories View */}
              {currentView === 'categories' && (
                <div>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
                      <p className="text-sm text-slate-500">Select a category to view subcategories</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(loading || loadingAllItems) ? (
                      <div className="col-span-full flex items-center justify-center py-12">
                        <div className="spinner"></div>
                        <span className="ml-3 text-slate-500">Loading categories...</span>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="col-span-full asset-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No categories found</p>
                      </div>
                    ) : (
                      categories.map((category, index) => (
                        <div 
                          key={category.id} 
                          className="group relative bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">{category.inventoryCount} inventory items</p>
                            </div>
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Subcategories View */}
              {currentView === 'subcategories' && (
                <div>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Subcategories</h2>
                      <p className="text-sm text-slate-500">Select a subcategory to view inventory items</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-full flex items-center justify-center py-12">
                        <div className="spinner"></div>
                        <span className="ml-3 text-slate-500">Loading subcategories...</span>
                      </div>
                    ) : currentSubcategories.length === 0 ? (
                      <div className="col-span-full asset-empty">
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
                          className="group relative bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-200"
                          onClick={() => handleSubcategoryClick(sub.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M9 9H15M9 13H15M9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">{sub.name}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">{sub.inventoryCount} inventory items</p>
                            </div>
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Items Table View */}
              {currentView === 'items' && (
                <div>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Inventory Items</h2>
                      <p className="text-sm text-slate-500">{items.length} items found in this subcategory</p>
                    </div>
                  </div>
                  
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="spinner"></div>
                      <span className="ml-3 text-slate-500">Loading items...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="asset-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>{search || filters.status || filters.location || filters.vendor ? 'No matching items found' : 'No items in this subcategory'}</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <SortHeader label="Inventory ID" sortKey="itemNo" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Item Name" sortKey="itemName" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Brand" sortKey="brand" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Model" sortKey="model" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Qty" sortKey="currentQty" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Warranty" sortKey="warrantyExpiry" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Location" sortKey="location" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Assigned User" sortKey="assignedTo" currentSort={sortConfig} onSort={handleSortByKey} />
                              <SortHeader label="Project" sortKey="projectName" currentSort={sortConfig} onSort={handleSortByKey} />
                              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3.5">
                                  <span className="font-mono text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                    {item.itemNo}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="font-medium text-slate-900">{item.itemName}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{item.brand || '-'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{item.model || '-'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-700">{item.currentQty}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                    item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                    item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                    item.status === 'UNDER_REPAIR' ? 'bg-amber-100 text-amber-700' :
                                    item.status === 'RETIRED' ? 'bg-slate-100 text-slate-600' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {item.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{formatDate(item.warrantyExpiry)}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{item.location || '-'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{item.assignedTo?.name || '-'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-sm text-slate-600">{item.projectName || '-'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                      onClick={() => navigate(`/access-management/${item.id}`)}
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
      {/* Toolbar - Modern Design */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => toggleSort('name')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'name' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Name
                  {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button onClick={() => toggleSort('department')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'department' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Department
                  {sortBy === 'department' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button onClick={() => toggleSort('assets')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'assets' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Assigned Assets
                  {sortBy === 'assets' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="p-4">
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
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
      {/* Toolbar - Modern Design */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => toggleSort('name')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'name' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Project Name
                  {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button onClick={() => toggleSort('manager')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'manager' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Manager
                  {sortBy === 'manager' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button onClick={() => toggleSort('assets')} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === 'assets' ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                  Assigned Assets
                  {sortBy === 'assets' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={loadProjects}
              className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-4">
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
    </div>
  );
}
