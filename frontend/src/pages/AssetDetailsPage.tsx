import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendor?: string;
  invoiceNo?: string;
  purchaseCost?: number;
  gst?: number;
  purchaseDate?: string;
  warrantyMonths?: number;
  warrantyExpiry?: string;
  location?: string;
  minStock?: number;
  currentQty: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
};

export function AssetDetailsPage() {
  const { inventoryId } = useParams<{ inventoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadItem() {
    if (!inventoryId) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory-master/${inventoryId}`);
      setItem(res.data.item);
      setError('');
    } catch {
      setError('Failed to load asset details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItem();
  }, [inventoryId]);

  function handleBack() {
    navigate('/access-management');
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function getWarrantyStatus(expiry?: string): { label: string; class: string } {
    if (!expiry) return { label: 'No Warranty', class: 'warranty-none' };
    const expiryDate = new Date(expiry);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    if (expiryDate < now) {
      return { label: 'Expired', class: 'warranty-expired' };
    } else if (expiryDate <= thirtyDays) {
      return { label: 'Expiring Soon', class: 'warranty-warning' };
    }
    return { label: 'Active', class: 'warranty-active' };
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="detail-header">
          <div className="skeleton skeleton-title"></div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <div className="skeleton skeleton-badge"></div>
            </div>
            <div className="detail-meta-row" style={{ marginTop: '12px' }}>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Asset not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Asset Management
          </button>
        </div>
      </div>
    );
  }

  const warrantyStatus = getWarrantyStatus(item.warrantyExpiry);

  return (
    <div className="page-stack">
      {/* Page Header */}
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button className="btn-back" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="detail-header-info">
          <div className="detail-title-row">
            <span className="detail-ticket-no">{item.itemNo}</span>
            <span className={`status-badge status-${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Item</span>
              <span className="detail-meta-value">{item.itemName}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Category</span>
              <span className="detail-meta-value">{item.category?.name || '-'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Subcategory</span>
              <span className="detail-meta-value">{item.subcategory?.name || '-'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column - Main Content */}
        <div className="detail-main">
          {/* Summary Cards */}
          <div className="asset-summary-cards">
            <div className="asset-summary-card">
              <span className="asset-summary-label">Current Status</span>
              <span className={`asset-summary-value status-text status-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Current User</span>
              <span className="asset-summary-value not-assigned">Not Assigned</span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Current Project</span>
              <span className="asset-summary-value not-assigned">Not Assigned</span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Warranty</span>
              <span className={`asset-summary-value ${warrantyStatus.class}`}>
                {warrantyStatus.label}
              </span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Location</span>
              <span className="asset-summary-value">{item.location || '-'}</span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Purchase Date</span>
              <span className="asset-summary-value">{formatDate(item.purchaseDate)}</span>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Inventory Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Inventory ID</label>
                  <span className="detail-field-value mono">{item.itemNo}</span>
                </div>
                <div className="detail-field">
                  <label>Item Name</label>
                  <span className="detail-field-value">{item.itemName}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Category</label>
                  <span className="detail-field-value">{item.category?.name || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Subcategory</label>
                  <span className="detail-field-value">{item.subcategory?.name || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Brand</label>
                  <span className="detail-field-value">{item.brand || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Model</label>
                  <span className="detail-field-value">{item.model || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Vendor</label>
                  <span className="detail-field-value">{item.vendor || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Invoice Number</label>
                  <span className="detail-field-value">{item.invoiceNo || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Purchase Cost</label>
                  <span className="detail-field-value">{formatCurrency(item.purchaseCost)}</span>
                </div>
                <div className="detail-field">
                  <label>GST</label>
                  <span className="detail-field-value">
                    {item.gst !== undefined && item.gst !== null ? `${item.gst}%` : '-'}
                  </span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Purchase Date</label>
                  <span className="detail-field-value">{formatDate(item.purchaseDate)}</span>
                </div>
                <div className="detail-field">
                  <label>Warranty</label>
                  <span className="detail-field-value">
                    {item.warrantyMonths ? `${item.warrantyMonths} months` : '-'}
                  </span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Warranty Expiry</label>
                  <span className={`detail-field-value ${warrantyStatus.class}`}>
                    {formatDate(item.warrantyExpiry)}
                    {warrantyStatus.label !== 'No Warranty' && (
                      <span className={`warranty-label ${warrantyStatus.class}`}>
                        {warrantyStatus.label}
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Location</label>
                  <span className="detail-field-value">{item.location || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Minimum Stock</label>
                  <span className="detail-field-value">{item.minStock ?? '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Current Quantity</label>
                  <span className="detail-field-value">{item.currentQty}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Status</label>
                  <span className={`detail-field-value status-badge status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Remarks</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-empty-state">
                <p>No remarks available.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="detail-sidebar">
          {/* Current Assignment */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Current Assignment</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <p>No active assignment.</p>
              </div>
            </div>
          </div>

          {/* Assignment History */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Assignment History</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No assignment history available.</p>
              </div>
            </div>
          </div>

          {/* Lifecycle Actions - Only for Super Admin */}
          {isSuperAdmin && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Lifecycle Actions</h3>
              </div>
              <div className="detail-card-body">
                <div className="action-cards-grid">
                  <div className="action-card">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Assign</span>
                    <span className="action-badge phase3">Available in Phase 3</span>
                  </div>
                  <div className="action-card">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 3L21 7L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 7H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M7 13L3 17L7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Transfer</span>
                    <span className="action-badge phase3">Available in Phase 3</span>
                  </div>
                  <div className="action-card">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Return</span>
                    <span className="action-badge phase3">Available in Phase 3</span>
                  </div>
                  <div className="action-card">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Repair</span>
                    <span className="action-badge phase3">Available in Phase 3</span>
                  </div>
                  <div className="action-card">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4L20 20M4 4H12M4 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 20V12M20 20H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Retire</span>
                    <span className="action-badge phase3">Available in Phase 3</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
