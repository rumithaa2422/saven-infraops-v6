import { FormEvent, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  AlertTriangle,
  Plus,
  Filter,
  X,
  Download,
  Calendar,
  User,
  Clock,
  FileText,
  Upload,
  Edit2,
  Trash2,
  ChevronDown,
  MoreHorizontal,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  PageHeader,
  IncidentStatusBadge,
  SeverityBadge,
  SectionCard,
  InfoCard,
  ModalLayout,
  ConfirmationDialog,
  SearchInput,
  FilterChip,
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  Pagination,
  Button,
  FormSection,
  FormRow,
  Input,
  Textarea,
  Select,
  ActionButtons,
  FileUpload,
  DeleteIncidentDialog,
  IncidentSummaryCard
} from '../components/incidents';

type Incident = {
  id: string;
  incidentNo: string;
  title: string;
  description?: string;
  severity: string;
  priority?: string;
  status: string;
  impactedService?: string;
  impactedProject?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SummaryStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
};

const initialForm = {
  title: '',
  description: '',
  severity: 'SEV3',
  priority: 'MEDIUM',
  impactedService: '',
  impactedProject: '',
  ownerName: ''
};

const severityOptions = [
  { value: 'SEV1', label: 'SEV1 - Critical' },
  { value: 'SEV2', label: 'SEV2 - High' },
  { value: 'SEV3', label: 'SEV3 - Medium' },
  { value: 'SEV4', label: 'SEV4 - Low' }
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' }
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_USER', label: 'Waiting' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' }
];

const severityFilterOptions = [
  { value: '', label: 'All Severities' },
  { value: 'SEV1', label: 'SEV1 - Critical' },
  { value: 'SEV2', label: 'SEV2 - High' },
  { value: 'SEV3', label: 'SEV3 - Medium' },
  { value: 'SEV4', label: 'SEV4 - Low' }
];

const priorityFilterOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' }
];

export function IncidentsPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [form, setForm] = useState(initialForm);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Sort and pagination
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Calculate summary statistics
  const summaryStats: SummaryStats = useMemo(() => ({
    total: items.length,
    open: items.filter(item => item.status === 'OPEN' || item.status === 'NEW').length,
    inProgress: items.filter(item => item.status === 'IN_PROGRESS' || item.status === 'ASSIGNED').length,
    resolved: items.filter(item => item.status === 'RESOLVED' || item.status === 'CLOSED').length,
    critical: items.filter(item => item.severity === 'SEV1' || item.severity === 'CRITICAL').length
  }), [items]);

  // Permission checks
  const canView = hasPermission('incidents:view');
  const canCreate = hasPermission('incidents:create');
  const canEdit = hasPermission('incidents:update');
  const canDelete = hasPermission('incidents:delete');
  const canExport = hasPermission('incidents:export');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.incidentNo.toLowerCase().includes(query) ||
        (item.ownerName?.toLowerCase().includes(query) ?? false) ||
        (item.impactedService?.toLowerCase().includes(query) ?? false) ||
        (item.impactedProject?.toLowerCase().includes(query) ?? false)
      );
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Severity filter
    if (severityFilter) {
      result = result.filter(item => item.severity === severityFilter);
    }
    
    // Priority filter
    if (priorityFilter) {
      result = result.filter(item => item.priority === priorityFilter);
    }
    
    return result;
  }, [items, searchQuery, statusFilter, severityFilter, priorityFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      let aVal: any = (a as any)[sortConfig.key];
      let bVal: any = (b as any)[sortConfig.key];
      
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredItems, sortConfig]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedItems.length / pageSize);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, severityFilter, priorityFilter]);

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  function handleOpenIncident(item: Incident) {
    navigate(`/incidents/${item.id}`);
  }

  function handleEditIncident(item: Incident) {
    setEditingIncident(item);
    setForm({
      title: item.title,
      description: item.description || '',
      severity: item.severity,
      priority: item.priority || 'MEDIUM',
      impactedService: item.impactedService || '',
      impactedProject: item.impactedProject || '',
      ownerName: item.ownerName || ''
    });
    setEditOpen(true);
  }

  function handleDeleteIncident(item: Incident) {
    setDeletingIncident(item);
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/incidents');
      setItems(res.data.items || []);
    } catch (err) {
      setMessage('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createIncident(e: FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        severity: form.severity,
        priority: form.priority,
        impactedService: form.impactedService,
        impactedProject: form.impactedProject
      };
      
      const res = await api.post('/incidents', payload);
      setItems([res.data.item, ...items]);
      setMessage('Incident created successfully.');
      setCreateOpen(false);
      clearCreateForm();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to create incident.');
    } finally {
      setUploading(false);
    }
  }

  async function updateIncident(e: FormEvent) {
    e.preventDefault();
    if (!editingIncident) return;
    
    setUploading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        severity: form.severity,
        priority: form.priority,
        impactedService: form.impactedService,
        impactedProject: form.impactedProject
      };
      
      const res = await api.patch(`/incidents/${editingIncident.id}`, payload);
      setItems(items.map(item => item.id === editingIncident.id ? res.data.item : item));
      setMessage('Incident updated successfully.');
      setEditOpen(false);
      setEditingIncident(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to update incident.');
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingIncident) return;
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
      await api.delete(`/incidents/${deletingIncident.id}`);
      setItems(items.filter(item => item.id !== deletingIncident.id));
      setMessage('Incident deleted successfully.');
      setDeleteOpen(false);
      setDeletingIncident(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to delete incident.');
    } finally {
      setDeleting(false);
    }
  }

  function clearCreateForm() {
    setForm(initialForm);
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditingIncident(null);
    setForm(initialForm);
  }

  function closeDeleteDialog() {
    setDeleteOpen(false);
    setDeletingIncident(null);
    setDeleteConfirmText('');
  }

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('');
    setSeverityFilter('');
    setPriorityFilter('');
  }

  const hasActiveFilters = searchQuery || statusFilter || severityFilter || priorityFilter;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Page Header */}
      <PageHeader
        title="Incidents"
        subtitle={`${summaryStats.total} total`}
        icon={AlertTriangle}
        actions={
          canCreate ? (
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Create Incident
            </Button>
          ) : undefined
        }
      />

      <main className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <IncidentSummaryCard
            title="Total Incidents"
            count={summaryStats.total}
            icon={AlertTriangle}
            color="slate"
          />
          <IncidentSummaryCard
            title="Open"
            count={summaryStats.open}
            icon={AlertCircle}
            color="blue"
          />
          <IncidentSummaryCard
            title="In Progress"
            count={summaryStats.inProgress}
            icon={Clock}
            color="amber"
          />
          <IncidentSummaryCard
            title="Resolved"
            count={summaryStats.resolved}
            icon={AlertTriangle}
            color="emerald"
          />
          <IncidentSummaryCard
            title="Critical (SEV1)"
            count={summaryStats.critical}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Search and Filters */}
        <SectionCard title="" noPadding className="!overflow-visible">
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by incident number, title, or owner..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={showFilters ? 'primary' : 'secondary'} 
                  icon={Filter}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-brand-700 text-white text-xs flex items-center justify-center">
                      {Number(!!statusFilter) + Number(!!severityFilter) + Number(!!priorityFilter)}
                    </span>
                  )}
                </Button>
                {canExport && (
                  <Button variant="secondary" icon={Download}>
                    Export
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Severity</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                    >
                      {severityFilterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                    >
                      {priorityFilterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" onClick={resetFilters} className="w-full">
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && !showFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-slate-500 font-medium">Active filters:</span>
                {statusFilter && (
                  <FilterChip 
                    label="Status" 
                    value={statusFilter.replace(/_/g, ' ')} 
                    onRemove={() => setStatusFilter('')} 
                  />
                )}
                {severityFilter && (
                  <FilterChip 
                    label="Severity" 
                    value={severityFilter} 
                    onRemove={() => setSeverityFilter('')} 
                  />
                )}
                {priorityFilter && (
                  <FilterChip 
                    label="Priority" 
                    value={priorityFilter} 
                    onRemove={() => setPriorityFilter('')} 
                  />
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Incident Table */}
        <TableContainer
          loading={loading}
          empty={paginatedItems.length === 0 && !loading}
          emptyTitle="No incidents found"
          emptyDescription={hasActiveFilters ? "No incidents match your search criteria. Try adjusting your filters." : "There are no incidents to display. Create a new incident to get started."}
        >
          {paginatedItems.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <SortHeader label="Incident No" sortKey="incidentNo" currentSort={sortConfig} onSort={handleSort} className="w-32" />
                      <SortHeader label="Title" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Severity" sortKey="severity" currentSort={sortConfig} onSort={handleSort} className="w-28" />
                      <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="w-32" />
                      <SortHeader label="Owner" sortKey="ownerName" currentSort={sortConfig} onSort={handleSort} className="w-36" />
                      <SortHeader label="Created" sortKey="createdAt" currentSort={sortConfig} onSort={handleSort} className="w-32" />
                      <th className="px-4 py-3.5 text-right w-20">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id} onClick={() => handleOpenIncident(item)}>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold text-brand-600">
                            {item.incidentNo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium text-slate-900 truncate">{item.title}</p>
                            {item.impactedService && (
                              <p className="text-xs text-slate-500 truncate">{item.impactedService}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={item.severity} size="sm" />
                        </TableCell>
                        <TableCell>
                          <IncidentStatusBadge status={item.status} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="text-sm text-slate-700 truncate">
                              {item.ownerName || 'Unassigned'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {formatDate(item.createdAt || '')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenIncident(item);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditIncident(item);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Edit incident"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteIncident(item);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete incident"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedItems.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </TableContainer>
      </main>

      {/* Create Incident Modal */}
      <ModalLayout
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          clearCreateForm();
        }}
        title="Create Incident"
        subtitle="Report a new incident for immediate attention"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => {
              setCreateOpen(false);
              clearCreateForm();
            }}>
              Cancel
            </Button>
            <Button icon={AlertTriangle} onClick={createIncident as any} loading={uploading}>
              Create Incident
            </Button>
          </div>
        }
      >
        <form onSubmit={createIncident} className="space-y-8">
          <FormSection title="General Information" icon={FileText}>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of the incident"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed description of the incident, including impact and symptoms..."
              rows={4}
            />
          </FormSection>

          <FormSection title="Classification" icon={AlertCircle}>
            <FormRow>
              <Select
                label="Severity"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                options={severityOptions}
                required
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={priorityOptions}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection title="Affected Services" icon={AlertTriangle}>
            <FormRow>
              <Input
                label="Impacted Service"
                value={form.impactedService}
                onChange={(e) => setForm({ ...form, impactedService: e.target.value })}
                placeholder="Name of the affected service"
              />
              <Input
                label="Impacted Project"
                value={form.impactedProject}
                onChange={(e) => setForm({ ...form, impactedProject: e.target.value })}
                placeholder="Related project (optional)"
              />
            </FormRow>
          </FormSection>
        </form>
      </ModalLayout>

      {/* Edit Incident Modal */}
      <ModalLayout
        isOpen={editOpen}
        onClose={closeEditDialog}
        title="Edit Incident"
        subtitle={editingIncident ? `Editing ${editingIncident.incidentNo}` : ''}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button icon={Edit2} onClick={updateIncident as any} loading={uploading}>
              Update Incident
            </Button>
          </div>
        }
      >
        <form onSubmit={updateIncident} className="space-y-8">
          <FormSection title="General Information" icon={FileText}>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </FormSection>

          <FormSection title="Classification" icon={AlertCircle}>
            <FormRow>
              <Select
                label="Severity"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                options={severityOptions}
                required
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={priorityOptions}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection title="Affected Services" icon={AlertTriangle}>
            <FormRow>
              <Input
                label="Impacted Service"
                value={form.impactedService}
                onChange={(e) => setForm({ ...form, impactedService: e.target.value })}
              />
              <Input
                label="Impacted Project"
                value={form.impactedProject}
                onChange={(e) => setForm({ ...form, impactedProject: e.target.value })}
              />
            </FormRow>
          </FormSection>
        </form>
      </ModalLayout>

      {/* Delete Confirmation Dialog */}
      <DeleteIncidentDialog
        isOpen={deleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        incidentNo={deletingIncident?.incidentNo || ''}
        incidentTitle={deletingIncident?.title || ''}
        isLoading={deleting}
        confirmInput
        confirmInputValue={deleteConfirmText}
        onConfirmInputChange={setDeleteConfirmText}
      />

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-sm">{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
