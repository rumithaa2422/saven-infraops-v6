/**
 * Vendor Details Page
 * 
 * Comprehensive vendor detail view with modern UI design.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type VendorLicense = {
  id: string;
  vendorName: string;
  licenseName: string;
  licenseCount: number;
  assignedCount: number;
  cost: number | null;
  renewalAt: string | null;
  ownerName: string | null;
  createdAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string | null;
  performedAt: string;
  newValue: any;
  oldValue: any;
};

type VendorDetails = {
  id: string;
  vendorName: string;
  vendorCode: string;
  category: string;
  status: string;
  website: string | null;
  country: string | null;
  gstNumber: string | null;
  registrationNumber: string | null;
  primaryContactName: string;
  designation: string | null;
  email: string;
  phone: string;
  address: string | null;
  remarks: string | null;
  contractStartDate: string | null;
  contractExpiryDate: string | null;
  renewalDate: string | null;
  paymentTerms: string | null;
  createdAt: string;
  updatedAt: string;
  assetCount: number;
  licenseCount: number;
  documentsCount: number;
  licenses: VendorLicense[];
  contractStatus: string;
  auditLogs: AuditLog[];
};

type LinkedProject = {
  id: string;
  projectName: string;
  projectCode: string;
  status: string;
  startDate: string | null;
  ownerName: string | null;
};

type VendorInventory = {
  id: string;
  itemNo: string;
  itemName: string;
  serialNumber: string | null;
  status: string;
  warrantyExpiry: string | null;
  purchaseDate: string | null;
  assignedDate: string | null;
};

type VendorDocument = {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  category: string;
  uploadedAt: string;
  uploadedByEmail: string;
};

export function VendorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [linkedProjects, setLinkedProjects] = useState<LinkedProject[]>([]);
  const [vendorInventory, setVendorInventory] = useState<VendorInventory[]>([]);
  const [vendorDocuments, setVendorDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadVendorDetails();
    loadLinkedProjects();
    loadVendorInventory();
    loadVendorDocuments();
  }, [id]);

  async function loadVendorDetails() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/vendors/${id}/details`);
      setVendor(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  }

  async function loadLinkedProjects() {
    if (!id) return;
    try {
      const res = await api.get(`/vendors/${id}/linked-projects`);
      setLinkedProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to load linked projects:', err);
    }
  }

  async function loadVendorInventory() {
    if (!id) return;
    try {
      const res = await api.get(`/vendors/${id}/inventory`);
      setVendorInventory(res.data.inventory || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }

  async function loadVendorDocuments() {
    if (!id) return;
    try {
      const res = await api.get(`/vendors/${id}/documents`);
      setVendorDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }

  function handleBack() {
    navigate('/vendors-licenses');
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vendors/${id}`);
      navigate('/vendors-licenses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  function formatDate(dateStr: string | null | undefined): string {
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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getContractStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'expiring': return 'warning';
      case 'expired': return 'danger';
      default: return 'default';
    }
  }

  function getContractStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return 'No Contract';
    }
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'DELETE': 'Deleted',
      'IMPORT': 'Imported'
    };
    return labels[action] || action;
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">
          <div className="spinner"></div>
          <span>Loading vendor...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Vendor not found'}</p>
          <button className="btn-back" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Back Button */}
      <button className="btn-back-top" onClick={handleBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Vendors
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-row">
          <div className="detail-vendor-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="detail-title-info">
            <h1 className="detail-title">{vendor.vendorName}</h1>
            <div className="detail-meta-tags">
              <span className="category-badge">{vendor.category}</span>
              <span className={`status-badge status-${vendor.status.toLowerCase()}`}>{vendor.status}</span>
            </div>
          </div>
        </div>
        <div className="detail-meta-row">
          {vendor.website && (
            <div className="detail-meta-item">
              <span className="detail-meta-label">Website</span>
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="detail-meta-value link">
                {vendor.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {vendor.country && (
            <div className="detail-meta-item">
              <span className="detail-meta-label">Country</span>
              <span className="detail-meta-value">{vendor.country}</span>
            </div>
          )}
          <div className="detail-meta-item">
            <span className="detail-meta-label">Vendor Code</span>
            <span className="detail-meta-value mono">{vendor.vendorCode}</span>
          </div>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <div className="detail-header-actions">
            <button className="btn-secondary" onClick={() => navigate(`/vendors-licenses/${id}/edit`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Edit
            </button>
            <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="detail-summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Contract Status</span>
            <span className={`summary-value status-${getContractStatusColor(vendor.contractStatus)}`}>
              {getContractStatusLabel(vendor.contractStatus)}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Linked Projects</span>
            <span className="summary-value">{linkedProjects.length}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Assets</span>
            <span className="summary-value">{vendorInventory.length}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Documents</span>
            <span className="summary-value">{vendorDocuments.length}</span>
          </div>
        </div>
      </div>

      <div className="detail-content-grid">
        {/* Main Column */}
        <div className="detail-main">
          {/* Basic Information */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Basic Information
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Vendor Name</label>
                  <span>{vendor.vendorName}</span>
                </div>
                <div className="detail-info-item">
                  <label>Vendor Code</label>
                  <span className="mono">{vendor.vendorCode}</span>
                </div>
                <div className="detail-info-item">
                  <label>Category</label>
                  <span>{vendor.category}</span>
                </div>
                <div className="detail-info-item">
                  <label>Status</label>
                  <span className={`status-badge status-${vendor.status.toLowerCase()}`}>{vendor.status}</span>
                </div>
                <div className="detail-info-item">
                  <label>Website</label>
                  <span>{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a> : '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Country</label>
                  <span>{vendor.country || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>GST Number</label>
                  <span className="mono">{vendor.gstNumber || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Registration Number</label>
                  <span className="mono">{vendor.registrationNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Primary Contact
              </h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Contact Name</label>
                  <span>{vendor.primaryContactName}</span>
                </div>
                <div className="detail-info-item">
                  <label>Designation</label>
                  <span>{vendor.designation || '-'}</span>
                </div>
                <div className="detail-info-item">
                  <label>Email</label>
                  <span><a href={`mailto:${vendor.email}`}>{vendor.email}</a></span>
                </div>
                <div className="detail-info-item">
                  <label>Phone</label>
                  <span><a href={`tel:${vendor.phone}`}>{vendor.phone}</a></span>
                </div>
                <div className="detail-info-item full-width">
                  <label>Address</label>
                  <span>{vendor.address || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Contract Information
              </h3>
              {vendor.contractExpiryDate && (
                <span className={`expiry-badge ${getContractStatusColor(vendor.contractStatus)}`}>
                  {getContractStatusLabel(vendor.contractStatus)}
                </span>
              )}
            </div>
            <div className="detail-card-body">
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <label>Contract Start</label>
                  <span>{formatDate(vendor.contractStartDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Contract Expiry</label>
                  <span>{formatDate(vendor.contractExpiryDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Renewal Date</label>
                  <span>{formatDate(vendor.renewalDate)}</span>
                </div>
                <div className="detail-info-item">
                  <label>Payment Terms</label>
                  <span>{vendor.paymentTerms || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Licenses */}
          {vendor.licenses && vendor.licenses.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Licenses ({vendor.licenses.length})
                </h3>
              </div>
              <div className="detail-card-body">
                <div className="license-list">
                  {vendor.licenses.map(license => (
                    <div key={license.id} className="license-item">
                      <div className="license-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="license-info">
                        <span className="license-name">{license.licenseName}</span>
                        <span className="license-meta">
                          {license.licenseCount} seats · {license.assignedCount} assigned
                          {license.renewalAt && ` · Renews ${formatDate(license.renewalAt)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Linked Projects */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 3H22V21H2V3Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Linked Projects ({linkedProjects.length})
              </h3>
            </div>
            <div className="detail-card-body">
              {linkedProjects.length > 0 ? (
                <div className="project-list">
                  {linkedProjects.map(project => (
                    <div key={project.id} className="project-item" onClick={() => navigate(`/projects-environments/${project.id}`)}>
                      <div className="project-info">
                        <span className="project-name">{project.projectName}</span>
                        <span className="project-meta">
                          {project.projectCode} · {project.ownerName || 'No manager'}
                        </span>
                      </div>
                      <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No linked data available</div>
              )}
            </div>
          </div>

          {/* Purchased Inventory */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Purchased Inventory ({vendorInventory.length})
              </h3>
            </div>
            <div className="detail-card-body">
              {vendorInventory.length > 0 ? (
                <div className="inventory-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                        <th>Warranty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorInventory.slice(0, 10).map(item => (
                        <tr key={item.id} onClick={() => navigate(`/inventory/master/${item.id}`)}>
                          <td>
                            <span className="item-name">{item.itemName}</span>
                            <span className="item-no">{item.itemNo}</span>
                          </td>
                          <td className="mono">{item.serialNumber || '-'}</td>
                          <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                          <td>{formatDate(item.warrantyExpiry)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No linked data available</div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Documents ({vendorDocuments.length})
              </h3>
            </div>
            <div className="detail-card-body">
              {vendorDocuments.length > 0 ? (
                <div className="document-list">
                  {vendorDocuments.map(doc => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="document-info">
                        <span className="document-name">{doc.originalFileName}</span>
                        <span className="document-meta">
                          {formatFileSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No linked data available</div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Activity Timeline
              </h3>
            </div>
            <div className="detail-card-body">
              {vendor.auditLogs && vendor.auditLogs.length > 0 ? (
                <div className="activity-timeline">
                  {vendor.auditLogs.map((log, index) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="marker-dot"></div>
                        {index < vendor.auditLogs.length - 1 && <div className="marker-line"></div>}
                      </div>
                      <div className="timeline-content">
                        <span className="timeline-action">{getActionLabel(log.action)}</span>
                        <span className="timeline-time">{formatDateTime(log.performedAt)}</span>
                        {log.actorEmail && <span className="timeline-actor">by {log.actorEmail}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No linked data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="detail-sidebar">
          {/* Quick Information */}
          <div className="sidebar-card">
            <h4>Quick Information</h4>
            <div className="quick-info-list">
              <div className="quick-info-item">
                <span className="quick-info-label">Created</span>
                <span className="quick-info-value">{formatDate(vendor.createdAt)}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Last Updated</span>
                <span className="quick-info-value">{formatDate(vendor.updatedAt)}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Total Assets</span>
                <span className="quick-info-value">{vendor.assetCount}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Projects</span>
                <span className="quick-info-value">{linkedProjects.length}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Documents</span>
                <span className="quick-info-value">{vendor.documentsCount}</span>
              </div>
              <div className="quick-info-item">
                <span className="quick-info-label">Licenses</span>
                <span className="quick-info-value">{vendor.licenseCount}</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {vendor.remarks && (
            <div className="sidebar-card">
              <h4>Remarks</h4>
              <p className="remarks-text">{vendor.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Delete Vendor</h3>
            <p>Are you sure you want to delete <strong>{vendor.vendorName}</strong>?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
