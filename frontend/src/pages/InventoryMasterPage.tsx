import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

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
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  // Check access permissions
  useEffect(() => {
    if (isEmployee) {
      setError('Access Restricted. You do not have permission to access this page.');
      setLoading(false);
    }
  }, [isEmployee]);

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

  if (loading) {
    return (
      <div className="page-stack">
        <div className="detail-header">
          <div className="skeleton skeleton-title"></div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <div className="skeleton skeleton-badge"></div>
            </div>
          </div>
        </div>
        <div className="detail-content-grid">
          <div className="detail-main">
            <div className="detail-card">
              <div className="detail-card-body">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text" style={{ marginTop: '16px' }}></div>
                <div className="skeleton skeleton-text"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !form.itemName) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {message && (
        <div className="notice notice-success">{message}</div>
      )}
      
      {error && (
        <div className="notice notice-error">{error}</div>
      )}

      {/* Header */}
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
          <div className="detail-title-row">
            <span className="detail-ticket-no">
              {isEditMode ? form.itemNo || 'Loading...' : 'New Inventory Item'}
            </span>
            <span className={`status-badge status-${form.status.toLowerCase()}`}>
              {form.status}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Category</span>
              <span className="detail-meta-value">
                {form.categoryId ? categories.find(c => c.id === form.categoryId)?.name : '-'}
              </span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Location</span>
              <span className="detail-meta-value">{form.location || '-'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Quantity</span>
              <span className="detail-meta-value">{form.currentQty}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit}>
        <div className="detail-content-grid">
          {/* Left Column */}
          <div className="detail-main">
            {/* Basic Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Basic Information</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-field-row">
                  <div className="detail-field">
                    <label className={errors.categoryId ? 'field-error' : ''}>
                      Category <span className="required">*</span>
                    </label>
                    {isFromCategoryPage && form.categoryId ? (
                      <div className="detail-field-display">
                        {categories.find(c => c.id === form.categoryId)?.name || 'Loading...'}
                      </div>
                    ) : (
                      <select
                        value={form.categoryId}
                        onChange={(e) => {
                          updateField('categoryId', e.target.value);
                          updateField('subcategoryId', ''); // Reset subcategory
                        }}
                        disabled={!isSuperAdmin || categoriesLoading}
                        className={errors.categoryId ? 'input-error' : ''}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                    {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
                  </div>
                  <div className="detail-field">
                    <label className={errors.subcategoryId ? 'field-error' : ''}>
                      Subcategory {isFromCategoryPage && <span className="required">*</span>}
                    </label>
                    <select
                      value={form.subcategoryId}
                      onChange={(e) => updateField('subcategoryId', e.target.value)}
                      disabled={!isSuperAdmin || !form.categoryId || categoriesLoading}
                      className={errors.subcategoryId ? 'input-error' : ''}
                    >
                      <option value="">Select Subcategory</option>
                      {availableSubcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                    {errors.subcategoryId && <span className="error-text">{errors.subcategoryId}</span>}
                  </div>
                </div>

                <div className="detail-field">
                  <label className={errors.itemName ? 'field-error' : ''}>
                    Item Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={(e) => updateField('itemName', e.target.value)}
                    disabled={!isSuperAdmin}
                    placeholder="Enter item name"
                    className={errors.itemName ? 'input-error' : ''}
                  />
                  {errors.itemName && <span className="error-text">{errors.itemName}</span>}
                </div>

                <div className="detail-field-row">
                  <div className="detail-field">
                    <label>Brand</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => updateField('brand', e.target.value)}
                      disabled={!isSuperAdmin}
                      placeholder="Enter brand"
                    />
                  </div>
                  <div className="detail-field">
                    <label>Model</label>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => updateField('model', e.target.value)}
                      disabled={!isSuperAdmin}
                      placeholder="Enter model"
                    />
                  </div>
                </div>

                <div className="detail-field">
                  <label>Vendor</label>
                  <select
                    value={form.vendorId || ''}
                    onChange={(e) => {
                      const selectedVendor = vendors.find(v => v.id === e.target.value);
                      updateField('vendorId', e.target.value);
                      updateField('vendor', selectedVendor?.vendorName || '');
                    }}
                    disabled={!isSuperAdmin}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName} ({vendor.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Purchase Information</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-field">
                  <label>Invoice Number</label>
                  <input
                    type="text"
                    value={form.invoiceNo}
                    onChange={(e) => updateField('invoiceNo', e.target.value)}
                    disabled={!isSuperAdmin}
                    placeholder="Enter invoice number"
                  />
                </div>

                <div className="detail-field-row">
                  <div className="detail-field">
                    <label className={errors.purchaseCost ? 'field-error' : ''}>
                      Purchase Cost
                    </label>
                    <input
                      type="number"
                      value={form.purchaseCost ?? ''}
                      onChange={(e) => updateField('purchaseCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={!isSuperAdmin}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={errors.purchaseCost ? 'input-error' : ''}
                    />
                    {errors.purchaseCost && <span className="error-text">{errors.purchaseCost}</span>}
                  </div>
                  <div className="detail-field">
                    <label>GST (%)</label>
                    <input
                      type="number"
                      value={form.gst ?? ''}
                      onChange={(e) => updateField('gst', e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={!isSuperAdmin}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="detail-field-row">
                  <div className="detail-field">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => updateField('purchaseDate', e.target.value)}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  <div className="detail-field">
                    <label>Warranty (Months)</label>
                    <input
                      type="number"
                      value={form.warrantyMonths ?? ''}
                      onChange={(e) => updateField('warrantyMonths', e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={!isSuperAdmin}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="detail-field">
                  <label className={errors.warrantyExpiry ? 'field-error' : ''}>
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) => updateField('warrantyExpiry', e.target.value)}
                    disabled={!isSuperAdmin || !form.purchaseDate}
                    className={errors.warrantyExpiry ? 'input-error' : ''}
                  />
                  {errors.warrantyExpiry && <span className="error-text">{errors.warrantyExpiry}</span>}
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Stock Information</h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    disabled={!isSuperAdmin}
                    placeholder="Enter location"
                  />
                </div>

                <div className="detail-field-row">
                  <div className="detail-field">
                    <label>Minimum Stock</label>
                    <input
                      type="number"
                      value={form.minStock ?? ''}
                      onChange={(e) => updateField('minStock', e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={!isSuperAdmin}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="detail-field">
                    <label className={errors.currentQty ? 'field-error' : ''}>
                      Current Quantity
                    </label>
                    <input
                      type="number"
                      value={form.currentQty}
                      onChange={(e) => updateField('currentQty', parseInt(e.target.value) || 0)}
                      disabled={!isSuperAdmin}
                      min="0"
                      className={errors.currentQty ? 'input-error' : ''}
                    />
                    {errors.currentQty && <span className="error-text">{errors.currentQty}</span>}
                  </div>
                </div>

                <div className="detail-field">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    disabled={!isSuperAdmin}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="detail-sidebar">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Actions</h3>
              </div>
              <div className="detail-card-body">
                {isSuperAdmin ? (
                  <>
                    <button
                      type="submit"
                      className="btn-primary-full"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-full"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <p className="read-only-notice">
                    You have read-only access to this page.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
