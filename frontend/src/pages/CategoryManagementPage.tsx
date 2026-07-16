import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Category = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  subcategories: SubCategory[];
};

type SubCategory = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryFormData = {
  name: string;
  description: string;
  status: string;
};

type SubCategoryFormData = {
  name: string;
  description: string;
  status: string;
};

export function CategoryManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    status: 'ACTIVE'
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Subcategory modal state
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubCategory | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubCategoryFormData>({
    name: '',
    description: '',
    status: 'ACTIVE'
  });
  const [savingSubcategory, setSavingSubcategory] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'subcategory'; item: Category | SubCategory; parentId?: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  // Filter categories based on search
  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(query) ||
      (cat.description?.toLowerCase().includes(query)) ||
      cat.subcategories.some(sub => sub.name.toLowerCase().includes(query))
    );
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/categories');
      setCategories(res.data.categories);
    } catch {
      setMessage('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle back navigation
  function handleBack() {
    navigate('/inventory');
  }

  // Category modal handlers
  function openCategoryModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        status: 'ACTIVE'
      });
    }
    setCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', status: 'ACTIVE' });
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      setMessage('Category name is required');
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        await api.patch(`/inventory/categories/${editingCategory.id}`, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          status: categoryForm.status
        });
        setMessage('Category updated successfully');
      } else {
        await api.post('/inventory/categories', {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          status: categoryForm.status
        });
        setMessage('Category created successfully');
      }
      closeCategoryModal();
      loadCategories();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  }

  // Subcategory modal handlers
  function openSubcategoryModal(categoryId: string, subcategory?: SubCategory) {
    setParentCategoryId(categoryId);
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryForm({
        name: subcategory.name,
        description: subcategory.description || '',
        status: subcategory.status
      });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({
        name: '',
        description: '',
        status: 'ACTIVE'
      });
    }
    setSubcategoryModalOpen(true);
  }

  function closeSubcategoryModal() {
    setSubcategoryModalOpen(false);
    setEditingSubcategory(null);
    setParentCategoryId(null);
    setSubcategoryForm({ name: '', description: '', status: 'ACTIVE' });
  }

  async function saveSubcategory() {
    if (!subcategoryForm.name.trim()) {
      setMessage('Subcategory name is required');
      return;
    }

    if (!parentCategoryId) {
      setMessage('Parent category is required');
      return;
    }

    setSavingSubcategory(true);
    try {
      if (editingSubcategory) {
        await api.patch(`/inventory/subcategories/${editingSubcategory.id}`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null,
          status: subcategoryForm.status
        });
        setMessage('Subcategory updated successfully');
      } else {
        await api.post(`/inventory/categories/${parentCategoryId}/subcategories`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null,
          status: subcategoryForm.status
        });
        setMessage('Subcategory created successfully');
      }
      closeSubcategoryModal();
      loadCategories();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to save subcategory');
    } finally {
      setSavingSubcategory(false);
    }
  }

  // Delete handlers
  function openDeleteConfirm(type: 'category' | 'subcategory', item: Category | SubCategory, parentId?: string) {
    setDeletingItem({ type, item, parentId });
    setDeleteConfirmText('');
    setDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setDeleteConfirmOpen(false);
    setDeletingItem(null);
    setDeleteConfirmText('');
  }

  async function confirmDelete() {
    if (!deletingItem || deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    try {
      if (deletingItem.type === 'category') {
        await api.delete(`/inventory/categories/${deletingItem.item.id}`);
        setMessage('Category deleted successfully');
      } else {
        await api.delete(`/inventory/subcategories/${deletingItem.item.id}`);
        setMessage('Subcategory deleted successfully');
      }
      closeDeleteConfirm();
      loadCategories();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'status-open' : 'status-closed';
  }

  // Toggle category expansion
  function toggleCategory(categoryId: string) {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  }

  if (isEmployee) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>You do not have permission to manage inventory categories.</p>
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
        <div className={`notice ${message.includes('Failed') ? 'notice-error' : 'notice-success'}`}>
          {message}
          <button className="notice-close" onClick={() => setMessage('')}>×</button>
        </div>
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
            <span className="detail-ticket-no">Category Management</span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Total Categories</span>
              <span className="detail-meta-value">{categories.length}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Total Subcategories</span>
              <span className="detail-meta-value">{categories.reduce((acc, cat) => acc + cat.subcategories.length, 0)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="module-toolbar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isSuperAdmin && (
          <button className="primary" onClick={() => openCategoryModal()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Category
          </button>
        )}
      </div>

      {/* Category List */}
      <div className="category-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="empty-state-title">
              {searchQuery ? 'No categories found' : 'No categories yet'}
            </p>
            <p className="empty-state-description">
              {searchQuery ? 'Try a different search term' : 'Create your first category to organize inventory items'}
            </p>
            {isSuperAdmin && !searchQuery && (
              <button className="primary" onClick={() => openCategoryModal()}>
                Create First Category
              </button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className={`category-card ${expandedCategory === category.id ? 'expanded' : ''}`}>
              <div className="category-header" onClick={() => toggleCategory(category.id)}>
                <div className="category-info">
                  <div className="category-expand-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: expandedCategory === category.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="category-details">
                    <div className="category-name-row">
                      <span className="category-name">{category.name}</span>
                      <span className={`status-badge ${getStatusBadgeClass(category.status)}`}>
                        {category.status}
                      </span>
                    </div>
                    <div className="category-meta">
                      <span>{category.subcategories.length} subcategories</span>
                      <span>•</span>
                      <span>Created {formatDate(category.createdAt)}</span>
                    </div>
                    {category.description && (
                      <p className="category-description">{category.description}</p>
                    )}
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="category-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      title="Add Subcategory"
                      onClick={() => openSubcategoryModal(category.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button
                      className="btn-icon"
                      title="Edit Category"
                      onClick={() => openCategoryModal(category)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      title="Delete Category"
                      onClick={() => openDeleteConfirm('category', category)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M12.5 4v9.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Subcategories */}
              {expandedCategory === category.id && (
                <div className="subcategory-list">
                  {category.subcategories.length === 0 ? (
                    <div className="subcategory-empty">
                      <p>No subcategories yet</p>
                      {isSuperAdmin && (
                        <button
                          className="btn-link"
                          onClick={() => openSubcategoryModal(category.id)}
                        >
                          Add first subcategory
                        </button>
                      )}
                    </div>
                  ) : (
                    category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="subcategory-item">
                        <div className="subcategory-item-row">
                          <div className="subcategory-info">
                            <span className="subcategory-name">{subcategory.name}</span>
                            <span className={`status-badge status-sm ${getStatusBadgeClass(subcategory.status)}`}>
                              {subcategory.status}
                            </span>
                          </div>
                          {isSuperAdmin && (
                            <div className="subcategory-actions">
                              <button
                                className="btn-icon btn-icon-sm"
                                title="Edit"
                                onClick={() => openSubcategoryModal(category.id, subcategory)}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                className="btn-icon btn-icon-sm btn-icon-danger"
                                title="Delete"
                                onClick={() => openDeleteConfirm('subcategory', subcategory, category.id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1.5 3.5h11M4.5 3.5V2a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1.5M11 3.5v8a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {subcategory.description && (
                          <p className="subcategory-description">{subcategory.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" className="close" onClick={closeCategoryModal}>×</button>
            </div>
            <div className="form-group">
              <label>
                Category Name *
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Hardware"
                  autoFocus
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Description
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Status
                <select
                  value={categoryForm.status}
                  onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeCategoryModal}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={saveCategory}
                disabled={savingCategory || !categoryForm.name.trim()}
              >
                {savingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {subcategoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>{editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}</h3>
              <button type="button" className="close" onClick={closeSubcategoryModal}>×</button>
            </div>
            <div className="form-group">
              <label>
                Subcategory Name *
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  placeholder="e.g., Laptop"
                  autoFocus
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Description
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Status
                <select
                  value={subcategoryForm.status}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeSubcategoryModal}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={saveSubcategory}
                disabled={savingSubcategory || !subcategoryForm.name.trim()}
              >
                {savingSubcategory ? 'Saving...' : (editingSubcategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && deletingItem && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete {deletingItem.type === 'category' ? 'Category' : 'Subcategory'}?</h3>
              <button type="button" className="close" onClick={closeDeleteConfirm}>×</button>
            </div>
            <div className="warning-box">
              <p>
                Are you sure you want to delete <strong>{deletingItem.item.name}</strong>?
              </p>
              {deletingItem.type === 'category' && (
                <p className="warning-note">
                  This will also delete all subcategories under this category.
                </p>
              )}
              <p>This action cannot be undone.</p>
            </div>
            <div className="form-group">
              <label>
                Type <strong>DELETE</strong> to confirm:
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteConfirm}>
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
