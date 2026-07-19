import { useState, useEffect, useCallback } from 'react';
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
  viewCount: number;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ArticleFormData {
  title: string;
  categoryId: string;
  summary: string;
  body: string;
  tags: string[];
}

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

// Constants
const DEFAULT_ARTICLE_FORM: ArticleFormData = {
  title: '',
  categoryId: '',
  summary: '',
  body: '',
  tags: []
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

type SortField = 'title' | 'createdAt' | 'updatedAt' | 'authorName' | 'categoryName';
type SortOrder = 'asc' | 'desc';

export function KnowledgeCategoryPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  
  // View mode: 'browse' = browse categories, 'articles' = view articles
  const [viewMode, setViewMode] = useState<'browse' | 'articles'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);

  // User permissions
  const canManageKB = isSuperAdmin || hasPermission('kb:manage');
  
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
  const [totalArticles, setTotalArticles] = useState(0);
  const [recentArticles, setRecentArticles] = useState(0);

  // Articles state
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState('');

  // Filters and sorting
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
      const cats = response.data.categories || [];
      setCategories(cats);
      
      // Calculate total articles
      const total = cats.reduce((sum: number, cat: KnowledgeCategory) => sum + (cat.articleCount || 0), 0);
      setTotalArticles(total);
      
      // Calculate recent articles (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Load all articles to calculate recent count
      try {
        const articlesRes = await api.get('/knowledge/articles', { 
          params: { limit: '1000', sortBy: 'createdAt', sortOrder: 'desc' } 
        });
        const allArticles = articlesRes.data.articles || [];
        const recent = allArticles.filter((a: KnowledgeArticle) => 
          new Date(a.createdAt) >= thirtyDaysAgo
        ).length;
        setRecentArticles(recent);
      } catch {
        // If we can't get articles, just use 0
        setRecentArticles(0);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load articles (optionally filtered by category)
  const loadArticles = useCallback(async () => {
    try {
      setArticleError('');
      setArticleLoading(true);

      const params: Record<string, string> = {};
      
      // Only filter by category if one is selected
      if (selectedCategory?.id) {
        params.categoryId = selectedCategory.id;
      }
      
      if (search) {
        params.search = search;
      }
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const response = await api.get('/knowledge/articles', { params });
      
      // Handle different response formats
      let articlesData = [];
      if (response.data?.articles) {
        articlesData = response.data.articles;
      } else if (Array.isArray(response.data)) {
        articlesData = response.data;
      }
      
      setArticles(articlesData);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setArticleError(axiosError.response?.data?.message || 'Failed to load articles');
      setArticles([]);
    } finally {
      setArticleLoading(false);
    }
  }, [selectedCategory?.id, search, sortBy, sortOrder]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    // Load articles when in articles view mode
    if (viewMode === 'articles') {
      loadArticles();
    }
  }, [viewMode, selectedCategory?.id, loadArticles]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'browse') {
      loadCategories();
    } else {
      loadArticles();
    }
  };

  // Navigate to articles view with selected category
  const viewCategory = (category: KnowledgeCategory) => {
    setSelectedCategory(category);
    setViewMode('articles');
    setSearch('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Navigate back to browse view
  const backToBrowse = () => {
    setSelectedCategory(null);
    setViewMode('browse');
    setArticles([]);
  };

  // View all articles (no category filter)
  const viewAllArticles = () => {
    setSelectedCategory(null);
    setViewMode('articles');
    setSearch('');
    setSortBy('createdAt');
    setSortOrder('desc');
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
      tags: article.tags || []
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

  const handleSaveArticle = async () => {
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
      const payload = {
        title: articleFormData.title.trim(),
        categoryId: articleFormData.categoryId,
        summary: articleFormData.summary.trim(),
        body: articleFormData.body,
        tags: articleFormData.tags
      };

      if (editingArticle) {
        await api.put(`/knowledge/articles/${editingArticle.id}`, payload);
        showToast('success', 'Article updated successfully');
      } else {
        await api.post('/knowledge/articles', payload);
        showToast('success', 'Article created successfully');
      }

      // Close modal first
      closeArticleForm();
      
      // Then reload both articles and category counts
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        loadArticles();
        loadCategories();
      }, 0);
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
      
      // Reload both articles and category counts
      setTimeout(() => {
        loadArticles();
        loadCategories();
      }, 0);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to delete article');
    } finally {
      setDeletingArticleInProgress(false);
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
  const getSortIndicator = (field: string) => {
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
          <p className="subtitle">
            {viewMode === 'browse' 
              ? 'Browse categories and articles' 
              : selectedCategory 
                ? `Articles in ${selectedCategory.name}` 
                : 'All articles'}
          </p>
        </div>
        <div className="header-actions">
          {viewMode === 'articles' && canManageArticles && (
            <button className="primary" onClick={openCreateArticleModal}>
              + Create Article
            </button>
          )}
          {viewMode === 'browse' && canManageCategories && (
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
          <button className="breadcrumb-link" onClick={backToBrowse}>
            ← Back to Browse Categories
          </button>
        </div>
      )}

      {/* Browse Categories View */}
      {viewMode === 'browse' && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <span className="stat-label">Categories</span>
                <strong className="stat-value">{categories.length}</strong>
                <small className="stat-hint">Total Categories</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-label">Articles</span>
                <strong className="stat-value">{totalArticles}</strong>
                <small className="stat-hint">Total Articles</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <span className="stat-label">Recent</span>
                <strong className="stat-value">{recentArticles}</strong>
                <small className="stat-hint">Added last 30 days</small>
              </div>
            </div>
          </div>

          {/* View All Articles Button */}
          <div className="browse-header">
            <h2>Browse Categories</h2>
            {totalArticles > 0 && (
              <button className="secondary" onClick={viewAllArticles}>
                View All Articles ({totalArticles})
              </button>
            )}
          </div>

          {/* Category Cards */}
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
            <div className="category-grid">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="category-card"
                  onClick={() => viewCategory(category)}
                >
                  <div className="category-card-header">
                    <h3 className="category-name">{category.name}</h3>
                    <span className="article-count-badge">
                      {category.articleCount || 0} {category.articleCount === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                  <p className="category-description">
                    {category.description || 'No description available'}
                  </p>
                  <div className="category-card-footer">
                    <div className="category-meta">
                      <span className="meta-item">
                        <span className="meta-icon">👤</span>
                        {category.createdBy || 'Unknown'}
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">📅</span>
                        {formatDate(category.updatedAt)}
                      </span>
                    </div>
                    {canManageCategories && (
                      <div className="category-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="icon-btn"
                          onClick={() => openEditCategoryModal(category)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="icon-btn delete"
                          onClick={() => openDeleteCategoryConfirm(category)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Articles View */}
      {viewMode === 'articles' && (
        <>
          {/* Article Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-label">
                  {selectedCategory ? selectedCategory.name : 'All Categories'}
                </span>
                <strong className="stat-value">{articles.length}</strong>
                <small className="stat-hint">
                  {selectedCategory ? 'In this category' : 'Total articles'}
                </small>
              </div>
            </div>
          </div>

          {/* Article List Header */}
          <div className="articles-header">
            <h2>
              {selectedCategory ? selectedCategory.name : 'All Articles'}
            </h2>
            <span className="article-count">
              Showing {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                <h3>
                  {search 
                    ? 'No articles match your search' 
                    : selectedCategory 
                      ? `No articles found in ${selectedCategory.name}` 
                      : 'No articles found'}
                </h3>
                {canManageArticles && !search && (
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
                    <th>Description</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('authorName')}
                    >
                      Created By{getSortIndicator('authorName')}
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
                      Last Updated{getSortIndicator('updatedAt')}
                    </th>
                    {canManageKB && <th className="actions-col">Actions</th>}
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
                      </td>
                      <td className="description-cell">{article.summary || '-'}</td>
                      <td>{article.authorName || '-'}</td>
                      <td>{formatDate(article.createdAt)}</td>
                      <td>{formatDate(article.updatedAt)}</td>
                      {canManageKB && (
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
                className="primary" 
                onClick={handleSaveArticle}
                disabled={savingArticle}
              >
                {savingArticle ? 'Saving...' : (editingArticle ? 'Update' : 'Save')}
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
                  <span>Updated {formatDate(viewingArticle.updatedAt)}</span>
                </div>
              </div>
            </div>

            {canUpdateArticles && (
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
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--text);
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

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          transition: box-shadow 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          background: var(--panel-soft);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        /* Browse Header */
        .browse-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .browse-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--text);
        }

        /* Articles Header */
        .articles-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .articles-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--text);
        }

        .article-count {
          color: var(--muted);
          font-size: 13px;
        }

        /* Category Grid */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        /* Category Card */
        .category-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          min-height: 160px;
        }

        .category-card:hover {
          border-color: var(--brand);
          box-shadow: 0 4px 12px rgba(84, 104, 255, 0.15);
          transform: translateY(-2px);
        }

        .category-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .category-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--text);
          line-height: 1.3;
        }

        .article-count-badge {
          background: var(--panel-soft);
          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .category-description {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 auto;
          line-height: 1.5;
          flex-grow: 1;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .category-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
        }

        .category-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .meta-icon {
          font-size: 12px;
        }

        .category-actions {
          display: flex;
          gap: 4px;
        }

        .icon-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          font-size: 14px;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .icon-btn:hover {
          background: var(--panel-soft);
        }

        .icon-btn.delete:hover {
          background: #fee2e2;
        }

        .stat-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text);
        }

        .stat-hint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
        }

        /* Filters Bar */
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .search-box input {
          width: 280px;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          background: white;
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
          width: 36px;
          height: 36px;
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
          font-weight: 600;
        }

        .error-card p,
        .empty-card p {
          color: var(--muted);
          margin: 0 0 20px 0;
          font-size: 14px;
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
          background: var(--panel-soft);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
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
          color: var(--text);
        }

        .table-card td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
          font-size: 14px;
        }

        .table-card tbody tr:last-child td {
          border-bottom: none;
        }

        .table-card tbody tr:hover {
          background: var(--panel-soft);
        }

        .clickable-row {
          cursor: pointer;
        }

        .description-cell {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--muted);
          font-size: 13px;
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
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }

        /* Article Title Cell */
        .article-title-link {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          padding: 0;
          display: block;
        }

        .article-title-link:hover {
          color: var(--brand);
        }

        /* Status Badges */
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: var(--panel-soft);
          color: #6b7280;
        }

        /* Actions Column */
        .actions-col {
          width: 120px;
          text-align: right;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
        }

        .action-btn {
          border: none;
          background: var(--panel-soft);
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: var(--line);
        }

        .action-btn.delete:hover {
          background: #fee2e2;
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

        .quill-wrapper .ql-editor {
          min-height: 180px;
          font-size: 14px;
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
          font-weight: 600;
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

        .page-title-row .close:hover {
          color: var(--text);
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
          color: var(--text);
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
          gap: 6px;
          margin-bottom: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--panel-soft);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
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
          font-size: 13px;
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
          font-size: 14px;
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
          margin-top: 24px;
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
          background: var(--panel-soft);
          padding: 16px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .article-summary p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
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
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
        }

        .article-body {
          line-height: 1.7;
          font-size: 14px;
        }

        .article-body h1,
        .article-body h2 {
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .article-body p {
          margin-bottom: 14px;
        }

        .article-body ul,
        .article-body ol {
          margin-bottom: 14px;
          padding-left: 24px;
        }

        .article-body code {
          background: var(--panel-soft);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
        }

        .article-body pre {
          background: var(--panel-soft);
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin-bottom: 14px;
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
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
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
            grid-template-columns: repeat(3, 1fr);
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
