import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Category = {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    inventoryItems: { id: string }[];
  }[];
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendor?: string;
  purchaseDate?: string;
  warrantyMonths?: number;
  warrantyExpiry?: string;
  location?: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  availableQty: number;
};

export function AssetCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isEmployee = !isSuperAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    assetTag: '',
    serialNo: '',
    remarks: '',
    assignedToName: ''
  });

  useEffect(() => {
    if (isEmployee) {
      navigate('/assets');
      return;
    }
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.get('/assets/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function loadInventoryItems() {
    if (!selectedSubcategory) return;
    
    setLoadingItems(true);
    try {
      const res = await api.get('/assets/inventory-items', {
        params: { subcategoryId: selectedSubcategory }
      });
      setInventoryItems(res.data.items || []);
    } catch (err) {
      console.error('Failed to load inventory items');
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    if (selectedSubcategory) {
      loadInventoryItems();
      setSelectedItem(null);
    }
  }, [selectedSubcategory]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSelectItem(item: InventoryItem) {
    setSelectedItem(item);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedItem) {
      setError('Please select an inventory item');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await api.post('/assets', {
        inventoryItemId: selectedItem.id,
        assetTag: form.assetTag.trim() || null,
        serialNo: form.serialNo.trim() || null,
        remarks: form.remarks.trim() || null,
        assignedToName: form.assignedToName.trim() || null
      });
      
      navigate(`/assets/${res.data.asset.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setSaving(false);
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

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const selectedSubcategoryData = selectedCategoryData?.subcategories.find(s => s.id === selectedSubcategory);

  if (isEmployee) {
    return null;
  }

  return (
    <div className="detail-page">
      <button className="btn-back-top" onClick={() => navigate('/assets')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="detail-header">
        <h2 className="detail-title">Create Asset</h2>
        <p className="page-subtitle">Create a new asset from inventory</p>
      </div>

      {loading ? (
        <div className="listing-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="notice notice-error">
          No inventory items available for asset creation. Please add inventory first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="detail-form">
          {error && <div className="notice notice-error">{error}</div>}

          {/* Step 1: Select Category */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <span className="step-badge">1</span>
              Select Category
            </h3>
            <div className="detail-card">
              <div className="form-group required">
                <label>Category *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                    setSelectedItem(null);
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Select Sub Category */}
          {selectedCategory && (
            <div className="detail-section">
              <h3 className="detail-section-title">
                <span className="step-badge">2</span>
                Select Sub Category
              </h3>
              <div className="detail-card">
                <div className="form-group required">
                  <label>Sub Category *</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setSelectedItem(null);
                    }}
                    required
                  >
                    <option value="">Select Sub Category</option>
                    {selectedCategoryData?.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Inventory Item */}
          {selectedSubcategory && (
            <div className="detail-section">
              <h3 className="detail-section-title">
                <span className="step-badge">3</span>
                Select Inventory Item
              </h3>
              <div className="detail-card">
                {loadingItems ? (
                  <div className="listing-loading">
                    <div className="spinner"></div>
                    <span>Loading items...</span>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="notice notice-warning">
                    No available inventory items in this subcategory.
                  </div>
                ) : (
                  <div className="inventory-item-grid">
                    {inventoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`inventory-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <div className="inventory-item-header">
                          <span className="inventory-item-no">{item.itemNo}</span>
                          <span className="inventory-item-qty">Qty: {item.availableQty}</span>
                        </div>
                        <div className="inventory-item-name">{item.itemName}</div>
                        <div className="inventory-item-details">
                          {item.brand && <span>{item.brand}</span>}
                          {item.model && <span>{item.model}</span>}
                        </div>
                        <div className="inventory-item-location">
                          {item.location || 'No location'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Asset Details */}
          {selectedItem && (
            <>
              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="step-badge">4</span>
                  Asset Details (Auto-populated from Inventory)
                </h3>
                <div className="detail-card">
                  <div className="auto-fill-info">
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Asset Name:</span>
                      <span className="auto-fill-value">{selectedItem.itemName}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Brand:</span>
                      <span className="auto-fill-value">{selectedItem.brand || '-'}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Model:</span>
                      <span className="auto-fill-value">{selectedItem.model || '-'}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Vendor:</span>
                      <span className="auto-fill-value">{selectedItem.vendor || '-'}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Purchase Date:</span>
                      <span className="auto-fill-value">{formatDate(selectedItem.purchaseDate)}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Warranty (Months):</span>
                      <span className="auto-fill-value">{selectedItem.warrantyMonths || '-'}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Warranty Expiry:</span>
                      <span className="auto-fill-value">{formatDate(selectedItem.warrantyExpiry)}</span>
                    </div>
                    <div className="auto-fill-row">
                      <span className="auto-fill-label">Location:</span>
                      <span className="auto-fill-value">{selectedItem.location || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="step-badge">5</span>
                  Asset Tag & Serial Number
                </h3>
                <div className="detail-card">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Asset Tag</label>
                      <input
                        type="text"
                        name="assetTag"
                        value={form.assetTag}
                        onChange={handleChange}
                        placeholder="e.g., AST-001"
                      />
                    </div>
                    <div className="form-group">
                      <label>Serial Number</label>
                      <input
                        type="text"
                        name="serialNo"
                        value={form.serialNo}
                        onChange={handleChange}
                        placeholder="Unique serial number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        name="assignedToName"
                        value={form.assignedToName}
                        onChange={handleChange}
                        placeholder="Employee name (optional)"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Remarks</label>
                      <textarea
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        placeholder="Additional notes (optional)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="detail-form-actions">
            <button 
              type="button" 
              className="secondary"
              onClick={() => navigate('/assets')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary"
              disabled={saving || !selectedItem}
            >
              {saving ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
