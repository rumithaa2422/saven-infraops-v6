import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Folder = {
  id: string;
  name: string;
  description: string | null;
  files: number;
  subfolders: number;
  createdAt: string;
  updatedAt: string;
  createdByEmail: string | null;
};

type RecentFolder = {
  id: string;
  name: string;
  updatedAt: string;
};

type FolderSummary = {
  totalFolders: number;
  totalFiles: number;
  storageUsed: number;
  recentlyModified: RecentFolder[];
};

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'recent';

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

export function DocumentRepositoryPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [summary, setSummary] = useState<FolderSummary>({
    totalFolders: 0,
    totalFiles: 0,
    storageUsed: 0,
    recentlyModified: []
  });

  // Search and filters
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchFolders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      // Convert sort option to backend params
      let sortByParam: string = 'createdAt';
      let sortOrder: string = 'desc';
      
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
      }

      const res = await api.get('/compliance/folders', {
        params: {
          search: search || undefined,
          sortBy: sortByParam,
          sortOrder
        }
      });

      let folderList: Folder[] = res.data.items || [];
      
      // Apply date filter on frontend (Phase 1)
      if (dateFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        folderList = folderList.filter(folder => {
          const folderDate = new Date(folder.updatedAt);
          const folderDateOnly = new Date(folderDate.getFullYear(), folderDate.getMonth(), folderDate.getDate());
          
          switch (dateFilter) {
            case 'today':
              return folderDateOnly.getTime() === today.getTime();
            case 'yesterday':
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              return folderDateOnly.getTime() === yesterday.getTime();
            case 'last7days':
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return folderDateOnly >= sevenDaysAgo;
            case 'last30days':
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return folderDateOnly >= thirtyDaysAgo;
            case 'thisMonth':
              const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              return folderDateOnly >= firstOfMonth;
            case 'thisYear':
              const firstOfYear = new Date(today.getFullYear(), 0, 1);
              return folderDateOnly >= firstOfYear;
            default:
              return true;
          }
        });
      }

      setFolders(folderList);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load folders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sortBy, dateFilter]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFolders();
  };

  const handleRefresh = () => {
    fetchFolders(true);
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/compliance/export/all', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `document-repository-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export documents');
    }
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
        description: newFolderDescription.trim() || null
      });

      setMessage('Folder created successfully');
      setShowCreateDialog(false);
      setNewFolderName('');
      setNewFolderDescription('');
      fetchFolders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create folder');
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
      fetchFolders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename folder');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      await api.delete(`/compliance/folders/${folderId}`);
      setMessage('Folder deleted successfully');
      setShowActionsMenu(null);
      fetchFolders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete folder');
    }
  };

  const openRenameDialog = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDescription(folder.description || '');
    setShowRenameDialog(true);
    setShowActionsMenu(null);
  };

  const hasActiveFilters = dateFilter !== '';

  return (
    <div className="doc-repo-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-title-section">
            <h1>Document Repository</h1>
            <p className="page-subtitle">Organize and manage your documents in folders</p>
          </div>
        </div>

        {/* Messages */}
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

        {/* Summary Cards */}
        <div className="doc-repo-summary-cards">
          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon folders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Total Folders</span>
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
              <span className="doc-repo-summary-label">Total Files</span>
              <span className="doc-repo-summary-value">{loading ? '...' : summary.totalFiles}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon storage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.27002 6.96001L11 12.01L18.73 6.96001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 12V21.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Storage Used</span>
              <span className="doc-repo-summary-value">{loading ? '...' : formatBytes(summary.storageUsed)}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon recent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Recently Modified</span>
              <span className="doc-repo-summary-value">{loading ? '...' : summary.recentlyModified.length}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search folders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button
              type="button"
              className={`toolbar-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
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
                <button className={sortBy === 'name_asc' ? 'active' : ''} onClick={() => handleSort('name_asc')}>
                  Name A-Z
                </button>
                <button className={sortBy === 'name_desc' ? 'active' : ''} onClick={() => handleSort('name_desc')}>
                  Name Z-A
                </button>
                <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => handleSort('newest')}>
                  Newest
                </button>
                <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => handleSort('oldest')}>
                  Oldest
                </button>
                <button className={sortBy === 'recent' ? 'active' : ''} onClick={() => handleSort('recent')}>
                  Recently Modified
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spin' : ''}>
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

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
              <button type="button" className="toolbar-btn primary" onClick={() => setShowCreateDialog(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Folder
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Date Filter</label>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="filter-actions">
                <button type="button" className="clear-filters-btn" onClick={() => setDateFilter('')}>
                  Clear Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={() => fetchFolders()}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Folders Grid */}
        <div className="doc-repo-grid-section">
          <div className="section-header">
            <h3>Folders</h3>
            <span className="section-count">{folders.length} items</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading folders...</p>
            </div>
          ) : folders.length === 0 && !hasActiveFilters && !search ? (
            <div className="doc-repo-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No folders yet</p>
              <span>Create your first folder to organize documents</span>
              {isSuperAdmin && (
                <button type="button" className="primary" onClick={() => setShowCreateDialog(true)}>
                  Create Folder
                </button>
              )}
            </div>
          ) : folders.length === 0 ? (
            <div className="doc-repo-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No folders match your filters</p>
              <button type="button" className="secondary" onClick={() => { setSearch(''); setDateFilter(''); fetchFolders(); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="doc-repo-grid">
              {folders.map((folder) => (
                <div key={folder.id} className="doc-repo-folder-card">
                  <div className="folder-card-header">
                    <div className="folder-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    {(isSuperAdmin || isAdmin) && (
                      <div className="folder-actions" ref={showActionsMenu === folder.id ? undefined : actionsMenuRef}>
                        <button
                          type="button"
                          className="actions-menu-btn"
                          onClick={(e) => { e.stopPropagation(); setShowActionsMenu(showActionsMenu === folder.id ? null : folder.id); }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="19" r="2" fill="currentColor"/>
                          </svg>
                        </button>
                        {showActionsMenu === folder.id && (
                          <div className="actions-dropdown">
                            <button onClick={() => openRenameDialog(folder)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Rename
                            </button>
                            <button onClick={() => handleDeleteFolder(folder.id)} className="delete">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Delete
                            </button>
                            <button>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              Properties
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="folder-card-body">
                    <h4 className="folder-name">{folder.name}</h4>
                    {folder.description && (
                      <p className="folder-description">{folder.description}</p>
                    )}
                    <div className="folder-stats">
                      <span>{folder.files} files</span>
                      <span>{folder.subfolders} subfolders</span>
                    </div>
                  </div>
                  <div className="folder-card-footer">
                    <span className="folder-date">Created {formatDate(folder.createdAt)}</span>
                    <span className="folder-date">Modified {formatDate(folder.updatedAt)}</span>
                  </div>
                </div>
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
              <h2>Create New Folder</h2>
              <button type="button" className="modal-close" onClick={() => setShowCreateDialog(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label htmlFor="folderName">Folder Name *</label>
                <input
                  type="text"
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="folderDescription">Description (optional)</label>
                <textarea
                  id="folderDescription"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Enter folder description"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleCreateFolder} disabled={saving}>
                {saving ? 'Creating...' : 'Create Folder'}
              </button>
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
              <button type="button" className="modal-close" onClick={() => setShowRenameDialog(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label htmlFor="folderName">Folder Name *</label>
                <input
                  type="text"
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="folderDescription">Description (optional)</label>
                <textarea
                  id="folderDescription"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Enter folder description"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowRenameDialog(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleRenameFolder} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
