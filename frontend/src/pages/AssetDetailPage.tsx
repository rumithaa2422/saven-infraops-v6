import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Asset = {
  id: string;
  assetNo: string;
  assetType: string;
  make?: string;
  model?: string;
  serialNo?: string;
  status: string;
  assignedToName?: string;
  location?: string;
  warrantyEndAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
};

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAsset();
  }, [id]);

  async function loadAsset() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory/${id}`);
      setAsset(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load asset');
    } finally {
      setLoading(false);
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

  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'AVAILABLE': 'status-available',
      'ASSIGNED': 'status-assigned',
      'UNDER_REPAIR': 'status-maintenance',
      'DAMAGED': 'status-damaged',
      'RETIRED': 'status-retired'
    };
    return statusMap[status] || 'status-available';
  }

  function getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  function getWarrantyStatus(): { label: string; class: string } {
    if (!asset?.warrantyEndAt) return { label: '-', class: '' };
    
    const expiryDate = new Date(asset.warrantyEndAt);
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

  if (isEmployee) {
    return (
      <div className="page-stack">
        <div className="access-restricted">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Access Restricted</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Back Button */}
      <button className="btn-back-top" onClick={() => navigate('/inventory')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {loading ? (
        <div className="listing-loading">
          <div className="spinner"></div>
          <span>Loading asset...</span>
        </div>
      ) : error || !asset ? (
        <div className="notice notice-error">{error || 'Asset not found'}</div>
      ) : (
        <>
          {/* Header */}
          <div className="detail-header">
            <div className="detail-title-section">
              <div className="detail-title-row">
                <span className="detail-ticket-no">{asset.assetNo}</span>
                <span className={`status-badge ${getStatusClass(asset.status)}`}>
                  {getStatusLabel(asset.status)}
                </span>
              </div>
              <h2 className="detail-title">{asset.assetType}</h2>
              {asset.make && asset.model && (
                <p className="detail-description">{asset.make} {asset.model}</p>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="detail-summary-cards">
            <div className="detail-summary-card">
              <span className="detail-summary-label">Status</span>
              <span className="detail-summary-value">{getStatusLabel(asset.status)}</span>
            </div>
            <div className="detail-summary-card">
              <span className="detail-summary-label">Current Owner</span>
              <span className="detail-summary-value">{asset.assignedToName || '-'}</span>
            </div>
            <div className="detail-summary-card">
              <span className="detail-summary-label">Category</span>
              <span className="detail-summary-value">{asset.category?.name || '-'}</span>
            </div>
            <div className="detail-summary-card">
              <span className="detail-summary-label">Location</span>
              <span className="detail-summary-value">{asset.location || '-'}</span>
            </div>
            <div className="detail-summary-card">
              <span className="detail-summary-label">Warranty</span>
              <span className={`detail-summary-value ${getWarrantyStatus().class}`}>
                {getWarrantyStatus().label}
              </span>
            </div>
          </div>

          {/* Asset Information */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Asset Information
            </h3>
            <div className="detail-card">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Asset ID</label>
                  <span className="detail-id">{asset.assetNo}</span>
                </div>
                <div className="detail-field">
                  <label>Asset Name</label>
                  <span>{asset.assetType}</span>
                </div>
                <div className="detail-field">
                  <label>Category</label>
                  <span>{asset.category?.name || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Sub Category</label>
                  <span>{asset.subcategory?.name || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Brand</label>
                  <span>{asset.make || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Model</label>
                  <span>{asset.model || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Serial Number</label>
                  <span>{asset.serialNo || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Purchase Date</label>
                  <span>-</span>
                </div>
                <div className="detail-field">
                  <label>Warranty Expiry</label>
                  <span>{formatDate(asset.warrantyEndAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Current Assignment
            </h3>
            <div className="detail-card">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Assigned To</label>
                  <span>{asset.assignedToName || '-'}</span>
                </div>
                <div className="detail-field">
                  <label>Location</label>
                  <span>{asset.location || '-'}</span>
                </div>
              </div>
              {isSuperAdmin && (
                <div className="detail-notice">
                  <p>Assignment functionality will be implemented in a future phase.</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Timeline
            </h3>
            <div className="detail-card">
              <div className="detail-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Asset Created</div>
                    <div className="timeline-date">{formatDateTime(asset.createdAt)}</div>
                  </div>
                </div>
                {asset.updatedAt !== asset.createdAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Last Updated</div>
                      <div className="timeline-date">{formatDateTime(asset.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="detail-notice">
                <p>Detailed history will be available in a future phase.</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H16M8 8H16M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Remarks
            </h3>
            <div className="detail-card">
              <p className="no-remarks">No remarks available.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
