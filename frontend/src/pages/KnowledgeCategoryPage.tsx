import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Types
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

interface KnowledgeArticle {
  id: string;
  title: string;
  categoryId: string | null;
  categoryName: string;
  summary: string | null;
  body: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface ArticleFormData {
  title: string;
  categoryId: string;
  summary: string;
  body: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  isAdmin: boolean;
}

// Constants
const DEFAULT_ARTICLE_FORM: ArticleFormData = {
  title: '',
  categoryId: '',
  summary: '',
  body: '',
  tags: [],
  status: 'DRAFT'
};

const DEFAULT_CATEGORY_FORM: CategoryFormData = {
  name: '',
  description: '',
  isActive: true
};

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'code-block'],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link', 'code-block'
];

type SortField = 'title' | 'status' | 'createdAt' | 'updatedAt' | 'authorName';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function KnowledgeCategoryPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  
  // View mode
  const [viewMode, setViewMode] = useState<'categories' | 'articles'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);

  // User permissions
  const isAdmin = isSuperAdmin || hasPermission('kb:manage');
  
  // Category permissions
  const canManageCategories = hasPermission('knowledge.category:create') || hasPermission('kb:manage');
  const canUpdateCategories = hasPermission('knowledge.category:update') || hasPermission('kb:manage');
  const canDeleteCategories = hasPermission('knowledge.category:delete') || hasPermission('kb:manage');

  // Article permissions
  const canCreateArticles = hasPermission('knowledge.article:create') || hasPermission('kb:manage');
  const canUpdateArticles = hasPermission('knowledge.article:update') || hasPermission('kb:manage');
  const canDeleteArticles = hasPermission('knowledge.article:delete') || hasPermission('kb:manage');
  const canManageArticles = canCreateArticles || canUpdateArticles || canDeleteArticles;

  // Categories state
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [articleStats, setArticleStats] = useState<ArticleStats>({ total: 0, published: 0, draft: 0, archived: 0, isAdmin: false });

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(isAdmin ? 'ALL' : 'PUBLISHED');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>(DEFAULT_CATEGORY_FORM);
  const [categoryFormError, setCategoryFormError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Category delete state
  const [showCategoryDelete, setShowCategoryDelete] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<KnowledgeCategory | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingCategoryInProgress, setDeletingCategoryInProgress] = useState(false);

  // Article form state
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [articleFormData, setArticleFormData] = useState<ArticleFormData>(DEFAULT_ARTICLE_FORM);
  const [articleFormError, setArticleFormError] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Article delete state
  const [showArticleDelete, setShowArticleDelete] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<KnowledgeArticle | null>(null);
  const [deleteArticleConfirmText, setDeleteArticleConfirmText] = useState('');
  const [deletingArticleInProgress, setDeletingArticleInProgress] = useState(false);

  // Article view state
  const [viewingArticle, setViewingArticle] = useState<KnowledgeArticle | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show toast notification
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/knowledge/categories');
      setCategories(response.data.categories || []);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load articles for a category
  const loadArticles = useCallback(async () => {
    if (!selectedCategory) return;
    
    try {
      setArticleError('');
      setArticleLoading(true);

      const params: Record<string, string> = { categoryId: selectedCategory.id };
      
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (search) {
        params.search = search;
      }
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const response = await api.get('/knowledge/articles', { params });
      setArticles(response.data.articles || []);

      // Load stats
      const statsRes = await api.get('/knowledge/articles/stats', { params: { categoryId: selectedCategory.id } });
      setArticleStats({
        ...statsRes.data,
        isAdmin
      });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setArticleError(axiosError.response?.data?.message || 'Failed to load articles');
    } finally {
      setArticleLoading(false);
    }
  }, [selectedCategory, statusFilter, search, sortBy, sortOrder, isAdmin]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (selectedCategory) {
      loadArticles();
    }
  }, [selectedCategory, loadArticles]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'categories') {
      loadCategories();
    } else {
      loadArticles();
    }
  };

  // Navigate to articles view
  const viewCategory = (category: KnowledgeCategory) => {
    setSelectedCategory(category);
    setViewMode('articles');
    setSearch('');
    setStatusFilter(isAdmin ? 'ALL' : 'PUBLISHED');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Navigate back to categories
  const backToCategories = () => {
    setSelectedCategory(null);
    setViewMode('categories');
    setArticles([]);
    setArticleStats({ total: 0, published: 0, draft: 0, archived: 0, isAdmin: false });
  };

  // Category CRUD handlers
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData(DEFAULT_CATEGORY_FORM);
    setCategoryFormError('');
    setShowCategoryForm(true);
  };

  const openEditCategoryModal = (category: KnowledgeCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    setCategoryFormError('');
    setShowCategoryForm(true);
  };

  const closeCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryFormData(DEFAULT_CATEGORY_FORM);
    setCategoryFormError('');
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormError('Category name is required');
      return;
    }
    if (categoryFormData.name.trim().length > 100) {
      setCategoryFormError('Category name must be 100 characters or less');
      return;
    }

    setSavingCategory(true);
    setCategoryFormError('');

    try {
      const payload = {
        name: categoryFormData.name.trim(),
        description: categoryFormData.description.trim() || null,
        isActive: categoryFormData.isActive
      };

      if (editingCategory) {
        await api.put(`/knowledge/categories/${editingCategory.id}`, payload);
        showToast('success', 'Category updated successfully');
      } else {
        await api.post('/knowledge/categories', payload);
        showToast('success', 'Category created successfully');
      }

      closeCategoryForm();
      loadCategories();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setCategoryFormError(axiosError.response?.data?.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const openDeleteCategoryConfirm = (category: KnowledgeCategory) => {
    setDeletingCategory(category);
    setDeleteConfirmText('');
    setShowCategoryDelete(true);
  };

  const closeDeleteCategoryConfirm = () => {
    setShowCategoryDelete(false);
    setDeletingCategory(null);
    setDeleteConfirmText('');
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory || deleteConfirmText !== 'DELETE') return;

    setDeletingCategoryInProgress(true);

    try {
      await api.delete(`/knowledge/categories/${deletingCategory.id}`);
      showToast('success', 'Category deleted successfully');
      closeDeleteCategoryConfirm();
      loadCategories();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingCategoryInProgress(false);
    }
  };

  // Article CRUD handlers
  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setArticleFormData({
      ...DEFAULT_ARTICLE_FORM,
      categoryId: selectedCategory?.id || ''
    });
    setArticleFormError('');
    setTagInput('');
    setShowArticleForm(true);
  };

  const openEditArticleModal = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setArticleFormData({
      title: article.title,
      categoryId: article.categoryId || '',
      summary: article.summary || '',
      body: article.body,
      tags: article.tags || [],
      status: article.status
    });
    setArticleFormError('');
    setTagInput('');
    setShowArticleForm(true);
  };

  const closeArticleForm = () => {
    setShowArticleForm(false);
    setEditingArticle(null);
    setArticleFormData(DEFAULT_ARTICLE_FORM);
    setArticleFormError('');
    setTagInput('');
  };

  const handleSaveArticle = async (publishNow: boolean = false) => {
    if (!articleFormData.title.trim()) {
      setArticleFormError('Title is required');
      return;
    }
    if (!articleFormData.categoryId) {
      setArticleFormError('Category is required');
      return;
    }
    if (!articleFormData.summary.trim()) {
      setArticleFormError('Short description is required');
      return;
    }
    if (!articleFormData.body.trim() || articleFormData.body === '<p><br></p>') {
      setArticleFormError('Article content is required');
      return;
    }

    setSavingArticle(true);
    setArticleFormError('');

    try {
      const status = publishNow ? 'PUBLISHED' : articleFormData.status;
      const payload = {
        title: articleFormData.title.trim(),
        categoryId: articleFormData.categoryId,
        summary: articleFormData.summary.trim(),
        body: articleFormData.body,
        tags: articleFormData.tags,
        status
      };

      if (editingArticle) {
        await api.put(`/knowledge/articles/${editingArticle.id}`, payload);
        showToast('success', publishNow ? 'Article published successfully' : 'Article updated successfully');
      } else {
        await api.post('/knowledge/articles', payload);
        showToast('success', publishNow ? 'Article published successfully' : 'Article created successfully');
      }

      closeArticleForm();
      loadArticles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setArticleFormError(axiosError.response?.data?.message || 'Failed to save article');
    } finally {
      setSavingArticle(false);
    }
  };

  const openDeleteArticleConfirm = (article: KnowledgeArticle) => {
    setDeletingArticle(article);
    setDeleteArticleConfirmText('');
    setShowArticleDelete(true);
  };

  const closeDeleteArticleConfirm = () => {
    setShowArticleDelete(false);
    setDeletingArticle(null);
    setDeleteArticleConfirmText('');
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle || deleteArticleConfirmText !== 'DELETE') return;

    setDeletingArticleInProgress(true);

    try {
      await api.delete(`/knowledge/articles/${deletingArticle.id}`);
      showToast('success', 'Article deleted successfully');
      closeDeleteArticleConfirm();
      loadArticles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to delete article');
    } finally {
      setDeletingArticleInProgress(false);
    }
  };

  const handlePublishArticle = async (article: KnowledgeArticle) => {
    try {
      await api.put(`/knowledge/articles/${article.id}`, { status: 'PUBLISHED' });
      showToast('success', 'Article published successfully');
      loadArticles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to publish article');
    }
  };

  const handleArchiveArticle = async (article: KnowledgeArticle) => {
    try {
      await api.put(`/knowledge/articles/${article.id}`, { status: 'ARCHIVED' });
      showToast('success', 'Article archived successfully');
      loadArticles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to archive article');
    }
  };

  const handleRestoreArticle = async (article: KnowledgeArticle) => {
    try {
      await api.put(`/knowledge/articles/${article.id}`, { status: 'DRAFT' });
      showToast('success', 'Article restored to draft');
      loadArticles();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to restore article');
    }
  };

  const viewArticle = async (article: KnowledgeArticle) => {
    try {
      const response = await api.get(`/knowledge/articles/${article.id}`);
      setViewingArticle(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to load article');
    }
  };

  // Tag handlers
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !articleFormData.tags.includes(tag)) {
      setArticleFormData({ ...articleFormData, tags: [...articleFormData.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setArticleFormData({
      ...articleFormData,
      tags: articleFormData.tags.filter(t => t !== tagToRemove)
    });
  };

  // Sort handlers
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
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

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusClass = status.toLowerCase();
    const statusLabel = status.charAt(0) + status.slice(1).toLowerCase();
    return <span className={`status-badge ${statusClass}`}>{statusLabel}</span>;
  };

  // Get empty message based on filter
  const getEmptyMessage = () => {
    switch (statusFilter) {
      case 'DRAFT': return 'No draft articles found';
      case 'PUBLISHED': return 'No published articles found';
      case 'ARCHIVED': return 'No archived articles found';
      default: return search ? 'No articles match your search' : 'No articles in this category yet';
    }
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
          <p className="subtitle">
            {viewMode === 'categories' ? 'Manage Categories' : `Articles in ${selectedCategory?.name || ''}`}
          </p>
        </div>
        <div className="header-actions">
          {viewMode === 'articles' && canManageArticles && (
            <button className="primary" onClick={openCreateArticleModal}>
              + Create Article
            </button>
          )}
          {viewMode === 'categories' && canManageCategories && (
            <button className="primary" onClick={openCreateCategoryModal}>
              + Create Category
            </button>
          )}
          <button 
            className="secondary icon-button" 
            onClick={handleRefresh}
            disabled={refreshing || articleLoading}
            title="Refresh"
          >
            {refreshing || articleLoading ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {viewMode === 'articles' && (
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={backToCategories}>
            ← Back to Categories
          </button>
        </div>
      )}

      {/* Categories View */}
      {viewMode === 'categories' && (
        <>
          {/* Summary Cards */}
          <section className="grid cards-3">
            <div className="stat-card">
              <span>Categories</span>
              <strong>{categories.length}</strong>
              <small>Total Categories</small>
            </div>
            <div className="stat-card">
              <span>Articles</span>
              <strong>{categories.reduce((sum, c) => sum + (c.articleCount || 0), 0)}</strong>
              <small>Total Articles</small>
            </div>
            <div className="stat-card">
              <span>Active</span>
              <strong>{categories.filter(c => c.isActive).length}</strong>
              <small>Active Categories</small>
            </div>
          </section>

          {/* Category List */}
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
                <button className="primary" onClick={handleRefresh}>Retry</button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-card">
                <span className="empty-icon">📁</span>
                <h3>No Categories Found</h3>
                <p>No knowledge categories available yet.</p>
                {canManageCategories && (
                  <button className="primary" onClick={openCreateCategoryModal}>
                    Create First Category
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Articles</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                    {canManageCategories && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} onClick={() => viewCategory(category)} className="clickable-row">
                      <td><strong>{category.name}</strong></td>
                      <td className="description-cell">{category.description || '-'}</td>
                      <td className="count-cell">
                        <span className="count-badge">{category.articleCount || 0}</span>
                      </td>
                      <td>{renderStatusBadge(category.isActive ? 'Active' : 'Inactive')}</td>
                      <td>{formatDate(category.createdAt)}</td>
                      <td>{formatDate(category.updatedAt)}</td>
                      {canManageCategories && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            {canUpdateCategories && (
                              <button 
                                className="action-btn edit"
                                onClick={() => openEditCategoryModal(category)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                            {canDeleteCategories && (
                              <button 
                                className="action-btn delete"
                                onClick={() => openDeleteCategoryConfirm(category)}
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
        </>
      )}

      {/* Articles View */}
      {viewMode === 'articles' && selectedCategory && (
        <>
          {/* Article Stats - Enterprise Style */}
          <div className="stats-grid">
            <div className="stat-card stat-card-primary">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-label">Total Articles</span>
                <strong className="stat-value">{articleStats.total}</strong>
                <small className="stat-hint">In this category</small>
              </div>
            </div>
            <div className="stat-card stat-card-success">
              <div className="stat-icon">✓</div>
              <div className="stat-content">
                <span className="stat-label">Published</span>
                <strong className="stat-value">{articleStats.published}</strong>
                <small className="stat-hint">Visible to users</small>
              </div>
            </div>
            <div className="stat-card stat-card-warning">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <span className="stat-label">Draft</span>
                <strong className="stat-value">{articleStats.draft}</strong>
                <small className="stat-hint">Awaiting publication</small>
              </div>
            </div>
            <div className="stat-card stat-card-muted">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <span className="stat-label">Archived</span>
                <strong className="stat-value">{articleStats.archived}</strong>
                <small className="stat-hint">Hidden from users</small>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="filters-left">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isAdmin && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="filter-select"
                >
                  <option value="ALL">All Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              )}
            </div>
            <div className="sort-info">
              {articles.length} article{articles.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Article List */}
          {articleLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : articleError ? (
            <div className="error-state">
              <div className="error-card">
                <span className="error-icon">⚠</span>
                <h3>Error Loading Articles</h3>
                <p>{articleError}</p>
                <button className="primary" onClick={handleRefresh}>Retry</button>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-card">
                <span className="empty-icon">📄</span>
                <h3>{getEmptyMessage()}</h3>
                {canManageArticles && statusFilter === 'ALL' && !search && (
                  <button className="primary" onClick={openCreateArticleModal}>
                    Create First Article
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
                      onClick={() => handleSort('title')}
                    >
                      Title{getSortIndicator('title')}
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('status')}
                    >
                      Status{getSortIndicator('status')}
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('authorName')}
                    >
                      Created By{getSortIndicator('authorName')}
                    </th>
                    <th>Views</th>
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
                    {(canManageArticles || isAdmin) && <th className="actions-col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <button 
                          className="article-title-link"
                          onClick={() => viewArticle(article)}
                        >
                          {article.title}
                        </button>
                        {article.summary && (
                          <div className="article-summary-preview">{article.summary}</div>
                        )}
                      </td>
                      <td>{renderStatusBadge(article.status)}</td>
                      <td>{article.authorName || '-'}</td>
                      <td className="count-cell">{article.viewCount}</td>
                      <td>{formatDate(article.createdAt)}</td>
                      <td>{formatDate(article.updatedAt)}</td>
                      {(canManageArticles || isAdmin) && (
                        <td className="actions-col">
                          <div className="action-buttons">
                            <button 
                              className="action-btn view"
                              onClick={() => viewArticle(article)}
                              title="View"
                            >
                              👁️
                            </button>
                            {canUpdateArticles && (
                              <>
                                <button 
                                  className="action-btn edit"
                                  onClick={() => openEditArticleModal(article)}
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                {article.status === 'DRAFT' && (
                                  <button 
                                    className="action-btn publish"
                                    onClick={() => handlePublishArticle(article)}
                                    title="Publish"
                                  >
                                    ✓
                                  </button>
                                )}
                                {article.status === 'PUBLISHED' && (
                                  <button 
                                    className="action-btn archive"
                                    onClick={() => handleArchiveArticle(article)}
                                    title="Archive"
                                  >
                                    📦
                                  </button>
                                )}
                                {article.status === 'ARCHIVED' && (
                                  <button 
                                    className="action-btn restore"
                                    onClick={() => handleRestoreArticle(article)}
                                    title="Restore"
                                  >
                                    ↩️
                                  </button>
                                )}
                                <button 
                                  className="action-btn delete"
                                  onClick={() => openDeleteArticleConfirm(article)}
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </>
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
        </>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" className="close" onClick={closeCategoryForm}>×</button>
            </div>

            {categoryFormError && (
              <div className="form-error-banner">{categoryFormError}</div>
            )}

            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="e.g., Infrastructure"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={categoryFormData.isActive ? 'true' : 'false'}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeCategoryForm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="primary" 
                onClick={handleSaveCategory}
                disabled={savingCategory || !categoryFormData.name.trim()}
              >
                {savingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {showCategoryDelete && deletingCategory && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Category</h3>
              <button type="button" className="close" onClick={closeDeleteCategoryConfirm}>×</button>
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
              <label>Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteCategoryConfirm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={handleDeleteCategory}
                disabled={deleteConfirmText !== 'DELETE' || deletingCategoryInProgress}
              >
                {deletingCategoryInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Form Modal */}
      {showArticleForm && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="page-title-row">
              <h3>{editingArticle ? 'Edit Article' : 'Create Article'}</h3>
              <button type="button" className="close" onClick={closeArticleForm}>×</button>
            </div>

            {articleFormError && (
              <div className="form-error-banner">{articleFormError}</div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={articleFormData.title}
                  onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
                  placeholder="Article title"
                  maxLength={200}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={articleFormData.categoryId}
                  onChange={(e) => setArticleFormData({ ...articleFormData, categoryId: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Short Description *</label>
              <input
                type="text"
                value={articleFormData.summary}
                onChange={(e) => setArticleFormData({ ...articleFormData, summary: e.target.value })}
                placeholder="Brief description of the article"
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label>Content *</label>
              <div className="quill-wrapper">
                <ReactQuill
                  theme="snow"
                  value={articleFormData.body}
                  onChange={(content) => setArticleFormData({ ...articleFormData, body: content })}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your article content here..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {articleFormData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                  />
                  <button type="button" className="secondary" onClick={addTag}>Add</button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeArticleForm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => handleSaveArticle(false)}
                disabled={savingArticle}
              >
                {savingArticle ? 'Saving...' : 'Save Draft'}
              </button>
              <button 
                type="button" 
                className="primary" 
                onClick={() => handleSaveArticle(true)}
                disabled={savingArticle}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Delete Confirmation Modal */}
      {showArticleDelete && deletingArticle && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Article</h3>
              <button type="button" className="close" onClick={closeDeleteArticleConfirm}>×</button>
            </div>

            <div className="warning-box">
              <p>Are you sure you want to delete <strong>{deletingArticle.title}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>

            <div className="form-group">
              <label>Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={deleteArticleConfirmText}
                onChange={(e) => setDeleteArticleConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteArticleConfirm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={handleDeleteArticle}
                disabled={deleteArticleConfirmText !== 'DELETE' || deletingArticleInProgress}
              >
                {deletingArticleInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article View Panel */}
      {viewingArticle && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="page-title-row">
              <h3>{viewingArticle.title}</h3>
              <button type="button" className="close" onClick={() => setViewingArticle(null)}>×</button>
            </div>

            <div className="article-view">
              <div className="article-meta">
                <span className="article-category">{viewingArticle.categoryName}</span>
                {renderStatusBadge(viewingArticle.status)}
                <span className="article-views">{viewingArticle.viewCount} views</span>
              </div>

              {viewingArticle.summary && (
                <div className="article-summary">
                  <p>{viewingArticle.summary}</p>
                </div>
              )}

              {viewingArticle.tags && viewingArticle.tags.length > 0 && (
                <div className="article-tags">
                  {viewingArticle.tags.map((tag, index) => (
                    <span key={index} className="tag-static">{tag}</span>
                  ))}
                </div>
              )}

              <div 
                className="article-body"
                dangerouslySetInnerHTML={{ __html: viewingArticle.body }}
              />

              <div className="article-footer">
                <div className="article-author">
                  <span>By {viewingArticle.authorName || 'Unknown'}</span>
                  <span>Created {formatDate(viewingArticle.createdAt)}</span>
                  {viewingArticle.publishedAt && (
                    <span>Published {formatDate(viewingArticle.publishedAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {(canUpdateArticles || isAdmin) && (
              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary" 
                  onClick={() => {
                    setViewingArticle(null);
                    openEditArticleModal(viewingArticle);
                  }}
                >
                  Edit Article
                </button>
              </div>
            )}
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

        .breadcrumb {
          margin-bottom: 16px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          color: var(--brand);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        /* Enterprise Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: box-shadow 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .stat-card-primary .stat-icon {
          background: rgba(84, 104, 255, 0.1);
        }

        .stat-card-success .stat-icon {
          background: rgba(34, 197, 94, 0.1);
        }

        .stat-card-warning .stat-icon {
          background: rgba(249, 115, 22, 0.1);
        }

        .stat-card-muted .stat-icon {
          background: rgba(107, 114, 128, 0.1);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-card-primary .stat-value { color: var(--brand); }
        .stat-card-success .stat-value { color: #22c55e; }
        .stat-card-warning .stat-value { color: #f97316; }
        .stat-card-muted .stat-value { color: #6b7280; }

        .stat-hint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
        }

        /* Filters Bar */
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
        }

        .filters-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-box input {
          width: 280px;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
        }

        .filter-select {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .sort-info {
          color: var(--muted);
          font-size: 13px;
        }

        /* Table Styles */
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
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-card th {
          background: #f9fafb;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          font-weight: 600;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--line);
        }

        .table-card th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .table-card th.sortable:hover {
          background: #f3f4f6;
        }

        .table-card td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        .table-card tbody tr:last-child td {
          border-bottom: none;
        }

        .table-card tbody tr:hover {
          background: #f9fafb;
        }

        .clickable-row {
          cursor: pointer;
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
          min-width: 32px;
          padding: 4px 10px;
          background: #f3f4f6;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        /* Article Title Cell */
        .article-title-link {
          background: none;
          border: none;
          color: #111827;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          padding: 0;
          display: block;
        }

        .article-title-link:hover {
          color: var(--brand);
          text-decoration: underline;
        }

        .article-summary-preview {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Status Badges */
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.published {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.draft {
          background: #ffedd5;
          color: #9a3412;
        }

        .status-badge.archived {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* Actions Column */
        .actions-col {
          width: 160px;
          text-align: right;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
        }

        .action-btn {
          border: none;
          background: #f3f4f6;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #e5e7eb;
        }

        .action-btn.delete:hover {
          background: #fee2e2;
        }

        .action-btn.publish:hover {
          background: #dcfce7;
        }

        .action-btn.archive:hover {
          background: #ffedd5;
        }

        .action-btn.restore:hover {
          background: #e0e7ff;
        }

        /* Modals */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-large {
          max-width: 800px;
        }

        .modal.article-modal .quill-wrapper .ql-editor {
          min-height: 200px;
        }

        .page-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title-row h3 {
          margin: 0;
          font-size: 18px;
        }

        .page-title-row .close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
          padding: 0;
          line-height: 1;
        }

        .form-error-banner {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(84, 104, 255, 0.1);
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .tags-input-container {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 13px;
        }

        .tag button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--muted);
          padding: 0;
          line-height: 1;
        }

        .tag-input-row {
          display: flex;
          gap: 8px;
        }

        .tag-input-row input {
          flex: 1;
          border: none;
          padding: 4px;
        }

        .warning-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .warning-box p {
          margin: 0 0 8px 0;
          color: #92400e;
        }

        .warning-box p:last-child {
          margin-bottom: 0;
        }

        .warning-note {
          font-style: italic;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        /* Article View */
        .article-view {
          margin-bottom: 20px;
        }

        .article-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }

        .article-category {
          font-size: 13px;
          color: var(--muted);
        }

        .article-views {
          font-size: 13px;
          color: var(--muted);
          margin-left: auto;
        }

        .article-summary {
          background: #f9fafb;
          padding: 16px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .article-summary p {
          margin: 0;
          font-size: 15px;
          line-height: 1.5;
        }

        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tag-static {
          display: inline-block;
          background: var(--brand);
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
        }

        .article-body {
          line-height: 1.7;
          font-size: 15px;
        }

        .article-body h1,
        .article-body h2 {
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .article-body p {
          margin-bottom: 16px;
        }

        .article-body ul,
        .article-body ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }

        .article-body code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .article-body pre {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .article-body pre code {
          background: none;
          padding: 0;
        }

        .article-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }

        .article-author {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--muted);
        }

        /* Toast */
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
          background: #22c55e;
          color: white;
        }

        .toast-notification.error {
          background: #ef4444;
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

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .table-card {
            overflow-x: auto;
          }

          .search-box input {
            width: 200px;
          }

          .form-row-2 {
            grid-template-columns: 1fr;
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

          .filters-left {
            flex-direction: column;
          }

          .search-box input {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .article-meta {
            flex-wrap: wrap;
          }

          .article-author {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
