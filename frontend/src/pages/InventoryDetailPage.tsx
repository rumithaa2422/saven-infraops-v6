import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Asset = {
  id: string;
  assetNo: string;
  assetType: string;
  make?: string | null;
  model?: string | null;
  serialNo?: string | null;
  status: string;
  assignedToName?: string | null;
  location?: string | null;
  warrantyEndAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type TimelineEntry = {
  action: string;
  description: string;
  performedByName: string | null;
  createdAt: string;
};

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  // Calculate available and allocated quantities (placeholder logic)
  // In a real implementation, this would come from the backend
  const availableQuantity = asset?.status === 'AVAILABLE' ? 1 : 0;
  const allocatedQuantity = asset?.status === 'ASSIGNED' ? 1 : 0;

  // Build timeline from asset data
  function buildTimeline(): TimelineEntry[] {
    if (!asset) return [];
    
    const entries: TimelineEntry[] = [];
    
    // Asset Created entry
    entries.push({
      action: 'Inventory Created',
      description: `Asset ${asset.assetNo} was added to inventory`,
      performedByName: null,
      createdAt: asset.createdAt || ''
    });
    
    // Status changed entries would go here in future enhancements
    
    return entries;
  }

  const timeline = asset ? buildTimeline() : [];

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory/${id}`);
      setAsset(res.data.item);
      setError('');
    } catch {
      setError('Failed to load inventory details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Scroll to top of page when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    load();
  }, [id]);

  function handleBack() {
    navigate('/inventory');
  }

  function getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'AVAILABLE': return 'status-open';
      case 'ASSIGNED': return 'status-progress';
      case 'UNDER_REPAIR': return 'status-waiting';
      case 'DAMAGED': return 'status-cancelled';
      case 'LOST': return 'status-cancelled';
      case 'RETIRED': return 'status-closed';
      case 'DISPOSED': return 'status-closed';
      default: return 'status-open';
    }
  }

  function getWarrantyStatus(): { label: string; class: string } {
    if (!asset?.warrantyEndAt) {
      return { label: 'N/A', class: 'pill-medium' };
    }
    
    const warrantyEnd = new Date(asset.warrantyEndAt);
    const now = new Date();
    
    if (warrantyEnd < now) {
      return { label: 'Expired', class: 'pill-critical' };
    }
    
    // Check if expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (warrantyEnd < thirtyDaysFromNow) {
      return { label: 'Expiring Soon', class: 'pill-high' };
    }
    
    return { label: 'Active', class: 'pill-low' };
  }

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="detail-header">
          <div className="skeleton skeleton-title"></div>
          <div className="detail-header-info">
            <div className="detail-title-row">
              <div className="skeleton skeleton-badge"></div>
              <div className="skeleton skeleton-badge"></div>
            </div>
            <div className="detail-meta-row" style={{ marginTop: '12px' }}>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
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
          <div className="detail-sidebar">
            <div className="detail-card">
              <div className="detail-card-body">
                <div className="skeleton" style={{ width: '100%', height: '36px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="page-stack">
        <div className="detail-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error || 'Inventory item not found.'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  const warrantyStatus = getWarrantyStatus();

  return (
    <div className="page-stack">
      {/* Header */}
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
            <span className="detail-ticket-no">{asset.assetNo}</span>
            <span className={`status-badge ${getStatusClass(asset.status)}`}>
              {asset.status.replace(/_/g, ' ')}
            </span>
            <span className={`priority-badge ${warrantyStatus.class}`}>
              Warranty: {warrantyStatus.label}
            </span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-item">
              <span className="detail-meta-label">Category</span>
              <span className="detail-meta-value">{asset.assetType}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Location</span>
              <span className="detail-meta-value">{asset.location || 'Unassigned'}</span>
            </span>
            <span className="detail-meta-item">
              <span className="detail-meta-label">Created</span>
              <span className="detail-meta-value">{formatDate(asset.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column */}
        <div className="detail-main">
          {/* Inventory Information Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Inventory Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-field">
                <label>Item Name</label>
                <span className="detail-field-value">{asset.assetType}</span>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Category</label>
                  <span className="detail-field-value">{asset.assetType}</span>
                </div>
                <div className="detail-field">
                  <label>Sub Category</label>
                  <span className="detail-field-value">-</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Brand</label>
                  <span className="detail-field-value">{asset.make || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Model</label>
                  <span className="detail-field-value">{asset.model || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Vendor</label>
                  <span className="detail-field-value">-</span>
                </div>
                <div className="detail-field">
                  <label>Serial No</label>
                  <span className="detail-field-value">{asset.serialNo || '-'}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Purchase Date</label>
                  <span className="detail-field-value">-</span>
                </div>
                <div className="detail-field">
                  <label>Warranty Expiry</label>
                  <span className="detail-field-value">{formatDate(asset.warrantyEndAt)}</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>Location</label>
                  <span className="detail-field-value">{asset.location || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <span className={`status-badge ${getStatusClass(asset.status)}`}>
                    {asset.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Allocation Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Current Allocation</h3>
            </div>
            <div className="detail-card-body">
              <div className="empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="empty-state-title">No assets have been allocated.</p>
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
                  <span className="detail-field-value">-</span>
                </div>
                <div className="detail-field">
                  <label>Purchase Cost</label>
                  <span className="detail-field-value">-</span>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>GST</label>
                  <span className="detail-field-value">-</span>
                </div>
                <div className="detail-field">
                  <label>AMC</label>
                  <span className="detail-field-value">-</span>
                </div>
              </div>
              <div className="detail-field">
                <label>Vendor</label>
                <span className="detail-field-value">-</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Timeline</h3>
            </div>
            <div className="detail-card-body timeline-body">
              {timeline.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="empty-state-title">No activity yet</p>
                  <p className="empty-state-description">Timeline events will appear as actions are taken on this inventory item.</p>
                </div>
              ) : (
                <div className="timeline-list">
                  {timeline.map((entry, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="timeline-dot"></div>
                        {index < timeline.length - 1 && <div className="timeline-line"></div>}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-action">{entry.action}</span>
                          <span className="timeline-time">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="timeline-description">{entry.description}</p>
                        {entry.performedByName && (
                          <span className="timeline-user">
                            by {entry.performedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary Cards */}
        <div className="detail-sidebar">
          {/* Inventory Summary Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Inventory Summary</h3>
            </div>
            <div className="detail-card-body">
              <div className="summary-stat">
                <label>Category</label>
                <span className="summary-value">{asset.assetType}</span>
              </div>
              <div className="summary-stat">
                <label>Available Quantity</label>
                <span className="summary-value">{availableQuantity}</span>
              </div>
              <div className="summary-stat">
                <label>Allocated Quantity</label>
                <span className="summary-value">{allocatedQuantity}</span>
              </div>
              <div className="summary-stat">
                <label>Warranty Status</label>
                <span className={`priority-badge ${warrantyStatus.class}`}>
                  {warrantyStatus.label}
                </span>
              </div>
              <div className="summary-stat">
                <label>Location</label>
                <span className="summary-value">{asset.location || '-'}</span>
              </div>
            </div>
          </div>

          {/* Access Notice for Admins without permission */}
          {isAdmin && !isSuperAdmin && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Access Notice</h3>
              </div>
              <div className="detail-card-body">
                <div className="notice notice-info">
                  You have view-only access to this inventory item.
                </div>
              </div>
            </div>
          )}

          {/* Employee Notice */}
          {isEmployee && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Access Notice</h3>
              </div>
              <div className="detail-card-body">
                <div className="notice notice-warning">
                  You do not have access to view inventory details.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
