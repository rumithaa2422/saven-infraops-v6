import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  status: string;
  currentQty: number;
  location?: string;
  category: { name: string };
  subcategory: { name: string };
};

export function AccessManagementTransferPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const assetsRes = await api.get('/inventory/analytics/search', {
        params: { sortBy: 'itemName', sortOrder: 'asc' }
      });
      const analyticsRes = await api.get('/inventory/analytics');
      setAssets(assetsRes.data.items || []);
      setLocations(analyticsRes.data.filters.locations || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedAssetData = assets.find(a => a.id === selectedAsset);
  const maxTransferQty = selectedAssetData?.currentQty || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setError('Please select an asset');
      return;
    }
    if (!targetLocation) {
      setError('Please select a target location');
      return;
    }
    if (transferQty < 1 || transferQty > maxTransferQty) {
      setError('Invalid quantity');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/inventory-master/${selectedAsset}/history`, {
        action: 'TRANSFERRED',
        description: `Transferred ${transferQty} unit(s) to ${targetLocation}`,
        performedBy: user?.name || 'System'
      });
      setSuccess(`Successfully transferred ${transferQty} unit(s) to ${targetLocation}`);
      setSelectedAsset('');
      setTargetLocation('');
      setTransferQty(1);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to transfer asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="access-restricted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 7V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Access Restricted</h2>
            <p>You do not have permission to access this feature.</p>
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
            <h1>Asset Transfer</h1>
          </div>
        </div>

        <div className="action-page-content">
          <div className="action-form-card">
            <h3>Transfer Assets Between Locations</h3>
            
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

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Asset *</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => {
                    setSelectedAsset(e.target.value);
                    setTransferQty(1);
                  }}
                  required
                >
                  <option value="">Choose an asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.itemName} ({a.itemNo}) - {a.location || 'No Location'} - Qty: {a.currentQty}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAssetData && (
                <div className="asset-detail-box">
                  <div className="detail-row">
                    <span className="label">Current Location:</span>
                    <span className="value">{selectedAssetData.location || 'Not Set'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Available Quantity:</span>
                    <span className="value">{selectedAssetData.currentQty}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span className="value">{selectedAssetData.category.name} / {selectedAssetData.subcategory.name}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Target Location *</label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  required
                >
                  <option value="">Choose target location...</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity to Transfer *</label>
                <input
                  type="number"
                  min="1"
                  max={maxTransferQty}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  required
                />
                <small className="helper-text">Max: {maxTransferQty} units available</small>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => navigate('/access-management')}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={submitting || !selectedAsset || !targetLocation}>
                  {submitting ? 'Transferring...' : 'Transfer Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
