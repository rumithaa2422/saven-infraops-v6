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
  // PART 5/6: Granular permissions - kb:manage alias still works for backward compatibility
  const canManageKB = isSuperAdmin || hasPermission('kb:manage');
  
  // Category permissions - PART 5/6: Granular permissions
  const canManageCategories = hasPermission('kb.category:create') || hasPermission('kb:manage');
  const canUpdateCategories = hasPermission('kb.category:edit') || hasPermission('kb:manage');
  const canDeleteCategories = hasPermission('kb.category:delete') || hasPermission('kb:manage');

  // Article permissions - PART 5/6: Granular permissions
  const canCreateArticles = hasPermission('kb:create') || hasPermission('kb:manage');
  const canUpdateArticles = hasPermission('kb:edit') || hasPermission('kb:manage');
  const canDeleteArticles = hasPermission('kb:delete') || hasPermission('kb:manage');
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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Attachment modals
  const [previewAttachment, setPreviewAttachment] = useState<{ id: string; name: string; url: string; type: string } | null>(null);
  const [deleteConfirmAttachment, setDeleteConfirmAttachment] = useState<{ id: string; name: string } | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);

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

  // Get category icon based on name
  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('network') || lowerName.includes('infrastructure')) return '🌐';
    if (lowerName.includes('security')) return '🔒';
    if (lowerName.includes('software') || lowerName.includes('app')) return '💻';
    if (lowerName.includes('hardware')) return '🖥️';
    if (lowerName.includes('database') || lowerName.includes('data')) return '🗄️';
    if (lowerName.includes('cloud')) return '☁️';
    if (lowerName.includes('support')) return '🎧';
    if (lowerName.includes('faq') || lowerName.includes('question')) return '❓';
    if (lowerName.includes('guide') || lowerName.includes('how')) return '📖';
    if (lowerName.includes('policy')) return '📋';
    if (lowerName.includes('training')) return '🎓';
    return '📁';
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

  // Get file type info from MIME type
  const getFileTypeInfo = (mimeType: string): { type: string; color: string; label: string } => {
    if (mimeType === 'application/pdf') return { type: 'pdf', color: '#ef4444', label: 'PDF' };
    if (mimeType.includes('word') || mimeType.includes('document')) return { type: 'word', color: '#3b82f6', label: 'Word' };
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return { type: 'excel', color: '#22c55e', label: 'Excel' };
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return { type: 'powerpoint', color: '#f97316', label: 'PPT' };
    if (mimeType.startsWith('image/')) return { type: 'image', color: '#8b5cf6', label: 'Image' };
    if (mimeType === 'text/plain') return { type: 'text', color: '#6b7280', label: 'Text' };
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return { type: 'archive', color: '#eab308', label: 'ZIP' };
    return { type: 'file', color: '#9ca3af', label: 'File' };
  };

  // Get SVG file icon based on MIME type
  const getFileIconSvg = (mimeType: string) => {
    const { type, color } = getFileTypeInfo(mimeType);
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {type === 'pdf' && <path d="M16 18V15H14.5C14.22 15 14 14.78 14 14.5V12.5C14 12.22 14.22 12 14.5 12H16V9.5C16 9.22 15.78 9 15.5 9H13.5C13.22 9 13 9.22 13 9.5V12.5H12.5C12.22 12.5 12 12.72 12 13V14.5C12 14.78 12.22 15 12.5 15H13V18C13 18.28 13.22 18.5 13.5 18.5H15.5C15.78 18.5 16 18.28 16 18Z" fill={color} opacity="0.3"/>}
        {type === 'word' && <path d="M9 15L9 9L12 9L12 15L9 15ZM9 15L12 15L12 18L9 15ZM12 10L15 10L15 13L12 13L12 10ZM12 14L15 14L15 17L12 17L12 14Z" fill={color} opacity="0.3"/>}
        {type === 'excel' && <path d="M9 9H15V12H9V9ZM9 13H15V16H9V13ZM9 16H15V19H9V16Z" fill={color} opacity="0.3"/>}
        {type === 'powerpoint' && <circle cx="12" cy="12" r="4" fill={color} opacity="0.3"/>}
        {type === 'image' && <path d="M12 15C14.21 15 16 13.21 16 11C16 8.79 14.21 7 12 7C9.79 7 8 8.79 8 11C8 13.21 9.79 15 12 15ZM12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9ZM19 19H5V5H7V17H19V19Z" fill={color} opacity="0.3"/>}
        {type === 'text' && <path d="M7 6H17V8H7V6ZM7 10H17V12H7V10ZM7 14H17V16H7V14Z" fill={color} opacity="0.3"/>}
        {type === 'archive' && <path d="M20 6H12L10 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V8C22 7.46957 21.7893 6.96086 21.4142 6.58579C21.0391 6.21071 20.5304 6 20 6ZM20 18H4V6H9L11 8H20V18Z" fill={color} opacity="0.3"/>}
      </svg>
    );
  };

  // Legacy function for compatibility
  const getFileIcon = (mimeType: string): string => {
    const { type } = getFileTypeInfo(mimeType);
    const icons: Record<string, string> = {
      pdf: '📄', word: '📝', excel: '📊', powerpoint: '📽️', image: '🖼️', text: '📃', archive: '📦', file: '📎'
    };
    return icons[type] || '📎';
  };

  // Get file extension from filename
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
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

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
  };

  // Remove file from selection
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload attachments to article
  const uploadAttachments = async (articleId: string): Promise<boolean> => {
    if (selectedFiles.length === 0) return true;

    setUploadingAttachments(true);
    setUploadProgress({});

    // Initialize progress for all files
    const initialProgress: { [key: string]: number } = {};
    selectedFiles.forEach((_, index) => {
      initialProgress[`file-${index}`] = 0;
    });
    setUploadProgress(initialProgress);

    try {
      // Simulate progress (actual upload doesn't support progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          let allDone = true;
          Object.keys(newProgress).forEach(key => {
            if (newProgress[key] < 90) {
              newProgress[key] = Math.min(90, newProgress[key] + Math.random() * 20);
            }
            if (newProgress[key] < 90) allDone = false;
          });
          return newProgress;
        });
      }, 200);

      const response = await knowledgeAttachmentApi.upload(articleId, selectedFiles);

      clearInterval(progressInterval);

      // Complete all progress
      setUploadProgress(prev => {
        const finalProgress = { ...prev };
        Object.keys(finalProgress).forEach(key => {
          finalProgress[key] = 100;
        });
        return finalProgress;
      });

      showToast('success', response.message);
      setSelectedFiles([]);
      setTimeout(() => setUploadProgress({}), 500);
      return true;
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload attachments');
      setUploadProgress({});
      return false;
    } finally {
      setUploadingAttachments(false);
    }
  };

  // Delete attachment
  const handleDeleteAttachment = async (): Promise<void> => {
    if (!deleteConfirmAttachment) return;

    setDeletingAttachment(true);
    try {
      await knowledgeAttachmentApi.delete(deleteConfirmAttachment.id);
      showToast('success', 'Attachment deleted successfully');

      // Update viewing article attachments
      if (viewingArticle) {
        setViewingArticle({
          ...viewingArticle,
          attachments: viewingArticle.attachments?.filter(a => a.id !== deleteConfirmAttachment.id)
        });
      }
      setDeleteConfirmAttachment(null);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete attachment');
    } finally {
      setDeletingAttachment(false);
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

  // Preview attachment
  const previewAttachmentFile = (attachment: Attachment) => {
    const { type } = getFileTypeInfo(attachment.mimeType);
    if (['pdf', 'image', 'text'].includes(type) || attachment.mimeType.startsWith('image/')) {
      const url = knowledgeAttachmentApi.getDownloadUrl(attachment.id);
      setPreviewAttachment({
        id: attachment.id,
        name: attachment.originalFileName,
        url,
        type: attachment.mimeType
      });
    } else {
      // For non-previewable files, just download
      downloadAttachment(attachment.id, attachment.originalFileName);
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
      <div className="kb-page-header">
        <div className="kb-header-left">
          <h1 className="kb-title">Knowledge Base</h1>
          <p className="kb-subtitle">
            {viewMode === 'browse' 
              ? 'Browse categories and articles' 
              : selectedCategory 
                ? `Articles in ${selectedCategory.name}` 
                : 'All articles'}
          </p>
        </div>
        <div className="kb-header-right">
          <button 
            className="kb-refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing || articleLoading}
            title="Refresh"
          >
            ↻
          </button>
          {viewMode === 'articles' && canManageArticles && (
            <button className="kb-create-btn" onClick={openCreateArticleModal}>
              <span>+</span> Create Article
            </button>
          )}
          {viewMode === 'browse' && canManageCategories && (
            <button className="kb-create-btn" onClick={openCreateCategoryModal}>
              <span>+</span> Create Category
            </button>
          )}
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
                <h3>Unable to Load Knowledge Categories</h3>
                <p>{error || 'Please refresh the page or contact your administrator if the issue continues.'}</p>
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
            <div className="kb-category-grid">
              {categories.map((category, index) => (
                <div 
                  key={category.id} 
                  className={`kb-category-card kb-card-${(index % 6) + 1}`}
                  onClick={() => viewCategory(category)}
                >
                  <div className="kb-card-accent"></div>
                  <div className="kb-card-content">
                    <div className="kb-card-header">
                      <div className="kb-card-icon">
                        {getCategoryIcon(category.name)}
                      </div>
                      <span className="kb-card-count">
                        {category.articleCount || 0} articles
                      </span>
                    </div>
                    <h3 className="kb-card-title">{category.name}</h3>
                    <p className="kb-card-desc">
                      {category.description || 'No description available'}
                    </p>
                  </div>
                  <div className="kb-card-footer">
                    <div className="kb-card-meta">
                      <span className="kb-meta-author">{category.createdBy || 'Unknown'}</span>
                      <span className="kb-meta-date">{formatDate(category.updatedAt)}</span>
                    </div>
                    {canManageCategories && (
                      <div className="kb-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="kb-action-btn"
                          onClick={() => openEditCategoryModal(category)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="kb-action-btn kb-delete"
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
                <h3>Unable to Load Knowledge Base Articles</h3>
                <p>{articleError || 'Please refresh the page or contact your administrator if the issue continues.'}</p>
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
                    <tr 
                      key={article.id} 
                      className="clickable-row"
                      onClick={() => viewArticle(article)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 hover:text-brand-600 transition-colors cursor-pointer">
                            {article.title}
                          </span>
                        </div>
                      </td>
                      <td className="description-cell">{article.summary || '-'}</td>
                      <td>{article.authorName || '-'}</td>
                      <td>{formatDate(article.createdAt)}</td>
                      <td>{formatDate(article.updatedAt)}</td>
                      {canManageKB && (
                        <td className="actions-col" onClick={(e) => e.stopPropagation()}>
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
          <div className="article-attachments-section">
            <div className="attachments-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Attachments
                {viewingArticle.attachments && viewingArticle.attachments.length > 0 && (
                  <span className="attachment-count">{viewingArticle.attachments.length}</span>
                )}
              </h3>
            </div>

            {/* Empty State */}
            {!viewingArticle.attachments?.length && !canUpdateArticles && (
              <div className="attachments-empty">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="empty-title">No attachments available</p>
                <p className="empty-subtitle">Upload files to provide additional resources.</p>
              </div>
            )}

            {/* Attachments List */}
            {viewingArticle.attachments && viewingArticle.attachments.length > 0 && (
              <div className="attachments-grid" role="list" aria-label="Attachments list">
                {viewingArticle.attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-card" role="listitem">
                    <div className="attachment-card-icon">
                      {getFileIconSvg(attachment.mimeType)}
                    </div>
                    <div className="attachment-card-content">
                      <button 
                        type="button"
                        className="attachment-card-name"
                        onClick={() => previewAttachmentFile(attachment)}
                        aria-label={`Preview ${attachment.originalFileName}`}
                        title="Click to preview"
                      >
                        {attachment.originalFileName}
                      </button>
                      <div className="attachment-card-meta">
                        <span className="file-type-badge" style={{ backgroundColor: getFileTypeInfo(attachment.mimeType).color + '20', color: getFileTypeInfo(attachment.mimeType).color }}>
                          {getFileTypeInfo(attachment.mimeType).label}
                        </span>
                        <span className="file-size">{formatFileSize(attachment.fileSize)}</span>
                      </div>
                      <div className="attachment-card-footer">
                        <span className="upload-info">
                          Uploaded {formatDate(attachment.uploadedAt)}
                          {attachment.uploadedBy && ` by ${attachment.uploadedBy}`}
                        </span>
                      </div>
                    </div>
                    <div className="attachment-card-actions">
                      <button 
                        className="action-btn download-btn"
                        onClick={() => downloadAttachment(attachment.id, attachment.originalFileName)}
                        title="Download"
                        aria-label={`Download ${attachment.originalFileName}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Download</span>
                      </button>
                      {/* PART 5/6: Delete attachment requires kb:delete or kb:manage */}
                      {(hasPermission('kb:delete') || hasPermission('kb:manage') || isSuperAdmin) && (
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => setDeleteConfirmAttachment({ id: attachment.id, name: attachment.originalFileName })}
                          title="Delete"
                          aria-label={`Delete ${attachment.originalFileName}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {canUpdateArticles && (
              <div className="upload-section">
                {/* Drag & Drop Zone */}
                <div 
                  className={`upload-dropzone ${isDraggingOver ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload attachments. Drag and drop files here or click to browse."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      document.getElementById('attachment-upload-detail')?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    id="attachment-upload-detail"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="file-input"
                    aria-hidden="true"
                  />
                  <div className="dropzone-content">
                    <div className="dropzone-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="dropzone-text">
                      <p className="dropzone-primary">
                        <strong>Drag & Drop</strong> or <span className="browse-link">click to browse</span>
                      </p>
                      <p className="dropzone-secondary">
                        Support: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, PNG, JPG
                      </p>
                      <p className="dropzone-limit">Maximum file size: 25 MB</p>
                    </div>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="selected-files-list">
                    <div className="selected-files-header">
                      <span>Selected files ({selectedFiles.length})</span>
                      {!uploadingAttachments && (
                        <button 
                          type="button" 
                          className="clear-all-btn"
                          onClick={() => setSelectedFiles([])}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="selected-files-grid">
                      {selectedFiles.map((file, index) => {
                        const progress = uploadProgress[`file-${index}`];
                        const isUploading = progress !== undefined && progress < 100;
                        const isComplete = progress === 100;
                        return (
                          <div key={index} className={`selected-file-card ${isComplete ? 'complete' : ''}`}>
                            <div className="selected-file-icon">
                              {getFileIconSvg(file.type)}
                            </div>
                            <div className="selected-file-info">
                              <span className="selected-file-name" title={file.name}>{file.name}</span>
                              <span className="selected-file-meta">
                                <span className="file-type-badge-small" style={{ backgroundColor: getFileTypeInfo(file.type).color + '20', color: getFileTypeInfo(file.type).color }}>
                                  {getFileTypeInfo(file.type).label}
                                </span>
                                <span className="file-size-small">{formatFileSize(file.size)}</span>
                              </span>
                              {isUploading && (
                                <div className="progress-bar-container">
                                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                                </div>
                              )}
                              {isComplete && <span className="upload-complete">Uploaded</span>}
                            </div>
                            {!isUploading && !isComplete && (
                              <button 
                                type="button" 
                                className="remove-file-btn"
                                onClick={() => removeSelectedFile(index)}
                                aria-label={`Remove ${file.name}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                            {isUploading && (
                              <div className="upload-spinner"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!uploadingAttachments && (
                      <button 
                        type="button" 
                        className="upload-btn"
                        onClick={async () => {
                          const success = await uploadAttachments(viewingArticle.id);
                          if (success) {
                            const updatedArticle = await api.get(`/knowledge/articles/${viewingArticle.id}`);
                            setViewingArticle(updatedArticle.data);
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                      </button>
                    )}
                    {uploadingAttachments && (
                      <div className="uploading-status">
                        <div className="spinner"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Form Modal - Modern Design */}
      {showCategoryForm && (
        <div className="kb-modal-backdrop" onClick={closeCategoryForm}>
          <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="kb-modal-header">
              <div className="kb-modal-icon">
                {editingCategory ? '📝' : '📁'}
              </div>
              <div className="kb-modal-title-area">
                <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
                <p>{editingCategory ? 'Update category details' : 'Add a new knowledge category'}</p>
              </div>
              <button type="button" className="kb-modal-close" onClick={closeCategoryForm}>
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="kb-modal-body">
              {categoryFormError && (
                <div className="kb-modal-error">{categoryFormError}</div>
              )}

              <div className="kb-form-group">
                <label>
                  <span className="kb-label-icon">🏷️</span>
                  Category Name <span className="kb-required">*</span>
                </label>
                <input
                  type="text"
                  className="kb-input"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Enter category name..."
                  maxLength={100}
                  autoFocus
                />
                <span className="kb-input-hint">Max 100 characters</span>
              </div>

              <div className="kb-form-group">
                <label>
                  <span className="kb-label-icon">📝</span>
                  Description
                </label>
                <textarea
                  className="kb-textarea"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Add a brief description for this category..."
                  rows={3}
                />
              </div>

              <div className="kb-form-group">
                <label>
                  <span className="kb-label-icon">📊</span>
                  Status
                </label>
                <div className="kb-toggle-group">
                  <button
                    type="button"
                    className={`kb-toggle-btn ${categoryFormData.isActive ? 'active' : ''}`}
                    onClick={() => setCategoryFormData({ ...categoryFormData, isActive: true })}
                  >
                    <span className="kb-toggle-dot green"></span>
                    Active
                  </button>
                  <button
                    type="button"
                    className={`kb-toggle-btn ${!categoryFormData.isActive ? 'active' : ''}`}
                    onClick={() => setCategoryFormData({ ...categoryFormData, isActive: false })}
                  >
                    <span className="kb-toggle-dot gray"></span>
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="kb-modal-footer">
              <button type="button" className="kb-btn-secondary" onClick={closeCategoryForm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="kb-btn-primary" 
                onClick={handleSaveCategory}
                disabled={savingCategory || !categoryFormData.name.trim()}
              >
                {savingCategory ? (
                  <>
                    <span className="kb-btn-spinner"></span>
                    Saving...
                  </>
                ) : editingCategory ? (
                  <>
                    <span>✓</span>
                    Update Category
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Create Category
                  </>
                )}
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
              <label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Attachments
              </label>
              <div className="form-attachments">
                {/* Drop Zone */}
                <div 
                  className={`form-dropzone ${isDraggingOver ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload attachments. Drag and drop files here or click to browse."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      document.getElementById('article-attachment-upload')?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    id="article-attachment-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="file-input"
                    aria-hidden="true"
                  />
                  <div className="form-dropzone-content">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Drag & drop files or <span className="browse-link">browse</span></span>
                    <span className="form-dropzone-limit">Max 25 MB per file</span>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="form-selected-files">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="form-selected-file">
                        <div className="form-file-icon">
                          {getFileIconSvg(file.type)}
                        </div>
                        <div className="form-file-info">
                          <span className="form-file-name">{file.name}</span>
                          <span className="form-file-meta">
                            <span className="file-type-badge-small" style={{ backgroundColor: getFileTypeInfo(file.type).color + '20', color: getFileTypeInfo(file.type).color }}>
                              {getFileTypeInfo(file.type).label}
                            </span>
                            <span className="file-size-small">{formatFileSize(file.size)}</span>
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className="form-remove-btn"
                          onClick={() => removeSelectedFile(index)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
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
                disabled={savingArticle || uploadingAttachments}
              >
                {savingArticle ? 'Saving...' : (uploadingAttachments ? 'Uploading...' : (editingArticle ? 'Update' : 'Save'))}
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

      {/* Attachment Delete Confirmation Modal */}
      {deleteConfirmAttachment && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-attachment-title">
          <div className="modal modal-confirm">
            <div className="modal-confirm-header">
              <div className="modal-confirm-icon danger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 id="delete-attachment-title">Delete Attachment?</h3>
            </div>
            <div className="modal-confirm-body">
              <p className="modal-confirm-filename">{deleteConfirmAttachment.name}</p>
              <p className="modal-confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-confirm-actions">
              <button 
                type="button" 
                className="secondary"
                onClick={() => setDeleteConfirmAttachment(null)}
                disabled={deletingAttachment}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="danger"
                onClick={handleDeleteAttachment}
                disabled={deletingAttachment}
              >
                {deletingAttachment ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="modal-backdrop preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div className="modal modal-preview">
            <div className="modal-preview-header">
              <h3 id="preview-title">{previewAttachment.name}</h3>
              <button 
                type="button" 
                className="close-preview"
                onClick={() => setPreviewAttachment(null)}
                aria-label="Close preview"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-preview-content">
              {previewAttachment.type.startsWith('image/') && (
                <img src={previewAttachment.url} alt={previewAttachment.name} className="preview-image" />
              )}
              {previewAttachment.type === 'application/pdf' && (
                <iframe src={previewAttachment.url} className="preview-pdf" title={previewAttachment.name} />
              )}
              {previewAttachment.type === 'text/plain' && (
                <iframe src={previewAttachment.url} className="preview-text" title={previewAttachment.name} />
              )}
            </div>
            <div className="modal-preview-footer">
              <button 
                type="button" 
                className="secondary"
                onClick={() => setPreviewAttachment(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="primary"
                onClick={() => {
                  downloadAttachment(previewAttachment.id, previewAttachment.name);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Page Header - Enterprise Style */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 24px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #1e293b;
        }

        .page-header .subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .breadcrumb {
          margin-bottom: 16px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          color: #5469f5;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        /* Stats Grid - Enterprise Style */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
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
          background: #f1f5f9;
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
          color: #1e293b;
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
          color: #1e293b;
        }

        .article-count {
          color: #64748b;
          font-size: 13px;
        }

        /* ===== MODERN KB PAGE HEADER ===== */
        .kb-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding: 24px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .kb-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kb-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .kb-subtitle {
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          margin: 0;
        }

        .kb-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kb-refresh-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kb-refresh-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: rotate(180deg);
        }

        .kb-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .kb-create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .kb-create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .kb-create-btn span {
          font-size: 18px;
          font-weight: 700;
        }

        /* ===== MODERN CATEGORY GRID ===== */
        .kb-category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        /* ===== MODERN COLORFUL CATEGORY CARDS ===== */
        .kb-category-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          min-height: 200px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .kb-category-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }

        /* Colorful accent bars */
        .kb-card-1 .kb-card-accent { background: linear-gradient(90deg, #667eea, #764ba2); }
        .kb-card-2 .kb-card-accent { background: linear-gradient(90deg, #f093fb, #f5576c); }
        .kb-card-3 .kb-card-accent { background: linear-gradient(90deg, #4facfe, #00f2fe); }
        .kb-card-4 .kb-card-accent { background: linear-gradient(90deg, #43e97b, #38f9d7); }
        .kb-card-5 .kb-card-accent { background: linear-gradient(90deg, #fa709a, #fee140); }
        .kb-card-6 .kb-card-accent { background: linear-gradient(90deg, #a8edea, #fed6e3); }

        .kb-card-1:hover { box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25); }
        .kb-card-2:hover { box-shadow: 0 12px 32px rgba(245, 87, 108, 0.25); }
        .kb-card-3:hover { box-shadow: 0 12px 32px rgba(79, 172, 254, 0.25); }
        .kb-card-4:hover { box-shadow: 0 12px 32px rgba(67, 233, 123, 0.25); }
        .kb-card-5:hover { box-shadow: 0 12px 32px rgba(250, 112, 154, 0.25); }
        .kb-card-6:hover { box-shadow: 0 12px 32px rgba(168, 237, 234, 0.25); }

        .kb-card-accent {
          height: 6px;
          width: 100%;
        }

        .kb-card-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .kb-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .kb-card-icon {
          font-size: 32px;
          line-height: 1;
        }

        .kb-card-count {
          background: #f1f5f9;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .kb-card-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #1e293b;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .kb-card-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
          flex: 1;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .kb-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }

        .kb-card-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kb-meta-author {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .kb-meta-date {
          font-size: 11px;
          color: #94a3b8;
        }

        .kb-card-actions {
          display: flex;
          gap: 6px;
        }

        .kb-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #e2e8f0;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .kb-action-btn:hover {
          background: #cbd5e1;
          transform: scale(1.1);
        }

        .kb-action-btn.kb-delete:hover {
          background: #fee2e2;
        }

        /* Stats label */
        .stat-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
          color: #1e293b;
        }

        .stat-hint {
          font-size: 12px;
          color: #94a3b8;
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
          color: #94a3b8;
          pointer-events: none;
        }

        .search-box input {
          width: 320px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 36px 10px 36px;
          font-size: 14px;
          background: white;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #5469f5;
          box-shadow: 0 0 0 3px rgba(84, 104, 255, 0.1);
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .search-clear {
          position: absolute;
          right: 8px;
          background: #f8fafc;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .search-clear:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .sort-info {
          color: #64748b;
          font-size: 13px;
          white-space: nowrap;
        }

        .searching {
          color: #5469f5;
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
          border: 3px solid #e2e8f0;
          border-top-color: #5469f5;
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
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
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
          color: #64748b;
          margin: 0 0 20px 0;
          font-size: 14px;
        }

        /* Table Card - Enterprise Style */
        .table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .table-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-card th {
          background: #f8fafc;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 600;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-card th.sortable {
          cursor: pointer;
          user-select: none;
          transition: all 0.15s;
        }

        .table-card th.sortable:hover {
          color: #1e293b;
          background: #f1f5f9;
        }

        .table-card td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 14px;
          color: #475569;
        }

        .table-card tbody tr:last-child td {
          border-bottom: none;
        }

        .table-card tbody tr {
          transition: all 0.15s;
        }

        .table-card tbody tr:hover {
          background: #f8fafc;
        }

        .clickable-row {
          cursor: pointer;
        }

        .clickable-row:hover td {
          background: #f1f5f9;
        }

        .description-cell {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #64748b;
          font-size: 13px;
        }

        .count-cell {
          text-align: center;
        }

        .count-badge {
          display: inline-block;
          min-width: 28px;
          padding: 4px 8px;
          background: #f8fafc;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Article Title Cell */
        .article-title-link {
          background: none;
          border: none;
          color: #1e293b;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          padding: 0;
          display: block;
        }

        .article-title-link:hover {
          color: #5469f5;
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
          background: #f8fafc;
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
          background: #f8fafc;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: #e2e8f0;
        }

        .action-btn.delete:hover {
          background: #fee2e2;
        }

        /* ===== MODERN MODAL STYLES ===== */
        .kb-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .kb-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Modal Header */
        .kb-modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .kb-modal-icon {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .kb-modal-title-area {
          flex: 1;
        }

        .kb-modal-title-area h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .kb-modal-title-area p {
          margin: 0;
          font-size: 13px;
          opacity: 0.85;
        }

        .kb-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kb-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        /* Modal Body */
        .kb-modal-body {
          padding: 24px;
        }

        .kb-modal-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .kb-form-group {
          margin-bottom: 20px;
        }

        .kb-form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .kb-label-icon {
          font-size: 16px;
        }

        .kb-required {
          color: #ef4444;
        }

        .kb-input,
        .kb-textarea {
          width: 100%;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          color: #1f2937;
          background: #f9fafb;
          transition: all 0.2s;
        }

        .kb-input:focus,
        .kb-textarea:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .kb-input::placeholder,
        .kb-textarea::placeholder {
          color: #9ca3af;
        }

        .kb-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .kb-input-hint {
          display: block;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 6px;
        }

        /* Toggle Group */
        .kb-toggle-group {
          display: flex;
          gap: 10px;
        }

        .kb-toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .kb-toggle-btn:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .kb-toggle-btn.active {
          border-color: #667eea;
          background: #eef2ff;
          color: #667eea;
        }

        .kb-toggle-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .kb-toggle-dot.green {
          background: #22c55e;
        }

        .kb-toggle-dot.gray {
          background: #9ca3af;
        }

        /* Modal Footer */
        .kb-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .kb-btn-secondary {
          padding: 12px 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .kb-btn-secondary:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .kb-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .kb-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .kb-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .kb-btn-primary span {
          font-size: 16px;
          font-weight: 700;
        }

        .kb-btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Legacy modal styles (keep for other modals) */
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
          color: #64748b;
          padding: 0;
          line-height: 1;
        }

        .page-title-row .close:hover {
          color: #1e293b;
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
          color: #1e293b;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5469f5;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .tags-input-container {
          border: 1px solid #e2e8f0;
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
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .tag button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #64748b;
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
          border-bottom: 1px solid #e2e8f0;
        }

        .article-category {
          font-size: 13px;
          color: #64748b;
        }

        .article-views {
          font-size: 13px;
          color: #64748b;
          margin-left: auto;
        }

        .article-summary {
          background: #f8fafc;
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
          background: #5469f5;
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
          background: #f8fafc;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
        }

        .article-body pre {
          background: #f8fafc;
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
          border-top: 1px solid #e2e8f0;
        }

        .article-author {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #64748b;
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
          color: #64748b;
          margin: 0 8px;
        }

        /* Article Detail View - Enterprise Style */
        .article-detail-view {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* Article Detail Header */
        .article-detail-header {
          padding: 32px;
          border-bottom: 1px solid #f1f5f9;
        }

        .article-detail-category {
          margin-bottom: 16px;
        }

        .category-badge {
          display: inline-block;
          background: #5469f5;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
        }

        .article-detail-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px 0;
          line-height: 1.3;
        }

        .article-detail-summary {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        /* Article Meta */
        .article-detail-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
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
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }

        .meta-icon {
          font-size: 16px;
        }

        .meta-actions {
          display: flex;
          gap: 12px;
        }

        .meta-actions button {
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 500;
        }

        /* Article Tags */
        .article-detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 20px 32px;
          border-bottom: 1px solid #f1f5f9;
        }

        .article-tag {
          display: inline-block;
          background: #f1f5f9;
          color: #475569;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        /* Article Content */
        .article-detail-content {
          padding: 32px;
        }

        .article-content-body {
          font-size: 15px;
          line-height: 1.8;
          color: #1e293b;
          max-width: 800px;
        }

        .article-content-body h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 32px 0 16px;
          color: #1e293b;
        }

        .article-content-body h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 28px 0 12px;
          color: #1e293b;
        }

        .article-content-body h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 24px 0 10px;
          color: #1e293b;
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
          background: #f8fafc;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
        }

        .article-content-body pre {
          background: #f8fafc;
          padding: 16px 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0 0 16px;
          border: 1px solid #e2e8f0;
        }

        .article-content-body pre code {
          background: none;
          padding: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .article-content-body blockquote {
          border-left: 4px solid #5469f5;
          padding: 12px 20px;
          margin: 0 0 16px;
          background: #f8fafc;
          border-radius: 0 8px 8px 0;
        }

        .article-content-body blockquote p {
          margin: 0;
        }

        .article-content-body a {
          color: #5469f5;
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
          border: 1px solid #e2e8f0;
          text-align: left;
        }

        .article-content-body th {
          background: #f8fafc;
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
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
          }

          .article-attachments-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .attachment-count {
            background: #5469f5;
            color: white;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 4px;
          }

          /* Empty State */
          .attachments-empty {
            text-align: center;
            padding: 48px 24px;
            background: white;
            border: 1px dashed #e2e8f0;
            border-radius: 12px;
          }

          .empty-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: #f8fafc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
          }

          .empty-title {
            font-size: 15px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 4px;
          }

          .empty-subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }

          /* Attachments Grid */
          .attachments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }

          .attachment-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            gap: 12px;
            transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
          }

          .attachment-card:hover {
            border-color: #5469f5;
            box-shadow: 0 4px 12px rgba(84, 104, 255, 0.1);
            transform: translateY(-1px);
          }

          .attachment-card-icon {
            flex-shrink: 0;
          }

          .attachment-card-content {
            flex: 1;
            min-width: 0;
          }

          .attachment-card-name {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            text-align: left;
            width: 100%;
          }

          .attachment-card-name:hover {
            color: #5469f5;
            text-decoration: underline;
          }

          .attachment-card-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
          }

          .file-type-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
          }

          .file-size {
            font-size: 12px;
            color: #64748b;
          }

          .attachment-card-footer {
            margin-top: 8px;
          }

          .upload-info {
            font-size: 11px;
            color: #64748b;
          }

          .attachment-card-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            border: none;
          }

          .action-btn.download-btn {
            background: #5469f5;
            color: white;
          }

          .action-btn.download-btn:hover {
            background: #4758e6;
          }

          .action-btn.delete-btn {
            background: white;
            color: #dc2626;
            border: 1px solid #e2e8f0;
          }

          .action-btn.delete-btn:hover {
            background: #dc2626;
            color: white;
            border-color: #dc2626;
          }

          /* Upload Section */
          .upload-section {
            margin-top: 24px;
          }

          .upload-dropzone {
            border: 2px dashed #e2e8f0;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
          }

          .upload-dropzone:hover,
          .upload-dropzone.dragging {
            border-color: #5469f5;
            background: rgba(84, 104, 255, 0.02);
          }

          .upload-dropzone.dragging {
            border-style: solid;
            background: rgba(84, 104, 255, 0.05);
          }

          .file-input {
            display: none;
          }

          .dropzone-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .dropzone-icon {
            width: 56px;
            height: 56px;
            background: #f8fafc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #5469f5;
          }

          .dropzone-text {
            text-align: center;
          }

          .dropzone-primary {
            font-size: 14px;
            color: #1e293b;
            margin: 0 0 4px;
          }

          .browse-link {
            color: #5469f5;
            cursor: pointer;
          }

          .browse-link:hover {
            text-decoration: underline;
          }

          .dropzone-secondary {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }

          .dropzone-limit {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0;
          }

          /* Selected Files */
          .selected-files-list {
            margin-top: 16px;
          }

          .selected-files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
          }

          .clear-all-btn {
            background: none;
            border: none;
            color: #5469f5;
            font-size: 12px;
            cursor: pointer;
          }

          .clear-all-btn:hover {
            text-decoration: underline;
          }

          .selected-files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
          }

          .selected-file-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            transition: all 0.15s;
          }

          .selected-file-card:hover {
            border-color: #5469f5;
          }

          .selected-file-card.complete {
            background: rgba(34, 197, 94, 0.05);
            border-color: rgba(34, 197, 94, 0.3);
          }

          .selected-file-icon {
            flex-shrink: 0;
          }

          .selected-file-info {
            flex: 1;
            min-width: 0;
          }

          .selected-file-name {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .selected-file-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 4px;
          }

          .file-type-badge-small {
            font-size: 9px;
            font-weight: 600;
            padding: 1px 4px;
            border-radius: 3px;
            text-transform: uppercase;
          }

          .file-size-small {
            font-size: 11px;
            color: #64748b;
          }

          .progress-bar-container {
            width: 100%;
            height: 4px;
            background: #f8fafc;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
          }

          .progress-bar {
            height: 100%;
            background: #5469f5;
            border-radius: 2px;
            transition: width 0.2s;
          }

          .upload-complete {
            display: inline-block;
            font-size: 11px;
            color: #22c55e;
            font-weight: 500;
            margin-top: 4px;
          }

          .remove-file-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #64748b;
            border-radius: 4px;
            transition: all 0.15s;
          }

          .remove-file-btn:hover {
            color: #dc2626;
            background: rgba(239, 68, 68, 0.1);
          }

          .upload-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #e2e8f0;
            border-top-color: #5469f5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .upload-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            background: #5469f5;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }

          .upload-btn:hover {
            background: #4758e6;
          }

          .uploading-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 14px;
            color: #5469f5;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #e2e8f0;
            border-top-color: #5469f5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          /* Form Attachments */
          .form-attachments {
            margin-top: 8px;
          }

          .form-dropzone {
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: #f8fafc;
          }

          .form-dropzone:hover,
          .form-dropzone.dragging {
            border-color: #5469f5;
            background: rgba(84, 104, 255, 0.05);
          }

          .form-dropzone-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 13px;
          }

          .form-dropzone-content svg {
            color: #5469f5;
          }

          .form-dropzone-limit {
            font-size: 11px;
            color: #64748b;
          }

          .form-selected-files {
            margin-top: 12px;
          }

          .form-selected-file {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 8px;
          }

          .form-file-icon {
            flex-shrink: 0;
          }

          .form-file-info {
            flex: 1;
            min-width: 0;
          }

          .form-file-name {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .form-file-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 4px;
          }

          .form-remove-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #64748b;
            border-radius: 4px;
            transition: all 0.15s;
          }

          .form-remove-btn:hover {
            color: #dc2626;
            background: rgba(239, 68, 68, 0.1);
          }

          /* Modal Confirm */
          .modal-confirm {
            max-width: 400px;
            text-align: center;
          }

          .modal-confirm-header {
            margin-bottom: 16px;
          }

          .modal-confirm-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-confirm-icon.danger {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
          }

          .modal-confirm-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }

          .modal-confirm-body {
            margin-bottom: 24px;
          }

          .modal-confirm-filename {
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
            margin: 0 0 8px;
            word-break: break-all;
          }

          .modal-confirm-warning {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }

          .modal-confirm-actions {
            display: flex;
            gap: 12px;
          }

          .modal-confirm-actions button {
            flex: 1;
          }

          /* Preview Modal */
          .preview-backdrop {
            background: rgba(0, 0, 0, 0.8);
          }

          .modal-preview {
            width: 90%;
            max-width: 1000px;
            height: 85vh;
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 12px;
            overflow: hidden;
          }

          .modal-preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-preview-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .close-preview {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: #64748b;
            border-radius: 6px;
            transition: all 0.15s;
          }

          .close-preview:hover {
            background: #f8fafc;
            color: #1e293b;
          }

          .modal-preview-content {
            flex: 1;
            overflow: auto;
            background: #f8fafc;
          }

          .preview-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .preview-pdf,
          .preview-text {
            width: 100%;
            height: 100%;
            border: none;
          }

          .modal-preview-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px 20px;
            border-top: 1px solid #e2e8f0;
            background: white;
          }

          .modal-preview-footer button {
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
