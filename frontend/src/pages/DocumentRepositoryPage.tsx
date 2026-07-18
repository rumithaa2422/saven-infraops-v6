import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Item = {
  id: string;
  name?: string;
  description: string | null;
  parentFolderId: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  itemType: 'folder' | 'file';
  subfolderCount?: number;
  fileCount?: number;
  folderId?: string | null;
  originalFileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileSize?: number;
  iconType?: string;
  uploadedBy?: string | null;
  uploadedByEmail?: string | null;
  uploadedAt?: string;
  modifiedAt?: string;
};

type BreadcrumbItem = {
  id: string | null;
  name: string;
};

type SortOption = 
  | 'name_asc' | 'name_desc' 
  | 'newest' | 'oldest' 
  | 'recent' | 'largest' | 'smallest'
  | 'folders_first' | 'files_first';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FileIcon = ({ type }: { type: string }) => {
  const iconColors: Record<string, string> = {
    pdf: '#ef4444',
    word: '#3b82f6',
    excel: '#22c55e',
    powerpoint: '#f97316',
    image: '#8b5cf6',
    text: '#6b7280',
    archive: '#eab308',
    file: '#9ca3af'
  };
  const color = iconColors[type] || iconColors.file;

  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export function DocumentRepositoryPage() {
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [summary, setSummary] = useState({ totalFolders: 0, totalFiles: 0 });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showRenameFileDialog, setShowRenameFileDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Item | null>(null);
  const [editingFile, setEditingFile] = useState<Item | null>(null);
  const [movingFile, setMovingFile] = useState<Item | null>(null);
  const [previewFile, setPreviewFile] = useState<Item | null>(null);
  const [allFolders, setAllFolders] = useState<{ id: string; name: string; parentFolderId: string | null }[]>([]);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showFileActionsMenu, setShowFileActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const fileActionsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filters
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [contentType, setContentType] = useState<'both' | 'folders' | 'files'>('both');
  const [uploaders, setUploaders] = useState<string[]>([]);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch uploaders for filter dropdown
  const fetchUploaders = useCallback(async () => {
    try {
      const res = await api.get('/compliance/uploaders');
      setUploaders(res.data.uploaders || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUploaders();
  }, [fetchUploaders]);

  const fetchData = useCallback(async (isRefresh = false, folderId: string | null = currentFolderId) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      // Convert sort option to backend params
      let sortByParam = 'createdAt';
      let sortOrder: 'asc' | 'desc' = 'desc';
      let foldersFirst = false;

      switch (sortBy) {
        case 'name_asc':
          sortByParam = 'name';
          sortOrder = 'asc';
          break;
        case 'name_desc':
          sortByParam = 'name';
          sortOrder = 'desc';
          break;
        case 'newest':
          sortByParam = 'createdAt';
          sortOrder = 'desc';
          break;
        case 'oldest':
          sortByParam = 'createdAt';
          sortOrder = 'asc';
          break;
        case 'recent':
          sortByParam = 'updatedAt';
          sortOrder = 'desc';
          break;
        case 'largest':
          sortByParam = 'fileSize';
          sortOrder = 'desc';
          break;
        case 'smallest':
          sortByParam = 'fileSize';
          sortOrder = 'asc';
          break;
        case 'folders_first':
          foldersFirst = true;
          sortByParam = 'name';
          sortOrder = 'asc';
          break;
        case 'files_first':
          foldersFirst = true;
          sortByParam = 'name';
          sortOrder = 'asc';
          break;
      }

      // Size filter
      let sizeMin: number | undefined;
      let sizeMax: number | undefined;
      if (sizeFilter) {
        switch (sizeFilter) {
          case 'lt1mb': sizeMax = 1024 * 1024; break;
          case '1-10mb': sizeMin = 1024 * 1024; sizeMax = 10 * 1024 * 1024; break;
          case '10-50mb': sizeMin = 10 * 1024 * 1024; sizeMax = 50 * 1024 * 1024; break;
          case 'gt50mb': sizeMin = 50 * 1024 * 1024; break;
        }
      }

      const res = await api.get('/compliance/items', {
        params: {
          folderId: folderId || undefined,
          search: search || undefined,
          type: contentType,
          fileTypes: fileTypes.length > 0 ? fileTypes.join(',') : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sizeMin,
          sizeMax,
          uploadedBy: uploadedBy || undefined,
          sortBy: sortByParam,
          sortOrder,
          foldersFirst: foldersFirst || undefined
        }
      });

      setItems(res.data.items || []);
      setSummary(res.data.summary || { totalFolders: 0, totalFiles: 0 });
      
      // Get breadcrumbs
      if (folderId) {
        const breadcrumbRes = await api.get(`/compliance/folders/${folderId}/breadcrumbs`);
        setBreadcrumbs(breadcrumbRes.data.breadcrumbs || []);
      } else {
        setBreadcrumbs([]);
      }
      
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sortBy, fileTypes, dateFrom, dateTo, sizeFilter, uploadedBy, contentType, currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(null);
      }
      if (fileActionsMenuRef.current && !fileActionsMenuRef.current.contains(event.target as Node)) {
        setShowFileActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSizeFilter('');
    setUploadedBy('');
    setFileTypes([]);
    setContentType('both');
    fetchData(true, folderId);
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length && items.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
      setSelectAll(true);
    }
  };

  // Export handlers
  const handleExportSelected = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const response = await api.get('/compliance/export', {
        params: { type: 'selected', itemIds: Array.from(selectedItems).join(',') },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected-items-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage(`Exported ${selectedItems.size} item(s)`);
      setShowExportDialog(false);
    } catch (err: any) {
      setError('Failed to export');
    }
  };

  const handleExportFolder = async (folderId: string) => {
    try {
      const response = await api.get('/compliance/export', {
        params: { type: 'folder', folderId },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `folder-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Folder exported');
      setShowExportDialog(false);
    } catch (err: any) {
      setError('Failed to export folder');
    }
  };

  const handleExportCurrent = async () => {
    try {
      const params = currentFolderId 
        ? { type: 'folder', folderId: currentFolderId }
        : { type: 'all' };
      
      const response = await api.get('/compliance/export', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Exported successfully');
      setShowExportDialog(false);
    } catch (err: any) {
      setError('Failed to export');
    }
  };

  // Delete selected
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} item(s)?`)) return;

    try {
      await api.delete('/compliance/items', {
        data: { itemIds: Array.from(selectedItems) }
      });
      setMessage(`Deleted ${selectedItems.size} item(s)`);
      setSelectedItems(new Set());
      setSelectAll(false);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleExport = async () => {
    setShowExportDialog(true);
  };

  const fetchAllFolders = async () => {
    try {
      const res = await api.get('/compliance/folders/all');
      setAllFolders(res.data.items || []);
    } catch (err: any) {
      setError('Failed to load folders');
    }
  };

  const handleOpenMoveDialog = (file: Item) => {
    setMovingFile(file);
    setSelectedMoveFolder('');
    fetchAllFolders();
    setShowMoveDialog(true);
    setShowFileActionsMenu(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/compliance/folders', {
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || null,
        parentFolderId: currentFolderId
      });

      setMessage('Folder created successfully');
      setShowCreateDialog(false);
      setNewFolderName('');
      setNewFolderDescription('');
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setSaving(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch(`/compliance/folders/${editingFolder.id}`, {
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || null
      });

      setMessage('Folder renamed successfully');
      setShowRenameDialog(false);
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderDescription('');
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rename folder');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder and all its contents?')) return;

    try {
      await api.delete(`/compliance/items`, {
        data: { itemIds: [folderId] }
      });
      setMessage('Folder deleted');
      setShowActionsMenu(null);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete folder');
    }
  };

  const openRenameDialog = (folder: Item) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name || '');
    setNewFolderDescription(folder.description || '');
    setShowRenameDialog(true);
    setShowActionsMenu(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('folderId', currentFolderId || '');

    try {
      await api.post('/compliance/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });

      setMessage(`Uploaded ${files.length} file(s)`);
      setShowUploadDialog(false);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRenameFile = async () => {
    if (!editingFile || !newFileName.trim()) {
      setError('File name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch(`/compliance/files/${editingFile.id}`, {
        originalFileName: newFileName.trim()
      });

      setMessage('File renamed successfully');
      setShowRenameFileDialog(false);
      setEditingFile(null);
      setNewFileName('');
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rename file');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveFile = async () => {
    if (!movingFile) return;

    setSaving(true);
    setError('');

    try {
      await api.patch(`/compliance/files/${movingFile.id}`, {
        folderId: selectedMoveFolder || null
      });

      setMessage('File moved successfully');
      setShowMoveDialog(false);
      setMovingFile(null);
      setSelectedMoveFolder('');
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to move file');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;

    try {
      await api.delete(`/compliance/items`, {
        data: { itemIds: [fileId] }
      });
      setMessage('File deleted');
      setShowFileActionsMenu(null);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/compliance/files/${fileId}?action=download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  const handlePreviewFile = (file: Item) => {
    setPreviewFile(file);
    setShowPreviewDialog(true);
  };

  const openRenameFileDialog = (file: Item) => {
    setEditingFile(file);
    const nameWithoutExt = (file.originalFileName || '').replace(/\.[^/.]+$/, '');
    setNewFileName(nameWithoutExt);
    setShowRenameFileDialog(true);
    setShowFileActionsMenu(null);
  };

  const currentFolderName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Document Repository';
  const totalItems = items.length;
  const folders = items.filter(i => i.itemType === 'folder');
  const files = items.filter(i => i.itemType === 'file');
  
  const hasActiveFilters = fileTypes.length > 0 || dateFrom || dateTo || sizeFilter || uploadedBy || contentType !== 'both';
  const hasSearch = search.trim() !== '';

  // Get empty message
  const getEmptyMessage = () => {
    if (hasSearch || hasActiveFilters) {
      if (contentType === 'folders') return 'No folders match your search.';
      if (contentType === 'files') return 'No files match your search.';
      return 'No items match your search.';
    }
    return currentFolderId ? 'This folder is empty.' : 'No folders or files found.';
  };

  return (
    <div className="doc-repo-page">
      <div className="page-container">
        <div className="doc-repo-breadcrumbs">
          <span className="breadcrumb-item">
            <button type="button" className={`breadcrumb-link ${breadcrumbs.length === 0 ? 'active' : ''}`} onClick={() => handleNavigateToFolder(null)}>
              Document Repository
            </button>
          </span>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.id || 'root'} className="breadcrumb-item">
              <span className="breadcrumb-separator">&gt;</span>
              <button type="button" className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`} onClick={() => handleNavigateToFolder(crumb.id)}>
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        <div className="page-header">
          <div className="page-title-section">
            <h1>{currentFolderName}</h1>
            <p className="page-subtitle">
              {currentFolderId ? `${summary.totalFolders} folders, ${summary.totalFiles} files` : 'Document Repository'}
            </p>
          </div>
        </div>

        {message && (
          <div className="alert alert-success">
            {message}
            <button onClick={() => setMessage('')}>&times;</button>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')}>&times;</button>
          </div>
        )}

        <div className="doc-repo-summary-cards">
          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon folders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Folders</span>
              <span className="doc-repo-summary-value">{loading ? '...' : summary.totalFolders}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon files">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Files</span>
              <span className="doc-repo-summary-value">{loading ? '...' : summary.totalFiles}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon storage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Selected</span>
              <span className="doc-repo-summary-value">{selectedItems.size}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon recent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Total</span>
              <span className="doc-repo-summary-value">{totalItems}</span>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search folders and files..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button type="button" className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>

            <div className="sort-dropdown">
              <button type="button" className="toolbar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sort
              </button>
              <div className="sort-dropdown-content">
                <button className={sortBy === 'name_asc' ? 'active' : ''} onClick={() => handleSort('name_asc')}>Name A-Z</button>
                <button className={sortBy === 'name_desc' ? 'active' : ''} onClick={() => handleSort('name_desc')}>Name Z-A</button>
                <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => handleSort('newest')}>Newest</button>
                <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => handleSort('oldest')}>Oldest</button>
                <button className={sortBy === 'recent' ? 'active' : ''} onClick={() => handleSort('recent')}>Recently Modified</button>
                <button className={sortBy === 'largest' ? 'active' : ''} onClick={() => handleSort('largest')}>Largest File</button>
                <button className={sortBy === 'smallest' ? 'active' : ''} onClick={() => handleSort('smallest')}>Smallest File</button>
                <button className={sortBy === 'folders_first' ? 'active' : ''} onClick={() => handleSort('folders_first')}>Folders First</button>
                <button className={sortBy === 'files_first' ? 'active' : ''} onClick={() => handleSort('files_first')}>Files First</button>
              </div>
            </div>

            <button type="button" className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spin' : ''}>
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            {(isSuperAdmin || isAdmin) && selectedItems.size > 0 && (
              <>
                <button type="button" className="toolbar-btn" onClick={handleExportSelected}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Export Selected
                </button>
                <button type="button" className="toolbar-btn danger" onClick={handleDeleteSelected}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete Selected
                </button>
              </>
            )}

            {(isSuperAdmin || isAdmin) && (
              <button type="button" className="toolbar-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Export
              </button>
            )}

            {isSuperAdmin && (
              <>
                <button type="button" className="toolbar-btn" onClick={() => setShowUploadDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Upload
                </button>
                <button type="button" className="toolbar-btn primary" onClick={() => setShowCreateDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  New Folder
                </button>
              </>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Show</label>
                <select value={contentType} onChange={(e) => { setContentType(e.target.value as any); }}>
                  <option value="both">Both</option>
                  <option value="folders">Folders Only</option>
                  <option value="files">Files Only</option>
                </select>
              </div>

              <div className="filter-group">
                <label>File Type</label>
                <div className="checkbox-group">
                  {['pdf', 'word', 'excel', 'powerpoint', 'image', 'text', 'zip', 'other'].map(type => (
                    <label key={type} className="checkbox-label">
                      <input type="checkbox" checked={fileTypes.includes(type)} onChange={(e) => {
                        if (e.target.checked) setFileTypes([...fileTypes, type]);
                        else setFileTypes(fileTypes.filter(t => t !== type));
                      }} />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
                  <span>to</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
                </div>
              </div>

              <div className="filter-group">
                <label>File Size</label>
                <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
                  <option value="">Any Size</option>
                  <option value="lt1mb">Less than 1 MB</option>
                  <option value="1-10mb">1 MB - 10 MB</option>
                  <option value="10-50mb">10 MB - 50 MB</option>
                  <option value="gt50mb">Greater than 50 MB</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Uploaded By</label>
                <select value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)}>
                  <option value="">Anyone</option>
                  {uploaders.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <button type="button" className="clear-filters-btn" onClick={() => {
                setFileTypes([]);
                setDateFrom('');
                setDateTo('');
                setSizeFilter('');
                setUploadedBy('');
                setContentType('both');
              }}>Clear Filters</button>
              <button type="button" className="apply-filters-btn" onClick={() => fetchData()}>Apply Filters</button>
            </div>
          </div>
        )}

        <div className="doc-repo-grid-section">
          <div className="section-header">
            <label className="select-all-checkbox">
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              <span>Select All ({totalItems})</span>
            </label>
            <span className="section-count">{folders.length} folders, {files.length} files</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : totalItems === 0 ? (
            <div className="doc-repo-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>{getEmptyMessage()}</p>
              {isSuperAdmin && !hasSearch && !hasActiveFilters && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="secondary" onClick={() => setShowUploadDialog(true)}>Upload Files</button>
                  <button type="button" className="primary" onClick={() => setShowCreateDialog(true)}>Create Folder</button>
                </div>
              )}
            </div>
          ) : (
            <div className="doc-repo-grid">
              {items.map((item) => (
                item.itemType === 'folder' ? (
                  <div key={item.id} className={`doc-repo-folder-card ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                    <div className="item-checkbox" onClick={() => toggleSelect(item.id)}>
                      <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => {}} />
                    </div>
                    <div className="folder-card-header" onClick={() => handleNavigateToFolder(item.id)}>
                      <div className="folder-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="#5468ff" strokeWidth="2"/>
                        </svg>
                      </div>
                      {(isSuperAdmin || isAdmin) && (
                        <div className="folder-actions" ref={showActionsMenu === item.id ? undefined : actionsMenuRef} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="actions-menu-btn" onClick={(e) => { e.stopPropagation(); setShowActionsMenu(showActionsMenu === item.id ? null : item.id); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </button>
                          {showActionsMenu === item.id && (
                            <div className="actions-dropdown">
                              <button onClick={() => handleExportFolder(item.id)}>Export Folder</button>
                              <button onClick={() => openRenameDialog(item)}>Rename</button>
                              <button onClick={() => handleDeleteFolder(item.id)} className="delete">Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="folder-card-body" onClick={() => handleNavigateToFolder(item.id)}>
                      <h4 className="folder-name">{item.name}</h4>
                      {item.description && <p className="folder-description">{item.description}</p>}
                      <div className="folder-stats">
                        <span>{item.subfolderCount || 0} folders</span>
                        <span>{item.fileCount || 0} files</span>
                      </div>
                    </div>
                    <div className="folder-card-footer">
                      <span className="folder-date">Created {formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className={`doc-repo-file-card ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                    <div className="item-checkbox" onClick={() => toggleSelect(item.id)}>
                      <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => {}} />
                    </div>
                    <div className="file-card-header">
                      <div className="file-icon" onClick={() => (item.iconType === 'pdf' || item.iconType === 'image') && handlePreviewFile(item)}>
                        <FileIcon type={item.iconType || 'file'} />
                      </div>
                      {(isSuperAdmin || isAdmin) && (
                        <div className="file-actions" ref={showFileActionsMenu === item.id ? undefined : fileActionsMenuRef}>
                          <button type="button" className="actions-menu-btn" onClick={() => setShowFileActionsMenu(showFileActionsMenu === item.id ? null : item.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </button>
                          {showFileActionsMenu === item.id && (
                            <div className="actions-dropdown">
                              {(item.iconType === 'pdf' || item.iconType === 'image') && (
                                <button onClick={() => handlePreviewFile(item)}>Preview</button>
                              )}
                              <button onClick={() => handleDownloadFile(item.id, item.originalFileName || '')}>Download</button>
                              <button onClick={() => openRenameFileDialog(item)}>Rename</button>
                              <button onClick={() => handleOpenMoveDialog(item)}>Move</button>
                              <button onClick={() => handleDeleteFile(item.id)} className="delete">Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="file-card-body">
                      <h4 className="file-name">{item.originalFileName}</h4>
                      <div className="file-stats">
                        <span>{item.fileExtension?.toUpperCase()}</span>
                        <span>{formatBytes(item.fileSize || 0)}</span>
                      </div>
                    </div>
                    <div className="file-card-footer">
                      <span className="file-date">{item.uploadedByEmail || 'Unknown'}</span>
                      <span className="file-date">Modified {formatDate(item.modifiedAt)}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Folder</h2>
              <button type="button" className="modal-close" onClick={() => setShowCreateDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group"><label>Folder Name *</label><input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Enter folder name" autoFocus /></div>
              <div className="form-group"><label>Description (optional)</label><textarea value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} placeholder="Enter folder description" rows={3} /></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowCreateDialog(false)}>Cancel</button>
              <button type="button" className="primary" onClick={handleCreateFolder} disabled={saving}>{saving ? 'Creating...' : 'Create Folder'}</button>
            </div>
          </div>
        </div>
      )}

      {showRenameDialog && editingFolder && (
        <div className="modal-overlay" onClick={() => setShowRenameDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Rename Folder</h2><button type="button" className="modal-close" onClick={() => setShowRenameDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group"><label>Folder Name *</label><input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus /></div>
              <div className="form-group"><label>Description</label><textarea value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} rows={3} /></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowRenameDialog(false)}>Cancel</button>
              <button type="button" className="primary" onClick={handleRenameFolder} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {showUploadDialog && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Upload Files</h2><button type="button" className="modal-close" onClick={() => !uploading && setShowUploadDialog(false)} disabled={uploading}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="upload-dropzone">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip" disabled={uploading} style={{ display: 'none' }} />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <p>Click to select files</p>
                <span>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, TXT, ZIP (Max 50MB each)</span>
                <button type="button" className="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Select Files</button>
              </div>
              {uploading && <div className="upload-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div><span>Uploading... {uploadProgress}%</span></div>}
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowUploadDialog(false)} disabled={uploading}>Close</button></div>
          </div>
        </div>
      )}

      {showRenameFileDialog && editingFile && (
        <div className="modal-overlay" onClick={() => setShowRenameFileDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Rename File</h2><button type="button" className="modal-close" onClick={() => setShowRenameFileDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>Extension: .{editingFile.fileExtension}</p>
              <div className="form-group"><label>File Name *</label><input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus /></div>
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowRenameFileDialog(false)}>Cancel</button><button type="button" className="primary" onClick={handleRenameFile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
          </div>
        </div>
      )}

      {showMoveDialog && movingFile && (
        <div className="modal-overlay" onClick={() => setShowMoveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Move File</h2><button type="button" className="modal-close" onClick={() => setShowMoveDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <p style={{ marginBottom: '16px' }}>Moving: <strong>{movingFile.originalFileName}</strong></p>
              <div className="form-group"><label>Destination Folder</label><select value={selectedMoveFolder} onChange={(e) => setSelectedMoveFolder(e.target.value)}><option value="">Root</option>{allFolders.filter(f => f.id !== movingFile.folderId).map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}</select></div>
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowMoveDialog(false)}>Cancel</button><button type="button" className="primary" onClick={handleMoveFile} disabled={saving}>{saving ? 'Moving...' : 'Move File'}</button></div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div className="modal-overlay" onClick={() => setShowExportDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Export</h2><button type="button" className="modal-close" onClick={() => setShowExportDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              <div className="export-options">
                <button className="export-option" onClick={handleExportCurrent}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/></svg>
                  <span>Export Current View</span>
                  <small>{currentFolderId ? 'This folder and contents' : 'Entire repository'}</small>
                </button>
                {selectedItems.size > 0 && (
                  <button className="export-option" onClick={handleExportSelected}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12L12 15L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M20 20H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 4V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span>Export Selected ({selectedItems.size})</span>
                    <small>Download as ZIP</small>
                  </button>
                )}
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowExportDialog(false)}>Cancel</button></div>
          </div>
        </div>
      )}

      {showPreviewDialog && previewFile && (
        <div className="modal-overlay" onClick={() => setShowPreviewDialog(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{previewFile.originalFileName}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="toolbar-btn" onClick={() => handleDownloadFile(previewFile.id, previewFile.originalFileName || '')}>Download</button>
                <button type="button" className="modal-close" onClick={() => setShowPreviewDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
              </div>
            </div>
            <div className="modal-body preview-body">
              {(previewFile.iconType === 'pdf' || previewFile.iconType === 'image') ? (
                <iframe src={`/api/compliance/files/${previewFile.id}?action=preview`} title={previewFile.originalFileName || ''} className="preview-iframe" />
              ) : (
                <div className="preview-unavailable">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p>Preview unavailable for this file type</p>
                  <button type="button" className="primary" onClick={() => handleDownloadFile(previewFile.id, previewFile.originalFileName || '')}>Download to view</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
