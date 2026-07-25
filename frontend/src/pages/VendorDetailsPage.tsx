/**
 * Vendor Details Page
 * 
 * Comprehensive vendor detail view with inventory integration.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { Eye, Edit2 } from 'lucide-react';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell
} from '../components/serviceRequests';

type InternalOwner = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: { role: { name: string } }[];
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
  internalOwnerId: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryCount: number;
  internalOwner: InternalOwner | null;
  contractStatus: string;
};

type VendorInventory = {
  id: string;
  itemNo: string;
  itemName: string;
  brand: string | null;
  model: string | null;
  status: string;
  warrantyExpiry: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
};

export function VendorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [vendorInventory, setVendorInventory] = useState<VendorInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'purchaseDate',
    direction: 'desc'
  });

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  useEffect(() => {
    loadVendorDetails();
    loadVendorInventory();
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

  async function loadVendorInventory() {
    if (!id) return;
    try {
      const res = await api.get(`/vendors/${id}/inventory`);
      setVendorInventory(res.data.inventory || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
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

  function getContractStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'expiring': return 'warning';
      case 'expired': return 'danger';
      default: return 'secondary';
    }
  }

  function getContractStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'no_contract': return 'No Contract';
      default: return status;
    }
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack vendor-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-secondary" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div>
                <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '16px', marginTop: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="workspace">
        <div className="page-stack vendor-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-secondary" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div>
                <h1 className="page-header-title">Error</h1>
              </div>
            </div>
          </div>
          <div className="error-container">
            <p>{error || 'Vendor not found'}</p>
            <button className="btn-secondary" onClick={handleBack}>
              Back to Vendors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack vendor-detail">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-secondary" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">{vendor.vendorName}</h1>
              <p className="page-header-subtitle">{vendor.category}</p>
            </div>
          </div>
          <div className="page-header-actions">
            <span className={`status-badge status-${vendor.status.toLowerCase()}`}>{vendor.status}</span>
            {isAdmin && (
              <>
                <button className="btn-secondary" onClick={() => navigate(`/vendors-licenses/${id}/edit`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="detail-meta">
          {vendor.website && (
            <div className="detail-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
              </svg>
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="detail-meta-value link">
                {vendor.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {vendor.country && (
            <div className="detail-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="detail-meta-value">{vendor.country}</span>
            </div>
          )}
          <div className="detail-meta-item">
            <span className="detail-meta-value mono">{vendor.vendorCode}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="detail-summary">
          <div className="summary-card">
            <span className="summary-label">Inventory Items</span>
            <span className="summary-value">{vendor.inventoryCount}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Contract Status</span>
            <span className={`summary-value status-${getContractStatusColor(vendor.contractStatus)}`}>
              {getContractStatusLabel(vendor.contractStatus)}
            </span>
          </div>
          {vendor.contractExpiryDate && (
            <div className="summary-card">
              <span className="summary-label">Contract Expires</span>
              <span className="summary-value">{formatDate(vendor.contractExpiryDate)}</span>
            </div>
          )}
        </div>

        <div className="detail-content">
          {/* Main Content */}
          <div className="detail-main">
            {/* Contact Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Contact Information
                </h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <label>Primary Contact</label>
                    <span>{vendor.primaryContactName}</span>
                  </div>
                  {vendor.designation && (
                    <div className="detail-info-item">
                      <label>Designation</label>
                      <span>{vendor.designation}</span>
                    </div>
                  )}
                  <div className="detail-info-item">
                    <label>Email</label>
                    <a href={`mailto:${vendor.email}`} className="link">{vendor.email}</a>
                  </div>
                  <div className="detail-info-item">
                    <label>Phone</label>
                    <a href={`tel:${vendor.phone}`} className="link">{vendor.phone}</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 21H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 21V7L12 3L19 7V21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 21V15H15V21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Business Information
                </h3>
              </div>
              <div className="detail-card-body">
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <label>GST Number</label>
                    <span className="mono">{vendor.gstNumber || '-'}</span>
                  </div>
                  <div className="detail-info-item">
                    <label>Registration Number</label>
                    <span className="mono">{vendor.registrationNumber || '-'}</span>
                  </div>
                  {vendor.address && (
                    <div className="detail-info-item full-width">
                      <label>Address</label>
                      <span>{vendor.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Contract Details
                </h3>
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
                  <TableContainer loading={false} empty={vendorInventory.length === 0} emptyTitle="No inventory" emptyDescription="No inventory purchased from this vendor">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <SortHeader label="Item" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="Brand/Model" sortKey="brand" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="Purchase Date" sortKey="purchaseDate" currentSort={sortConfig} onSort={handleSort} />
                          <SortHeader label="Cost" sortKey="purchaseCost" currentSort={sortConfig} onSort={handleSort} />
                          <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vendorInventory.slice(0, 10).map(item => (
                          <TableRow key={item.id} onClick={() => navigate(`/inventory/master/${item.id}`)}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{item.itemName}</span>
                                <span className="text-xs text-slate-500 font-mono">{item.itemNo}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {[item.brand, item.model].filter(Boolean).join(' / ') || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                item.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-500">{formatDate(item.purchaseDate)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-700">{formatCurrency(item.purchaseCost)}</span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                onClick={() => navigate(`/inventory/master/${item.id}`)}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </table>
                    {vendorInventory.length > 10 && (
                      <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                        Showing 10 of {vendorInventory.length} items
                      </div>
                    )}
                  </TableContainer>
                ) : (
                  <div className="empty-state">No inventory purchased from this vendor</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            {/* Quick Info */}
            <div className="sidebar-card">
              <h4>Quick Info</h4>
              <div className="sidebar-info">
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Vendor</span>
                  <span className="sidebar-value">{vendor.vendorName}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Code</span>
                  <span className="sidebar-value mono">{vendor.vendorCode}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Category</span>
                  <span className="sidebar-value">{vendor.category}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Status</span>
                  <span className={`status-badge status-${vendor.status.toLowerCase()}`}>{vendor.status}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Website</span>
                  <span className="sidebar-value">
                    {vendor.website ? (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="link">
                        {vendor.website}
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Country</span>
                  <span className="sidebar-value">{vendor.country || '-'}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">GST Number</span>
                  <span className="sidebar-value mono">{vendor.gstNumber || '-'}</span>
                </div>
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Reg. Number</span>
                  <span className="sidebar-value mono">{vendor.registrationNumber || '-'}</span>
                </div>
              </div>
            </div>

            {/* Inventory Count */}
            <div className="sidebar-card highlight">
              <h4>Inventory</h4>
              <div className="sidebar-stat">
                <span className="stat-value">{vendor.inventoryCount}</span>
                <span className="stat-label">Items Purchased</span>
              </div>
            </div>

            {/* Internal Owner */}
            {vendor.internalOwner && (
              <div className="sidebar-card">
                <h4>Internal Owner</h4>
                <div className="sidebar-owner">
                  <div className="owner-avatar">
                    {vendor.internalOwner.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="owner-info">
                    <span className="owner-name">{vendor.internalOwner.name}</span>
                    <span className="owner-email">{vendor.internalOwner.email}</span>
                    {vendor.internalOwner.department && (
                      <span className="owner-department">{vendor.internalOwner.department}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="sidebar-card">
              <h4>Key Dates</h4>
              <div className="sidebar-dates">
                <div className="sidebar-date-item">
                  <span className="date-label">Created</span>
                  <span className="date-value">{formatDate(vendor.createdAt)}</span>
                </div>
                <div className="sidebar-date-item">
                  <span className="date-label">Updated</span>
                  <span className="date-value">{formatDate(vendor.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {vendor.remarks && (
              <div className="sidebar-card">
                <h4>Remarks</h4>
                <p className="sidebar-remarks">{vendor.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Vendor</h3>
              <p>
                Are you sure you want to delete <strong>{vendor.vendorName}</strong>?
                {vendor.inventoryCount > 0 && (
                  <span className="text-danger">
                    <br />This vendor has {vendor.inventoryCount} associated inventory item(s) and cannot be deleted.
                  </span>
                )}
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={deleting || vendor.inventoryCount > 0}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
