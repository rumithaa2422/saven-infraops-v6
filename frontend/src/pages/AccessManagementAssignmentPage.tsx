import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  status: string;
  currentQty: number;
  category: { name: string };
  subcategory: { name: string };
};

export function AccessManagementAssignmentPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [availableAssets, setAvailableAssets] = useState<InventoryItem[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, assetsRes] = await Promise.all([
        api.get('/users'),
        api.get('/inventory/analytics/search', {
          params: { status: 'AVAILABLE', sortBy: 'itemName', sortOrder: 'asc' }
        })
      ]);
      setUsers(usersRes.data.users || []);
      setAvailableAssets(assetsRes.data.items || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === availableAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(availableAssets.map(a => a.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      for (const assetId of selectedAssets) {
        await api.post(`/inventory-master/${assetId}/history`, {
          action: 'ASSIGNED',
          description: `Assigned to user ${users.find(u => u.id === selectedUser)?.name || selectedUser}`,
          performedBy: user?.name || 'System'
        });
      }
      setSuccess(`Successfully assigned ${selectedAssets.length} asset(s) to ${users.find(u => u.id === selectedUser)?.name}`);
      setSelectedAssets([]);
      setSelectedUser('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign assets');
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
            <h1>Asset Assignment</h1>
          </div>
        </div>

        <div className="action-page-content">
          <div className="action-form-card">
            <h3>Assign Assets to User</h3>
            
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
                <label>Select User *</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div className="asset-select-header">
                  <label>Select Assets ({selectedAssets.length} selected)</label>
                  <button type="button" className="select-all-btn" onClick={handleSelectAll}>
                    {selectedAssets.length === availableAssets.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="asset-select-list">
                  {loading ? (
                    <p className="loading-text">Loading assets...</p>
                  ) : availableAssets.length === 0 ? (
                    <p className="empty-text">No available assets for assignment</p>
                  ) : (
                    availableAssets.map(asset => (
                      <label key={asset.id} className="asset-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleAssetToggle(asset.id)}
                        />
                        <div className="asset-info">
                          <span className="asset-name">{asset.itemName}</span>
                          <span className="asset-meta">
                            {asset.itemNo} • {asset.category.name} • {asset.subcategory.name}
                          </span>
                        </div>
                        <span className="asset-qty">Qty: {asset.currentQty}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => navigate('/access-management')}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={submitting || !selectedUser || selectedAssets.length === 0}>
                  {submitting ? 'Assigning...' : `Assign ${selectedAssets.length} Asset(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
