import { useState, useEffect, useMemo } from 'react';
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

export function KnowledgeCategoryPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  
  // View mode: 'categories' | 'articles'
  const [viewMode, setViewMode] = useState<'categories' | 'articles'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);

  // Permissions for category management
  const canManageCategories = hasPermission('knowledge.category:create') || hasPermission('kb:manage');
  const canUpdateCategories = hasPermission('knowledge.category:update') || hasPermission('kb:manage');
  const canDeleteCategories = hasPermission('knowledge.category:delete') || hasPermission('kb:manage');

  // Permissions for article management
  const isAdmin = isSuperAdmin || hasPermission('kb:manage');
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
  const [articleStats, setArticleStats] = useState<ArticleStats>({ total: 0, published: 0, draft: 0, archived: 0 });

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

  // Search and filter state
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load categories
  async function loadCategories() {
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
  }

  // Load articles for a category
  async function loadArticles(categoryId: string) {
    try {
      setArticleError('');
      setArticleLoading(true);

      // Load articles
      const params: Record<string, string> = { categoryId };
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
      const statsRes = await api.get('/knowledge/articles/stats', { params: { categoryId } });
      setArticleStats(statsRes.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setArticleError(axiosError.response?.data?.message || 'Failed to load articles');
    } finally {
      setArticleLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadArticles(selectedCategory.id);
    }
  }, [selectedCategory, statusFilter, search, sortBy, sortOrder]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'categories') {
      loadCategories();
    } else if (selectedCategory) {
      loadArticles(selectedCategory.id);
    }
  };

  // Navigate to articles view
  const viewCategory = (category: KnowledgeCategory) => {
    setSelectedCategory(category);
    setViewMode('articles');
    setSearch('');
    setStatusFilter('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Navigate back to categories
  const backToCategories = () => {
    setSelectedCategory(null);
    setViewMode('categories');
    setArticles([]);
    setArticleStats({ total: 0, published: 0, draft: 0, archived: 0 });
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
      if (selectedCategory) {
        loadArticles(selectedCategory.id);
      }
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
      if (selectedCategory) {
        loadArticles(selectedCategory.id);
      }
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
      if (selectedCategory) {
        loadArticles(selectedCategory.id);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to publish article');
    }
  };

  const handleArchiveArticle = async (article: KnowledgeArticle) => {
    try {
      await api.put(`/knowledge/articles/${article.id}`, { status: 'ARCHIVED' });
      showToast('success', 'Article archived successfully');
      if (selectedCategory) {
        loadArticles(selectedCategory.id);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to archive article');
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

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      // Search is applied via useEffect
    }, 300);
    setSearchTimeout(timeout);
  };

  // Sort handlers
  const handleSort = (field: 'title' | 'createdAt' | 'updatedAt' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted articles
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (search && viewMode === 'articles') {
      const searchLower = search.toLowerCase();
      result = result.filter(
        article =>
          article.title.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower) ||
          article.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [articles, search, viewMode]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusClass = status.toLowerCase();
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
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
              <span>Published</span>
              <strong>-</strong>
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
          </div>

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
                  {categories
                    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()))
                    .map((category) => (
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
          {/* Article Stats */}
          <section className="grid cards-4">
            <div className="stat-card">
              <span>Total</span>
              <strong>{articleStats.total}</strong>
              <small>Total Articles</small>
            </div>
            <div className="stat-card">
              <span>Published</span>
              <strong>{articleStats.published}</strong>
              <small>Available</small>
            </div>
            <div className="stat-card">
              <span>Draft</span>
              <strong>{articleStats.draft}</strong>
              <small>Not Published</small>
            </div>
            <div className="stat-card">
              <span>Archived</span>
              <strong>{articleStats.archived}</strong>
              <small>Archived</small>
            </div>
          </section>

          {/* Search and Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="sort-info">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
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
          ) : filteredArticles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-card">
                <span className="empty-icon">📄</span>
                <h3>No Articles Found</h3>
                <p>{search || statusFilter !== 'ALL' ? 'No articles match your search.' : 'No articles in this category yet.'}</p>
                {canManageArticles && !search && statusFilter === 'ALL' && (
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
                    <th>Category</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('status')}
                    >
                      Status{getSortIndicator('status')}
                    </th>
                    <th>Author</th>
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
                    {(canManageArticles || isAdmin) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <button 
                          className="article-title-link"
                          onClick={() => viewArticle(article)}
                        >
                          {article.title}
                        </button>
                      </td>
                      <td>{article.categoryName}</td>
                      <td>{renderStatusBadge(article.status)}</td>
                      <td>{article.authorName || '-'}</td>
                      <td className="count-cell">{article.viewCount}</td>
                      <td>{formatDate(article.createdAt)}</td>
                      <td>{formatDate(article.updatedAt)}</td>
                      {(canManageArticles || isAdmin) && (
                        <td>
                          <div className="action-buttons">
                            {canUpdateArticles && (
                              <button 
                                className="action-btn edit"
                                onClick={() => openEditArticleModal(article)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                            {article.status === 'DRAFT' && canUpdateArticles && (
                              <button 
                                className="action-btn publish"
                                onClick={() => handlePublishArticle(article)}
                                title="Publish"
                              >
                                ✓
                              </button>
                            )}
                            {article.status === 'PUBLISHED' && canUpdateArticles && (
                              <button 
                                className="action-btn archive"
                                onClick={() => handleArchiveArticle(article)}
                                title="Archive"
                              >
                                📦
                              </button>
                            )}
                            {canDeleteArticles && (
                              <button 
                                className="action-btn delete"
                                onClick={() => openDeleteArticleConfirm(article)}
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
        <div className="modal-backdrop article-modal">
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

            <div className="form-group">
              <label>Status</label>
              <select
                value={articleFormData.status}
                onChange={(e) => setArticleFormData({ ...articleFormData, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
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

        .filter-select {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          background: white;
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

        .action-btn.publish:hover {
          background: var(--success-soft);
        }

        .action-btn.archive:hover {
          background: var(--warning-soft);
        }

        .article-title-link {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          padding: 0;
        }

        .article-title-link:hover {
          color: var(--brand);
          text-decoration: underline;
        }

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

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .tags-input-container {
          border: 1px solid var(--line);
          border-radius: 10px;
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
          background: var(--panel-soft);
          padding: 4px 10px;
          border-radius: 12px;
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

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

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
          background: var(--panel-soft);
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
          border-radius: 12px;
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
          background: var(--panel-soft);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .article-body pre {
          background: var(--panel-soft);
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

          .search-box input {
            width: 100%;
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
