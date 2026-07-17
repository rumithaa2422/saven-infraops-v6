import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: { role: { name: string } }[];
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client?: string;
  ownerName?: string;
  description?: string;
  department?: string;
  technologyStack?: string;
  priority: string;
  status: string;
  budget?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  projectType?: string;
  projectLocation?: string;
  remarks?: string;
  managerId?: string;
  teamMemberIds?: string;
  manager?: User | null;
  teamMembers?: User[];
  createdAt: string;
  updatedAt: string;
};

type Assignment = {
  id: string;
  inventory: {
    id: string;
    itemNo: string;
    itemName: string;
    status: string;
    warrantyExpiry?: string;
    category?: { id: string; name: string };
    subcategory?: { id: string; name: string };
  };
  user?: { id: string; name: string; email: string };
  project?: { id: string; projectName: string; projectCode: string };
  assignedDate: string;
  status: string;
};

type AssetSummary = {
  totalAssets: number;
  uniqueUsers: number;
  underRepair: number;
  warrantyExpiring: number;
};

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docSortBy, setDocSortBy] = useState('uploadedAt');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [deleteDocError, setDeleteDocError] = useState('');

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'today' | 'this_week' | 'this_month'>('all');
  const [activitySearch, setActivitySearch] = useState('');

  // Assigned Assets state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assetSummary, setAssetSummary] = useState<AssetSummary>({
    totalAssets: 0,
    uniqueUsers: 0,
    underRepair: 0,
    warrantyExpiring: 0
  });
  const [assetSearch, setAssetSearch] = useState('');
  const [assetFilterStatus, setAssetFilterStatus] = useState('');
  const [assetFilterUser, setAssetFilterUser] = useState('');
  const [assetFilterWarranty, setAssetFilterWarranty] = useState('');

  type Document = {
    id: string;
    fileName: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string | null;
    uploadedAt: string;
    remarks: string | null;
  };

  type Activity = {
    id: string;
    projectId: string;
    activityType: string;
    title: string;
    description: string | null;
    performedBy: string | null;
    performedAt: string;
    metadata: any;
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (project?.id) {
      loadDocuments();
      loadActivities();
      loadAssignments();
    }
  }, [project?.id]);

  async function loadActivities() {
    if (!id) return;
    try {
      setLoadingActivities(true);
      const res = await api.get(`/projects-environments/${id}/activities`, {
        params: {
          filter: activityFilter,
          search: activitySearch || undefined,
          sortBy: 'performedAt',
          sortOrder: 'desc'
        }
      });
      setActivities(res.data.items || []);
    } catch (err: any) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  }

  async function loadDocuments() {
    if (!id) return;
    try {
      setLoadingDocs(true);
      const res = await api.get(`/projects-environments/${id}/documents`, {
        params: { sortBy: docSortBy, sortOrder: 'desc' }
      });
      setDocuments(res.data.items || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function loadAssignments() {
    if (!id) return;
    try {
      setLoadingAssignments(true);
      const res = await api.get('/inventory-assignments', {
        params: { projectId: id, status: 'ACTIVE' }
      });
      const loadedAssignments: Assignment[] = res.data.assignments || [];
      setAssignments(loadedAssignments);
      
      // Calculate summary
      const userIds = new Set<string>();
      let underRepair = 0;
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let warrantyExpiring = 0;
      
      loadedAssignments.forEach(assignment => {
        if (assignment.user?.id) {
          userIds.add(assignment.user.id);
        }
        if (assignment.inventory.status === 'UNDER_REPAIR') {
          underRepair++;
        }
        if (assignment.inventory.warrantyExpiry) {
          const expiry = new Date(assignment.inventory.warrantyExpiry);
          if (expiry >= now && expiry <= thirtyDays) {
            warrantyExpiring++;
          }
        }
      });
      
      setAssetSummary({
        totalAssets: loadedAssignments.length,
        uniqueUsers: userIds.size,
        underRepair,
        warrantyExpiring
      });
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function loadProject() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects-environments/${id}`);
      setProject(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate('/projects-environments');
  }

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/projects-environments/${id}`);
      navigate('/projects-environments');
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(value?: number): string {
    if (!value) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  function getUserRole(user: User): string {
    return user.roles?.[0]?.role?.name || 'Employee';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'DELAYED': return 'danger';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'danger';
      default: return 'default';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Filter assignments based on search and filters
  function filterAssignments(): Assignment[] {
    let result = [...assignments];
    
    // Search filter
    if (assetSearch) {
      const searchLower = assetSearch.toLowerCase();
      result = result.filter(a =>
        a.inventory.itemNo.toLowerCase().includes(searchLower) ||
        a.inventory.itemName.toLowerCase().includes(searchLower) ||
        a.user?.name?.toLowerCase().includes(searchLower) ||
        a.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (assetFilterStatus) {
      result = result.filter(a => a.inventory.status === assetFilterStatus);
    }
    
    // User filter
    if (assetFilterUser) {
      const userLower = assetFilterUser.toLowerCase();
      result = result.filter(a =>
        a.user?.name?.toLowerCase().includes(userLower) ||
        a.user?.email?.toLowerCase().includes(userLower)
      );
    }
    
    // Warranty filter
    if (assetFilterWarranty) {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      result = result.filter(a => {
        if (!a.inventory.warrantyExpiry) {
          return assetFilterWarranty === 'none' || assetFilterWarranty === 'expired';
        }
        const expiry = new Date(a.inventory.warrantyExpiry);
        
        if (assetFilterWarranty === 'expired') return expiry < now;
        if (assetFilterWarranty === 'expiring') return expiry >= now && expiry <= thirtyDays;
        if (assetFilterWarranty === 'active') return expiry > thirtyDays;
        return true;
      });
    }
    
    return result;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Validate file size (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds 20 MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'image/png',
      'image/jpeg',
      'text/plain'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.zip', '.png', '.jpg', '.jpeg', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setUploadError('Invalid file type. Allowed types: PDF, DOCX, DOC, XLSX, XLS, PPTX, ZIP, PNG, JPG, JPEG, TXT');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/projects-environments/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess('Document uploaded successfully!');
      loadDocuments();
      e.target.value = '';
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.response?.data || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: Document) {
    if (!id) return;
    try {
      const response = await api.get(`/projects-environments/${id}/documents/${doc.id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download document');
    }
  }

  async function handleDeleteDoc(doc: Document) {
    if (!id) return;
    if (!confirm(`Delete "${doc.originalFileName}"?`)) return;

    setDeletingDoc(doc.id);
    setDeleteDocError('');
    try {
      await api.delete(`/projects-environments/${id}/documents/${doc.id}`);
      loadDocuments();
    } catch (err: any) {
      setDeleteDocError(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  }

  // Access check for Employee
  if (isEmployee) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Access Restricted. You do not have permission to view this page.</p>
          <button className="btn-back" onClick={() => navigate('/projects-environments')}>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <div className="detail-breadcrumb">
            <span>Loading...</span>
          </div>
        </div>
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Project not found'}</p>
          <button className="btn-back" onClick={() => navigate('/projects-environments')}>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const teamSize = (project.teamMembers?.length || 0) + (project.manager ? 1 : 0);

  const filteredDocs = documents.filter(doc =>
    doc.originalFileName.toLowerCase().includes(docSearch.toLowerCase()) ||
    doc.fileType.toLowerCase().includes(docSearch.toLowerCase()) ||
    (doc.uploadedBy?.toLowerCase().includes(docSearch.toLowerCase()) ?? false)
  );

  // Activity helper functions
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'PROJECT_CREATED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'PROJECT_UPDATED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'PROJECT_STATUS_CHANGED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'PROJECT_PRIORITY_CHANGED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 15L6 17L12 11L18 17L20 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 9L6 11L12 5L18 11L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'PROJECT_MANAGER_CHANGED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'TEAM_MEMBER_ADDED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 13V21M16 16H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'TEAM_MEMBER_REMOVED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 13H22M16 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'DOCUMENT_UPLOADED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2"/>
            <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'DOCUMENT_DELETED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  const getActivityIconColor = (activityType: string) => {
    switch (activityType) {
      case 'PROJECT_CREATED': return 'success';
      case 'PROJECT_UPDATED': return 'info';
      case 'PROJECT_STATUS_CHANGED': return 'warning';
      case 'PROJECT_PRIORITY_CHANGED': return 'warning';
      case 'PROJECT_MANAGER_CHANGED': return 'info';
      case 'TEAM_MEMBER_ADDED': return 'success';
      case 'TEAM_MEMBER_REMOVED': return 'danger';
      case 'DOCUMENT_UPLOADED': return 'success';
      case 'DOCUMENT_DELETED': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="detail-page">
      {/* Back Button - Top Left */}
      <button className="btn-back-top" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <span onClick={handleBack} style={{ cursor: 'pointer' }}>Projects</span>
          <span>/</span>
          <span>{project.projectName}</span>
        </div>
        <div className="detail-actions">
          {isSuperAdmin && (
            <>
              <button className="btn-secondary" onClick={() => navigate(`/projects-environments/${id}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
                  <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Edit
              </button>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="detail-title-section">
        <div className="detail-title-left">
          <div className="detail-ticket-id">{project.projectCode}</div>
          <h1 className="detail-title">{project.projectName}</h1>
          <div className="detail-meta">
            <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
            <span className={`priority-badge priority-${getPriorityColor(project.priority)}`}>{project.priority}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-main">
          {/* Overview Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Overview
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Project Name</label>
                  <span>{project.projectName || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Code</label>
                  <span className="mono">{project.projectCode || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Client</label>
                  <span>{project.client || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Department</label>
                  <span>{project.department || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Type</label>
                  <span>{project.projectType?.replace(/_/g, ' ') || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Technology Stack</label>
                  <span>{project.technologyStack || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Start Date</label>
                  <span>{formatDate(project.startDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Expected End Date</label>
                  <span>{formatDate(project.expectedEndDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Budget</label>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Project Location</label>
                  <span>{project.projectLocation || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          {project.description && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Description
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.description}</p>
              </div>
            </div>
          )}

          {/* Remarks Card */}
          {project.remarks && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Remarks
                </h3>
              </div>
              <div className="detail-card-body">
                <p className="detail-description">{project.remarks}</p>
              </div>
            </div>
          )}

          {/* Inventory Placeholder Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Assigned Inventory
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h4>Assigned Inventory</h4>
                <p>No inventory has been assigned to this project yet.</p>
              </div>
            </div>
          </div>

          {/* Licenses Placeholder Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5C15 3.89543 15.8954 3 17 3C18.1046 3 19 3.89543 19 5V7H15V5Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 7H19V9C19 11.2091 17.2091 13 15 13H9C6.79086 13 5 11.2091 5 9V7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7V13H15V15H9V21H7V7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Licenses
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5C15 3.89543 15.8954 3 17 3C18.1046 3 19 3.89543 19 5V7H15V5Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 7H19V9C19 11.2091 17.2091 13 15 13H9C6.79086 13 5 11.2091 5 9V7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7V13H15V15H9V21H7V7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h4>Licenses</h4>
                <p>No licenses assigned.</p>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Documents
              </h3>
              <div className="detail-card-actions">
                {isSuperAdmin && (
                  <label className="btn-upload" title="Upload Document">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.zip,.png,.jpg,.jpeg,.txt" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
            <div className="detail-card-body">
              {/* Search and Sort */}
              <div className="doc-toolbar">
                <div className="doc-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input type="text" placeholder="Search documents..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} />
                </div>
                <select className="doc-sort" value={docSortBy} onChange={(e) => setDocSortBy(e.target.value)}>
                  <option value="uploadedAt">Date</option>
                  <option value="fileName">Name</option>
                  <option value="fileType">Type</option>
                  <option value="fileSize">Size</option>
                  <option value="uploadedBy">Uploaded By</option>
                </select>
                <button className="btn-icon" onClick={loadDocuments} title="Refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              {uploadSuccess && <div className="alert alert-success">{uploadSuccess}</div>}
              {uploadError && <div className="alert alert-error">{uploadError}</div>}
              {deleteDocError && <div className="alert alert-error">{deleteDocError}</div>}

              {/* Documents Table */}
              {loadingDocs ? (
                <div className="doc-loading">
                  <div className="spinner"></div>
                  <span>Loading documents...</span>
                </div>
              ) : filteredDocs.length > 0 ? (
                <div className="doc-table-wrapper">
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id}>
                          <td className="doc-name">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span title={doc.originalFileName}>{doc.originalFileName}</span>
                          </td>
                          <td><span className="doc-type">{doc.fileType.split('/').pop()?.toUpperCase() || '-'}</span></td>
                          <td>{formatFileSize(doc.fileSize)}</td>
                          <td>{doc.uploadedBy || '-'}</td>
                          <td>{formatDate(doc.uploadedAt)}</td>
                          <td className="doc-actions">
                            <button className="btn-icon" onClick={() => handleDownload(doc)} title="Download">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {isSuperAdmin && (
                              <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteDoc(doc)} title="Delete" disabled={deletingDoc === doc.id}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="detail-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h4>No Documents</h4>
                  <p>No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Activity Timeline
              </h3>
              <div className="detail-card-actions">
                <button className="btn-icon" onClick={loadActivities} title="Refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="detail-card-body">
              {/* Filters */}
              <div className="activity-toolbar">
                <div className="activity-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadActivities()}
                  />
                </div>
                <div className="activity-filters">
                  <button
                    className={`filter-btn ${activityFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setActivityFilter('all'); loadActivities(); }}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${activityFilter === 'today' ? 'active' : ''}`}
                    onClick={() => { setActivityFilter('today'); loadActivities(); }}
                  >
                    Today
                  </button>
                  <button
                    className={`filter-btn ${activityFilter === 'this_week' ? 'active' : ''}`}
                    onClick={() => { setActivityFilter('this_week'); loadActivities(); }}
                  >
                    This Week
                  </button>
                  <button
                    className={`filter-btn ${activityFilter === 'this_month' ? 'active' : ''}`}
                    onClick={() => { setActivityFilter('this_month'); loadActivities(); }}
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {loadingActivities ? (
                <div className="activity-loading">
                  <div className="spinner"></div>
                  <span>Loading activities...</span>
                </div>
              ) : activities.length > 0 ? (
                <div className="activity-timeline">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="activity-item">
                      <div className={`activity-icon ${getActivityIconColor(activity.activityType)}`}>
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-title">{activity.title}</span>
                          <span className="activity-time">{formatDateTime(activity.performedAt)}</span>
                        </div>
                        {activity.description && (
                          <p className="activity-description">{activity.description}</p>
                        )}
                        {activity.performedBy && (
                          <span className="activity-performed-by">by {activity.performedBy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="activity-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No project activities available.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Assets Section */}
        <div className="detail-section">
          <div className="detail-card full-width">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Assigned Assets
              </h3>
              <div className="detail-card-actions">
                <button className="btn-icon" onClick={loadAssignments} title="Refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="detail-card-body">
              {/* Summary Stats */}
              <div className="asset-summary-stats">
                <div className="asset-stat">
                  <span className="asset-stat-value">{loadingAssignments ? '...' : assetSummary.totalAssets}</span>
                  <span className="asset-stat-label">Assigned Assets</span>
                </div>
                <div className="asset-stat">
                  <span className="asset-stat-value">{loadingAssignments ? '...' : assetSummary.uniqueUsers}</span>
                  <span className="asset-stat-label">Users Using Assets</span>
                </div>
                <div className="asset-stat">
                  <span className="asset-stat-value">{loadingAssignments ? '...' : assetSummary.underRepair}</span>
                  <span className="asset-stat-label">Under Repair</span>
                </div>
                <div className="asset-stat">
                  <span className="asset-stat-value">{loadingAssignments ? '...' : assetSummary.warrantyExpiring}</span>
                  <span className="asset-stat-label">Warranty Expiring (30 days)</span>
                </div>
              </div>

              {/* Filters */}
              <div className="asset-toolbar">
                <div className="asset-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by Inventory ID, Item Name, Brand, Assigned User..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                  />
                </div>
                <div className="asset-filters">
                  <select
                    value={assetFilterStatus}
                    onChange={(e) => setAssetFilterStatus(e.target.value)}
                    className="asset-filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filter by User..."
                    value={assetFilterUser}
                    onChange={(e) => setAssetFilterUser(e.target.value)}
                    className="asset-filter-input"
                  />
                  <select
                    value={assetFilterWarranty}
                    onChange={(e) => setAssetFilterWarranty(e.target.value)}
                    className="asset-filter-select"
                  >
                    <option value="">All Warranty</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {loadingAssignments ? (
                <div className="asset-loading">
                  <div className="spinner"></div>
                  <span>Loading assets...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="asset-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No inventory assigned to this project.</p>
                </div>
              ) : (
                <div className="asset-table-wrapper">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>Inventory ID</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Assigned User</th>
                        <th>Assigned Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterAssignments().map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="item-no">{assignment.inventory.itemNo}</td>
                          <td className="item-name">{assignment.inventory.itemName}</td>
                          <td>{assignment.inventory.category?.name || '-'}</td>
                          <td>{assignment.inventory.subcategory?.name || '-'}</td>
                          <td>-</td>
                          <td>-</td>
                          <td>{assignment.user?.name || '-'}</td>
                          <td>{formatDate(assignment.assignedDate)}</td>
                          <td>
                            <span className={`status-badge status-${assignment.inventory.status.toLowerCase()}`}>
                              {assignment.inventory.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-open-asset"
                              onClick={() => navigate(`/access-management/${assignment.inventory.id}`)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="detail-sidebar">
          {/* Team Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Team
              </h3>
              <span className="detail-card-count">{teamSize}</span>
            </div>
            <div className="detail-card-body">
              {/* Manager Section */}
              <div className="team-section">
                <h4 className="team-section-title">Project Manager</h4>
                {project.manager ? (
                  <div className="team-member-card manager">
                    <div className="member-avatar">
                      {project.manager.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{project.manager.name}</span>
                      <span className="member-details">{project.manager.email}</span>
                      {project.manager.department && (
                        <span className="member-details">{project.manager.department}</span>
                      )}
                      <span className="member-role-badge manager">Manager</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-team">No manager assigned</p>
                )}
              </div>

              {/* Team Members Section */}
              <div className="team-section">
                <h4 className="team-section-title">Team Members ({project.teamMembers?.length || 0})</h4>
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <div className="team-members-list">
                    {project.teamMembers.map(member => (
                      <div key={member.id} className="team-member-card">
                        <div className="member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-details">{member.email}</span>
                          {member.department && (
                            <span className="member-details">{member.department}</span>
                          )}
                          <span className="member-role">{getUserRole(member)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-team">No team members assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Quick Info
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`status-badge status-${getStatusColor(project.status)}`}>{project.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Priority</span>
                <span className={`priority-badge priority-${getPriorityColor(project.priority)}`}>{project.priority}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{formatDate(project.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatDateTime(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button type="button" className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  {deleteError}
                </div>
              )}
              <div className="warning-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Are you sure you want to delete this project?</p>
                <p><strong>{project.projectName}</strong> ({project.projectCode})</p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
