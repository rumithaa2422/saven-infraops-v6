import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, knowledgeAttachmentApi } from '../services/api';
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

interface Attachment {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  uploadedAt: string;
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
  attachments?: Attachment[];
  attachmentCount?: number;
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
  
  // View mode: 'browse' = browse categories, 'articles' = view articles, 'article-detail' = read article
  const [viewMode, setViewMode] = useState<'browse' | 'articles' | 'article-detail'>('browse');
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
  const [searchInput, setSearchInput] = useState(''); // Raw input for immediate display
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Debounced search value (300ms delay)
  const debouncedSearch = useMemo(() => {
    return searchInput;
  }, [searchInput]);

  // Effect to update search after debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  // Attachment upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

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
    setSearchInput('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Navigate back to browse view
  const backToBrowse = () => {
    setViewingArticle(null);
    setSelectedCategory(null);
    setViewMode('browse');
    setArticles([]);
    setSearch('');
    setSearchInput('');
  };

  // View all articles (no category filter)
  const viewAllArticles = () => {
    setSelectedCategory(null);
    setViewMode('articles');
    setSearch('');
    setSearchInput('');
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

      let savedArticleId: string;

      if (editingArticle) {
        await api.put(`/knowledge/articles/${editingArticle.id}`, payload);
        savedArticleId = editingArticle.id;
        showToast('success', 'Article updated successfully');
      } else {
        const response = await api.post('/knowledge/articles', payload);
        savedArticleId = response.data.id;
        showToast('success', 'Article created successfully');
      }

      // Upload attachments if any selected
      if (selectedFiles.length > 0) {
        await uploadAttachments(savedArticleId);
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
      setViewingArticle(null);
      const response = await api.get(`/knowledge/articles/${article.id}`);
      setViewingArticle(response.data);
      setViewMode('article-detail');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast('error', axiosError.response?.data?.message || 'Failed to load article');
    }
  };

  // Go back to articles list from article detail
  const backToArticles = () => {
    setViewingArticle(null);
    setViewMode('articles');
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon based on MIME type
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType === 'text/plain') return '📃';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
    e.target.value = '';
  };

  // Remove file from selection
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload attachments to article
  const uploadAttachments = async (articleId: string): Promise<boolean> => {
    if (selectedFiles.length === 0) return true;

    setUploadingAttachments(true);
    try {
      const response = await knowledgeAttachmentApi.upload(articleId, selectedFiles);
      showToast('success', response.message);
      setSelectedFiles([]);
      return true;
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload attachments');
      return false;
    } finally {
      setUploadingAttachments(false);
    }
  };

  // Delete attachment
  const deleteAttachment = async (attachmentId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await knowledgeAttachmentApi.delete(attachmentId);
      showToast('success', 'Attachment deleted successfully');

      // Update viewing article attachments
      if (viewingArticle) {
        setViewingArticle({
          ...viewingArticle,
          attachments: viewingArticle.attachments?.filter(a => a.id !== attachmentId)
        });
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete attachment');
    }
  };

  // Download attachment
  const downloadAttachment = (attachmentId: string, fileName: string) => {
    const url = knowledgeAttachmentApi.getDownloadUrl(attachmentId);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {(viewMode === 'articles' || viewMode === 'article-detail') && (
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={backToBrowse}>
            ← Knowledge Base
          </button>
          {viewMode === 'article-detail' && (
            <>
              <span className="breadcrumb-separator">/</span>
              <button className="breadcrumb-link" onClick={backToArticles}>
                {selectedCategory?.name || 'All Articles'}
              </button>
            </>
          )}
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
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchInput('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="sort-info">
              {articleLoading ? (
                <span className="searching">Searching...</span>
              ) : (
                <>{articles.length} article{articles.length !== 1 ? 's' : ''} found</>
              )}
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

      {/* Article Detail View */}
      {viewMode === 'article-detail' && viewingArticle && (
        <div className="article-detail-view">
          {/* Article Header */}
          <div className="article-detail-header">
            <div className="article-detail-category">
              <span className="category-badge">{viewingArticle.categoryName}</span>
            </div>
            <h1 className="article-detail-title">{viewingArticle.title}</h1>
            {viewingArticle.summary && (
              <p className="article-detail-summary">{viewingArticle.summary}</p>
            )}
          </div>

          {/* Article Meta */}
          <div className="article-detail-meta">
            <div className="meta-left">
              <span className="meta-author">
                <span className="meta-icon">👤</span>
                {viewingArticle.authorName || 'Unknown'}
              </span>
              <span className="meta-date">
                <span className="meta-icon">📅</span>
                Created {formatDate(viewingArticle.createdAt)}
              </span>
              {viewingArticle.updatedAt !== viewingArticle.createdAt && (
                <span className="meta-date">
                  <span className="meta-icon">🔄</span>
                  Updated {formatDate(viewingArticle.updatedAt)}
                </span>
              )}
              <span className="meta-views">
                <span className="meta-icon">👁️</span>
                {viewingArticle.viewCount} views
              </span>
            </div>
            {canUpdateArticles && (
              <div className="meta-actions">
                <button 
                  className="secondary"
                  onClick={() => {
                    setViewMode('articles');
                    openEditArticleModal(viewingArticle);
                  }}
                >
                  ✏️ Edit Article
                </button>
              </div>
            )}
          </div>

          {/* Article Tags */}
          {viewingArticle.tags && viewingArticle.tags.length > 0 && (
            <div className="article-detail-tags">
              {viewingArticle.tags.map((tag, index) => (
                <span key={index} className="article-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="article-detail-content">
            <div 
              className="article-content-body"
              dangerouslySetInnerHTML={{ __html: viewingArticle.body }}
            />
          </div>

          {/* Article Attachments */}
          {(viewingArticle.attachments && viewingArticle.attachments.length > 0 || canUpdateArticles) && (
            <div className="article-attachments-section">
              <h3>Attachments</h3>
              
              {viewingArticle.attachments && viewingArticle.attachments.length > 0 && (
                <div className="attachments-list">
                  {viewingArticle.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-item">
                      <span className="attachment-icon">{getFileIcon(attachment.mimeType)}</span>
                      <div className="attachment-info">
                        <span className="attachment-name">{attachment.originalFileName}</span>
                        <span className="attachment-meta">
                          {formatFileSize(attachment.fileSize)} • Uploaded {formatDate(attachment.uploadedAt)}
                        </span>
                      </div>
                      <div className="attachment-actions">
                        <button 
                          className="btn-icon" 
                          onClick={() => downloadAttachment(attachment.id, attachment.originalFileName)}
                          title="Download"
                        >
                          ⬇️
                        </button>
                        {(hasPermission('kb:manage') || isSuperAdmin) && (
                          <button 
                            className="btn-icon danger" 
                            onClick={() => deleteAttachment(attachment.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canUpdateArticles && (
                <div className="attachment-upload-area">
                  <input
                    type="file"
                    id="attachment-upload-detail"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="attachment-upload-detail" className="upload-label">
                    + Add Attachments
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <span>{getFileIcon(file.type)} {file.name}</span>
                          <button 
                            type="button" 
                            className="btn-remove"
                            onClick={() => removeSelectedFile(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {uploadingAttachments ? (
                        <div className="upload-progress">Uploading...</div>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-upload"
                          onClick={async () => {
                            const success = await uploadAttachments(viewingArticle.id);
                            if (success) {
                              // Refresh article to get updated attachments
                              const updatedArticle = await api.get(`/knowledge/articles/${viewingArticle.id}`);
                              setViewingArticle(updatedArticle.data);
                            }
                          }}
                        >
                          Upload Selected Files
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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

            {/* Attachment Upload Section */}
            <div className="form-group">
              <label>Attachments</label>
              <div className="form-attachments">
                <input
                  type="file"
                  id="article-attachment-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="article-attachment-upload" className="upload-label">
                  + Add Attachments
                </label>
                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="selected-file">
                        <span>{getFileIcon(file.type)} {file.name}</span>
                        <button 
                          type="button" 
                          className="btn-remove"
                          onClick={() => removeSelectedFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
          gap: 16px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          font-size: 14px;
          color: var(--muted);
          pointer-events: none;
        }

        .search-box input {
          width: 320px;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 36px 10px 36px;
          font-size: 14px;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(84, 104, 255, 0.1);
        }

        .search-box input::placeholder {
          color: var(--muted);
        }

        .search-clear {
          position: absolute;
          right: 8px;
          background: var(--panel-soft);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .search-clear:hover {
          background: var(--line);
          color: var(--text);
        }

        .sort-info {
          color: var(--muted);
          font-size: 13px;
          white-space: nowrap;
        }

        .searching {
          color: var(--brand);
          font-style: italic;
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

          .search-box {
            width: 100%;
          }

          .search-box input {
            width: 100%;
          }

          .sort-info {
            text-align: center;
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

      {/* Article Detail Styles */}
      <style>{`
        /* Breadcrumb Separator */
        .breadcrumb-separator {
          color: var(--muted);
          margin: 0 8px;
        }

        /* Article Detail View */
        .article-detail-view {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }

        /* Article Detail Header */
        .article-detail-header {
          padding: 32px 32px 24px;
          border-bottom: 1px solid var(--line);
        }

        .article-detail-category {
          margin-bottom: 12px;
        }

        .category-badge {
          display: inline-block;
          background: var(--brand);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 16px;
        }

        .article-detail-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 12px 0;
          line-height: 1.3;
        }

        .article-detail-summary {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.6;
          margin: 0;
        }

        /* Article Meta */
        .article-detail-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: var(--panel-soft);
          border-bottom: 1px solid var(--line);
        }

        .meta-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .meta-author,
        .meta-date,
        .meta-views {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--muted);
        }

        .meta-icon {
          font-size: 14px;
        }

        .meta-actions {
          display: flex;
          gap: 8px;
        }

        .meta-actions button {
          font-size: 13px;
          padding: 8px 16px;
        }

        /* Article Tags */
        .article-detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 16px 32px;
          border-bottom: 1px solid var(--line);
        }

        .article-tag {
          display: inline-block;
          background: var(--panel-soft);
          color: var(--text);
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid var(--line);
        }

        /* Article Content */
        .article-detail-content {
          padding: 32px;
        }

        .article-content-body {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text);
          max-width: 800px;
        }

        .article-content-body h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 32px 0 16px;
          color: var(--text);
        }

        .article-content-body h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 28px 0 12px;
          color: var(--text);
        }

        .article-content-body h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 24px 0 10px;
          color: var(--text);
        }

        .article-content-body p {
          margin: 0 0 16px;
        }

        .article-content-body ul,
        .article-content-body ol {
          margin: 0 0 16px;
          padding-left: 24px;
        }

        .article-content-body li {
          margin-bottom: 8px;
        }

        .article-content-body code {
          background: var(--panel-soft);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
        }

        .article-content-body pre {
          background: var(--panel-soft);
          padding: 16px 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0 0 16px;
          border: 1px solid var(--line);
        }

        .article-content-body pre code {
          background: none;
          padding: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .article-content-body blockquote {
          border-left: 4px solid var(--brand);
          padding: 12px 20px;
          margin: 0 0 16px;
          background: var(--panel-soft);
          border-radius: 0 8px 8px 0;
        }

        .article-content-body blockquote p {
          margin: 0;
        }

        .article-content-body a {
          color: var(--brand);
          text-decoration: none;
        }

        .article-content-body a:hover {
          text-decoration: underline;
        }

        .article-content-body img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }

        .article-content-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 16px;
        }

        .article-content-body th,
        .article-content-body td {
          padding: 10px 14px;
          border: 1px solid var(--line);
          text-align: left;
        }

        .article-content-body th {
          background: var(--panel-soft);
          font-weight: 600;
        }

        /* Article Detail Responsive */
        @media (max-width: 768px) {
          .article-detail-header {
            padding: 24px 20px;
          }

          .article-detail-title {
            font-size: 22px;
          }

          .article-detail-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 16px 20px;
          }

          .meta-left {
            gap: 16px;
          }

          .meta-actions {
            width: 100%;
          }

          .meta-actions button {
            flex: 1;
          }

          .article-detail-tags {
            padding: 12px 20px;
          }

          .article-detail-content {
            padding: 20px;
          }

          /* Article Attachments */
          .article-attachments-section {
            padding: 20px;
            border-top: 1px solid var(--line);
            background: var(--panel-soft);
          }

          .article-attachments-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 16px;
          }

          .attachments-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }

          .attachment-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: white;
            border: 1px solid var(--line);
            border-radius: 8px;
            transition: border-color 0.15s, box-shadow 0.15s;
          }

          .attachment-item:hover {
            border-color: var(--brand);
            box-shadow: 0 2px 8px rgba(84, 104, 255, 0.08);
          }

          .attachment-icon {
            font-size: 24px;
          }

          .attachment-info {
            flex: 1;
            min-width: 0;
          }

          .attachment-name {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .attachment-meta {
            display: block;
            font-size: 12px;
            color: var(--muted);
            margin-top: 2px;
          }

          .attachment-actions {
            display: flex;
            gap: 8px;
          }

          .btn-icon {
            width: 36px;
            height: 36px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
          }

          .btn-icon:hover {
            background: var(--brand);
            border-color: var(--brand);
          }

          .btn-icon.danger:hover {
            background: var(--error);
            border-color: var(--error);
          }

          /* Attachment Upload Area */
          .attachment-upload-area {
            margin-top: 16px;
          }

          .upload-label {
            display: inline-block;
            padding: 10px 20px;
            background: white;
            border: 2px dashed var(--line);
            border-radius: 8px;
            color: var(--brand);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }

          .upload-label:hover {
            border-color: var(--brand);
            background: var(--panel-soft);
          }

          .selected-files {
            margin-top: 12px;
            padding: 12px;
            background: white;
            border: 1px solid var(--line);
            border-radius: 8px;
          }

          .selected-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--panel-soft);
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 13px;
          }

          .selected-file:last-of-type {
            margin-bottom: 0;
          }

          .selected-file span {
            display: flex;
            align-items: center;
            gap: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .btn-remove {
            background: none;
            border: none;
            font-size: 18px;
            color: var(--muted);
            cursor: pointer;
            padding: 0 4px;
          }

          .btn-remove:hover {
            color: var(--error);
          }

          .btn-upload {
            margin-top: 12px;
            padding: 10px 20px;
            background: var(--brand);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }

          .btn-upload:hover {
            background: var(--brand-dark);
          }

          .upload-progress {
            margin-top: 12px;
            padding: 12px;
            background: var(--panel-soft);
            border-radius: 8px;
            text-align: center;
            color: var(--brand);
            font-size: 14px;
          }

          /* Form Attachments */
          .form-attachments {
            margin-top: 8px;
          }

          .form-attachments .upload-label {
            display: inline-block;
            padding: 8px 16px;
            background: white;
            border: 2px dashed var(--line);
            border-radius: 6px;
            color: var(--brand);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }

          .form-attachments .upload-label:hover {
            border-color: var(--brand);
            background: var(--panel-soft);
          }

          .form-attachments .selected-files {
            margin-top: 8px;
          }

          .form-attachments .selected-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            background: var(--panel-soft);
            border-radius: 4px;
            margin-bottom: 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
