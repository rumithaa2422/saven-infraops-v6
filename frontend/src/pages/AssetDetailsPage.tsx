import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/serviceRequests/PageHeader';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  Download,
  MoreVertical
} from 'lucide-react';

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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [userError, setUserError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [userActiveIndex, setUserActiveIndex] = useState(-1);
  const [projectActiveIndex, setProjectActiveIndex] = useState(-1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUser, setTransferUser] = useState('');
  const [transferProject, setTransferProject] = useState('');
  const [transferUserSearch, setTransferUserSearch] = useState('');
  const [transferProjectSearch, setTransferProjectSearch] = useState('');
  const [filteredTransferUsers, setFilteredTransferUsers] = useState<User[]>([]);
  const [filteredTransferProjects, setFilteredTransferProjects] = useState<Project[]>([]);
  const [showTransferUserDropdown, setShowTransferUserDropdown] = useState(false);
  const [showTransferProjectDropdown, setShowTransferProjectDropdown] = useState(false);
  const [transferUserError, setTransferUserError] = useState('');
  const [transferProjectError, setTransferProjectError] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returning, setReturning] = useState(false);

  // Repair modal state
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [repairRemarks, setRepairRemarks] = useState('');
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState('');

  // Retire modal state
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireReason, setRetireReason] = useState('');
  const [retireRemarks, setRetireRemarks] = useState('');
  const [retiring, setRetiring] = useState(false);
  const [retireError, setRetireError] = useState('');

  // Refs for click-outside detection and focus
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const transferUserDropdownRef = useRef<HTMLDivElement>(null);
  const transferProjectDropdownRef = useRef<HTMLDivElement>(null);

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
      setUserActiveIndex(-1);
      setProjectActiveIndex(-1);
    }
  }, [showAssignModal]);

  // Filter users based on search
  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers(users);
    } else {
      const search = userSearch.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      ));
    }
    setUserActiveIndex(-1);
  }, [userSearch, users]);

  // Filter projects based on search
  useEffect(() => {
    if (!projectSearch.trim()) {
      setFilteredProjects(projects);
    } else {
      const search = projectSearch.toLowerCase();
      setFilteredProjects(projects.filter(p => 
        p.projectName.toLowerCase().includes(search) || 
        p.projectCode.toLowerCase().includes(search)
      ));
    }
    setProjectActiveIndex(-1);
  }, [projectSearch, projects]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    }

    if (showAssignModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssignModal]);

  // Keyboard navigation for user dropdown
  function handleUserKeyDown(e: React.KeyboardEvent) {
    if (!showUserDropdown || filteredUsers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setUserActiveIndex(prev => prev < filteredUsers.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setUserActiveIndex(prev => prev > 0 ? prev - 1 : filteredUsers.length - 1);
    } else if (e.key === 'Enter' && userActiveIndex >= 0) {
      e.preventDefault();
      selectUser(filteredUsers[userActiveIndex]);
    } else if (e.key === 'Escape') {
      setShowUserDropdown(false);
    }
  }

  // Keyboard navigation for project dropdown
  function handleProjectKeyDown(e: React.KeyboardEvent) {
    if (!showProjectDropdown || filteredProjects.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProjectActiveIndex(prev => prev < filteredProjects.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProjectActiveIndex(prev => prev > 0 ? prev - 1 : filteredProjects.length - 1);
    } else if (e.key === 'Enter' && projectActiveIndex >= 0) {
      e.preventDefault();
      selectProject(filteredProjects[projectActiveIndex]);
    } else if (e.key === 'Escape') {
      setShowProjectDropdown(false);
    }
  }

  function selectUser(user: User) {
    setSelectedUser(user.id);
    setUserSearch(user.name);
    setUserError('');
    setShowUserDropdown(false);
  }

  function selectProject(project: Project) {
    setSelectedProject(project.id);
    setProjectSearch(project.projectName);
    setProjectError('');
    setShowProjectDropdown(false);
  }

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
    setUserError('');
    setProjectError('');
    setUserSearch('');
    setProjectSearch('');
    setFilteredUsers([]);
    setFilteredProjects([]);
    setShowSuccessToast(false);
  }

  function closeAssignModal() {
    setShowAssignModal(false);
    setUsers([]);
    setProjects([]);
    setFilteredUsers([]);
    setFilteredProjects([]);
    setShowUserDropdown(false);
    setShowProjectDropdown(false);
    setShowSuccessToast(false);
  }

  async function handleAssign() {
    if (!inventoryId) return;

    // Validation
    let hasError = false;
    if (!selectedUser) {
      setUserError('Please select a user');
      hasError = true;
    } else {
      setUserError('');
    }
    if (!selectedProject) {
      setProjectError('Please select a project');
      hasError = true;
    } else {
      setProjectError('');
    }
    if (hasError) return;

    try {
      setAssigning(true);
      setAssignError('');

      await api.post('/inventory-assignments', {
        inventoryId,
        userId: selectedUser,
        projectId: selectedProject,
        remarks: remarks || undefined
      });

      // Show success toast
      setShowSuccessToast(true);
      
      // Close modal after brief delay
      setTimeout(() => {
        closeAssignModal();
        // Refresh data
        loadItem();
        loadAssignment();
      }, 1500);
    } catch (err: any) {
      setAssignError(err.response?.data?.message || 'Failed to assign inventory');
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

  // Transfer handlers
  function openTransferModal() {
    setShowTransferModal(true);
    setTransferUser('');
    setTransferProject('');
    setTransferUserSearch('');
    setTransferProjectSearch('');
    setTransferRemarks('');
    setTransferUserError('');
    setTransferProjectError('');
    // Load users and projects for transfer
    api.get('/inventory-assignments/users').then(res => {
      setFilteredTransferUsers(res.data.users || []);
    });
    api.get('/inventory-assignments/projects').then(res => {
      setFilteredTransferProjects(res.data.projects || []);
    });
  }

  function closeTransferModal() {
    setShowTransferModal(false);
  }

  async function handleTransfer() {
    if (!inventoryId) return;

    let hasError = false;
    if (!transferUser) {
      setTransferUserError('Please select a new user');
      hasError = true;
    } else {
      setTransferUserError('');
    }
    if (!transferProject) {
      setTransferProjectError('Please select a project');
      hasError = true;
    } else {
      setTransferProjectError('');
    }
    if (hasError) return;

    try {
      setTransferring(true);
      await api.post('/inventory-assignments/transfer', {
        inventoryId,
        userId: transferUser,
        projectId: transferProject,
        remarks: transferRemarks || undefined
      });

      setToastMessage('Inventory transferred successfully!');
      setShowSuccessToast(true);
      setTimeout(() => {
        closeTransferModal();
        setShowSuccessToast(false);
        loadItem();
        loadAssignment();
      }, 1500);
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || 'Failed to transfer inventory');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setTransferring(false);
    }
  }

  // Return handlers
  function openReturnModal() {
    setShowReturnModal(true);
    setReturnRemarks('');
  }

  function closeReturnModal() {
    setShowReturnModal(false);
  }

  async function handleReturn() {
    if (!inventoryId) return;

    try {
      setReturning(true);
      await api.post('/inventory-assignments/return', {
        inventoryId,
        remarks: returnRemarks || undefined
      });

      setToastMessage('Inventory returned successfully!');
      setShowSuccessToast(true);
      setTimeout(() => {
        closeReturnModal();
        setShowSuccessToast(false);
        loadItem();
        loadAssignment();
      }, 1500);
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || 'Failed to return inventory');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setReturning(false);
    }
  }

  // Repair handlers
  function openRepairModal() {
    setShowRepairModal(true);
    setIssueDescription('');
    setVendor('');
    setExpectedReturnDate('');
    setRepairRemarks('');
    setRepairError('');
  }

  function closeRepairModal() {
    setShowRepairModal(false);
  }

  async function handleRepair() {
    if (!inventoryId) return;

    if (!issueDescription.trim()) {
      setRepairError('Issue description is required');
      return;
    }

    try {
      setRepairing(true);
      setRepairError('');
      await api.post('/inventory-assignments/repair', {
        inventoryId,
        issueDescription,
        vendor: vendor || undefined,
        expectedReturnDate: expectedReturnDate || undefined,
        remarks: repairRemarks || undefined
      });

      setToastMessage('Inventory sent for repair!');
      setShowSuccessToast(true);
      setTimeout(() => {
        closeRepairModal();
        setShowSuccessToast(false);
        loadItem();
        loadAssignment();
      }, 1500);
    } catch (err: any) {
      setRepairError(err.response?.data?.message || 'Failed to send for repair');
    } finally {
      setRepairing(false);
    }
  }

  // Retire handlers
  function openRetireModal() {
    setShowRetireModal(true);
    setRetireReason('');
    setRetireRemarks('');
    setRetireError('');
  }

  function closeRetireModal() {
    setShowRetireModal(false);
  }

  async function handleRetire() {
    if (!inventoryId) return;

    if (!retireReason.trim()) {
      setRetireError('Retirement reason is required');
      return;
    }

    try {
      setRetiring(true);
      setRetireError('');
      await api.post('/inventory-assignments/retire', {
        inventoryId,
        reason: retireReason,
        remarks: retireRemarks || undefined
      });

      setToastMessage('Inventory retired successfully!');
      setShowSuccessToast(true);
      setTimeout(() => {
        closeRetireModal();
        setShowSuccessToast(false);
        loadItem();
        loadAssignment();
      }, 1500);
    } catch (err: any) {
      setRetireError(err.response?.data?.message || 'Failed to retire inventory');
    } finally {
      setRetiring(false);
    }
  }

  // Filter users for transfer
  useEffect(() => {
    if (!transferUserSearch.trim()) {
      setFilteredTransferUsers(users);
    } else {
      const search = transferUserSearch.toLowerCase();
      setFilteredTransferUsers(users.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      ));
    }
  }, [transferUserSearch, users]);

  // Filter projects for transfer
  useEffect(() => {
    if (!transferProjectSearch.trim()) {
      setFilteredTransferProjects(projects);
    } else {
      const search = transferProjectSearch.toLowerCase();
      setFilteredTransferProjects(projects.filter(p => 
        p.projectName.toLowerCase().includes(search) || 
        p.projectCode.toLowerCase().includes(search)
      ));
    }
  }, [transferProjectSearch, projects]);

  const canAssign = isSuperAdmin && item && !NON_ASSIGNABLE_STATUSES.includes(item.status) && !assignment;
  const canTransfer = isSuperAdmin && item?.status === 'ASSIGNED' && assignment;
  const canReturn = isSuperAdmin && item?.status === 'ASSIGNED';
  const canRepair = isSuperAdmin && item && ['AVAILABLE', 'ASSIGNED'].includes(item.status);
  const canRetire = isSuperAdmin && item && ['AVAILABLE', 'ASSIGNED'].includes(item.status);
  const isFormReady = selectedUser && selectedProject;

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack asset-detail">
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-icon">
                <Package className="w-5 h-5" />
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

  if (error || !item) {
    return (
      <div className="workspace">
        <div className="page-stack asset-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-back" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <Package className="w-5 h-5" />
              </div>
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
            <p>{error || 'Asset not found.'}</p>
            <button className="btn-back" onClick={handleBack}>
              Back to Asset Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const warrantyStatus = getWarrantyStatus(item.warrantyExpiry);

  // Status Badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'AVAILABLE': { bg: 'bg-green-100', text: 'text-green-700' },
      'ASSIGNED': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'UNDER_REPAIR': { bg: 'bg-amber-100', text: 'text-amber-700' },
      'RETIRED': { bg: 'bg-slate-100', text: 'text-slate-600' },
      'LOST': { bg: 'bg-red-100', text: 'text-red-700' },
      'DAMAGED': { bg: 'bg-orange-100', text: 'text-orange-700' },
    };
    const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${config.bg} ${config.text}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="workspace">
      <div className="page-stack asset-detail">
        {/* Page Header */}
        <PageHeader
          title="Asset Details"
          showBackButton
          onBackClick={handleBack}
        />

        {/* Asset Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                    {item.itemNo}
                  </span>
                  <StatusBadge status={item.status} />
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                    {item.category?.name || 'Uncategorized'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.itemName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {item.brand && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>{item.brand}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.purchaseDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Purchased {formatDate(item.purchaseDate)}</span>
                    </div>
                  )}
                  {warrantyStatus.label !== 'No Warranty' && (
                    <div className="flex items-center gap-1.5">
                      {warrantyStatus.label.includes('Expired') ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className={warrantyStatus.class}>Warranty {warrantyStatus.label}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Info */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current User</p>
                <p className="text-sm font-semibold text-slate-900">{assignment?.user?.name || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current Project</p>
                <p className="text-sm font-semibold text-slate-900">{assignment?.project?.projectName || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Quantity</p>
                <p className="text-sm font-semibold text-slate-900">{item.currentQty}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Warranty Expiry</p>
                <p className={`text-sm font-semibold ${warrantyStatus.class}`}>{formatDate(item.warrantyExpiry)}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content Grid */}
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inventory Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Inventory Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Inventory ID</label>
                    <p className="mt-1 text-sm font-mono text-indigo-600">{item.itemNo}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Item Name</label>
                    <p className="mt-1 text-sm font-medium text-slate-900">{item.itemName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</label>
                    <p className="mt-1 text-sm text-slate-700">{item.category?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subcategory</label>
                    <p className="mt-1 text-sm text-slate-700">{item.subcategory?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Brand</label>
                    <p className="mt-1 text-sm text-slate-700">{item.brand || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Model</label>
                    <p className="mt-1 text-sm text-slate-700">{item.model || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</label>
                    <p className="mt-1 text-sm text-slate-700">{item.vendor || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Invoice Number</label>
                    <p className="mt-1 text-sm text-slate-700">{item.invoiceNo || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Purchase Cost</label>
                    <p className="mt-1 text-sm text-slate-700">{formatCurrency(item.purchaseCost)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">GST</label>
                    <p className="mt-1 text-sm text-slate-700">{item.gst !== undefined && item.gst !== null ? `${item.gst}%` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Purchase Date</label>
                    <p className="mt-1 text-sm text-slate-700">{formatDate(item.purchaseDate)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Warranty</label>
                    <p className="mt-1 text-sm text-slate-700">{item.warrantyMonths ? `${item.warrantyMonths} months` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Warranty Expiry</label>
                    <p className={`mt-1 text-sm ${warrantyStatus.class}`}>{formatDate(item.warrantyExpiry)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</label>
                    <p className="mt-1 text-sm text-slate-700">{item.location || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Min. Stock</label>
                    <p className="mt-1 text-sm text-slate-700">{item.minStock ?? '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Current Qty</label>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.currentQty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Remarks</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500">No remarks available.</p>
              </div>
            </div>
          </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Current Assignment */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Current Assignment</h3>
            </div>
            <div className="p-6">
              {assignment ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {assignment.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{assignment.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500">{assignment.user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Project</label>
                      <p className="mt-1 text-sm text-slate-700">{assignment.project?.projectName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                          assignment.status === 'RETURNED' ? 'bg-slate-100 text-slate-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {assignment.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assigned Date</label>
                      <p className="mt-1 text-sm text-slate-700">{formatDate(assignment.assignedDate)}</p>
                    </div>
                  </div>
                  {assignment.remarks && (
                    <div className="pt-3 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Remarks</label>
                      <p className="mt-1 text-sm text-slate-700">{assignment.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No active assignment</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment History */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Assignment History</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No assignment history available</p>
              </div>
            </div>
          </div>

          {/* Lifecycle Actions - Only for Super Admin */}
          {isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Lifecycle Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      canAssign 
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={canAssign ? openAssignModal : undefined}
                    disabled={!canAssign}
                  >
                    <User className="w-5 h-5" />
                    Assign to User
                  </button>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      canTransfer 
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={canTransfer ? openTransferModal : undefined}
                    disabled={!canTransfer}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 3L21 7L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 7H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M7 13L3 17L7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Transfer
                  </button>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      canReturn 
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={canReturn ? openReturnModal : undefined}
                    disabled={!canReturn}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Return
                  </button>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      canRepair 
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={canRepair ? openRepairModal : undefined}
                    disabled={!canRepair}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Send for Repair
                  </button>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      canRetire 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={canRetire ? openRetireModal : undefined}
                    disabled={!canRetire}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4L20 20M4 4H12M4 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 20V12M20 20H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Retire Asset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="enterprise-modal-overlay" onClick={closeTransferModal}>
          <div className="enterprise-modal" onClick={e => e.stopPropagation()}>
            <div className="enterprise-modal-header">
              <div className="enterprise-modal-title-section">
                <h1 className="enterprise-modal-title">Transfer Inventory</h1>
                <div className="enterprise-modal-subtitle">
                  <span className="enterprise-subtitle-id">{item?.itemNo}</span>
                  <span className="enterprise-subtitle-name">{item?.itemName}</span>
                  <span className="enterprise-status-badge status-assigned">Transfer</span>
                </div>
              </div>
              <button className="enterprise-modal-close" onClick={closeTransferModal} disabled={transferring}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="enterprise-modal-body">
              <div className="enterprise-section">
                <h3 className="enterprise-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                  Current Assignment
                </h3>
                <div className="enterprise-info-grid">
                  <div className="enterprise-info-item">
                    <span className="enterprise-info-label">Current User</span>
                    <span className="enterprise-info-value">{assignment?.user?.name || '-'}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <span className="enterprise-info-label">Current Project</span>
                    <span className="enterprise-info-value">{assignment?.project?.projectName || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="enterprise-section" style={{marginTop: '20px'}}>
                <h3 className="enterprise-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/></svg>
                  New Assignment
                </h3>
                <div className="enterprise-field">
                  <label className="enterprise-label">Select New User <span className="enterprise-required">*</span></label>
                  <div className="enterprise-autocomplete" ref={transferUserDropdownRef}>
                    <input
                      type="text"
                      className={`enterprise-autocomplete-input ${transferUserError ? 'error' : ''}`}
                      placeholder="Search user..."
                      value={transferUserSearch}
                      onChange={e => { setTransferUserSearch(e.target.value); setTransferUser(''); setShowTransferUserDropdown(true); }}
                      onFocus={() => setShowTransferUserDropdown(true)}
                      disabled={transferring}
                    />
                    {showTransferUserDropdown && (
                      <div className="enterprise-autocomplete-dropdown">
                        {filteredTransferUsers.map(u => (
                          <div key={u.id} className={`enterprise-autocomplete-item ${transferUser === u.id ? 'selected' : ''}`} onClick={() => { setTransferUser(u.id); setTransferUserSearch(u.name); setTransferUserError(''); setShowTransferUserDropdown(false); }}>
                            <div className="enterprise-autocomplete-item-avatar">{u.name.charAt(0)}</div>
                            <div className="enterprise-autocomplete-item-content">
                              <span className="enterprise-autocomplete-item-name">{u.name}</span>
                              <span className="enterprise-autocomplete-item-email">{u.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {transferUserError && <span className="enterprise-field-error">{transferUserError}</span>}
                  </div>
                </div>
                <div className="enterprise-field">
                  <label className="enterprise-label">Select Project <span className="enterprise-required">*</span></label>
                  <div className="enterprise-autocomplete" ref={transferProjectDropdownRef}>
                    <input
                      type="text"
                      className={`enterprise-autocomplete-input ${transferProjectError ? 'error' : ''}`}
                      placeholder="Search project..."
                      value={transferProjectSearch}
                      onChange={e => { setTransferProjectSearch(e.target.value); setTransferProject(''); setShowTransferProjectDropdown(true); }}
                      onFocus={() => setShowTransferProjectDropdown(true)}
                      disabled={transferring}
                    />
                    {showTransferProjectDropdown && (
                      <div className="enterprise-autocomplete-dropdown">
                        {filteredTransferProjects.map(p => (
                          <div key={p.id} className={`enterprise-autocomplete-item ${transferProject === p.id ? 'selected' : ''}`} onClick={() => { setTransferProject(p.id); setTransferProjectSearch(p.projectName); setTransferProjectError(''); setShowTransferProjectDropdown(false); }}>
                            <div className="enterprise-autocomplete-item-avatar project"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/></svg></div>
                            <div className="enterprise-autocomplete-item-content">
                              <span className="enterprise-autocomplete-item-name">{p.projectName}</span>
                              <span className="enterprise-autocomplete-item-email">{p.projectCode}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {transferProjectError && <span className="enterprise-field-error">{transferProjectError}</span>}
                  </div>
                </div>
                <div className="enterprise-field">
                  <label className="enterprise-label">Remarks</label>
                  <textarea className="enterprise-textarea" placeholder="Add remarks..." value={transferRemarks} onChange={e => setTransferRemarks(e.target.value)} disabled={transferring} rows={3} />
                </div>
              </div>
            </div>
            <div className="enterprise-modal-footer">
              <div></div>
              <div className="enterprise-modal-footer-right">
                <button className="enterprise-btn-secondary" onClick={closeTransferModal} disabled={transferring}>Cancel</button>
                <button className="enterprise-btn-primary" onClick={handleTransfer} disabled={transferring || !transferUser || !transferProject}>
                  {transferring ? <><span className="enterprise-spinner"></span>Transferring...</> : 'Transfer Inventory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="enterprise-modal-overlay" onClick={closeReturnModal}>
          <div className="enterprise-modal enterprise-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="enterprise-modal-header">
              <div className="enterprise-modal-title-section">
                <h1 className="enterprise-modal-title">Return Inventory</h1>
                <div className="enterprise-modal-subtitle">
                  <span className="enterprise-subtitle-id">{item?.itemNo}</span>
                  <span className="enterprise-subtitle-name">{item?.itemName}</span>
                </div>
              </div>
              <button className="enterprise-modal-close" onClick={closeReturnModal} disabled={returning}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="enterprise-modal-body">
              <div className="enterprise-confirm-message">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="confirm-icon warning"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <p>Are you sure you want to return this inventory?</p>
                <p className="confirm-detail">This will set the inventory status back to Available.</p>
              </div>
              <div className="enterprise-field">
                <label className="enterprise-label">Remarks (Optional)</label>
                <textarea className="enterprise-textarea" placeholder="Add return remarks..." value={returnRemarks} onChange={e => setReturnRemarks(e.target.value)} disabled={returning} rows={3} />
              </div>
            </div>
            <div className="enterprise-modal-footer">
              <div></div>
              <div className="enterprise-modal-footer-right">
                <button className="enterprise-btn-secondary" onClick={closeReturnModal} disabled={returning}>Cancel</button>
                <button className="enterprise-btn-primary" onClick={handleReturn} disabled={returning}>
                  {returning ? <><span className="enterprise-spinner"></span>Returning...</> : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repair Modal */}
      {showRepairModal && (
        <div className="enterprise-modal-overlay" onClick={closeRepairModal}>
          <div className="enterprise-modal" onClick={e => e.stopPropagation()}>
            <div className="enterprise-modal-header">
              <div className="enterprise-modal-title-section">
                <h1 className="enterprise-modal-title">Send for Repair</h1>
                <div className="enterprise-modal-subtitle">
                  <span className="enterprise-subtitle-id">{item?.itemNo}</span>
                  <span className="enterprise-subtitle-name">{item?.itemName}</span>
                  <span className="enterprise-status-badge status-under_repair">Repair</span>
                </div>
              </div>
              <button className="enterprise-modal-close" onClick={closeRepairModal} disabled={repairing}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="enterprise-modal-body">
              <div className="enterprise-section">
                <h3 className="enterprise-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Repair Details
                </h3>
                <div className="enterprise-field">
                  <label className="enterprise-label">Issue Description <span className="enterprise-required">*</span></label>
                  <textarea className={`enterprise-textarea ${repairError && !issueDescription ? 'error' : ''}`} placeholder="Describe the issue..." value={issueDescription} onChange={e => setIssueDescription(e.target.value)} disabled={repairing} rows={3} />
                </div>
                <div className="enterprise-field">
                  <label className="enterprise-label">Vendor</label>
                  <input type="text" className="enterprise-autocomplete-input" placeholder="Enter vendor name..." value={vendor} onChange={e => setVendor(e.target.value)} disabled={repairing} />
                </div>
                <div className="enterprise-field">
                  <label className="enterprise-label">Expected Return Date</label>
                  <input type="date" className="enterprise-autocomplete-input" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} disabled={repairing} />
                </div>
                <div className="enterprise-field">
                  <label className="enterprise-label">Remarks</label>
                  <textarea className="enterprise-textarea" placeholder="Additional remarks..." value={repairRemarks} onChange={e => setRepairRemarks(e.target.value)} disabled={repairing} rows={2} />
                </div>
                {repairError && <div className="enterprise-error-banner"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span>{repairError}</span></div>}
              </div>
            </div>
            <div className="enterprise-modal-footer">
              <div></div>
              <div className="enterprise-modal-footer-right">
                <button className="enterprise-btn-secondary" onClick={closeRepairModal} disabled={repairing}>Cancel</button>
                <button className="enterprise-btn-primary" onClick={handleRepair} disabled={repairing || !issueDescription.trim()}>
                  {repairing ? <><span className="enterprise-spinner"></span>Sending...</> : 'Send for Repair'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retire Modal */}
      {showRetireModal && (
        <div className="enterprise-modal-overlay" onClick={closeRetireModal}>
          <div className="enterprise-modal enterprise-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="enterprise-modal-header">
              <div className="enterprise-modal-title-section">
                <h1 className="enterprise-modal-title">Retire Inventory</h1>
                <div className="enterprise-modal-subtitle">
                  <span className="enterprise-subtitle-id">{item?.itemNo}</span>
                  <span className="enterprise-subtitle-name">{item?.itemName}</span>
                </div>
              </div>
              <button className="enterprise-modal-close" onClick={closeRetireModal} disabled={retiring}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="enterprise-modal-body">
              <div className="enterprise-confirm-message danger">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="confirm-icon danger"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <p>Are you sure you want to retire this inventory?</p>
                <p className="confirm-detail">Retired inventory cannot be assigned again.</p>
              </div>
              <div className="enterprise-field">
                <label className="enterprise-label">Reason for Retirement <span className="enterprise-required">*</span></label>
                <textarea className="enterprise-textarea" placeholder="Enter retirement reason..." value={retireReason} onChange={e => setRetireReason(e.target.value)} disabled={retiring} rows={3} />
              </div>
              <div className="enterprise-field">
                <label className="enterprise-label">Remarks</label>
                <textarea className="enterprise-textarea" placeholder="Additional remarks..." value={retireRemarks} onChange={e => setRetireRemarks(e.target.value)} disabled={retiring} rows={2} />
              </div>
              {retireError && <div className="enterprise-error-banner"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span>{retireError}</span></div>}
            </div>
            <div className="enterprise-modal-footer">
              <div></div>
              <div className="enterprise-modal-footer-right">
                <button className="enterprise-btn-secondary" onClick={closeRetireModal} disabled={retiring}>Cancel</button>
                <button className="enterprise-btn-primary danger" onClick={handleRetire} disabled={retiring || !retireReason.trim()}>
                  {retiring ? <><span className="enterprise-spinner"></span>Retiring...</> : 'Confirm Retirement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="enterprise-toast success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Assign Modal - Enterprise Design */}
      {showAssignModal && (
        <div className="enterprise-modal-overlay" onClick={closeAssignModal}>
          <div className="enterprise-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="enterprise-modal-header">
              <div className="enterprise-modal-title-section">
                <h1 className="enterprise-modal-title">Assign Inventory</h1>
                <div className="enterprise-modal-subtitle">
                  <span className="enterprise-subtitle-id">{item?.itemNo}</span>
                  <span className="enterprise-subtitle-name">{item?.itemName}</span>
                  <span className={`enterprise-status-badge status-${item?.status?.toLowerCase()}`}>
                    {item?.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="enterprise-modal-breadcrumb">
                  <span>{item?.category?.name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  <span>{item?.subcategory?.name}</span>
                </div>
              </div>
              <button className="enterprise-modal-close" onClick={closeAssignModal} disabled={assigning}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="enterprise-modal-body">
              {/* Two Column Layout */}
              <div className="enterprise-modal-columns">
                {/* Left Column - Inventory Information */}
                <div className="enterprise-column">
                  <div className="enterprise-section">
                    <h3 className="enterprise-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Inventory Information
                    </h3>
                    <div className="enterprise-info-grid">
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Inventory ID</span>
                        <span className="enterprise-info-value mono">{item?.itemNo}</span>
                      </div>
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Category</span>
                        <span className="enterprise-info-value">{item?.category?.name}</span>
                      </div>
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Subcategory</span>
                        <span className="enterprise-info-value">{item?.subcategory?.name}</span>
                      </div>
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Brand</span>
                        <span className="enterprise-info-value">{item?.brand || '-'}</span>
                      </div>
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Model</span>
                        <span className="enterprise-info-value">{item?.model || '-'}</span>
                      </div>
                      <div className="enterprise-info-item">
                        <span className="enterprise-info-label">Location</span>
                        <span className="enterprise-info-value">{item?.location || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Assignment */}
                <div className="enterprise-column">
                  <div className="enterprise-section">
                    <h3 className="enterprise-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="17" cy="11" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M21 21v-1.5a2 2 0 00-2-2h-1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Assignment Details
                    </h3>

                    {/* User Autocomplete */}
                    <div className="enterprise-field">
                      <label className="enterprise-label">
                        Project Manager / User
                        <span className="enterprise-required">*</span>
                      </label>
                      <div className="enterprise-autocomplete" ref={userDropdownRef}>
                        <div className="enterprise-autocomplete-input-wrapper">
                          <svg className="enterprise-autocomplete-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <input
                            ref={userInputRef}
                            type="text"
                            className={`enterprise-autocomplete-input ${userError ? 'error' : ''} ${assigning ? 'disabled' : ''}`}
                            placeholder="Search for a user..."
                            value={userSearch}
                            onChange={e => {
                              setUserSearch(e.target.value);
                              setSelectedUser('');
                              setShowUserDropdown(true);
                            }}
                            onFocus={() => setShowUserDropdown(true)}
                            onKeyDown={handleUserKeyDown}
                            disabled={assigning}
                          />
                          {userSearch && (
                            <button 
                              className="enterprise-autocomplete-clear"
                              onClick={() => {
                                setUserSearch('');
                                setSelectedUser('');
                                setUserError('');
                                userInputRef.current?.focus();
                              }}
                              disabled={assigning}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        {showUserDropdown && (
                          <div className="enterprise-autocomplete-dropdown">
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((user, index) => (
                                <div
                                  key={user.id}
                                  className={`enterprise-autocomplete-item ${selectedUser === user.id ? 'selected' : ''} ${index === userActiveIndex ? 'active' : ''}`}
                                  onClick={() => !assigning && selectUser(user)}
                                  onMouseEnter={() => setUserActiveIndex(index)}
                                >
                                  <div className="enterprise-autocomplete-item-avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="enterprise-autocomplete-item-content">
                                    <span className="enterprise-autocomplete-item-name">{user.name}</span>
                                    <span className="enterprise-autocomplete-item-email">{user.email}</span>
                                    {user.department && (
                                      <span className="enterprise-autocomplete-item-dept">{user.department}</span>
                                    )}
                                  </div>
                                  {selectedUser === user.id && (
                                    <svg className="enterprise-autocomplete-item-check" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="enterprise-autocomplete-empty">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>No users found</span>
                              </div>
                            )}
                          </div>
                        )}
                        {userError && <span className="enterprise-field-error">{userError}</span>}
                      </div>
                    </div>

                    {/* Project Autocomplete */}
                    <div className="enterprise-field">
                      <label className="enterprise-label">
                        Project
                        <span className="enterprise-required">*</span>
                      </label>
                      <div className="enterprise-autocomplete" ref={projectDropdownRef}>
                        <div className="enterprise-autocomplete-input-wrapper">
                          <svg className="enterprise-autocomplete-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <input
                            ref={projectInputRef}
                            type="text"
                            className={`enterprise-autocomplete-input ${projectError ? 'error' : ''} ${assigning ? 'disabled' : ''}`}
                            placeholder="Search for a project..."
                            value={projectSearch}
                            onChange={e => {
                              setProjectSearch(e.target.value);
                              setSelectedProject('');
                              setShowProjectDropdown(true);
                            }}
                            onFocus={() => setShowProjectDropdown(true)}
                            onKeyDown={handleProjectKeyDown}
                            disabled={assigning}
                          />
                          {projectSearch && (
                            <button 
                              className="enterprise-autocomplete-clear"
                              onClick={() => {
                                setProjectSearch('');
                                setSelectedProject('');
                                setProjectError('');
                                projectInputRef.current?.focus();
                              }}
                              disabled={assigning}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        {showProjectDropdown && (
                          <div className="enterprise-autocomplete-dropdown">
                            {filteredProjects.length > 0 ? (
                              filteredProjects.map((project, index) => (
                                <div
                                  key={project.id}
                                  className={`enterprise-autocomplete-item ${selectedProject === project.id ? 'selected' : ''} ${index === projectActiveIndex ? 'active' : ''}`}
                                  onClick={() => !assigning && selectProject(project)}
                                  onMouseEnter={() => setProjectActiveIndex(index)}
                                >
                                  <div className="enterprise-autocomplete-item-avatar project">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                  </div>
                                  <div className="enterprise-autocomplete-item-content">
                                    <span className="enterprise-autocomplete-item-name">{project.projectName}</span>
                                    <span className="enterprise-autocomplete-item-email">{project.projectCode}</span>
                                  </div>
                                  {selectedProject === project.id && (
                                    <svg className="enterprise-autocomplete-item-check" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="enterprise-autocomplete-empty">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M12 12v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>No projects found</span>
                              </div>
                            )}
                          </div>
                        )}
                        {projectError && <span className="enterprise-field-error">{projectError}</span>}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="enterprise-field">
                      <label className="enterprise-label">Remarks</label>
                      <textarea
                        className={`enterprise-textarea ${assigning ? 'disabled' : ''}`}
                        placeholder="Add any additional notes or comments..."
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        disabled={assigning}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {assignError && (
                <div className="enterprise-error-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{assignError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="enterprise-modal-footer">
              <div className="enterprise-modal-footer-left">
                {/* Keyboard hints */}
                <span className="enterprise-keyboard-hint">
                  <kbd>↑</kbd><kbd>↓</kbd> Navigate
                </span>
                <span className="enterprise-keyboard-hint">
                  <kbd>Enter</kbd> Select
                </span>
                <span className="enterprise-keyboard-hint">
                  <kbd>Esc</kbd> Close
                </span>
              </div>
              <div className="enterprise-modal-footer-right">
                <button 
                  className="enterprise-btn-secondary"
                  onClick={closeAssignModal}
                  disabled={assigning}
                >
                  Cancel
                </button>
                <button 
                  className="enterprise-btn-primary"
                  onClick={handleAssign}
                  disabled={assigning || !isFormReady}
                >
                  {assigning ? (
                    <>
                      <span className="enterprise-spinner"></span>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Assign Inventory
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {showSuccessToast && (
            <div className="enterprise-toast success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Inventory assigned successfully!</span>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
