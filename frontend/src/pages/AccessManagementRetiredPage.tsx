import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  status: string;
  currentQty: number;
  location?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  category: { name: string };
  subcategory: { name: string };
};

export function AccessManagementRetiredPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [retiredAssets, setRetiredAssets] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  const [retirementReason, setRetirementReason] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('RECYCLED');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const assetsRes = await api.get('/inventory/analytics/search', {
        params: { sortBy: 'itemName', sortOrder: 'asc' }
      });
      const retired = assetsRes.data.items.filter((item: InventoryItem) => item.status === 'RETIRED');
      setRetiredAssets(retired);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAssets = retiredAssets.filter(asset =>
    asset.itemName.toLowerCase().includes(search.toLowerCase()) ||
    asset.itemNo.toLowerCase().includes(search.toLowerCase()) ||
    (asset.brand && asset.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setError('Please select an asset to retire');
      return;
    }
    if (!retirementReason.trim()) {
      setError('Please provide a retirement reason');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/inventory-master/${selectedAsset.id}/history`, {
        action: 'RETIRED',
        description: `[${disposalMethod}] ${retirementReason}`,
        performedBy: 'System'
      });
      setSuccess(`Successfully retired ${selectedAsset.itemName}`);
      setSelectedAsset(null);
      setRetirementReason('');
      setDisposalMethod('RECYCLED');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retire asset');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (!isSuperAdmin) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="access-restricted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 7V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Access Restricted</h2>
            <p>Only Super Admins can manage retired assets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack">
        <div className="page-header">
          <button type="button" className="back-btn" onClick={() => navigate('/access-management')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div>
            <p className="eyebrow">Asset Management</p>
            <h1>Retired Assets</h1>
          </div>
        </div>

        {success && (
          <div className="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {success}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="retired-page-layout">
          {/* Retired Assets List */}
          <div className="retired-assets-panel">
            <div className="panel-header">
              <h3>Retired Assets ({filteredAssets.length})</h3>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="retired-assets-list">
              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : filteredAssets.length === 0 ? (
                <div className="empty-state">
                  <p>No retired assets found</p>
                </div>
              ) : (
                filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    className={`retired-asset-item ${selectedAsset?.id === asset.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setRetirementReason('');
                      setDisposalMethod('RECYCLED');
                    }}
                  >
                    <div className="asset-main">
                      <span className="asset-name">{asset.itemName}</span>
                      <span className="asset-id">{asset.itemNo}</span>
                    </div>
                    <div className="asset-meta">
                      {asset.brand && <span>{asset.brand}</span>}
                      <span>{asset.category.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Asset Details & Retirement Form */}
          <div className="retired-asset-detail">
            {selectedAsset ? (
              <>
                <div className="detail-header">
                  <h3>{selectedAsset.itemName}</h3>
                  <span className="asset-id">{selectedAsset.itemNo}</span>
                </div>

                <div className="detail-info-grid">
                  <div className="info-item">
                    <label>Brand/Model</label>
                    <span>{selectedAsset.brand || '-'} {selectedAsset.model ? `/ ${selectedAsset.model}` : ''}</span>
                  </div>
                  <div className="info-item">
                    <label>Category</label>
                    <span>{selectedAsset.category.name} / {selectedAsset.subcategory.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <span>{selectedAsset.location || 'Not Set'}</span>
                  </div>
                  <div className="info-item">
                    <label>Purchase Date</label>
                    <span>{formatDate(selectedAsset.purchaseDate)}</span>
                  </div>
                  <div className="info-item">
                    <label>Purchase Cost</label>
                    <span>{formatCurrency(selectedAsset.purchaseCost)}</span>
                  </div>
                  <div className="info-item">
                    <label>Warranty Expiry</label>
                    <span>{formatDate(selectedAsset.warrantyExpiry)}</span>
                  </div>
                  <div className="info-item">
                    <label>Current Qty</label>
                    <span>{selectedAsset.currentQty}</span>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <span className="status-badge status-retired">{selectedAsset.status}</span>
                  </div>
                </div>

                <div className="divider"></div>

                <h4>Retire This Asset</h4>
                <form onSubmit={handleRetire}>
                  <div className="form-group">
                    <label>Disposal Method *</label>
                    <select
                      value={disposalMethod}
                      onChange={(e) => setDisposalMethod(e.target.value)}
                      required
                    >
                      <option value="RECYCLED">Recycled</option>
                      <option value="DONATED">Donated</option>
                      <option value="SOLD">Sold</option>
                      <option value="DISPOSED">Disposed</option>
                      <option value="WAREHOUSED">Stored in Warehouse</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Retirement Reason *</label>
                    <textarea
                      value={retirementReason}
                      onChange={(e) => setRetirementReason(e.target.value)}
                      placeholder="Enter the reason for retirement..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="secondary" onClick={() => setSelectedAsset(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="danger" disabled={submitting || !retirementReason.trim()}>
                      {submitting ? 'Processing...' : 'Confirm Retirement'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="no-selection">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 14H20M4 10H20M10 4H14M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Select an asset from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
