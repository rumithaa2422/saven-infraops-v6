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

type TimelineEntry = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
};

export function InventoryMasterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Calculate available quantity (current - reserved)
  const reservedQty = 0; // Will be implemented later
  const availableQty = item ? item.currentQty - reservedQty : 0;

  // Get warranty status
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

  async function loadItem() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory-master/${id}`);
      setItem(res.data.item);
      setError('');
    } catch {
      setError('Failed to load inventory item details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isEmployee) {
      setError('Access Restricted. You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    loadItem();
  }, [id, isEmployee]);

  function handleBack() {
    if (item) {
      navigate(`/inventory/${item.category.id}`);
    } else {
      navigate('/inventory');
    }
  }

  function handleEdit() {
    navigate(`/inventory/master/${id}/edit`);
  }

  async function handleDelete() {
    if (!item) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this inventory item? This action cannot be undone.');
    if (!confirmed) return;

    const categoryId = item.category.id;
    
    try {
      setDeleting(true);
      await api.delete(`/inventory-master/${item.id}`);
      setMessage('Inventory item deleted successfully.');
      setTimeout(() => {
        navigate(`/inventory/${categoryId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete inventory item.');
    } finally {
      setDeleting(false);
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

  function formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Timeline entries (static for now - will be enhanced later)
  const timelineEntries: TimelineEntry[] = item ? [
    {
      id: '1',
      action: 'Inventory Created',
      description: `Item "${item.itemName}" was created`,
      createdAt: item.createdAt
    }
  ] : [];

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack inventory-master-detail">
          <div className="page-header">
            <div className="page-header-left">
              <div>
                <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '16px', marginTop: '4px' }}></div>
              </div>
            </div>
          </div>
          <div className="detail-content-grid">
            <div className="detail-main">
              <div className="detail-card">
                <div className="detail-card-body">
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ marginTop: '16px' }}></div>
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="workspace">
        <div className="page-stack inventory-master-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-secondary" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div>
                <h1 className="page-header-title">Error</h1>
              </div>
            </div>
          </div>
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'Inventory item not found.'}</p>
            <button className="btn-secondary" onClick={handleBack}>
              Back to Inventory Master
            </button>
          </div>
        </div>
      </div>
    );
  }

  const warrantyStatus = getWarrantyStatus(item.warrantyExpiry);
  const isLowStock = item.minStock && item.currentQty < item.minStock;

  return (
    <div className="workspace">
      <div className="page-stack inventory-master-detail">
        {message && (
          <div className="notice notice-success">{message}</div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-secondary" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div>
              <h1 className="page-header-title">{item.itemName}</h1>
              <p className="page-header-subtitle">{item.itemNo}</p>
            </div>
          </div>
          <div className="page-header-right">
            <span className={`status-badge status-${item.status.toLowerCase()}`}>
              {item.status}
            </span>
            {isLowStock && (
              <span className="priority-badge priority-high">
                Low Stock
              </span>
            )}
          </div>
        </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-main">
          {/* Inventory Summary Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Inventory Summary</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Item Name</label>
                  <span className="detail-field-value">{item.itemName}</span>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <span className={`detail-field-value status-badge status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Available Quantity</label>
                  <span className={`detail-field-value ${isLowStock ? 'qty-low' : ''}`}>
                    {availableQty}
                  </span>
                </div>
              </div>
              <div className="detail-field">
                <label>Location</label>
                <span className="detail-field-value">{item.location || '-'}</span>
              </div>
            </div>
          </div>

          {/* Basic Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Basic Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Category</label>
                  <span className="detail-field-value">{item.category?.name || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Subcategory</label>
                  <span className="detail-field-value">{item.subcategory?.name || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Brand</label>
                  <span className="detail-field-value">{item.brand || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Model</label>
                  <span className="detail-field-value">{item.model || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Vendor</label>
                  <span className="detail-field-value">{item.vendor || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Purchase Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Invoice Number</label>
                  <span className="detail-field-value">{item.invoiceNo || '-'}</span>
                </div>
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
                  <label>Warranty (Months)</label>
                  <span className="detail-field-value">
                    {item.warrantyMonths ? `${item.warrantyMonths} months` : '-'}
                  </span>
                </div>
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
              </div>
            </div>
          </div>

          {/* Stock Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Stock Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Current Quantity</label>
                  <span className={`detail-field-value ${isLowStock ? 'qty-low' : ''}`}>
                    {item.currentQty}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Minimum Stock</label>
                  <span className="detail-field-value">{item.minStock ?? '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Reserved Quantity</label>
                  <span className="detail-field-value">{reservedQty}</span>
                </div>
              </div>
              <div className="detail-field">
                <label>Available Quantity</label>
                <span className={`detail-field-value ${isLowStock ? 'qty-low' : ''}`}>
                  {availableQty}
                </span>
              </div>
            </div>
          </div>

          {/* History Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>History</h3>
            </div>
            <div className="detail-card-body">
              {timelineEntries.length === 0 ? (
                <div className="timeline-empty">
                  <p>No history available</p>
                </div>
              ) : (
                <div className="timeline">
                  {timelineEntries.map((entry, index) => (
                    <div key={entry.id} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-action">{entry.action}</span>
                          <span className="timeline-date">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <p className="timeline-description">{entry.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="detail-sidebar">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Actions</h3>
            </div>
            <div className="detail-card-body">
              {isSuperAdmin ? (
                <>
                  <button
                    className="btn-primary-full"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger-full"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              ) : (
                <p className="read-only-notice">
                  You have read-only access to this page.
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Quick Stats</h3>
            </div>
            <div className="detail-card-body">
              <div className="quick-stat">
                <span className="quick-stat-label">Created</span>
                <span className="quick-stat-value">{formatDate(item.createdAt)}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Last Updated</span>
                <span className="quick-stat-value">{formatDate(item.updatedAt)}</span>
              </div>
              {warrantyStatus.label !== 'No Warranty' && (
                <div className="quick-stat">
                  <span className="quick-stat-label">Warranty Status</span>
                  <span className={`quick-stat-value ${warrantyStatus.class}`}>
                    {warrantyStatus.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
