import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, Package, Users, AlertTriangle, Wrench } from 'lucide-react';
import {
  PageHeader,
  TableContainer,
  SortHeader
} from '../components/serviceRequests';
import { SummaryCards } from '../components/common/SummaryCards';

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  status: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
};

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  status: string;
  client?: string;
  department?: string;
  startDate?: string;
  expectedEndDate?: string;
  managerId?: string;
  manager?: { name: string; email: string };
  managerName?: string;
  teamSize?: number;
};

type AssignmentWithUser = {
  id: string;
  inventory: InventoryItem;
  user: { id: string; name: string; email: string };
  project: { id: string; projectName: string; projectCode: string };
  assignedDate: string;
};

export function ProjectAssetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const [assignedCount, setAssignedCount] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [warrantyExpiring, setWarrantyExpiring] = useState(0);
  const [underRepair, setUnderRepair] = useState(0);

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
    if (projectId) {
      loadProject();
      loadProjectAssignments();
    }
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      const res = await api.get(`/projects-environments/${projectId}`);
      setProjectData(res.data.item);
      setError('');
    } catch {
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectAssignments() {
    try {
      setLoadingAssets(true);
      const res = await api.get('/inventory-assignments', {
        params: { projectId, status: 'ACTIVE' }
      });
      const data = res.data.assignments || [];
      setAssignments(data);
      
      // Count unique users
      const userIds = new Set(data.map((a: AssignmentWithUser) => a.user?.id));
      setUniqueUsers(userIds.size);
      setAssignedCount(data.length);
      
      // Count warranty expiring and repair
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let warrantyCount = 0;
      let repairCount = 0;
      
      data.forEach((assignment: AssignmentWithUser) => {
        const item = assignment.inventory;
        if (item.warrantyExpiry) {
          const expiry = new Date(item.warrantyExpiry);
          if (expiry >= now && expiry <= thirtyDays) {
            warrantyCount++;
          }
        }
        if (item.status === 'UNDER_REPAIR') {
          repairCount++;
        }
      });
      
      setWarrantyExpiring(warrantyCount);
      setUnderRepair(repairCount);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssets(false);
    }
  }

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

  // Summary cards data
  const summaryCards = useMemo(() => [
    {
      icon: Package,
      iconBgColor: 'bg-gradient-to-br from-slate-100 to-slate-50',
      iconColor: 'text-slate-600',
      value: loadingAssets ? '...' : assignedCount,
      label: 'Total Assets'
    },
    {
      icon: Users,
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      value: loadingAssets ? '...' : uniqueUsers,
      label: 'Users'
    },
    {
      icon: AlertTriangle,
      iconBgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-600',
      value: loadingAssets ? '...' : warrantyExpiring,
      label: 'Warranty Expiring'
    },
    {
      icon: Wrench,
      iconBgColor: 'bg-gradient-to-br from-orange-100 to-orange-50',
      iconColor: 'text-orange-600',
      value: loadingAssets ? '...' : underRepair,
      label: 'Under Repair'
    }
  ], [assignedCount, uniqueUsers, warrantyExpiring, underRepair, loadingAssets]);

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack project-assets">
          <PageHeader
            title="Project Assets"
            showBackButton
            onBackClick={handleBack}
          />
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="workspace">
        <div className="page-stack project-assets">
          <PageHeader
            title="Project Assets"
            showBackButton
            onBackClick={handleBack}
          />
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <p className="text-slate-600 mb-4">{error || 'Project not found.'}</p>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" onClick={handleBack}>
              Back to Asset Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack project-assets">
        {/* Page Header */}
        <PageHeader
          title="Project Assets"
          showBackButton
          onBackClick={handleBack}
        />

        {/* Project Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                    {projectData.projectCode}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    projectData.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    projectData.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {projectData.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{projectData.projectName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {projectData.client && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{projectData.client}</span>
                    </div>
                  )}
                  {projectData.manager?.name || projectData.managerName ? (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{(projectData.manager?.name || projectData.managerName)}</span>
                    </div>
                  ) : null}
                  {projectData.department && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{projectData.department}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Project Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4M8 3v4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Summary Info */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Start Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(projectData.startDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Expected End</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(projectData.expectedEndDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Team Size</p>
                <p className="text-sm font-semibold text-slate-900">{projectData.teamSize || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Manager</p>
                <p className="text-sm font-semibold text-slate-900">{projectData.manager?.name || projectData.managerName || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

        {/* Assets Table */}
        <div className="mt-6">
          <TableContainer loading={loadingAssets} empty={assignments.length === 0} emptyTitle="No assets found" emptyDescription="This project has no assets assigned to it.">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <SortHeader label="User" sortKey="user" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Inventory ID" sortKey="itemNo" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Item" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Brand" sortKey="brand" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                  <SortHeader label="Assigned Date" sortKey="assignedDate" currentSort={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map(assignment => (
                  <tr 
                    key={assignment.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/access-management/${assignment.inventory.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-brand-600">
                            {assignment.user?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{assignment.user?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                        {assignment.inventory.itemNo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-700">{assignment.inventory.itemName}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">{assignment.inventory.category?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">{assignment.inventory.brand || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        assignment.inventory.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        assignment.inventory.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {assignment.inventory.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">{formatDate(assignment.assignedDate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}
