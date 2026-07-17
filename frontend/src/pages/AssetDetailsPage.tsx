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

type Assignment = {
  id: string;
  inventoryId: string;
  userId: string | null;
  projectId: string | null;
  assignedBy: string;
  assignedByName: string;
  assignedDate: string;
  status: string;
  remarks: string | null;
  returnedDate: string | null;
  user: { id: string; name: string; email: string } | null;
  project: { id: string; projectName: string; projectCode: string } | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  department?: string;
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
};

const NON_ASSIGNABLE_STATUSES = ['UNDER_REPAIR', 'RETIRED', 'LOST', 'DAMAGED'];

export function AssetDetailsPage() {
  const { inventoryId } = useParams<{ inventoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

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

  async function loadAssignment() {
    if (!inventoryId) return;
    try {
      const res = await api.get(`/inventory-assignments/inventory/${inventoryId}`);
      setAssignment(res.data.assignment || null);
    } catch {
      setAssignment(null);
    }
  }

  useEffect(() => {
    loadItem();
    loadAssignment();
  }, [inventoryId]);

  useEffect(() => {
    if (showAssignModal) {
      loadUsers();
      loadProjects();
    }
  }, [showAssignModal]);

  useEffect(() => {
    if (showAssignModal && userSearch) {
      loadUsers(userSearch);
    }
  }, [userSearch, showAssignModal]);

  useEffect(() => {
    if (showAssignModal && projectSearch) {
      loadProjects(projectSearch);
    }
  }, [projectSearch, showAssignModal]);

  async function loadUsers(search = '') {
    try {
      const res = await api.get('/inventory-assignments/users', { params: { search } });
      setUsers(res.data.users || []);
    } catch {
      setUsers([]);
    }
  }

  async function loadProjects(search = '') {
    try {
      const res = await api.get('/inventory-assignments/projects', { params: { search } });
      setProjects(res.data.projects || []);
    } catch {
      setProjects([]);
    }
  }

  function handleBack() {
    navigate('/access-management');
  }

  function openAssignModal() {
    setShowAssignModal(true);
    setSelectedUser('');
    setSelectedProject('');
    setRemarks('');
    setAssignError('');
    setUserSearch('');
    setProjectSearch('');
  }

  function closeAssignModal() {
    setShowAssignModal(false);
    setUsers([]);
    setProjects([]);
  }

  async function handleAssign() {
    if (!inventoryId) return;

    // Validation
    if (!selectedUser) {
      setAssignError('Please select a user');
      return;
    }
    if (!selectedProject) {
      setAssignError('Please select a project');
      return;
    }

    try {
      setAssigning(true);
      setAssignError('');

      await api.post('/inventory-assignments', {
        inventoryId,
        userId: selectedUser,
        projectId: selectedProject,
        remarks: remarks || undefined
      });

      // Refresh data
      await Promise.all([loadItem(), loadAssignment()]);
      closeAssignModal();
    } catch (err: any) {
      setAssignError(err.response?.data?.message || 'Failed to assign inventory');
    } finally {
      setAssigning(false);
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

  const canAssign = isSuperAdmin && item && !NON_ASSIGNABLE_STATUSES.includes(item.status) && !assignment;

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
              <span className={`asset-summary-value ${assignment ? '' : 'not-assigned'}`}>
                {assignment?.user?.name || 'Not Assigned'}
              </span>
            </div>
            <div className="asset-summary-card">
              <span className="asset-summary-label">Current Project</span>
              <span className={`asset-summary-value ${assignment ? '' : 'not-assigned'}`}>
                {assignment?.project?.projectName || 'Not Assigned'}
              </span>
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
              {assignment ? (
                <div className="assignment-details">
                  <div className="detail-field-row">
                    <div className="detail-field">
                      <label>Assigned User</label>
                      <span className="detail-field-value">{assignment.user?.name || '-'}</span>
                    </div>
                    <div className="detail-field">
                      <label>Project</label>
                      <span className="detail-field-value">{assignment.project?.projectName || '-'}</span>
                    </div>
                  </div>
                  <div className="detail-field-row">
                    <div className="detail-field">
                      <label>Assigned Date</label>
                      <span className="detail-field-value">{formatDate(assignment.assignedDate)}</span>
                    </div>
                    <div className="detail-field">
                      <label>Status</label>
                      <span className="detail-field-value">
                        <span className={`status-badge status-${assignment.status.toLowerCase()}`}>
                          {assignment.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  {assignment.remarks && (
                    <div className="detail-field">
                      <label>Remarks</label>
                      <span className="detail-field-value">{assignment.remarks}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="detail-empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p>No active assignment.</p>
                </div>
              )}
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
                  <div 
                    className={`action-card ${canAssign ? 'action-card-clickable' : ''}`}
                    onClick={canAssign ? openAssignModal : undefined}
                  >
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="action-label">Assign</span>
                    {canAssign ? (
                      <span className="action-badge ready">Click to Assign</span>
                    ) : (
                      <span className="action-badge phase3">Not Available</span>
                    )}
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

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-content assign-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Inventory</h2>
              <button className="modal-close" onClick={closeAssignModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Step 1: Inventory Information */}
              <div className="assign-step">
                <div className="step-header">
                  <span className="step-number">1</span>
                  <span className="step-title">Inventory Information</span>
                </div>
                <div className="step-content inventory-info-preview">
                  <div className="info-row">
                    <span className="info-label">Inventory ID</span>
                    <span className="info-value mono">{item?.itemNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Item Name</span>
                    <span className="info-value">{item?.itemName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Category</span>
                    <span className="info-value">{item?.category?.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Subcategory</span>
                    <span className="info-value">{item?.subcategory?.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Brand</span>
                    <span className="info-value">{item?.brand || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Model</span>
                    <span className="info-value">{item?.model || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Assign To */}
              <div className="assign-step">
                <div className="step-header">
                  <span className="step-number">2</span>
                  <span className="step-title">Assign To</span>
                </div>
                <div className="step-content">
                  <div className="searchable-dropdown">
                    <label>Select User *</label>
                    <div className="dropdown-input-wrapper">
                      <input
                        type="text"
                        className="dropdown-input"
                        placeholder="Search user by name or email..."
                        value={userSearch}
                        onChange={e => {
                          setUserSearch(e.target.value);
                          setSelectedUser('');
                        }}
                        onFocus={() => {
                          setShowUserDropdown(true);
                          loadUsers(userSearch);
                        }}
                      />
                      {showUserDropdown && users.length > 0 && (
                        <div className="dropdown-list">
                          {users.map(user => (
                            <div
                              key={user.id}
                              className={`dropdown-item ${selectedUser === user.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedUser(user.id);
                                setUserSearch(user.name);
                                setShowUserDropdown(false);
                              }}
                            >
                              <div className="dropdown-item-name">{user.name}</div>
                              <div className="dropdown-item-email">{user.email}</div>
                              {user.department && (
                                <div className="dropdown-item-dept">{user.department}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Project */}
              <div className="assign-step">
                <div className="step-header">
                  <span className="step-number">3</span>
                  <span className="step-title">Project</span>
                </div>
                <div className="step-content">
                  <div className="searchable-dropdown">
                    <label>Select Project *</label>
                    <div className="dropdown-input-wrapper">
                      <input
                        type="text"
                        className="dropdown-input"
                        placeholder="Search project by name or code..."
                        value={projectSearch}
                        onChange={e => {
                          setProjectSearch(e.target.value);
                          setSelectedProject('');
                        }}
                        onFocus={() => {
                          setShowProjectDropdown(true);
                          loadProjects(projectSearch);
                        }}
                      />
                      {showProjectDropdown && projects.length > 0 && (
                        <div className="dropdown-list">
                          {projects.map(project => (
                            <div
                              key={project.id}
                              className={`dropdown-item ${selectedProject === project.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedProject(project.id);
                                setProjectSearch(project.projectName);
                                setShowProjectDropdown(false);
                              }}
                            >
                              <div className="dropdown-item-name">{project.projectName}</div>
                              <div className="dropdown-item-email">{project.projectCode}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Remarks */}
              <div className="assign-step">
                <div className="step-header">
                  <span className="step-number">4</span>
                  <span className="step-title">Remarks</span>
                </div>
                <div className="step-content">
                  <textarea
                    className="remarks-textarea"
                    placeholder="Optional remarks..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {assignError && (
                <div className="assign-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {assignError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeAssignModal}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAssign}
                disabled={assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
