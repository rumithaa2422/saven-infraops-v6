import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { User, Calendar, Eye, Mail, Phone, Briefcase, Shield, MapPin, Package } from 'lucide-react';
import {
  PageHeader,
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  SectionCard,
  InfoCard,
  InfoGrid
} from '../components/serviceRequests';

type InventoryAssignment = {
  id: string;
  inventoryId: string;
  status: string;
  assignedDate: string;
  returnedDate?: string;
  inventory: {
    id: string;
    itemNo: string;
    itemName: string;
    serialNumber?: string;
    status: string;
    category: { id: string; name: string };
    subcategory: { id: string; name: string };
  };
  project?: {
    id: string;
    projectName: string;
    projectCode: string;
  };
};

type InventorySummary = {
  totalAssigned: number;
  available: number;
  underRepair: number;
  returned: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  team?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  dateJoined?: string;
  address?: string;
  remarks?: string;
  employeeId?: string;
  roles: { role: { id: string; name: string } }[];
  currentProject?: {
    id: string;
    projectName: string;
    projectCode: string;
    client?: string;
    department?: string;
    status: string;
    startDate?: string;
    expectedEndDate?: string;
    manager?: { id: string; name: string; email: string };
    managerName?: string;
    userProjectRole: string;
  } | null;
  assignedInventory?: InventoryAssignment[];
  inventorySummary?: InventorySummary;
};

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'assignedDate',
    direction: 'desc'
  });

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  async function loadUser() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/users-teams/${id}`);
      setUser(res.data.item || res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user');
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

  function getRoleBadgeClass(roleName: string): string {
    if (roleName === 'Super Admin') return 'role-super-admin';
    if (roleName === 'Admin') return 'role-admin';
    if (roleName === 'Manager') return 'role-manager';
    return 'role-employee';
  }

  function getInventoryStatusBadge(status: string): string {
    const statusMap: Record<string, string> = {
      'AVAILABLE': 'status-available',
      'ASSIGNED': 'status-assigned',
      'UNDER_REPAIR': 'status-repair',
      'RETURNED': 'status-returned',
      'RETIRED': 'status-retired',
      'ACTIVE': 'status-assigned',
      'TRANSFERRED': 'status-transferred'
    };
    return statusMap[status] || '';
  }

  function getInventoryStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      'AVAILABLE': 'Available',
      'ASSIGNED': 'Assigned',
      'UNDER_REPAIR': 'Repair',
      'RETURNED': 'Returned',
      'RETIRED': 'Retired',
      'ACTIVE': 'Active',
      'TRANSFERRED': 'Transferred'
    };
    return labelMap[status] || status;
  }

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack user-detail">
          <PageHeader
            title="User Dashboard"
            showBackButton
            onBackClick={() => navigate('/users-teams')}
          />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="workspace">
        <div className="page-stack user-detail">
          <PageHeader
            title="User Dashboard"
            showBackButton
            onBackClick={() => navigate('/users-teams')}
          />
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'User not found.'}</p>
            <button className="btn-secondary" onClick={() => navigate('/users-teams')}>
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryRole = user.roles?.[0]?.role?.name || 'Employee';
  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="workspace">
      <div className="page-stack user-detail">
        {/* Page Header */}
        <PageHeader
          title="User Details"
          showBackButton
          onBackClick={() => navigate('/users-teams')}
        />

        {/* User Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                    {user.employeeId || user.id.slice(0, 8)}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    primaryRole === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                    primaryRole === 'Admin' ? 'bg-blue-100 text-blue-700' :
                    primaryRole === 'Manager' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {primaryRole}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{user.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {user.department && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span>{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(user.dateJoined)}</span>
                  </div>
                  {user.designation && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>{user.designation}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* User Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {userInitials}
              </div>
            </div>
          </div>

          {/* Summary Info */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-900">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{user.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Team</p>
                <p className="text-sm font-semibold text-slate-900">{user.team || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Employment Type</p>
                <p className="text-sm font-semibold text-slate-900">{user.employmentType || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-400" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Employee ID</label>
                    <p className="mt-1 text-sm font-medium text-slate-700">{user.employeeId || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
                    <p className="mt-1 text-sm font-medium text-slate-900">{user.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
                    <p className="mt-1 text-sm text-slate-700">{user.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone Number</label>
                    <p className="mt-1 text-sm text-slate-700">{user.phoneNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Department</label>
                    <p className="mt-1 text-sm text-slate-700">{user.department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Designation</label>
                    <p className="mt-1 text-sm text-slate-700">{user.designation || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        primaryRole === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                        primaryRole === 'Admin' ? 'bg-blue-100 text-blue-700' :
                        primaryRole === 'Manager' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {primaryRole}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  Employment Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date Joined</label>
                    <p className="mt-1 text-sm text-slate-700">{formatDate(user.dateJoined)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Employment Type</label>
                    <p className="mt-1 text-sm text-slate-700">{user.employmentType || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Team</label>
                    <p className="mt-1 text-sm text-slate-700">{user.team || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</label>
                    <p className="mt-1 text-sm text-slate-700">{user.address || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Remarks</label>
                    <p className="mt-1 text-sm text-slate-700">{user.remarks || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  Project Information
                </h3>
              </div>
              <div className="p-6">
                {user.currentProject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                          {user.currentProject.projectCode}
                        </span>
                        <h4 className="text-lg font-semibold text-slate-900">{user.currentProject.projectName}</h4>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        user.currentProject.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        user.currentProject.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {user.currentProject.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-100">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Client</label>
                        <p className="mt-1 text-sm text-slate-700">{user.currentProject.client || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Project Manager</label>
                        <p className="mt-1 text-sm text-slate-700">{user.currentProject.manager?.name || user.currentProject.managerName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">User's Role</label>
                        <p className="mt-1">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            user.currentProject.userProjectRole === 'Project Manager' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.currentProject.userProjectRole}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Department</label>
                        <p className="mt-1 text-sm text-slate-700">{user.currentProject.department || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start Date</label>
                        <p className="mt-1 text-sm text-slate-700">{formatDate(user.currentProject.startDate)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expected End</label>
                        <p className="mt-1 text-sm text-slate-700">{formatDate(user.currentProject.expectedEndDate)}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                        onClick={() => navigate(`/projects-environments/${user.currentProject?.id}`)}
                      >
                        <Briefcase className="w-4 h-4" />
                        View Project
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No project assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Inventory */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-400" />
                  Assigned Inventory
                  {user.assignedInventory && user.assignedInventory.length > 0 && (
                    <span className="ml-2 px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
                      {user.assignedInventory.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-6">
                {user.assignedInventory && user.assignedInventory.length > 0 ? (
                  <>
                    {/* Summary Stats */}
                    {user.inventorySummary && (
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">{user.inventorySummary.totalAssigned}</p>
                          <p className="text-xs font-medium text-slate-500">Assigned</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-green-700">{user.inventorySummary.available}</p>
                          <p className="text-xs font-medium text-green-600">Available</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-amber-700">{user.inventorySummary.underRepair}</p>
                          <p className="text-xs font-medium text-amber-600">Repair</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-slate-700">{user.inventorySummary.returned}</p>
                          <p className="text-xs font-medium text-slate-500">Returned</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Inventory Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <TableContainer loading={false} empty={user.assignedInventory.length === 0} emptyTitle="No inventory" emptyDescription="No inventory assigned to this user">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <SortHeader label="Inventory ID" sortKey="itemNo" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Sub Category" sortKey="subcategory" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Name" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Assigned Date" sortKey="assignedDate" currentSort={sortConfig} onSort={handleSort} />
                              <SortHeader label="Project" sortKey="project" currentSort={sortConfig} onSort={handleSort} />
                              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Array.from(
                              new Map(user.assignedInventory.slice(0, 10).map(a => [a.id, a])).values()
                            ).map((assignment) => (
                              <TableRow key={assignment.id}>
                                <TableCell>
                                  <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                                    {assignment.inventory.itemNo}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-600">{assignment.inventory.category?.name || '-'}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-600">{assignment.inventory.subcategory?.name || '-'}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium text-slate-900">{assignment.inventory.itemName}</span>
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                    assignment.inventory.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                    assignment.inventory.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {getInventoryStatusLabel(assignment.status === 'ACTIVE' ? 'ASSIGNED' : assignment.inventory.status)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-500">{formatDate(assignment.assignedDate)}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-600">{assignment.project?.projectName || '-'}</span>
                                </TableCell>
                                <TableCell>
                                  <button 
                                    className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                    onClick={() => navigate(`/inventory/master/${assignment.inventoryId}`)}
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </tbody>
                        </table>
                        {user.assignedInventory.length > 10 && (
                          <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                            Showing 10 of {user.assignedInventory.length} items
                          </div>
                        )}
                      </TableContainer>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No inventory assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Quick Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Created</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDateTime(user.createdAt)}</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Updated</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDateTime(user.updatedAt)}</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</p>
                  <p className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      primaryRole === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                      primaryRole === 'Admin' ? 'bg-blue-100 text-blue-700' :
                      primaryRole === 'Manager' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {primaryRole}
                    </span>
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Department</p>
                  <p className="mt-1 text-sm text-slate-700">{user.department || '-'}</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
                  <p className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
