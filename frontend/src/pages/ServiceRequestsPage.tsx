import { FormEvent, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PermissionGate } from '../components/permissions';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  Edit2,
  Trash2,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
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
  ActionButtons
} from '../components/serviceRequests';

/**
 * PART 2: Service Requests Permission Enforcement
 */
type ServiceRequest = {
  id: string;
  ticketNo: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  priority: string;
  status: string;
  requesterName: string;
  assigneeName?: string;
  assigneeId?: string;
  projectName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SummaryStats = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
};

const initialForm = {
  title: '',
  description: '',
  category: 'Network',
  subCategory: '',
  priority: 'MEDIUM',
  requesterName: '',
  projectName: ''
};

const ALLOWED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf,.docx,.xlsx,.txt';

const categoryOptions = [
  { value: 'Network', label: 'Network' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'Security', label: 'Security' },
  { value: 'Infrastructure', label: 'Infrastructure' },
  { value: 'Database', label: 'Database' },
  { value: 'Cloud', label: 'Cloud' },
  { value: 'Support', label: 'Support' },
  { value: 'General', label: 'General' }
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
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' }
];

export function ServiceRequestsPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
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
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
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
    open: items.filter(item => item.status === 'OPEN' || item.status === 'NEW' || item.status === 'ASSIGNED').length,
    inProgress: items.filter(item => item.status === 'IN_PROGRESS' || item.status === 'WAITING_FOR_USER').length,
    closed: items.filter(item => item.status === 'CLOSED' || item.status === 'RESOLVED' || item.status === 'COMPLETED').length
  }), [items]);

  // Permission checks
  const canView = hasPermission('tickets:view');
  const canCreate = hasPermission('tickets:create');
  const canEdit = hasPermission('tickets:edit');
  const canDelete = hasPermission('tickets:delete');
  const canExport = hasPermission('tickets:export');
  
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
        item.ticketNo.toLowerCase().includes(query) ||
        item.requesterName.toLowerCase().includes(query) ||
        (item.assigneeName?.toLowerCase().includes(query) ?? false) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter) {
      result = result.filter(item => item.priority === priorityFilter);
    }
    
    // Category filter
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    return result;
  }, [items, searchQuery, statusFilter, priorityFilter, categoryFilter]);

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
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter]);

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  function canAdminOpenTicket(item: ServiceRequest): boolean {
    if (isSuperAdmin) return true;
    if (isAdmin) return item.assigneeId === user?.id;
    return true;
  }

  function handleOpenTicket(item: ServiceRequest) {
    if (!canAdminOpenTicket(item)) {
      setMessage('Access Restricted. You can only open tickets assigned to you.');
      return;
    }
    navigate(`/service-requests/${item.id}`);
  }

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/service-requests');
      setItems(res.data.items);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('No records loaded. Check backend, MySQL, seed data, and login token.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
  }

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter || categoryFilter;

  // Form handlers
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  function clearCreateForm() {
    setCreateOpen(false);
    setForm(initialForm);
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function createRequest(event: FormEvent) {
    event.preventDefault();
    try {
      setUploading(true);
      const response = await api.post('/service-requests', form);
      const requestId = response.data.item.id;
      
      if (selectedFiles && selectedFiles.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
        try {
          await api.post(`/service-requests/${requestId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch {
          console.error('Attachment upload failed');
        }
      }
      
      clearCreateForm();
      await load();
    } catch {
      setMessage('Create request failed. Check mandatory fields and backend logs.');
    } finally {
      setUploading(false);
    }
  }

  function openEditDialog(request: ServiceRequest, event: React.MouseEvent) {
    event.stopPropagation();
    setEditingRequest(request);
    setForm({
      title: request.title,
      description: request.description || '',
      category: request.category,
      subCategory: request.subCategory || '',
      priority: request.priority,
      requesterName: request.requesterName,
      projectName: request.projectName || ''
    });
    setEditOpen(true);
  }

  async function updateRequest(event: FormEvent) {
    event.preventDefault();
    if (!editingRequest?.id) return;
    try {
      await api.put(`/service-requests/${editingRequest.id}`, form);
      setEditOpen(false);
      setEditingRequest(null);
      setForm(initialForm);
      await load();
    } catch {
      setMessage('Update failed. Check backend logs.');
    }
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditingRequest(null);
    setForm(initialForm);
  }

  function openDeleteDialog(request: ServiceRequest, event: React.MouseEvent) {
    event.stopPropagation();
    setDeletingRequest(request);
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deletingRequest?.id || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/service-requests/${deletingRequest.id}`);
      setDeleteOpen(false);
      setDeletingRequest(null);
      await load();
      setMessage('Request deleted successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  }

  function closeDeleteDialog() {
    setDeleteOpen(false);
    setDeletingRequest(null);
    setDeleteConfirmText('');
  }

  function exportCsv() {
    const header = ['Ticket No', 'Title', 'Category', 'Priority', 'Status', 'Requester', 'Assignee'];
    const rows = sortedItems.map(item => [
      item.ticketNo,
      item.title,
      item.category,
      item.priority,
      item.status,
      item.requesterName,
      item.assigneeName || ''
    ]);
    
    const csv = [
      header.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Header */}
      <PageHeader
        title="Service Requests"
        subtitle={`${summaryStats.total} total`}
        icon={Ticket}
        actions={
          <>
            {canExport && (
              <Button variant="secondary" icon={Download} onClick={exportCsv}>
                Export
              </Button>
            )}
            {canCreate && (
              <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                Create Request
              </Button>
            )}
          </>
        }
      />

      {/* Main Content */}
      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{summaryStats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Open</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{summaryStats.open}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{summaryStats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Closed</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{summaryStats.closed}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by title, ticket number, requester..."
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-brand-200 text-brand-800 text-xs rounded-md">
                  {[statusFilter, priorityFilter, categoryFilter].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Status:</span>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.slice(1).map(option => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      onClick={() => setStatusFilter(statusFilter === option.value ? '' : option.value)}
                      active={statusFilter === option.value}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Priority:</span>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(option => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      onClick={() => setPriorityFilter(priorityFilter === option.value ? '' : option.value)}
                      active={priorityFilter === option.value}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Category:</span>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.slice(0, 6).map(option => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      onClick={() => setCategoryFilter(categoryFilter === option.value ? '' : option.value)}
                      active={categoryFilter === option.value}
                    />
                  ))}
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" icon={X} onClick={resetFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <TableContainer loading={loading} empty={!loading && paginatedItems.length === 0}>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <SortHeader label="Ticket" sortKey="ticketNo" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Title" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Priority" sortKey="priority" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Requester" sortKey="requesterName" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Assignee" sortKey="assigneeName" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => {
                const isRestricted = isAdmin && !canAdminOpenTicket(item);
                return (
                  <TableRow key={item.id} onClick={() => handleOpenTicket(item)} disabled={isRestricted}>
                    <TableCell>
                      <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                        {item.ticketNo}
                      </span>
                    </TableCell>
                    <TableCell truncate>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 hover:text-brand-600 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">{formatDate(item.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={item.category} size="sm" />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={item.priority} size="sm" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-700">{item.requesterName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-brand-600" />
                          </div>
                          <span className="text-sm text-slate-700">{item.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {isRestricted ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-lg">
                            Restricted
                          </span>
                        ) : (
                          <>
                            <PermissionGate permission="tickets:edit">
                              <button
                                onClick={(e) => openEditDialog(item, e)}
                                className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="tickets:delete">
                              <button
                                onClick={(e) => openDeleteDialog(item, e)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination */}
          {!loading && sortedItems.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </TableContainer>
      </main>

      {/* Create Modal */}
      <ModalLayout
        isOpen={createOpen}
        onClose={clearCreateForm}
        title="Create Service Request"
        subtitle="Submit a new service request for assistance"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={clearCreateForm}>
              Cancel
            </Button>
            <Button icon={Plus} onClick={createRequest as any} loading={uploading}>
              Create Request
            </Button>
          </div>
        }
      >
        <form onSubmit={createRequest} className="space-y-8">
          <FormSection title="General Information" icon={FileText}>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of your request"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed description of your request..."
              rows={4}
            />
            <FormRow>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={categoryOptions}
                required
              />
              <Input
                label="Sub Category"
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                placeholder="Optional sub-category"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Request Details" icon={AlertCircle}>
            <FormRow>
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={priorityOptions}
                required
              />
              <Input
                label="Project"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                placeholder="Related project (optional)"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Requester Information" icon={User}>
            <Input
              label="Requester Name"
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              placeholder="Your full name"
              required
            />
          </FormSection>

          <FormSection title="Attachments" icon={Upload}>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES}
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, PDF, DOCX, XLSX, TXT (max 25MB per file)
                </p>
              </label>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-brand-600">
                    {selectedFiles.length} file(s) selected
                  </p>
                </div>
              )}
            </div>
          </FormSection>
        </form>
      </ModalLayout>

      {/* Edit Modal */}
      <ModalLayout
        isOpen={editOpen}
        onClose={closeEditDialog}
        title="Edit Service Request"
        subtitle={editingRequest ? `Editing ${editingRequest.ticketNo}` : ''}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button icon={Edit2} onClick={updateRequest as any}>
              Update Request
            </Button>
          </div>
        }
      >
        <form onSubmit={updateRequest} className="space-y-8">
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
            <FormRow>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={categoryOptions}
                required
              />
              <Input
                label="Sub Category"
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              />
            </FormRow>
          </FormSection>

          <FormSection title="Request Details" icon={AlertCircle}>
            <FormRow>
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={priorityOptions}
                required
              />
              <Input
                label="Project"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              />
            </FormRow>
          </FormSection>

          <FormSection title="Requester Information" icon={User}>
            <Input
              label="Requester Name"
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              required
            />
          </FormSection>
        </form>
      </ModalLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Service Request"
        message={`Are you sure you want to delete ${deletingRequest?.ticketNo}? This action cannot be undone.`}
        confirmText="Delete Request"
        variant="danger"
        isLoading={deleting}
        confirmInput
        confirmInputValue={deleteConfirmText}
        onConfirmInputChange={setDeleteConfirmText}
        confirmInputPlaceholder="Type DELETE to confirm"
      />

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-sm">{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
