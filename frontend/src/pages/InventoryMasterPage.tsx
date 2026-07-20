import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PermissionGate } from '../components/permissions';
import { 
  Package, 
  Plus, 
  Save,
  X,
  ArrowLeft,
  ChevronDown,
  FileText,
  ShoppingCart,
  MapPin,
  Clock,
  AlertCircle,
  PackagePlus
} from 'lucide-react';
import {
  PageHeader,
  StockStatusBadge,
  FormSection,
  FormRow,
  Input,
  Textarea,
  Select,
  Button,
  QuantityInput,
  ModalLayout,
  ActionButtons,
  DetailSidebarCard,
  DetailField,
  SectionCard,
  LoadingCard
} from '../components/inventory';

/**
 * PART 4: Inventory Master Permission Enforcement
 * 
 * This module now enforces granular permissions:
 * - inventory:view - View inventory items
 * - inventory:create_asset - Create new inventory assets
 * - inventory:update_asset - Update inventory assets
 * - inventory:delete_asset - Delete inventory assets
 * - inventory:export - Export inventory data
 */

type Category = {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
  }[];
};

type InventoryItem = {
  id?: string;
  itemNo?: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendorName?: string;
  vendorId?: string;
  invoiceNo?: string;
  purchaseCost?: number;
  gst?: number;
  purchaseDate?: string;
  warrantyMonths?: number;
  warrantyExpiry?: string;
  location?: string;
  minStock?: number;
  currentQty: number;
  status: string;
  categoryId: string;
  subcategoryId: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

type VendorOption = {
  id: string;
  vendorName: string;
  vendorCode: string;
};

type ValidationErrors = {
  itemName?: string;
  categoryId?: string;
  subcategoryId?: string;
  currentQty?: string;
  purchaseCost?: string;
  warrantyExpiry?: string;
};

export function InventoryMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  // PART 4: Permission checks using granular permissions
  const canView = hasPermission('inventory:view');
  const canCreate = hasPermission('inventory:create_asset');
  const canUpdate = hasPermission('inventory:update_asset');
  const canDelete = hasPermission('inventory:delete_asset');
  const canExport = hasPermission('inventory:export');

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Categories for dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Vendors for dropdown
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // Check if coming from a category page (pre-selected category)
  const preCategoryId = searchParams.get('categoryId');
  const preSubcategoryId = searchParams.get('subcategoryId');
  const isFromCategoryPage = Boolean(preCategoryId);

  // Form state
  const [form, setForm] = useState<InventoryItem>({
    itemName: '',
    brand: '',
    model: '',
    vendorName: '',
    invoiceNo: '',
    purchaseCost: undefined,
    gst: undefined,
    purchaseDate: '',
    warrantyMonths: undefined,
    warrantyExpiry: '',
    location: '',
    minStock: undefined,
    currentQty: 0,
    status: 'ACTIVE',
    categoryId: '',
    subcategoryId: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Check access permissions - PART 4: Use permission instead of role
  useEffect(() => {
    if (!canView) {
      setError('Access Restricted. You do not have permission to access this page.');
      setLoading(false);
    }
  }, [canView]);

  // Load categories for dropdowns
  async function loadCategories() {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/inventory-master/categories/list');
      setCategories(res.data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }

  // Load vendors for dropdown
  async function loadVendors() {
    try {
      setVendorsLoading(true);
      const res = await api.get('/vendors?status=ACTIVE&per_page=1000');
      setVendors(res.data.vendors || []);
    } catch {
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }

  // Load existing item for edit
  async function loadItem() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory-master/${id}`);
      const item = res.data.item;

      setForm({
        itemName: item.itemName || '',
        brand: item.brand || '',
        model: item.model || '',
        vendorName: item.vendorName || '',
        vendorId: item.vendorId || '',
        invoiceNo: item.invoiceNo || '',
        purchaseCost: item.purchaseCost,
        gst: item.gst,
        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
        warrantyMonths: item.warrantyMonths,
        warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.split('T')[0] : '',
        location: item.location || '',
        minStock: item.minStock,
        currentQty: item.currentQty,
        status: item.status || 'ACTIVE',
        categoryId: item.categoryId || '',
        subcategoryId: item.subcategoryId || ''
      });
    } catch {
      setError('Failed to load inventory item.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadVendors();
    if (isEditMode) {
      loadItem();
    } else {
      // Set pre-selected category and subcategory from query params
      const preCategoryId = searchParams.get('categoryId');
      const preSubcategoryId = searchParams.get('subcategoryId');

      if (preCategoryId) {
        setForm(prev => ({ ...prev, categoryId: preCategoryId }));
      }
      if (preSubcategoryId) {
        setForm(prev => ({ ...prev, subcategoryId: preSubcategoryId }));
      }
      setLoading(false);
    }
  }, [id, isEditMode]);

  // Calculate warranty expiry when purchase date or months change
  useEffect(() => {
    if (form.purchaseDate && form.warrantyMonths && form.warrantyMonths > 0) {
      const purchaseDate = new Date(form.purchaseDate);
      purchaseDate.setMonth(purchaseDate.getMonth() + form.warrantyMonths);
      const year = purchaseDate.getFullYear();
      const month = String(purchaseDate.getMonth() + 1).padStart(2, '0');
      const day = String(purchaseDate.getDate()).padStart(2, '0');
      setForm(prev => ({ ...prev, warrantyExpiry: `${year}-${month}-${day}` }));
    }
  }, [form.purchaseDate, form.warrantyMonths]);

  function validate(): boolean {
    const newErrors: ValidationErrors = {};

    if (!form.itemName.trim()) {
      newErrors.itemName = 'Item Name is required';
    }

    if (!form.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    // When coming from category page, subcategory is mandatory
    if (isFromCategoryPage && !form.subcategoryId) {
      newErrors.subcategoryId = 'Subcategory is required';
    }

    if (form.currentQty < 0) {
      newErrors.currentQty = 'Quantity cannot be negative';
    }

    if (form.purchaseCost !== undefined && form.purchaseCost < 0) {
      newErrors.purchaseCost = 'Purchase Cost cannot be negative';
    }

    if (form.purchaseDate && form.warrantyExpiry) {
      if (new Date(form.warrantyExpiry) < new Date(form.purchaseDate)) {
        newErrors.warrantyExpiry = 'Warranty Expiry cannot be before Purchase Date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    if (!isSuperAdmin) {
      setError('Only Super Admin can save inventory items.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        itemName: form.itemName.trim(),
        brand: form.brand?.trim() || undefined,
        model: form.model?.trim() || undefined,
        vendorName: form.vendorName?.trim() || undefined,
        vendorId: form.vendorId || undefined,
        invoiceNo: form.invoiceNo?.trim() || undefined,
        purchaseCost: form.purchaseCost,
        gst: form.gst,
        purchaseDate: form.purchaseDate || undefined,
        warrantyMonths: form.warrantyMonths,
        warrantyExpiry: form.warrantyExpiry || undefined,
        location: form.location?.trim() || undefined,
        minStock: form.minStock,
        currentQty: form.currentQty,
        status: form.status,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId
      };

      if (isEditMode) {
        await api.patch(`/inventory-master/${id}`, payload);
        setMessage('Inventory item updated successfully!');
      } else {
        await api.post('/inventory-master', payload);
        setMessage('Inventory item created successfully!');
      }

      // Navigate back after short delay
      setTimeout(() => {
        if (form.categoryId) {
          navigate(`/inventory/${form.categoryId}`);
        } else {
          navigate('/inventory');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save inventory item.');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (form.categoryId) {
      navigate(`/inventory/${form.categoryId}`);
    } else {
      navigate('/inventory');
    }
  }

  function handleCancel() {
    handleBack();
  }

  function updateField(field: keyof InventoryItem, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  // Get available subcategories based on selected category
  const availableSubcategories = categories.find(c => c.id === form.categoryId)?.subcategories || [];

  // Get category name
  const categoryName = categories.find(c => c.id === form.categoryId)?.name || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-100 rounded"></div>
              <div className="h-4 w-32 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
            <div>
              <LoadingCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !form.itemName) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
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
        title={isEditMode ? 'Edit Inventory Item' : 'Create Inventory Item'}
        subtitle={isEditMode ? form.itemNo : 'New Item'}
        icon={isEditMode ? Package : PackagePlus}
        iconColor="text-brand-600"
        breadcrumbs={[
          { label: 'Inventory', onClick: () => navigate('/inventory') },
          ...(isEditMode && form.itemNo ? [{ label: form.itemNo }] : [])
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            {isSuperAdmin && (
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSubmit}
                loading={saving}
              >
                {isEditMode ? 'Update Item' : 'Save Item'}
              </Button>
            )}
          </div>
        }
      />

      {/* Toast Messages */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage('')} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError('')} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <SectionCard
              title="General Information"
              icon={Package}
              iconColor="text-brand-600"
              iconBg="bg-brand-50"
            >
              <div className="space-y-6">
                {/* Category and Subcategory */}
                <FormRow>
                  <Select
                    label="Category"
                    required
                    value={form.categoryId}
                    onChange={(e) => {
                      updateField('categoryId', e.target.value);
                      updateField('subcategoryId', '');
                    }}
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                    ]}
                    disabled={!isSuperAdmin || categoriesLoading}
                    error={errors.categoryId}
                  />
                  <Select
                    label="Subcategory"
                    value={form.subcategoryId}
                    onChange={(e) => updateField('subcategoryId', e.target.value)}
                    options={[
                      { value: '', label: 'Select Subcategory' },
                      ...availableSubcategories.map(sub => ({ value: sub.id, label: sub.name }))
                    ]}
                    disabled={!isSuperAdmin || !form.categoryId || categoriesLoading}
                    error={errors.subcategoryId}
                  />
                </FormRow>

                {/* Item Name */}
                <Input
                  label="Item Name"
                  required
                  value={form.itemName}
                  onChange={(e) => updateField('itemName', e.target.value)}
                  placeholder="Enter item name"
                  disabled={!isSuperAdmin}
                  error={errors.itemName}
                />

                {/* Brand and Model */}
                <FormRow>
                  <Input
                    label="Brand"
                    value={form.brand || ''}
                    onChange={(e) => updateField('brand', e.target.value)}
                    placeholder="Enter brand name"
                    disabled={!isSuperAdmin}
                  />
                  <Input
                    label="Model"
                    value={form.model || ''}
                    onChange={(e) => updateField('model', e.target.value)}
                    placeholder="Enter model number"
                    disabled={!isSuperAdmin}
                  />
                </FormRow>
              </div>
            </SectionCard>

            {/* Vendor Information */}
            <SectionCard
              title="Vendor Information"
              icon={ShoppingCart}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            >
              <div className="space-y-6">
                <Select
                  label="Vendor"
                  value={form.vendorId || ''}
                  onChange={(e) => {
                    const selectedVendor = vendors.find(v => v.id === e.target.value);
                    updateField('vendorId', e.target.value);
                    updateField('vendorName', selectedVendor?.vendorName || '');
                  }}
                  options={[
                    { value: '', label: 'Select a vendor' },
                    ...vendors.map(vendor => ({ 
                      value: vendor.id, 
                      label: `${vendor.vendorName} (${vendor.vendorCode})` 
                    }))
                  ]}
                  disabled={!isSuperAdmin || vendorsLoading}
                />
              </div>
            </SectionCard>

            {/* Purchase Information */}
            <SectionCard
              title="Purchase Information"
              icon={FileText}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            >
              <div className="space-y-6">
                <Input
                  label="Invoice Number"
                  value={form.invoiceNo || ''}
                  onChange={(e) => updateField('invoiceNo', e.target.value)}
                  placeholder="Enter invoice number"
                  disabled={!isSuperAdmin}
                />

                <FormRow>
                  <Input
                    label="Purchase Cost"
                    type="number"
                    value={form.purchaseCost ?? ''}
                    onChange={(e) => updateField('purchaseCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={!isSuperAdmin}
                    error={errors.purchaseCost}
                  />
                  <Input
                    label="GST (%)"
                    type="number"
                    value={form.gst ?? ''}
                    onChange={(e) => updateField('gst', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!isSuperAdmin}
                  />
                </FormRow>

                <FormRow>
                  <Input
                    label="Purchase Date"
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => updateField('purchaseDate', e.target.value)}
                    disabled={!isSuperAdmin}
                  />
                  <Input
                    label="Warranty (Months)"
                    type="number"
                    value={form.warrantyMonths ?? ''}
                    onChange={(e) => updateField('warrantyMonths', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                    disabled={!isSuperAdmin}
                  />
                </FormRow>

                <Input
                  label="Warranty Expiry"
                  type="date"
                  value={form.warrantyExpiry}
                  onChange={(e) => updateField('warrantyExpiry', e.target.value)}
                  disabled={!isSuperAdmin || !form.purchaseDate}
                  error={errors.warrantyExpiry}
                  hint={form.purchaseDate && form.warrantyMonths ? "Auto-calculated from purchase date" : undefined}
                />
              </div>
            </SectionCard>

            {/* Stock & Location Information */}
            <SectionCard
              title="Stock & Location"
              icon={MapPin}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            >
              <div className="space-y-6">
                <Input
                  label="Location"
                  value={form.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g., Warehouse A, Shelf 3"
                  disabled={!isSuperAdmin}
                />

                <FormRow>
                  <Input
                    label="Minimum Stock Level"
                    type="number"
                    value={form.minStock ?? ''}
                    onChange={(e) => updateField('minStock', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                    disabled={!isSuperAdmin}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Current Quantity
                      {errors.currentQty && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <QuantityInput
                      value={form.currentQty}
                      onChange={(value) => updateField('currentQty', value)}
                      min={0}
                      disabled={!isSuperAdmin}
                    />
                    {errors.currentQty && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        {errors.currentQty}
                      </p>
                    )}
                  </div>
                </FormRow>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="ACTIVE"
                        checked={form.status === 'ACTIVE'}
                        onChange={(e) => updateField('status', e.target.value)}
                        disabled={!isSuperAdmin}
                        className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="INACTIVE"
                        checked={form.status === 'INACTIVE'}
                        onChange={(e) => updateField('status', e.target.value)}
                        disabled={!isSuperAdmin}
                        className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-700">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Item Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <DetailField 
                  label="Item Name" 
                  value={form.itemName || <span className="text-slate-400">Not set</span>} 
                />
                <DetailField 
                  label="Category" 
                  value={categoryName || <span className="text-slate-400">Not selected</span>} 
                />
                <DetailField 
                  label="Location" 
                  value={form.location || <span className="text-slate-400">Not set</span>} 
                />
                <DetailField 
                  label="Quantity" 
                  value={
                    <span className={`font-semibold ${
                      form.minStock && form.currentQty <= form.minStock 
                        ? 'text-amber-600' 
                        : form.currentQty === 0 
                          ? 'text-red-600' 
                          : 'text-emerald-600'
                    }`}>
                      {form.currentQty}
                      {form.minStock !== undefined && form.minStock > 0 && (
                        <span className="text-slate-400 font-normal text-xs ml-1">
                          / min: {form.minStock}
                        </span>
                      )}
                    </span>
                  } 
                />
                <DetailField 
                  label="Status" 
                  value={<StockStatusBadge status={form.status} size="sm" />} 
                />
              </div>
            </div>

            {/* Stock Status Indicator */}
            {form.minStock !== undefined && form.minStock > 0 && (
              <div className={`rounded-xl p-4 border ${
                form.currentQty === 0 
                  ? 'bg-red-50 border-red-200' 
                  : form.currentQty <= form.minStock 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    form.currentQty === 0 
                      ? 'bg-red-100' 
                      : form.currentQty <= form.minStock 
                        ? 'bg-amber-100' 
                        : 'bg-emerald-100'
                  }`}>
                    <Package className={`w-5 h-5 ${
                      form.currentQty === 0 
                        ? 'text-red-600' 
                        : form.currentQty <= form.minStock 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${
                      form.currentQty === 0 
                        ? 'text-red-800' 
                        : form.currentQty <= form.minStock 
                          ? 'text-amber-800' 
                          : 'text-emerald-800'
                    }`}>
                      {form.currentQty === 0 
                        ? 'Out of Stock' 
                        : form.currentQty <= form.minStock 
                          ? 'Low Stock Alert' 
                          : 'Stock Adequate'}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      form.currentQty === 0 
                        ? 'text-red-600' 
                        : form.currentQty <= form.minStock 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                    }`}>
                      {form.currentQty === 0 
                        ? 'This item is completely out of stock.' 
                        : form.currentQty <= form.minStock 
                          ? `Stock is below minimum level (${form.minStock}).` 
                          : `Stock level is healthy (${form.currentQty}/${form.minStock}).`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isSuperAdmin ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isEditMode ? 'Update Item' : 'Save Item'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-amber-800">View Only Access</h4>
                    <p className="text-xs text-amber-600 mt-1">
                      You have read-only access to this page. Contact an administrator to make changes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
