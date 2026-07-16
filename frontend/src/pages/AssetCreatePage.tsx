import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Category = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

export function AssetCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isEmployee = !isSuperAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    assetType: '',
    make: '',
    model: '',
    serialNo: '',
    status: 'AVAILABLE',
    assignedToName: '',
    location: '',
    warrantyEndAt: '',
    categoryId: '',
    subcategoryId: ''
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
      const res = await api.get('/inventory/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Reset subcategory when category changes
    if (name === 'categoryId') {
      setForm(prev => ({ ...prev, subcategoryId: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.assetType.trim()) {
      setError('Asset Type is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await api.post('/assets', {
        ...form,
        categoryId: form.categoryId || null,
        subcategoryId: form.subcategoryId || null
      });
      
      navigate(`/assets/${res.data.asset.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId);

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
      </div>

      {loading ? (
        <div className="listing-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="detail-form">
          {error && <div className="notice notice-error">{error}</div>}

          <div className="detail-section">
            <h3 className="detail-section-title">Asset Information</h3>
            <div className="detail-card">
              <div className="form-grid">
                <div className="form-group required">
                  <label>Asset Type *</label>
                  <input
                    type="text"
                    name="assetType"
                    value={form.assetType}
                    onChange={handleChange}
                    placeholder="e.g., Laptop, Monitor, Keyboard"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Make</label>
                  <input
                    type="text"
                    name="make"
                    value={form.make}
                    onChange={handleChange}
                    placeholder="e.g., Dell, HP, Apple"
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="e.g., XPS 15, MacBook Pro"
                  />
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    name="serialNo"
                    value={form.serialNo}
                    onChange={handleChange}
                    placeholder="Unique identifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Status & Assignment</h3>
            <div className="detail-card">
              <div className="form-grid">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="RETIRED">Retired</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    name="assignedToName"
                    value={form.assignedToName}
                    onChange={handleChange}
                    placeholder="Employee name"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Office 101, Data Center"
                  />
                </div>
                <div className="form-group">
                  <label>Warranty Expiry</label>
                  <input
                    type="date"
                    name="warrantyEndAt"
                    value={form.warrantyEndAt}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Inventory Source</h3>
            <div className="detail-card">
              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    name="categoryId" 
                    value={form.categoryId} 
                    onChange={handleChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub Category</label>
                  <select 
                    name="subcategoryId" 
                    value={form.subcategoryId} 
                    onChange={handleChange}
                    disabled={!selectedCategory}
                  >
                    <option value="">Select Sub Category</option>
                    {selectedCategory?.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

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
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
