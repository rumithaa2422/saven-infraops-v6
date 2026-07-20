import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PermissionGate } from '../components/permissions';
import * as XLSX from 'xlsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  X,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  PackageX,
  Clock,
  FileCheck,
  PlusCircle,
  XCircle,
  FileText,
  Shield,
  MapPin,
  ShoppingCart,
  PackagePlus
} from 'lucide-react';
import {
  PageHeader,
  StockStatusBadge,
  CategoryBadge,
  SectionCard,
  InfoCard,
  InfoGrid,
  InventorySummaryCard,
  EmptyStateCard,
  LoadingCard,
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  Pagination,
  SearchInput,
  FilterChip,
  Button,
  ModalLayout,
  ConfirmationDialog,
  ActionButtons
} from '../components/inventory';

/**
 * PART 4: Inventory Category Permission Enforcement
 * 
 * This module now enforces granular permissions:
 * - inventory:view - View inventory categories
 * - inventory:create_category - Create categories
 * - inventory:update_category - Update categories
 * - inventory:delete_category - Delete categories
 * - inventory:export - Export inventory data
 */

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
  invoiceNo?: string;
  purchaseCost?: number;
  gst?: number;
  warrantyMonths?: number;
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
  assignment?: {
    id: string;
    status: string;
    user?: { id: string; name: string; email: string };
    project?: { id: string; projectName: string; projectCode: string };
  };
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
  assignmentStatus: string;
  assignedUser: string;
  project: string;
};

export function InventoryCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  // PART 4: Permission checks using granular permissions
  const canView = hasPermission('inventory:view');
  const canCreateCategory = hasPermission('inventory:create_category');
  const canUpdateCategory = hasPermission('inventory:update_category');
  const canDeleteCategory = hasPermission('inventory:delete_category');
  const canExport = hasPermission('inventory:export');

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    subcategory: '',
    vendor: '',
    brand: '',
    location: '',
    warranty: '',
    status: '',
    stock: '',
    purchaseYear: '',
    assignmentStatus: '',
    assignedUser: '',
    project: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'itemName',
    direction: 'asc'
  });

  // Subcategory Management State
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '' });
  const [subcategoryError, setSubcategoryError] = useState('');
  const [subcategorySaving, setSubcategorySaving] = useState(false);
  const [subcategoryDeleting, setSubcategoryDeleting] = useState<string | null>(null);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importValidRows, setImportValidRows] = useState<any[]>([]);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    duplicates?: any[];
    errors?: any[];
    created?: any[];
    error?: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load category and items
  async function loadData() {
    if (!categoryId) return;
    try {
      setLoading(true);

      const catRes = await api.get(`/inventory/categories/${categoryId}`);
      setCategory(catRes.data.category);

      const itemsRes = await api.get('/inventory-master', {
        params: { categoryId }
      });
      const loadedItems = itemsRes.data.items || [];

      const itemsWithAssignments = await Promise.all(
        loadedItems.map(async (item: InventoryItem) => {
          try {
            const assignRes = await api.get(`/inventory-assignments/inventory/${item.id}`);
            return {
              ...item,
              assignment: assignRes.data.assignment || undefined
            };
          } catch {
            return { ...item, assignment: undefined };
          }
        })
      );

      setItems(itemsWithAssignments);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load category details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!canView) {
      setError('Access Restricted. You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    loadData();
  }, [categoryId, !canView]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedSubcategory) {
      result = result.filter(item => item.subcategoryId === selectedSubcategory);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemNo.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.vendor?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        item.assignment?.user?.name?.toLowerCase().includes(searchLower) ||
        item.assignment?.project?.projectName?.toLowerCase().includes(searchLower)
      );
    }

    if (!selectedSubcategory && filters.subcategory) {
      result = result.filter(item => item.subcategoryId === filters.subcategory);
    }

    if (filters.vendor) {
      result = result.filter(item =>
        item.vendor?.toLowerCase().includes(filters.vendor.toLowerCase())
      );
    }

    if (filters.brand) {
      result = result.filter(item =>
        item.brand?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    if (filters.location) {
      result = result.filter(item =>
        item.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

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

    if (filters.status) {
      result = result.filter(item => item.status === filters.status);
    }

    if (filters.stock) {
      if (filters.stock === 'low') {
        result = result.filter(item => item.minStock && item.currentQty < item.minStock);
      } else if (filters.stock === 'in') {
        result = result.filter(item => item.currentQty > 0);
      }
    }

    if (filters.purchaseYear) {
      result = result.filter(item => {
        if (!item.purchaseDate) return false;
        const year = new Date(item.purchaseDate).getFullYear().toString();
        return year === filters.purchaseYear;
      });
    }

    if (filters.assignmentStatus) {
      if (filters.assignmentStatus === 'assigned') {
        result = result.filter(item => item.assignment && item.assignment.status === 'ACTIVE');
      } else if (filters.assignmentStatus === 'available') {
        result = result.filter(item => !item.assignment);
      }
    }

    if (filters.assignedUser) {
      const userLower = filters.assignedUser.toLowerCase();
      result = result.filter(item =>
        item.assignment?.user?.name?.toLowerCase().includes(userLower) ||
        item.assignment?.user?.email?.toLowerCase().includes(userLower)
      );
    }

    if (filters.project) {
      const projectLower = filters.project.toLowerCase();
      result = result.filter(item =>
        item.assignment?.project?.projectName?.toLowerCase().includes(projectLower) ||
        item.assignment?.project?.projectCode?.toLowerCase().includes(projectLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = (a as any)[sortConfig.key];
      let bVal: any = (b as any)[sortConfig.key];

      if (sortConfig.key === 'purchaseDate' || sortConfig.key === 'warrantyExpiry') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, selectedSubcategory, search, filters, sortConfig]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, selectedSubcategory]);

  // Calculate summary stats
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

  // Get subcategory counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.subcategoryId] = (counts[item.subcategoryId] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Get unique values for filters
  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    items.forEach(item => {
      if (item.vendor) vendors.add(item.vendor);
    });
    return Array.from(vendors).sort();
  }, [items]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    items.forEach(item => {
      if (item.brand) brands.add(item.brand);
    });
    return Array.from(brands).sort();
  }, [items]);

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

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
      purchaseYear: '',
      assignmentStatus: '',
      assignedUser: '',
      project: ''
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
      purchaseYear: '',
      assignmentStatus: '',
      assignedUser: '',
      project: ''
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

  function handleRowClick(item: InventoryItem) {
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
    const headers = [
      'Category', 'Sub Category', 'Item Name', 'Brand', 'Model', 'Vendor',
      'Invoice Number', 'Purchase Cost', 'GST', 'Purchase Date', 'Warranty',
      'Warranty Expiry', 'Location', 'Minimum Stock', 'Current Quantity', 'Status'
    ];

    const rows = filteredItems.map(item => [
      category?.name || '',
      item.subcategory?.name || '',
      item.itemName,
      item.brand || '',
      item.model || '',
      item.vendor || '',
      item.invoiceNo || '',
      item.purchaseCost?.toString() || '',
      item.gst?.toString() || '',
      item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '',
      item.warrantyMonths ? `${item.warrantyMonths} months` : '',
      item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : '',
      item.location || '',
      item.minStock?.toString() || '',
      item.currentQty.toString(),
      item.status
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

  // Import Functions
  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportProcessing(true);
    setImportResult(null);
    setImportErrors({});
    setImportValidRows([]);
    setShowImportModal(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setImportData(jsonData);
        validateImportData(jsonData);
      } catch {
        alert('Failed to parse Excel file');
        setShowImportModal(false);
      }
      setImportProcessing(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  async function validateImportData(data: any[]) {
    const errors: Record<number, string[]> = {};
    const validRows: any[] = [];
    const existingInvoiceNos = new Set(items.map(i => i.invoiceNo).filter(Boolean));
    const seenInvoiceNos = new Set<string>();
    const seenCombinations = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];
      const rowNum = i + 2;

      if (!row['Item Name'] && !row['ItemName'] && !row['itemName']) {
        rowErrors.push('Item Name is required');
      }

      const categoryName = row['Category'] || row['category'] || '';
      const subcategoryName = row['Sub Category'] || row['SubCategory'] || row['subcategory'] || '';
      const itemName = row['Item Name'] || row['ItemName'] || row['itemName'] || '';
      const brand = row['Brand'] || row['brand'] || '';
      const model = row['Model'] || row['model'] || '';

      const comboKey = `${categoryName.toLowerCase()}|${subcategoryName.toLowerCase()}|${itemName.toLowerCase()}|${brand.toLowerCase()}|${model.toLowerCase()}`;
      if (seenCombinations.has(comboKey)) {
        rowErrors.push(`Duplicate inventory "${itemName}" in same Category/Subcategory`);
      }
      seenCombinations.add(comboKey);

      const invoiceNo = row['Invoice Number'] || row['InvoiceNumber'] || row['invoiceNo'] || '';
      if (invoiceNo && existingInvoiceNos.has(invoiceNo)) {
        rowErrors.push(`Invoice Number "${invoiceNo}" already exists`);
      }
      if (invoiceNo && seenInvoiceNos.has(invoiceNo)) {
        rowErrors.push(`Duplicate Invoice Number "${invoiceNo}" in file`);
      }
      seenInvoiceNos.add(invoiceNo);

      if (rowErrors.length > 0) {
        errors[i] = rowErrors;
      } else {
        const purchaseCost = row['Purchase Cost'] || row['PurchaseCost'] || row['purchaseCost'];
        const gst = row['GST'] || row['gst'];
        const currentQty = row['Current Quantity'] || row['CurrentQty'] || row['currentQty'] || row['Quantity'];
        const minStock = row['Minimum Stock'] || row['MinimumStock'] || row['minStock'];
        const status = row['Status'] || row['status'] || 'ACTIVE';

        validRows.push({
          _rowIndex: rowNum,
          categoryName: categoryName.trim(),
          subcategoryName: subcategoryName.trim(),
          itemName: itemName.trim(),
          brand: brand.trim(),
          model: model.trim(),
          vendor: (row['Vendor'] || row['vendor'] || '').trim(),
          invoiceNo: invoiceNo.trim(),
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
          gst: gst ? parseFloat(gst) : null,
          purchaseDate: row['Purchase Date'] || row['PurchaseDate'] || row['purchaseDate'] || null,
          warrantyMonths: row['Warranty'] || row['warranty'] || null,
          location: (row['Location'] || row['location'] || '').trim(),
          minStock: minStock ? parseInt(minStock) : null,
          currentQty: currentQty ? parseInt(currentQty) : 0,
          status: (status || 'ACTIVE').toUpperCase()
        });
      }
    }

    setImportErrors(errors);
    setImportValidRows(validRows);
  }

  async function handleImportConfirm() {
    if (importValidRows.length === 0) return;

    setImportProcessing(true);

    try {
      const response = await api.post('/inventory-master/bulk-import', {
        items: importValidRows
      });

      const { success, failed, duplicates, errors } = response.data;

      setImportResult({
        success,
        failed,
        duplicates,
        errors,
        created: response.data.created || []
      });

      loadData();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setImportResult({
        success: 0,
        failed: importValidRows.length,
        error: err.response?.data?.message || 'Import failed'
      });
    } finally {
      setImportProcessing(false);
    }
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors({});
    setImportValidRows([]);
    setImportResult(null);
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getWarrantyStatus(expiry?: string): { label: string; class: string; variant: 'success' | 'warning' | 'danger' } {
    if (!expiry) return { label: '-', class: '', variant: 'success' };
    const expiryDate = new Date(expiry);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    if (expiryDate < now) {
      return { label: 'Expired', class: 'text-red-600 bg-red-50 border-red-200', variant: 'danger' };
    } else if (expiryDate <= thirtyDays) {
      return { label: 'Expiring Soon', class: 'text-amber-600 bg-amber-50 border-amber-200', variant: 'warning' };
    }
    return { label: 'Active', class: 'text-emerald-600 bg-emerald-50 border-emerald-200', variant: 'success' };
  }

  function toggleSubcategory(subId: string) {
    if (selectedSubcategory === subId) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subId);
    }
  }

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
        await api.patch(`/inventory/subcategories/${editingSubcategory.id}`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null
        });
      } else {
        await api.post(`/inventory/categories/${categoryId}/subcategories`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null
        });
      }

      await loadData();
      closeSubcategoryForm();
    } catch (err: any) {
      setSubcategoryError(err.response?.data?.message || `Failed to ${editingSubcategory ? 'update' : 'create'} subcategory`);
    } finally {
      setSubcategorySaving(false);
    }
  }

  function confirmDeleteSubcategory(subId: string) {
    const sub = category?.subcategories.find(s => s.id === subId);
    const count = subcategoryCounts[subId] || 0;

    if (count > 0) {
      setSubcategoryError(`Cannot delete. This subcategory contains ${count} inventory item${count > 1 ? 's' : ''}.`);
      return;
    }

    setDeletingSubId(subId);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteSubcategory() {
    if (!deletingSubId) return;

    try {
      await api.delete(`/inventory/subcategories/${deletingSubId}`);
      await loadData();
      setSubcategoryError('');
    } catch (err: any) {
      setSubcategoryError(err.response?.data?.message || 'Failed to delete subcategory');
    } finally {
      setDeletingSubId(null);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'You do not have permission to view this page.'}</p>
          <button
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <PageHeader
        title={category?.name || 'Inventory'}
        subtitle={category?.subcategories.length ? `${category.subcategories.length} subcategories` : undefined}
        icon={Package}
        iconColor="text-brand-600"
        breadcrumbs={[
          { label: 'Inventory', onClick: () => navigate('/inventory') },
          ...(category?.name ? [{ label: category.name }] : [])
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExport}
                disabled={filteredItems.length === 0}
              >
                Export
              </Button>
            )}
            {isSuperAdmin && (
              <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                onClick={handleImportClick}
              >
                Import
              </Button>
            )}
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleCreateInventory}
              >
                Create Item
              </Button>
            )}
          </div>
        }
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <InventorySummaryCard
            title="Total Items"
            count={stats.total}
            icon={Package}
            color="blue"
          />
          <InventorySummaryCard
            title="Available"
            count={stats.available}
            icon={PackageCheck}
            color="emerald"
          />
          <InventorySummaryCard
            title="Low Stock"
            count={stats.lowStock}
            icon={PackageX}
            color="amber"
          />
          <InventorySummaryCard
            title="Warranty Due"
            count={stats.warrantyExpiring}
            icon={Clock}
            color="purple"
          />
          <InventorySummaryCard
            title="Expired"
            count={stats.expired}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Subcategories Section */}
        <SectionCard
          title="Subcategories"
          icon={FileCheck}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          action={
            isSuperAdmin && (
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => openSubcategoryForm()}
              >
                Add Subcategory
              </Button>
            )
          }
        >
          {subcategoryError && !showSubcategoryForm && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {subcategoryError}
            </div>
          )}

          {showSubcategoryForm ? (
            <form onSubmit={handleSaveSubcategory} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                {editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                    placeholder="Enter subcategory name"
                    disabled={subcategorySaving}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    placeholder="Enter description"
                    disabled={subcategorySaving}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                  />
                </div>
              </div>
              {subcategoryError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {subcategoryError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={closeSubcategoryForm}
                  disabled={subcategorySaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={subcategorySaving}
                >
                  {editingSubcategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {category?.subcategories.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => toggleSubcategory(sub.id)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer
                    ${selectedSubcategory === sub.id
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-brand-50/50'
                    }
                  `}
                >
                  <span className="text-sm font-medium">{sub.name}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${selectedSubcategory === sub.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-600'
                    }
                  `}>
                    {subcategoryCounts[sub.id] || 0}
                  </span>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openSubcategoryForm(sub)}
                        className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteSubcategory(sub.id)}
                        disabled={subcategoryDeleting === sub.id}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(!category?.subcategories || category.subcategories.length === 0) && (
                <p className="text-sm text-slate-500 py-4">No subcategories yet.</p>
              )}
            </div>
          )}
        </SectionCard>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 w-full">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search items by name, ID, brand, vendor, location..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="sm"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              {activeFilterChips.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterChips.length > 0 && (
            <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
              {activeFilterChips.map(chip => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={() => removeFilterChip(chip.key)}
                  active
                />
              ))}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {!selectedSubcategory && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Subcategory</label>
                    <select
                      value={filters.subcategory}
                      onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">All</option>
                      {category?.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Stock</label>
                  <select
                    value={filters.stock}
                    onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All</option>
                    <option value="low">Low Stock</option>
                    <option value="in">In Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Warranty</label>
                  <select
                    value={filters.warranty}
                    onChange={(e) => setFilters({ ...filters, warranty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="none">No Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Vendor</label>
                  <select
                    value={filters.vendor}
                    onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All Vendors</option>
                    {uniqueVendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All Brands</option>
                    {uniqueBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Purchase Year</label>
                  <select
                    value={filters.purchaseYear}
                    onChange={(e) => setFilters({ ...filters, purchaseYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All Years</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Assignment</label>
                  <select
                    value={filters.assignmentStatus}
                    onChange={(e) => setFilters({ ...filters, assignmentStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">All</option>
                    <option value="assigned">Assigned</option>
                    <option value="available">Available</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <TableContainer
          loading={loading}
          empty={filteredItems.length === 0}
          emptyTitle="No inventory items found"
          emptyDescription={
            search || activeFilterChips.length > 0
              ? "Try adjusting your search or filters"
              : "Create your first inventory item in this category"
          }
          emptyIcon={Package}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <SortHeader label="Item" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Brand" sortKey="brand" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Qty" sortKey="currentQty" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Location" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <SortHeader label="Warranty" sortKey="warrantyExpiry" currentSort={sortConfig} onSort={handleSort} />
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(item => {
                  const warranty = getWarrantyStatus(item.warrantyExpiry);
                  const isLowStock = item.minStock && item.currentQty < item.minStock;

                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={isLowStock ? 'bg-amber-50/30' : ''}
                    >
                      <TableCell>
                        <div>
                          <span className="text-xs font-mono font-semibold text-brand-600">{item.itemNo}</span>
                          <p className="text-sm font-medium text-slate-900 mt-0.5">{item.itemName}</p>
                          {item.brand && (
                            <p className="text-xs text-slate-500">{item.brand}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">{item.brand || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            item.currentQty === 0 
                              ? 'text-red-600' 
                              : isLowStock 
                                ? 'text-amber-600' 
                                : 'text-slate-900'
                          }`}>
                            {item.currentQty}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">{item.location || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge status={item.status === 'ACTIVE' ? (isLowStock ? 'LOW_STOCK' : item.currentQty === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK') : 'DISCONTINUED'} />
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${warranty.class}`}>
                          {warranty.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.assignment?.user ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.assignment.user.name}</p>
                            {item.assignment.project && (
                              <p className="text-xs text-slate-500">{item.assignment.project.projectName}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredItems.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </TableContainer>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingSubId(null);
          setDeleteConfirmText('');
        }}
        onConfirm={handleDeleteSubcategory}
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Import Modal */}
      <ModalLayout
        isOpen={showImportModal}
        onClose={closeImportModal}
        title="Import Inventory Items"
        subtitle="Upload an Excel file to bulk import inventory items"
        size="xl"
        footer={
          !importResult && (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeImportModal}>
                Cancel
              </Button>
              {importValidRows.length > 0 && (
                <Button
                  variant="primary"
                  onClick={handleImportConfirm}
                  loading={importProcessing}
                  icon={Upload}
                >
                  Import {importValidRows.length} Items
                </Button>
              )}
            </div>
          )
        }
      >
        <div className="space-y-6">
          {!importFile && !importResult && (
            <div
              onClick={handleImportClick}
              className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-all"
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-400">
                XLSX, XLS, or CSV files
              </p>
            </div>
          )}

          {importFile && !importResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">{importFile.name}</span>
                <button
                  onClick={closeImportModal}
                  className="ml-auto p-1 rounded-lg text-emerald-600 hover:bg-emerald-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="text-center py-8">
              {importResult.success > 0 && importResult.failed === 0 ? (
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {importResult.error ? 'Import Failed' : 'Import Complete'}
              </h3>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{importResult.success}</p>
                  <p className="text-sm text-slate-500">Imported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-slate-500">Skipped</p>
                </div>
              </div>
              <Button
                variant="primary"
                className="mt-6"
                onClick={closeImportModal}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </ModalLayout>
    </div>
  );
}
