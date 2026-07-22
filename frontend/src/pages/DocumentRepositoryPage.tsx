import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  downloadCount?: number;
  version?: number;
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

const formatBytes = (bytes: number | undefined | null): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
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

const getFileIcon = (type: string) => {
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
  const [summary, setSummary] = useState({ 
    totalFolders: 0, 
    totalFiles: 0,
    storageUsed: 0,
    recentActivityCount: 0
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showRenameFileDialog, setShowRenameFileDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Item | null>(null);
  const [editingFile, setEditingFile] = useState<Item | null>(null);
  const [movingFile, setMovingFile] = useState<Item | null>(null);
  const [allFolders, setAllFolders] = useState<{ id: string; name: string; parentFolderId: string | null }[]>([]);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showFileActionsMenu, setShowFileActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const fileActionsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Filters - Simplified to only Calendar, From, To, Year
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('');
  
  // Generate available years from current year going back 10 years
  const availableYears = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/compliance/summary', {
        params: { folderId: currentFolderId || undefined }
      });
      setSummary(res.data || { totalFolders: 0, totalFiles: 0, storageUsed: 0, recentActivityCount: 0 });
    } catch { /* ignore */ }
  }, [currentFolderId]);

  const fetchData = useCallback(async (isRefresh = false, folderId: string | null = currentFolderId) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      let sortByParam = 'createdAt';
      let sortOrder: 'asc' | 'desc' = 'desc';
      let foldersFirst = false;

      switch (sortBy) {
        case 'name_asc': sortByParam = 'name'; sortOrder = 'asc'; break;
        case 'name_desc': sortByParam = 'name'; sortOrder = 'desc'; break;
        case 'newest': sortByParam = 'createdAt'; sortOrder = 'desc'; break;
        case 'oldest': sortByParam = 'createdAt'; sortOrder = 'asc'; break;
        case 'recent': sortByParam = 'updatedAt'; sortOrder = 'desc'; break;
        case 'largest': sortByParam = 'fileSize'; sortOrder = 'desc'; break;
        case 'smallest': sortByParam = 'fileSize'; sortOrder = 'asc'; break;
        case 'folders_first': foldersFirst = true; sortByParam = 'name'; sortOrder = 'asc'; break;
        case 'files_first': foldersFirst = true; sortByParam = 'name'; sortOrder = 'asc'; break;
      }

      // Calculate date range based on year filter
      let effectiveDateFrom = dateFrom;
      let effectiveDateTo = dateTo;
      if (yearFilter) {
        effectiveDateFrom = `${yearFilter}-01-01`;
        effectiveDateTo = `${yearFilter}-12-31`;
      }

      const res = await api.get('/compliance/items', {
        params: {
          folderId: folderId || undefined,
          search: search || undefined,
          type: 'both',
          dateFrom: effectiveDateFrom || undefined,
          dateTo: effectiveDateTo || undefined,
          sortBy: sortByParam,
          sortOrder,
          foldersFirst: foldersFirst || undefined
        }
      });

      setItems(res.data.items || []);
      // Handle both /items and /summary response formats
      const summaryData = res.data.summary || res.data || {};
      setSummary({
        totalFolders: summaryData.totalFolders ?? 0,
        totalFiles: summaryData.totalFiles ?? 0,
        storageUsed: summaryData.storageUsed ?? 0,
        recentActivityCount: summaryData.recentActivityCount ?? 0
      });
      
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
  }, [search, sortBy, dateFrom, dateTo, currentFolderId, yearFilter]);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [fetchData, fetchSummary]);

  // Menu close handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionsMenu !== null) {
        const folderActions = document.querySelectorAll('.folder-actions');
        let clickedInside = false;
        folderActions.forEach(container => {
          if (container.contains(event.target as Node)) clickedInside = true;
        });
        if (!clickedInside) setShowActionsMenu(null);
      }
      
      if (showFileActionsMenu !== null) {
        const fileActions = document.querySelectorAll('.file-actions');
        let clickedInside = false;
        fileActions.forEach(container => {
          if (container.contains(event.target as Node)) clickedInside = true;
        });
        if (!clickedInside) setShowFileActionsMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActionsMenu(null);
        setShowFileActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showActionsMenu, showFileActionsMenu]);

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
    setYearFilter('');
    fetchData(true, folderId);
  };

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

  // Download file
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    setShowFileActionsMenu(null);
    try {
      await api.post(`/compliance/files/${fileId}/download`, {
        userName: user?.name,
        userEmail: user?.email
      });
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/compliance/files/${fileId}?action=download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  };

  const openRenameFileDialog = (file: Item) => {
    setShowFileActionsMenu(null);
    setEditingFile(file);
    const nameWithoutExt = (file.originalFileName || '').replace(/\.[^/.]+$/, '');
    setNewFileName(nameWithoutExt);
    setShowRenameFileDialog(true);
  };

  const handleOpenMoveDialog = (file: Item) => {
    setShowFileActionsMenu(null);
    setMovingFile(file);
    setSelectedMoveFolder('');
    fetchAllFolders();
    setShowMoveDialog(true);
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    setShowFileActionsMenu(null);
    if (!confirm('Delete this file?')) return;

    try {
      await api.delete('/compliance/items', {
        data: { itemIds: [fileId] }
      });
      setMessage('File deleted');
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  // Rename file
  const handleRenameFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      await api.patch(`/compliance/files/${editingFile.id}`, {
        originalFileName: newFileName
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

  // Move file
  const handleMoveFile = async () => {
    if (!movingFile) return;
    setSaving(true);
    try {
      await api.patch(`/compliance/files/${movingFile.id}`, {
        folderId: selectedMoveFolder || null
      });
      setMessage('File moved successfully');
      setShowMoveDialog(false);
      setMovingFile(null);
      setSelectedMoveFolder('');
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to move file');
    } finally {
      setSaving(false);
    }
  };

  // Fetch all folders for move dialog
  const fetchAllFolders = async () => {
    try {
      const res = await api.get('/compliance/folders/all');
      setAllFolders(res.data.items || []);
    } catch { /* ignore */ }
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/compliance/folders', {
        name: newFolderName,
        description: newFolderDescription,
        parentFolderId: currentFolderId
      });
      setMessage('Folder created');
      setShowCreateDialog(false);
      setNewFolderName('');
      setNewFolderDescription('');
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setSaving(false);
    }
  };

  // Rename folder
  const handleRenameFolder = async () => {
    if (!editingFolder) return;
    setSaving(true);
    try {
      await api.patch(`/compliance/folders/${editingFolder.id}`, {
        name: newFolderName,
        description: newFolderDescription
      });
      setMessage('Folder renamed');
      setShowRenameDialog(false);
      setEditingFolder(null);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rename folder');
    } finally {
      setSaving(false);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    setShowActionsMenu(null);
    if (!confirm('Delete this folder?')) return;

    try {
      await api.delete('/compliance/items', {
        data: { itemIds: [folderId] }
      });
      setMessage('Folder deleted');
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete folder');
    }
  };

  const openRenameDialog = (folder: Item) => {
    setShowActionsMenu(null);
    setEditingFolder(folder);
    setNewFolderName(folder.name || '');
    setNewFolderDescription(folder.description || '');
    setShowRenameDialog(true);
  };

  // Upload files
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    // Include folderId if we're in a subfolder
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await api.post('/compliance/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });
      
      const uploadedCount = res.data.totalUploaded || res.data.uploaded?.length || 0;
      const errorCount = res.data.totalErrors || res.data.errors?.length || 0;
      
      if (uploadedCount > 0) {
        setMessage(`Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        const errorMsg = res.data.errors?.map((e: any) => `${e.fileName}: ${e.error}`).join('; ');
        setError(`Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}: ${errorMsg}`);
      }
      setShowUploadDialog(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Upload failed';
      setError(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Export all
  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await fetch(`/api/compliance/export?type=all`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Export completed');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSelected = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await fetch(`/api/compliance/export?type=selected&itemIds=${Array.from(selectedItems).join(',')}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected-items-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Export completed');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} items?`)) return;

    try {
      await api.delete('/compliance/items', {
        data: { itemIds: Array.from(selectedItems) }
      });
      setMessage(`Deleted ${selectedItems.size} items`);
      fetchData(true);
      fetchSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete items');
    }
  };

  const folders = items.filter(i => i.itemType === 'folder');
  const files = items.filter(i => i.itemType === 'file');
  const totalItems = items.length;
  
  const hasActiveFilters = dateFrom || dateTo || yearFilter;
  const hasSearch = search.trim() !== '';

  return (
    <div className="doc-repo-page">
      <div className="page-container">
        {/* Breadcrumbs */}
        {currentFolderId && breadcrumbs.length > 0 && (
          <div className="doc-repo-breadcrumbs">
            <div className="breadcrumb-item">
              <button type="button" className="breadcrumb-link" onClick={() => handleNavigateToFolder(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px' }}>
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Compliance
              </button>
            </div>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id || index}>
                <span className="breadcrumb-separator">›</span>
                <div className="breadcrumb-item">
                  <button type="button" className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`} onClick={() => handleNavigateToFolder(crumb.id)}>
                    {crumb.name}
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="doc-repo-summary-cards">
          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon folders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Total Folders</span>
              <span className="doc-repo-summary-value">{summary.totalFolders ?? 0}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon files">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Total Files</span>
              <span className="doc-repo-summary-value">{summary.totalFiles ?? 0}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon storage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Storage Used</span>
              <span className="doc-repo-summary-value">{formatBytes(summary.storageUsed)}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon recent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Last Updated</span>
              <span className="doc-repo-summary-value">{summary.recentActivityCount ? 'Active' : '-'}</span>
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
            {error || message}
            <button onClick={() => { setError(''); setMessage(''); }}>×</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input type="text" placeholder="Search folders and files..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button type="button" className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/></svg>
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>

            <div className="sort-dropdown">
              <button type="button" className="toolbar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
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
              </div>
            </div>

            <button type="button" className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={refreshing ? 'spin' : ''}><path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Refresh
            </button>

            {(isSuperAdmin || isAdmin) && selectedItems.size > 0 && (
              <>
                <button type="button" className="toolbar-btn" onClick={handleExportSelected} disabled={exporting}>
                  Export Selected
                </button>
                <button type="button" className="toolbar-btn danger" onClick={handleDeleteSelected}>
                  Delete ({selectedItems.size})
                </button>
              </>
            )}

            {(isSuperAdmin || isAdmin) && (
              <>
                <button type="button" className="toolbar-btn" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
                <button type="button" className="toolbar-btn" onClick={() => setShowUploadDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2"/></svg>
                  Upload
                </button>
                <button type="button" className="toolbar-btn primary" onClick={() => setShowCreateDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  New Folder
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h4>Filters</h4>
            </div>
            <div className="filters-content">
              <div className="filter-row">
                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Created Date
                  </label>
                  <div className="date-range-inputs">
                    <div className="date-input-wrapper">
                      <span className="date-label">From</span>
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <span className="date-separator">—</span>
                    <div className="date-input-wrapper">
                      <span className="date-label">To</span>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Year
                  </label>
                  <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="year-select">
                    <option value="">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <button type="button" className="clear-filters-btn" onClick={() => {
                setDateFrom('');
                setDateTo('');
                setYearFilter('');
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Clear Filters
              </button>
              <button type="button" className="apply-filters-btn" onClick={() => fetchData()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="doc-repo-grid-section">
          <div className="section-header">
            <label className="select-all-checkbox">
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              <span>Select All ({totalItems})</span>
            </label>
            <span className="section-count">{folders.length} folders · {files.length} files</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : totalItems === 0 ? (
            <div className="doc-repo-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/></svg>
              <p>{hasSearch || hasActiveFilters ? 'No items match your search' : 'No items in this folder'}</p>
              <span>Upload files or create folders to get started</span>
              {isSuperAdmin && !hasSearch && !hasActiveFilters && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
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
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/></svg>
                      </div>
                      {(isSuperAdmin || isAdmin) && (
                        <div className="folder-actions" ref={actionsMenuRef} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="actions-menu-btn" onClick={() => { setShowFileActionsMenu(null); setShowActionsMenu(showActionsMenu === item.id ? null : item.id); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>
                          </button>
                          {showActionsMenu === item.id && (
                            <div className="actions-dropdown">
                              <button onClick={() => openRenameDialog(item)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/></svg>
                                Rename
                              </button>
                              <button onClick={() => handleDeleteFolder(item.id)} className="delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/></svg>
                                Delete
                              </button>
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
                      <div className="file-icon" onClick={() => handleDownloadFile(item.id, item.originalFileName || '')}>
                        {getFileIcon(item.iconType || 'file')}
                      </div>
                      {(isSuperAdmin || isAdmin) && (
                        <div className="file-actions" ref={fileActionsMenuRef}>
                          <button type="button" className="actions-menu-btn" onClick={() => { setShowActionsMenu(null); setShowFileActionsMenu(showFileActionsMenu === item.id ? null : item.id); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>
                          </button>
                          {showFileActionsMenu === item.id && (
                            <div className="actions-dropdown">
                              <button onClick={() => handleDownloadFile(item.id, item.originalFileName || '')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/><path d="M12 15V3" stroke="currentColor" strokeWidth="2"/></svg>
                                Download
                              </button>
                              <button onClick={() => openRenameFileDialog(item)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/></svg>
                                Rename
                              </button>
                              <button onClick={() => handleOpenMoveDialog(item)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2"/></svg>
                                Move
                              </button>
                              <button onClick={() => handleDeleteFile(item.id)} className="delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/></svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="file-card-body" onClick={() => handleDownloadFile(item.id, item.originalFileName || '')}>
                      <h4 className="file-name">{item.originalFileName}</h4>
                      <div className="file-stats">
                        <span className="file-type">{item.fileExtension?.toUpperCase()}</span>
                        <span>{formatBytes(item.fileSize || 0)}</span>
                      </div>
                    </div>
                    <div className="file-card-footer">
                      <span className="file-uploader">{item.uploadedByEmail || 'Unknown'}</span>
                      <span className="file-version">v{item.version || 1}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Folder</h2>
              <button type="button" className="modal-close" onClick={() => setShowCreateDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Folder Name *</label>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowCreateDialog(false)}>Cancel</button>
              <button type="button" className="primary" onClick={handleCreateFolder} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Dialog */}
      {showRenameDialog && editingFolder && (
        <div className="modal-overlay" onClick={() => setShowRenameDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename Folder</h2>
              <button type="button" className="modal-close" onClick={() => setShowRenameDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Folder Name *</label>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowRenameDialog(false)}>Cancel</button>
              <button type="button" className="primary" onClick={handleRenameFolder} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button type="button" className="modal-close" onClick={() => !uploading && setShowUploadDialog(false)} disabled={uploading}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
            </div>
            <div className="modal-body">
              <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip" style={{ display: 'none' }} />
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2"/></svg>
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

      {/* Rename File Dialog */}
      {showRenameFileDialog && editingFile && (
        <div className="modal-overlay" onClick={() => setShowRenameFileDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Rename File</h2><button type="button" className="modal-close" onClick={() => setShowRenameFileDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>Extension: .{editingFile.fileExtension}</p>
              <div className="form-group"><label>File Name *</label><input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus /></div>
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowRenameFileDialog(false)}>Cancel</button><button type="button" className="primary" onClick={handleRenameFile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
          </div>
        </div>
      )}

      {/* Move File Dialog */}
      {showMoveDialog && movingFile && (
        <div className="modal-overlay" onClick={() => setShowMoveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Move File</h2><button type="button" className="modal-close" onClick={() => setShowMoveDialog(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button></div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>Moving: <strong>{movingFile.originalFileName}</strong></p>
              <div className="form-group"><label>Destination Folder</label><select value={selectedMoveFolder} onChange={(e) => setSelectedMoveFolder(e.target.value)}><option value="">Root</option>{allFolders.filter(f => f.id !== movingFile.folderId).map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}</select></div>
            </div>
            <div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowMoveDialog(false)}>Cancel</button><button type="button" className="primary" onClick={handleMoveFile} disabled={saving}>{saving ? 'Moving...' : 'Move File'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
