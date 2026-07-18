import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type HistoryEntry = {
  id: string;
  action: string;
  description?: string;
  performedBy: string;
  createdAt: string;
};

type Document = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  documentType: string;
  uploadedBy?: string;
  createdAt: string;
};

type Assignment = {
  id: string;
  status: string;
  assignedDate: string;
  remarks?: string;
  user?: { id: string; name: string; email: string };
  project?: { id: string; projectName: string; projectCode: string };
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendorName?: string;
  vendorId?: string;
  invoiceNo?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  gst?: number;
  warrantyExpiry?: string;
  location?: string;
  status: string;
  currentQty: number;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
  history?: HistoryEntry[];
  documents?: Document[];
};

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assignment state
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  useEffect(() => {
    loadItem();
    loadAssignment();
  }, [id]);

  async function loadItem() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory-master/${id}`);
      setItem(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory item');
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignment() {
    if (!id) return;
    try {
      setLoadingAssignment(true);
      const res = await api.get(`/inventory-assignments/inventory/${id}`);
      setAssignment(res.data.assignment || null);
    } catch {
      setAssignment(null);
    } finally {
      setLoadingAssignment(false);
    }
  }

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
    if (value === undefined || value === null) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(fileType: string): React.ReactNode {
    if (fileType.includes('pdf')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Validate file size (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25 MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: PDF, DOC, DOCX, XLSX');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          await api.post(`/inventory-master/${id}/documents`, {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: reader.result as string,
            documentType: 'Document'
          });
          setUploadSuccess('Document uploaded successfully!');
          loadItem();
          e.target.value = '';
        } catch (err: any) {
          setUploadError(err.response?.data?.message || 'Failed to upload document');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document');
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: Document) {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    setDeletingDoc(doc.id);
    try {
      await api.delete(`/inventory-master/${id}/documents/${doc.id}`);
      loadItem();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  }

  async function handleDeleteInventory() {
    if (!item) return;
    if (!confirm(`Delete "${item.itemName}"? This action cannot be undone.`)) return;
    
    setDeleting(true);
    try {
      await api.delete(`/inventory-master/${id}`);
      navigate(`/inventory/${item.category.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete inventory');
      setDeleting(false);
    }
  }

  function getHistoryIcon(action: string): React.ReactNode {
    if (action === 'Created') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (action.includes('Quantity')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (action.includes('Warranty')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (action.includes('Location')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    }
    if (action.includes('Status')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    }
    if (action.includes('Document')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20H21M3 20H21M12 4H21M3 4H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }

  function getHistoryColor(action: string): string {
    if (action === 'Created') return 'success';
    if (action.includes('Quantity')) return 'warning';
    if (action.includes('Warranty')) return 'info';
    if (action.includes('Location')) return 'primary';
    if (action.includes('Status')) return 'default';
    if (action.includes('Document')) return 'primary';
    return 'default';
  }

  if (isEmployee) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Access Restricted. You do not have permission to view this page.</p>
          <button className="btn-back" onClick={() => navigate('/inventory')}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <div className="detail-breadcrumb">
            <Link to="/inventory">Inventory</Link>
            <span>/</span>
            <span>Loading...</span>
          </div>
        </div>
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Inventory item not found'}</p>
          <button className="btn-back" onClick={() => navigate('/inventory')}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Back Button - Top Left */}
      <button className="btn-back-top" onClick={() => navigate(`/inventory/${item.category.id}`)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <Link to="/inventory">Inventory</Link>
          <span>/</span>
          <Link to={`/inventory/${item.category.id}`}>{item.category.name}</Link>
          <span>/</span>
          <span>{item.itemName}</span>
        </div>
        <div className="detail-actions">
          {isSuperAdmin && (
            <>
              <button className="btn-secondary" onClick={() => navigate(`/inventory/master/${item.id}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
                  <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Edit
              </button>
              <button className="btn-danger" onClick={handleDeleteInventory} disabled={deleting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="detail-title-section">
        <div className="detail-title-left">
          <div className="detail-ticket-id">{item.itemNo}</div>
          <h1 className="detail-title">{item.itemName}</h1>
          <div className="detail-meta">
            <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
            <span className="detail-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {item.category.name} / {item.subcategory.name}
            </span>
          </div>
        </div>
      </div>

      {/* Assignment Summary Cards */}
      <div className="assignment-summary-cards">
        <div className={`assignment-summary-card ${assignment ? 'assigned' : 'available'}`}>
          <div className="assignment-summary-icon">
            {assignment ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </div>
          <div className="assignment-summary-content">
            <span className="assignment-summary-label">Assignment Status</span>
            <span className="assignment-summary-value">{assignment ? 'Assigned' : 'Available'}</span>
          </div>
        </div>
        {item.status === 'UNDER_REPAIR' && (
          <div className="assignment-summary-card repair">
            <div className="assignment-summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="assignment-summary-content">
              <span className="assignment-summary-label">Item Status</span>
              <span className="assignment-summary-value">Under Repair</span>
            </div>
          </div>
        )}
        {item.status === 'RETIRED' && (
          <div className="assignment-summary-card retired">
            <div className="assignment-summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="assignment-summary-content">
              <span className="assignment-summary-label">Item Status</span>
              <span className="assignment-summary-value">Retired</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Assignment Card */}
      <div className="detail-card assignment-card">
        <div className="detail-card-header">
          <h3>Current Assignment</h3>
          <button 
            className="btn-link" 
            onClick={() => navigate(`/access-management/${item.id}`)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 3H21M21 3V9M21 3L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Open in Asset Management
          </button>
        </div>
        <div className="detail-card-body">
          {loadingAssignment ? (
            <div className="assignment-loading">
              <div className="spinner small"></div>
              <span>Loading assignment...</span>
            </div>
          ) : assignment ? (
            <div className="assignment-details">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Assignment Status</label>
                  <span className={`status-badge status-${assignment.status.toLowerCase()}`}>
                    {assignment.status}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Assigned User</label>
                  <span className="detail-field-value">
                    {assignment.user?.name || '-'}
                    {assignment.user?.email && (
                      <span className="field-subtext">{assignment.user.email}</span>
                    )}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Assigned Project</label>
                  <span className="detail-field-value">
                    {assignment.project?.projectName || '-'}
                    {assignment.project?.projectCode && (
                      <span className="field-subtext">{assignment.project.projectCode}</span>
                    )}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Assigned Date</label>
                  <span className="detail-field-value">{formatDate(assignment.assignedDate)}</span>
                </div>
                <div className="detail-field full-width">
                  <label>Remarks</label>
                  <span className="detail-field-value">{assignment.remarks || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="assignment-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No active assignment.</p>
            </div>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Left Column - Main Information */}
        <div className="detail-main">
          {/* Inventory Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Inventory Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Item Name</label>
                  <span className="detail-field-value">{item.itemName}</span>
                </div>
                <div className="detail-field">
                  <label>Category</label>
                  <span className="detail-field-value">{item.category.name}</span>
                </div>
                <div className="detail-field">
                  <label>Subcategory</label>
                  <span className="detail-field-value">{item.subcategory.name}</span>
                </div>
                <div className="detail-field">
                  <label>Brand</label>
                  <span className="detail-field-value">{item.brand || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Model</label>
                  <span className="detail-field-value">{item.model || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Vendor</label>
                  {item.vendorId ? (
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/vendors-licenses/${item.vendorId}`); }} className="detail-link">
                      {item.vendorName || 'View Vendor'}
                    </a>
                  ) : (
                    <span className="detail-field-value">{item.vendorName || '-'}</span>
                  )}
                </div>
                <div className="detail-field">
                  <label>Location</label>
                  <span className="detail-field-value">{item.location || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Quantity</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Current Quantity</label>
                  <span className="detail-field-value large">{item.currentQty}</span>
                </div>
                <div className="detail-field">
                  <label>Minimum Stock</label>
                  <span className="detail-field-value">{item.minStock ?? '-'}</span>
                </div>
              </div>
              {item.minStock && item.currentQty < item.minStock && (
                <div className="detail-alert warning">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.74C2.88 20.92 3.23 21.01 3.59 21.01H20.41C20.77 21.01 21.12 20.92 21.43 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.94 2.85C11.58 2.85 11.23 2.94 10.92 3.12C10.61 3.3 10.35 3.56 10.17 3.86L10.29 3.86Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Low Stock Alert
                </div>
              )}
            </div>
          </div>

          {/* History Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>History</h3>
              <span className="detail-card-count">{item.history?.length || 0}</span>
            </div>
            <div className="detail-card-body">
              {!item.history || item.history.length === 0 ? (
                <div className="detail-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No history available</p>
                </div>
              ) : (
                <div className="timeline">
                  {item.history.map((entry) => (
                    <div key={entry.id} className="timeline-item">
                      <div className={`timeline-icon ${getHistoryColor(entry.action)}`}>
                        {getHistoryIcon(entry.action)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-action">{entry.action}</span>
                          <span className="timeline-date">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        {entry.description && (
                          <p className="timeline-description">{entry.description}</p>
                        )}
                        <span className="timeline-user">by {entry.performedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="detail-sidebar">
          {/* Purchase Information */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Purchase Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-sidebar-field">
                <label>Invoice Number</label>
                <span>{item.invoiceNo || '-'}</span>
              </div>
              <div className="detail-sidebar-field">
                <label>Purchase Date</label>
                <span>{formatDate(item.purchaseDate)}</span>
              </div>
              <div className="detail-sidebar-field">
                <label>Purchase Cost</label>
                <span>{formatCurrency(item.purchaseCost)}</span>
              </div>
              <div className="detail-sidebar-field">
                <label>GST</label>
                <span>{item.gst ? `${item.gst}%` : '-'}</span>
              </div>
              <div className="detail-sidebar-field">
                <label>Vendor</label>
                {item.vendorId ? (
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/vendors-licenses/${item.vendorId}`); }} className="detail-link">
                    {item.vendorName || 'View Vendor'}
                  </a>
                ) : (
                  <span>{item.vendorName || '-'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Warranty</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-sidebar-field">
                <label>Warranty Expiry</label>
                <span className={!item.warrantyExpiry ? '' : new Date(item.warrantyExpiry) < new Date() ? 'text-danger' : ''}>
                  {formatDate(item.warrantyExpiry)}
                </span>
              </div>
              {item.warrantyExpiry && (
                <div className={`warranty-status ${new Date(item.warrantyExpiry) < new Date() ? 'expired' : 'active'}`}>
                  {new Date(item.warrantyExpiry) < new Date() ? 'Expired' : 'Active'}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Documents</h3>
              <span className="detail-card-count">{item.documents?.length || 0}</span>
            </div>
            <div className="detail-card-body">
              {isSuperAdmin && (
                <div className="upload-section">
                  <label className="upload-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Upload Document
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <p className="upload-hint">PDF, DOC, DOCX, XLSX (max 25MB)</p>
                  {uploadError && <div className="upload-error">{uploadError}</div>}
                  {uploadSuccess && <div className="upload-success">{uploadSuccess}</div>}
                </div>
              )}

              {!item.documents || item.documents.length === 0 ? (
                <div className="detail-empty small">
                  <p>No documents uploaded</p>
                </div>
              ) : (
                <div className="documents-list">
                  {item.documents.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="document-info">
                        <span className="document-name">{doc.fileName}</span>
                        <span className="document-meta">
                          {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      <div className="document-actions">
                        <a
                          href={doc.url}
                          download={doc.fileName}
                          className="btn-icon-sm"
                          title="Download"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </a>
                        {isSuperAdmin && (
                          <button
                            className="btn-icon-sm btn-icon-danger"
                            onClick={() => handleDeleteDocument(doc)}
                            disabled={deletingDoc === doc.id}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
