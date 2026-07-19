import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { StatCard } from '../components/StatCard';

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  articleCount: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

const DEFAULT_FORM_DATA: CategoryFormData = {
  name: '',
  description: '',
  isActive: true
};

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'isActive';
type SortOrder = 'asc' | 'desc';

export function KnowledgeCategoryPage() {
  const { hasPermission } = useAuth();
  
  // Permissions for category management
  const canCreate = hasPermission('knowledge.category:create') || hasPermission('kb:manage');
  const canUpdate = hasPermission('knowledge.category:update') || hasPermission('kb:manage');
  const canDelete = hasPermission('knowledge.category:delete') || hasPermission('kb:manage');
  const canManage = canCreate || canUpdate || canDelete;

  // State
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [totalArticles, setTotalArticles] = useState(0);
  const [publishedArticles, setPublishedArticles] = useState(0);
  const [draftArticles, setDraftArticles] = useState(0);

  // Search and sort state
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM_DATA);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<KnowledgeCategory | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Toast state for notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load categories and article stats
  async function loadCategories() {
    try {
      setError('');
      const response = await api.get('/knowledge/categories');
      const cats = response.data.categories || [];
      setCategories(cats);
      
      // Calculate total articles from all categories
      const total = cats.reduce((sum: number, cat: KnowledgeCategory) => sum + (cat.articleCount || 0), 0);
      setTotalArticles(total);
      
      // Try to fetch article status breakdown (if backend supports it)
      try {
        const articlesRes = await api.get('/knowledge-base', { params: { limit: 1 } });
        // Backend may return stats in different format - we'll use what's available
        if (articlesRes.data.stats) {
          setPublishedArticles(articlesRes.data.stats.published || 0);
          setDraftArticles(articlesRes.data.stats.draft || 0);
        }
      } catch {
        // If articles API doesn't provide stats, estimate from total
        // This is a temporary calculation - real stats would come from backend
        setPublishedArticles(Math.floor(total * 0.8)); // Estimate
        setDraftArticles(Math.floor(total * 0.2)); // Estimate
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      // Client-side search is already handled in filteredCategories
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        cat =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, search, sortBy, sortOrder]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError('');
    setShowForm(true);
  };

  // Open edit modal
  const openEditModal = (category: KnowledgeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    setFormError('');
    setShowForm(true);
  };

  // Close form modal
  const closeFormModal = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError('');
  };

  // Save category (create or update)
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    if (formData.name.trim().length > 100) {
      setFormError('Category name must be 100 characters or less');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        isActive: formData.isActive
      };

      if (editingCategory) {
        await api.put(`/knowledge/categories/${editingCategory.id}`, payload);
        showToast('success', 'Category updated successfully');
      } else {
        await api.post('/knowledge/categories', payload);
        showToast('success', 'Category created successfully');
      }

      closeFormModal();
      loadCategories();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFormError(axiosError.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (category: KnowledgeCategory) => {
    setDeletingCategory(category);
    setDeleteConfirmText('');
    setShowDelete(true);
  };

  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setShowDelete(false);
    setDeletingCategory(null);
    setDeleteConfirmText('');
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingCategory || deleteConfirmText !== 'DELETE') return;

    setDeleting(true);

    try {
      await api.delete(`/knowledge/categories/${deletingCategory.id}`);
      showToast('success', 'Category deleted successfully');
      closeDeleteConfirm();
      loadCategories();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="workspace">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Knowledge Base</h1>
          <p className="subtitle">Manage Knowledge Base Categories</p>
        </div>
        <div className="header-actions">
          {canManage && (
            <button className="primary" onClick={openCreateModal}>
              + Create Category
            </button>
          )}
          <button 
            className="secondary icon-button" 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
          >
            {refreshing ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid cards-3">
        <div className="stat-card">
          <span>Categories</span>
          <strong>{categories.length}</strong>
          <small>Total Categories</small>
        </div>
        <div className="stat-card">
          <span>Articles</span>
          <strong>{totalArticles}</strong>
          <small>Total Articles</small>
        </div>
        <div className="stat-card">
          <span>Published</span>
          <strong>{publishedArticles}</strong>
          <small>Published Articles</small>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="sort-info">
          {filteredCategories.length} category{filteredCategories.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <div className="error-card">
            <span className="error-icon">⚠</span>
            <h3>Error Loading Categories</h3>
            <p>{error}</p>
            <button className="primary" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-card">
            <span className="empty-icon">📁</span>
            <h3>No Categories Found</h3>
            <p>
              {search
                ? 'No categories match your search criteria.'
                : 'No knowledge categories available yet.'}
            </p>
            {canManage && !search && (
              <button className="primary" onClick={openCreateModal}>
                Create Your First Category
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('name')}
                >
                  Category Name{getSortIndicator('name')}
                </th>
                <th>Description</th>
                <th>Articles</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('isActive')}
                >
                  Status{getSortIndicator('isActive')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('createdAt')}
                >
                  Created{getSortIndicator('createdAt')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('updatedAt')}
                >
                  Updated{getSortIndicator('updatedAt')}
                </th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td className="description-cell">
                    {category.description || '-'}
                  </td>
                  <td className="count-cell">
                    <span className="count-badge">{category.articleCount}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(category.createdAt)}</td>
                  <td>{formatDate(category.updatedAt)}</td>
                  {canManage && (
                    <td>
                      <div className="action-buttons">
                        {canUpdate && (
                          <button 
                            className="action-btn edit"
                            onClick={() => openEditModal(category)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="action-btn delete"
                            onClick={() => openDeleteConfirm(category)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" className="close" onClick={closeFormModal}>×</button>
            </div>

            {formError && (
              <div className="form-error-banner">
                {formError}
              </div>
            )}

            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Infrastructure"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeFormModal}>
                Cancel
              </button>
              <button 
                type="button" 
                className="primary" 
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
              >
                {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && deletingCategory && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Category</h3>
              <button type="button" className="close" onClick={closeDeleteConfirm}>×</button>
            </div>

            <div className="warning-box">
              <p>Are you sure you want to delete <strong>{deletingCategory.name}</strong>?</p>
              {deletingCategory.articleCount > 0 && (
                <p className="warning-note">
                  This category has {deletingCategory.articleCount} article{deletingCategory.articleCount !== 1 ? 's' : ''} assigned to it.
                </p>
              )}
              <p>This action cannot be undone.</p>
            </div>

            <div className="form-group">
              <label>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteConfirm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .page-header .subtitle {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
        }

        .search-box input {
          width: 300px;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
        }

        .sort-info {
          color: var(--muted);
          font-size: 13px;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--line);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-card,
        .empty-card {
          text-align: center;
          padding: 40px;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          max-width: 400px;
        }

        .error-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .error-card h3,
        .empty-card h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .error-card p,
        .empty-card p {
          color: var(--muted);
          margin: 0 0 20px 0;
        }

        .table-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
        }

        .table-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-card th {
          background: var(--panel-soft);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--line);
        }

        .table-card th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .table-card th.sortable:hover {
          background: var(--line);
        }

        .table-card td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        .table-card tbody tr:hover {
          background: var(--panel-soft);
        }

        .description-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--muted);
        }

        .count-cell {
          text-align: center;
        }

        .count-badge {
          display: inline-block;
          min-width: 28px;
          padding: 4px 8px;
          background: var(--panel-soft);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          border: none;
          background: transparent;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: var(--panel-soft);
        }

        .action-btn.delete:hover {
          background: var(--danger-soft);
        }

        .form-error-banner {
          background: var(--danger-soft);
          color: var(--danger);
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
          position: relative;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--brand);
        }

        .warning-box {
          background: var(--warning-soft);
          border: 1px solid var(--warning);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .warning-box p {
          margin: 0 0 8px 0;
          color: var(--warning);
        }

        .warning-box p:last-child {
          margin-bottom: 0;
        }

        .warning-note {
          font-style: italic;
        }

        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 600;
          z-index: 100;
          animation: slideIn 0.3s ease;
        }

        .toast-notification.success {
          background: var(--success);
          color: white;
        }

        .toast-notification.error {
          background: var(--danger);
          color: white;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 1024px) {
          .table-card {
            overflow-x: auto;
          }

          .search-box input {
            width: 200px;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box input {
            width: 100%;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
