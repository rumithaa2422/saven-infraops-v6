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
  AlertCircle,
  Inbox,
  Hourglass,
  CheckCircle,
  ShieldAlert
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
  DeleteIncidentDialog
} from '../components/incidents';
import { SummaryCards } from '../components/common/SummaryCards';
import * as XLSX from 'xlsx';

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

type IncidentRow = {
  title: string;
  description: string;
  severity: string;
  priority: string;
  impactedService: string;
  impactedProject: string;
  ownerName: string;
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

  // Summary cards data for Incidents
  const summaryCards = useMemo(() => [
    {
      icon: Inbox,
      iconBgColor: 'bg-gradient-to-br from-slate-100 to-slate-50',
      iconColor: 'text-slate-600',
      value: summaryStats.total,
      label: 'Total Incidents'
    },
    {
      icon: AlertCircle,
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      value: summaryStats.open,
      label: 'Open'
    },
    {
      icon: Hourglass,
      iconBgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-600',
      value: summaryStats.inProgress,
      label: 'In Progress'
    },
    {
      icon: CheckCircle,
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconColor: 'text-emerald-600',
      value: summaryStats.resolved,
      label: 'Resolved'
    },
    {
      icon: ShieldAlert,
      iconBgColor: 'bg-gradient-to-br from-red-100 to-red-50',
      iconColor: 'text-red-600',
      value: summaryStats.critical,
      label: 'Critical (SEV1)'
    }
  ], [summaryStats]);

  // Permission checks
  const canView = hasPermission('incidents:view');
  const canCreate = hasPermission('incidents:create');
  const canEdit = hasPermission('incidents:update');
  const canDelete = hasPermission('incidents:delete');
  const canExport = hasPermission('incidents:export');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importValidRows, setImportValidRows] = useState<IncidentRow[]>([]);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    error?: string;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

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

  // Export incidents to Excel
  const handleExport = async () => {
    try {
      const res = await api.get('/incidents?limit=10000');
      const allIncidents = res.data.items || res.data || [];
      
      const exportData = allIncidents.map((i: Incident) => ({
        'Incident No': i.incidentNo,
        'Title': i.title,
        'Description': i.description || '',
        'Severity': i.severity,
        'Priority': i.priority || '',
        'Status': i.status,
        'Impacted Service': i.impactedService || '',
        'Impacted Project': i.impactedProject || '',
        'Owner': i.ownerName || '',
        'Created At': i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : '',
        'Updated At': i.updatedAt ? new Date(i.updatedAt).toISOString().split('T')[0] : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidents');
      
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 15 }
      ];

      XLSX.writeFile(workbook, `incidents-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export incidents');
    }
  };

  // Import handlers
  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportProcessing(true);
    setImportResult(null);
    setImportErrors({});
    setImportValidRows([]);
    setShowImportModal(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setImportData(jsonData);
        validateImportData(jsonData).then(() => {
          setImportProcessing(false);
        }).catch(() => {
          setImportProcessing(false);
        });
      } catch (err) {
        alert('Failed to parse Excel file');
        setShowImportModal(false);
        setImportProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  async function validateImportData(data: any[]): Promise<void> {
    const errors: Record<number, string[]> = {};
    const validRows: IncidentRow[] = [];

    const SEVERITY_OPTIONS = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];
    const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const STATUS_OPTIONS = ['OPEN', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];

      const getField = (name: string) => String(row[name] || '').trim();

      const title = getField('Title');
      const description = getField('Description');
      const severity = getField('Severity') || 'SEV3';
      const priority = getField('Priority') || 'MEDIUM';
      const impactedService = getField('Impacted Service');
      const impactedProject = getField('Impacted Project');
      const ownerName = getField('Owner');

      // Validate Title
      if (!title) {
        rowErrors.push('Title is required');
      }

      // Validate Severity
      if (severity && !SEVERITY_OPTIONS.includes(severity)) {
        rowErrors.push(`Invalid severity "${severity}". Allowed: ${SEVERITY_OPTIONS.join(', ')}`);
      }

      // Validate Priority
      if (priority && !PRIORITY_OPTIONS.includes(priority)) {
        rowErrors.push(`Invalid priority "${priority}". Allowed: ${PRIORITY_OPTIONS.join(', ')}`);
      }

      if (rowErrors.length > 0) {
        errors[i] = rowErrors;
      } else {
        validRows.push({
          title,
          description,
          severity,
          priority,
          impactedService,
          impactedProject,
          ownerName
        });
      }
    }

    setImportErrors(errors);
    setImportValidRows(validRows);
    return Promise.resolve();
  }

  async function handleImportConfirm() {
    if (importValidRows.length === 0) return;

    setImportProcessing(true);
    let success = 0;
    let failed = 0;

    try {
      for (const row of importValidRows) {
        try {
          const payload = {
            title: row.title,
            description: row.description || undefined,
            severity: row.severity,
            priority: row.priority,
            impactedService: row.impactedService || undefined,
            impactedProject: row.impactedProject || undefined,
            ownerName: row.ownerName || undefined
          };

          await api.post('/incidents', payload);
          success++;
        } catch (err: any) {
          console.error('Failed to import incident:', row.title, err);
          failed++;
        }
      }

      setImportResult({ success, failed, skipped: 0 });
      
      if (success > 0) {
        load();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setImportResult({
        success,
        failed,
        skipped: 0,
        error: err.response?.data?.message || 'Import failed'
      });
    } finally {
      setImportProcessing(false);
    }
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors({});
    setImportValidRows([]);
    setImportResult(null);
    
    // Refresh incidents list after closing modal
    load();
  }

  function downloadValidationReport() {
    const errorData: any[][] = [['Row', 'Field', 'Error']];
    Object.entries(importErrors).forEach(([rowIdx, errors]) => {
      const row = importData[parseInt(rowIdx)];
      const title = row?.['Title'] || 'N/A';
      errors.forEach(error => {
        errorData.push([`${parseInt(rowIdx) + 2} (${title})`, '', error]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'import-validation-report.xlsx');
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
    <div className="workspace">
      <div className="page-stack incidents">
        {/* Page Header */}
        <PageHeader
          title="Incidents"
          subtitle={`${summaryStats.total} total`}
          icon={AlertTriangle}
          actions={
            canCreate ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Create Incident
              </button>
            ) : undefined
          }
        />

        <div className="content-section">
        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

        {/* Search and Filters */}
        <SectionCard title="" noPadding className="!overflow-visible">
          <div className="p-3 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
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
                  <Button variant="secondary" icon={Download} onClick={handleExport}>
                    Export
                  </Button>
                )}
                {canCreate && (
                  <Button variant="secondary" icon={Upload} onClick={handleImportClick}>
                    Import
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                    >
                      {severityFilterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
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
      </div>

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
        icon="⚠️"
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
        icon="✏️"
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

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={importInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFileChange}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeImportModal}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">Import Incidents</h3>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              {!importResult && (
                <div>
                  {importFile && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-700">{importFile.name}</span>
                    </div>
                  )}

                  {importFile && !importProcessing && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-slate-900">{importData.length}</div>
                        <div className="text-sm text-slate-500">Total Rows</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{importValidRows.length}</div>
                        <div className="text-sm text-green-600">Valid</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{Object.keys(importErrors).length}</div>
                        <div className="text-sm text-red-600">Invalid</div>
                      </div>
                    </div>
                  )}

                  {importFile && !importProcessing && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Preview</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-slate-600">Row</th>
                              <th className="px-3 py-2 text-left text-slate-600">Title</th>
                              <th className="px-3 py-2 text-left text-slate-600">Severity</th>
                              <th className="px-3 py-2 text-left text-slate-600">Priority</th>
                              <th className="px-3 py-2 text-left text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importData.slice(0, 10).map((row, idx) => {
                              const hasError = importErrors[idx];
                              return (
                                <tr key={idx} className={hasError ? 'bg-red-50' : 'bg-white'}>
                                  <td className="px-3 py-2">{idx + 2}</td>
                                  <td className="px-3 py-2">{row['Title'] || '-'}</td>
                                  <td className="px-3 py-2">{row['Severity'] || '-'}</td>
                                  <td className="px-3 py-2">{row['Priority'] || '-'}</td>
                                  <td className="px-3 py-2">
                                    {hasError ? (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Invalid</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Valid</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {importData.length > 10 && (
                        <p className="text-xs text-slate-500 mt-2">Showing first 10 of {importData.length} rows</p>
                      )}
                    </div>
                  )}

                  {Object.keys(importErrors).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Validation Errors</h4>
                      <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-auto">
                        {Object.entries(importErrors).slice(0, 5).map(([rowIdx, errors]) => {
                          const row = importData[parseInt(rowIdx)];
                          const title = row?.['Title'] || 'N/A';
                          return (
                            <div key={rowIdx} className="mb-2 text-sm">
                              <strong className="text-red-700">Row {parseInt(rowIdx) + 2} ({title}):</strong>
                              <ul className="ml-4 text-red-600 list-disc">
                                {errors.map((error, eIdx) => (
                                  <li key={eIdx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                        {Object.keys(importErrors).length > 5 && (
                          <p className="text-xs text-red-600">And {Object.keys(importErrors).length - 5} more errors.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {importProcessing && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-slate-600">Validating data...</p>
                    </div>
                  )}
                </div>
              )}

              {importResult && !importResult.error && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Complete</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                      <div className="text-sm text-green-600">Imported</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                  </div>
                </div>
              )}

              {importResult?.error && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Failed</h3>
                  <p className="text-sm text-slate-600">{importResult.error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
              {!importResult ? (
                <>
                  {Object.keys(importErrors).length > 0 && (
                    <Button variant="ghost" onClick={downloadValidationReport}>
                      Download Report
                    </Button>
                  )}
                  <div className="flex-1"></div>
                  <Button variant="secondary" onClick={closeImportModal}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleImportConfirm}
                    disabled={importProcessing || importValidRows.length === 0}
                    className="ml-2"
                  >
                    {importProcessing ? 'Importing...' : `Import ${importValidRows.length} Incidents`}
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={closeImportModal} className="ml-auto">
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
