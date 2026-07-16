import { FormEvent, useEffect, useMemo, useState, useRef, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../auth/AuthContext';

type ModulePageProps = {
  moduleKey: string;
  title: string;
};

type RecordItem = Record<string, unknown> & { id?: string };

type Field = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
};

// Category Management types
type SubCategory = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  subcategories: SubCategory[];
  inventoryCount?: number;
  subcategoryCount?: number;
};

// Phase 4C: Extended permissions type for action-level RBAC
type ModuleConfig = {
  referenceKey: string;
  titleKey: string;
  ownerKey?: string;
  statusKey?: string;
  dateKey?: string;
  fields: Field[];
  columns: Field[];
  permissions: {
    view?: string;      // NEW: View/Drawer permission
    create?: string;   // Create button and modal
    write?: string;    // Edit/Manage actions
    export?: string;   // NEW: Export permission
    import?: string;   // NEW: Import permission
    delete?: string;   // Delete permission
  };
  moduleType?: string; // Module type for import framework (e.g., 'incidents', 'users-teams')
  isDocumentRepository?: boolean; // PDF document repository mode
  isCategoryManagement?: boolean; // Category management mode (inventory module)
};

const configs: Record<string, ModuleConfig> = {
  incidents: {
    referenceKey: 'incidentNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['SEV1', 'SEV2', 'SEV3', 'SEV4'] },
      { key: 'impactedService', label: 'Impacted Service' },
      { key: 'impactedProject', label: 'Impacted Project' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ],
    columns: [
      { key: 'incidentNo', label: 'Incident No' },
      { key: 'title', label: 'Title' },
      { key: 'severity', label: 'Severity' },
      { key: 'impactedService', label: 'Impacted Service' },
      { key: 'impactedProject', label: 'Impacted Project' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'status', label: 'Status' },
      { key: 'description', label: 'Description' }
    ],
    permissions: { create: 'incidents:create', write: 'incidents:manage', delete: 'incidents:manage', export: 'incidents:export', import: 'settings:write' },
    moduleType: 'incidents'
  },
  problems: {
    referenceKey: 'problemNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'ownerName', label: 'Owner' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'rootCause', label: 'Root Cause', type: 'textarea' }
    ],
    columns: [
      { key: 'problemNo', label: 'Problem No' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'rootCause', label: 'Root Cause' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'problems:create', write: 'problems:manage', delete: 'problems:manage', export: 'problems:export', import: 'settings:write' },
    moduleType: 'problems'
  },
  changes: {
    referenceKey: 'changeNo',
    titleKey: 'title',
    ownerKey: 'ownerName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { key: 'ownerName', label: 'Owner' },
      { key: 'changeWindow', label: 'Change Window', type: 'date' },
      { key: 'rollbackPlan', label: 'Rollback Plan', type: 'textarea' }
    ],
    columns: [
      { key: 'changeNo', label: 'Change No' },
      { key: 'title', label: 'Title' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'changeWindow', label: 'Change Window' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'rollbackPlan', label: 'Rollback Plan' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'changes:create', write: 'changes:approve', delete: 'changes:manage', export: 'changes:export', import: 'settings:write' },
    moduleType: 'change-requests'
  },
  inventory: {
    referenceKey: 'name',
    titleKey: 'name',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [],
    columns: [],
    permissions: { view: 'inventory:view', create: 'inventory:manage', write: 'inventory:manage', delete: 'inventory:manage', export: 'inventory:export' },
    moduleType: 'inventory',
    isCategoryManagement: true
  },
  'access-management': {
    referenceKey: 'requestNo',
    titleKey: 'systemName',
    ownerKey: 'approverName',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'requesterName', label: 'Requester', required: true },
      { key: 'accessType', label: 'Access Type', required: true },
      { key: 'systemName', label: 'System Name', required: true },
      { key: 'approverName', label: 'Approver' },
      { key: 'justification', label: 'Justification', type: 'textarea' }
    ],
    columns: [
      { key: 'requestNo', label: 'Request No' },
      { key: 'requesterName', label: 'Requester' },
      { key: 'accessType', label: 'Access Type' },
      { key: 'systemName', label: 'System Name' },
      { key: 'approverName', label: 'Approver' },
      { key: 'justification', label: 'Justification' },
      { key: 'status', label: 'Status' }
    ],
    permissions: { create: 'access:request', write: 'access:approve', delete: 'access:manage', export: 'access:export' }
  },
  compliance: {
    referenceKey: 'id',
    titleKey: 'fileName',
    dateKey: 'createdAt',
    fields: [], // No form fields needed for document repository
    columns: [
      { key: 'fileName', label: 'File Name' },
      { key: 'uploadedBy', label: 'Uploaded By' },
      { key: 'createdAt', label: 'Uploaded Date' },
      { key: 'fileSize', label: 'File Size' }
    ],
    permissions: { create: 'compliance:create', delete: 'compliance:manage', export: 'compliance:read' },
    moduleType: 'compliance',
    isDocumentRepository: true
  },
  'projects-environments': {
    referenceKey: 'projectName',
    titleKey: 'environmentName',
    ownerKey: 'ownerName',
    dateKey: 'createdAt',
    fields: [
      { key: 'projectName', label: 'Project Name', required: true },
      { key: 'environmentName', label: 'Environment', required: true },
      { key: 'serviceName', label: 'Service Name' },
      { key: 'serverName', label: 'Server Name' },
      { key: 'databaseName', label: 'Database Name' },
      { key: 'ownerName', label: 'Owner' }
    ],
    columns: [
      { key: 'projectName', label: 'Project Name' },
      { key: 'environmentName', label: 'Environment' },
      { key: 'serviceName', label: 'Service Name' },
      { key: 'serverName', label: 'Server Name' },
      { key: 'databaseName', label: 'Database Name' },
      { key: 'ownerName', label: 'Owner' }
    ],
    permissions: { create: 'projects:create', write: 'projects:manage', delete: 'projects:manage', export: 'projects:export', import: 'settings:write' },
    moduleType: 'projects'
  },
  'vendors-licenses': {
    referenceKey: 'vendorName',
    titleKey: 'licenseName',
    ownerKey: 'ownerName',
    dateKey: 'renewalAt',
    fields: [
      { key: 'vendorName', label: 'Vendor Name', required: true },
      { key: 'licenseName', label: 'License Name', required: true },
      { key: 'licenseCount', label: 'License Count', type: 'number' },
      { key: 'assignedCount', label: 'Assigned Count', type: 'number' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'renewalAt', label: 'Renewal Date', type: 'date' }
    ],
    columns: [
      { key: 'vendorName', label: 'Vendor Name' },
      { key: 'licenseName', label: 'License Name' },
      { key: 'licenseCount', label: 'License Count' },
      { key: 'assignedCount', label: 'Assigned Count' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'renewalAt', label: 'Renewal Date' }
    ],
    permissions: { create: 'vendors:create', write: 'vendors:manage', delete: 'vendors:manage', export: 'vendors:export', import: 'settings:write' },
    moduleType: 'vendors'
  },
  'knowledge-base': {
    referenceKey: 'category',
    titleKey: 'title',
    ownerKey: 'authorName',
    dateKey: 'createdAt',
    fields: [
      { key: 'title', label: 'Article Title', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'authorName', label: 'Author' },
      { key: 'body', label: 'Body', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'title', label: 'Article Title' },
      { key: 'category', label: 'Category' },
      { key: 'authorName', label: 'Author' },
      { key: 'body', label: 'Body' }
    ],
    permissions: { view: 'kb:view', create: 'kb:create', write: 'kb:manage', delete: 'kb:manage', export: 'kb:export', import: 'kb:import' },
    moduleType: 'knowledge-base'
  },
  'users-teams': {
    referenceKey: 'email',
    titleKey: 'name',
    ownerKey: 'department',
    statusKey: 'status',
    dateKey: 'createdAt',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'], required: true },
      { key: 'roleId', label: 'Role', type: 'select', options: ['role-placeholder'] }
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' }
    ],
    permissions: {
      view: 'users:view',      // View user details in drawer
      create: 'users:create',  // Create user button/modal
      write: 'users:manage',   // Edit/Enable/Disable/Reset Password
      delete: 'users:delete',  // Delete user
      export: 'users:export',  // Export users button
      import: 'settings:write' // Import users
    },
    moduleType: 'users-teams'
  },
  'reports-analytics': {
    referenceKey: 'title',
    titleKey: 'description',
    ownerKey: 'owner',
    fields: [
      { key: 'title', label: 'Report Name', required: true },
      { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' }
    ],
    columns: [
      { key: 'title', label: 'Report' },
      { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' }
    ],
    permissions: { create: undefined, write: 'reports:view', export: 'reports:export' }
  }
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && value.includes('T') && value.endsWith('Z')) return new Date(value).toLocaleDateString();
  return String(value);
}

// Special formatter for user roles (handles the nested roles array from Prisma)
function formatUserRoles(value: unknown): string {
  if (!value || !Array.isArray(value)) return '-';
  if (value.length === 0) return '-';
  // Extract role names from the nested structure: [{ role: { name: "Admin" } }]
  const roleNames = value.map((r: { role?: { name?: string } }) => r?.role?.name).filter(Boolean);
  if (roleNames.length === 0) return '-';
  return roleNames.join(', ');
}


type StatusAction = { label: string; value: string };

function getStatusActions(moduleKey: string, currentStatus?: string): StatusAction[] {
  // Access Management: REQUESTED -> APPROVED -> PROVISIONED -> REVOKED
  if (moduleKey === 'access-management') {
    if (currentStatus === 'REVOKED' || currentStatus === 'EXPIRED') return [];
    if (currentStatus === 'PROVISIONED') {
      return [{ label: 'Revoke', value: 'REVOKED' }];
    }
    if (currentStatus === 'APPROVED') {
      return [
        { label: 'Provision', value: 'PROVISIONED' },
        { label: 'Revoke', value: 'REVOKED' }
      ];
    }
    // REQUESTED, REJECTED or unknown
    return [{ label: 'Approve', value: 'APPROVED' }];
  }

  // Inventory: AVAILABLE <-> ASSIGNED, UNDER_REPAIR
  if (moduleKey === 'inventory') {
    return [
      { label: 'Mark Available', value: 'AVAILABLE' },
      { label: 'Mark Assigned', value: 'ASSIGNED' },
      { label: 'Under Repair', value: 'UNDER_REPAIR' }
    ];
  }

  if (moduleKey === 'users-teams') return [];

  // Incidents use IncidentStatus: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
  const status = currentStatus?.toUpperCase();
  
  // If already closed, no actions available
  if (status === 'CLOSED') return [];
  
  // Incidents: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
  if (moduleKey === 'incidents') {
    if (status === 'OPEN' || status === 'ASSIGNED') {
      return [
        { label: 'Mark In Progress', value: 'IN_PROGRESS' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'IN_PROGRESS') {
      return [
        { label: 'Mark Resolved', value: 'RESOLVED' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'RESOLVED') {
      return [{ label: 'Close', value: 'CLOSED' }];
    }
    // Default for unknown status
    return [
      { label: 'Mark In Progress', value: 'IN_PROGRESS' },
      { label: 'Close', value: 'CLOSED' }
    ];
  }

  // Changes use ChangeRequestStatus: OPEN -> PENDING_APPROVAL -> APPROVED -> IMPLEMENTING -> COMPLETED -> CLOSED
  if (moduleKey === 'changes') {
    if (status === 'OPEN') {
      return [
        { label: 'Request Approval', value: 'PENDING_APPROVAL' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'PENDING_APPROVAL') {
      return [
        { label: 'Approve', value: 'APPROVED' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'APPROVED') {
      return [
        { label: 'Start Implementation', value: 'IMPLEMENTING' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'IMPLEMENTING') {
      return [
        { label: 'Mark Completed', value: 'COMPLETED' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'COMPLETED') {
      return [{ label: 'Close', value: 'CLOSED' }];
    }
    return [];
  }

  // Problems use ProblemStatus: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
  if (moduleKey === 'problems') {
    if (status === 'OPEN' || status === 'ASSIGNED') {
      return [{ label: 'Mark In Progress', value: 'IN_PROGRESS' }];
    }
    if (status === 'IN_PROGRESS') {
      return [
        { label: 'Mark Resolved', value: 'RESOLVED' },
        { label: 'Close', value: 'CLOSED' }
      ];
    }
    if (status === 'RESOLVED') {
      return [{ label: 'Close', value: 'CLOSED' }];
    }
    return [];
  }

  // Service Requests use ServiceRequestStatus: OPEN -> ASSIGNED -> IN_PROGRESS -> WAITING_FOR_USER -> COMPLETED -> CLOSED
  // For service requests, we let the backend handle the state machine
  if (moduleKey === 'tickets' || moduleKey === 'service-requests') {
    return []; // Backend handles status transitions
  }

  return [];
}

function getInitialForm(fields: Field[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.options?.[0] || '';
    return acc;
  }, {});
}

export function ModulePage({ moduleKey, title }: ModulePageProps) {
  const config = configs[moduleKey] || configs['reports-analytics'];
  const { hasPermission, hasAnyPermission, user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const navigate = useNavigate();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecordItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(config.fields));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<{id: string; name: string}[]>([]);
  
  // Get status actions based on current item's status
  const statusActions = getStatusActions(moduleKey, selected?.status as string | undefined);
  
  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<RecordItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Category Management state (for inventory module)
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState('');

  // Category form state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', status: 'ACTIVE' });
  const [savingCategory, setSavingCategory] = useState(false);

  // Subcategory form state
  const [subcategoryFormOpen, setSubcategoryFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubCategory | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', status: 'ACTIVE' });
  const [savingSubcategory, setSavingSubcategory] = useState(false);

  // Category delete state
  const [categoryDeleteOpen, setCategoryDeleteOpen] = useState(false);
  const [categoryDeleteItem, setCategoryDeleteItem] = useState<{ type: 'category' | 'subcategory'; item: Category | SubCategory } | null>(null);
  const [categoryDeleteText, setCategoryDeleteText] = useState('');
  const [categoryDeleting, setCategoryDeleting] = useState(false);

  // Import state (Phase 5 - import)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [parsedData, setParsedData] = useState<{
    totalRows: number;
    columns: string[];
    sheetName?: string;
    isPreview: boolean;
    data: Record<string, unknown>[];
  } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    summary: { allValid: boolean; message: string };
    rows: Array<{ row: number; valid: boolean; data: Record<string, unknown>; errors: Array<{ row: number; field: string; message: string }> }>;
    errorsByRow: Record<number, string[]>;
    templateValidation?: {
      valid: boolean;
      message: string;
      missingRequired?: string[];
      matchedColumns?: string[];
    };
  } | null>(null);
  const [executeResult, setExecuteResult] = useState<{
    success: boolean;
    totalRows: number;
    imported: number;
    failed: number;
    skipped: number;
    results: Array<{ 
      row: number; 
      success: boolean; 
      identifier: string; 
      id?: string; 
      error?: string; 
      warning?: string;
      emailError?: string;
    }>;
    summary: { allSuccessful: boolean; message: string };
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importInputId = useId();

  // PDF Document Upload State (for compliance document repository)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Document Import State (multiple PDFs)
  const [isImportingDocs, setIsImportingDocs] = useState(false);
  const [docImportResult, setDocImportResult] = useState<{
    imported: number;
    skipped: { fileName: string; reason: string }[];
  } | null>(null);
  const docImportInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Document delete state
  const [documentToDelete, setDocumentToDelete] = useState<RecordItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  // Document repository search/filter/sort state
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docUploadedBy, setDocUploadedBy] = useState('all');
  const [docDateRange, setDocDateRange] = useState<string>('allTime');
  const [docSortBy, setDocSortBy] = useState<'fileName' | 'createdAt' | 'fileSize'>('createdAt');
  const [docSortOrder, setDocSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploaders, setUploaders] = useState<{ id: string; email: string }[]>([]);
  const docDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search state for users-teams module
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      load(query);
    }, 300);
  }, [moduleKey]);

  // ============================================
  // Category Management Functions
  // ============================================

  async function loadCategories() {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/inventory/categories');
      setCategories(res.data.categories);
    } catch {
      setCategoryMessage('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'status-open' : 'status-closed';
  }

  // Category CRUD
  function openCategoryForm(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', status: 'ACTIVE' });
    }
    setCategoryFormOpen(true);
  }

  function closeCategoryForm() {
    setCategoryFormOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', status: 'ACTIVE' });
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      setCategoryMessage('Category name is required');
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        await api.patch(`/inventory/categories/${editingCategory.id}`, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          status: categoryForm.status
        });
        setCategoryMessage('Category updated successfully');
      } else {
        await api.post('/inventory/categories', {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          status: categoryForm.status
        });
        setCategoryMessage('Category created successfully');
      }
      closeCategoryForm();
      loadCategories();
    } catch (err: any) {
      setCategoryMessage(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  }

  // Subcategory CRUD
  function openSubcategoryForm(categoryId: string, subcategory?: SubCategory) {
    setParentCategoryId(categoryId);
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryForm({
        name: subcategory.name,
        description: subcategory.description || '',
        status: subcategory.status
      });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({ name: '', description: '', status: 'ACTIVE' });
    }
    setSubcategoryFormOpen(true);
  }

  function closeSubcategoryForm() {
    setSubcategoryFormOpen(false);
    setEditingSubcategory(null);
    setParentCategoryId(null);
    setSubcategoryForm({ name: '', description: '', status: 'ACTIVE' });
  }

  async function saveSubcategory() {
    if (!subcategoryForm.name.trim()) {
      setCategoryMessage('Subcategory name is required');
      return;
    }

    if (!parentCategoryId) {
      setCategoryMessage('Parent category is required');
      return;
    }

    setSavingSubcategory(true);
    try {
      if (editingSubcategory) {
        await api.patch(`/inventory/subcategories/${editingSubcategory.id}`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null,
          status: subcategoryForm.status
        });
        setCategoryMessage('Subcategory updated successfully');
      } else {
        await api.post(`/inventory/categories/${parentCategoryId}/subcategories`, {
          name: subcategoryForm.name.trim(),
          description: subcategoryForm.description.trim() || null,
          status: subcategoryForm.status
        });
        setCategoryMessage('Subcategory created successfully');
      }
      closeSubcategoryForm();
      loadCategories();
    } catch (err: any) {
      setCategoryMessage(err.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setSavingSubcategory(false);
    }
  }

  // Delete handlers
  function openCategoryDelete(type: 'category' | 'subcategory', item: Category | SubCategory) {
    setCategoryDeleteItem({ type, item });
    setCategoryDeleteText('');
    setCategoryDeleteOpen(true);
  }

  function closeCategoryDelete() {
    setCategoryDeleteOpen(false);
    setCategoryDeleteItem(null);
    setCategoryDeleteText('');
  }

  async function confirmCategoryDelete() {
    if (!categoryDeleteItem || categoryDeleteText !== 'DELETE') return;

    setCategoryDeleting(true);
    try {
      if (categoryDeleteItem.type === 'category') {
        await api.delete(`/inventory/categories/${categoryDeleteItem.item.id}`);
        setCategoryMessage('Category deleted successfully');
      } else {
        await api.delete(`/inventory/subcategories/${categoryDeleteItem.item.id}`);
        setCategoryMessage('Subcategory deleted successfully');
      }
      closeCategoryDelete();
      loadCategories();
    } catch (err: any) {
      setCategoryMessage(err.response?.data?.message || 'Failed to delete');
    } finally {
      setCategoryDeleting(false);
    }
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(cat => {
    if (!categorySearch) return true;
    const query = categorySearch.toLowerCase();
    return (
      cat.name.toLowerCase().includes(query) ||
      (cat.description?.toLowerCase().includes(query)) ||
      cat.subcategories.some(sub => sub.name.toLowerCase().includes(query))
    );
  });

  // Handle search input change
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  }

  // Handle import file selection
  function handleImportClick() {
    importInputRef.current?.click();
  }

  // Handle file selection from file picker
  function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportResult(null);

    // Phase 2: Upload the file immediately
    uploadImportFile(file);
  }

  // Upload import file to backend
  async function uploadImportFile(file: File) {
    setIsImporting(true);
    setImportError(null);
    setValidationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setImportResult({
          name: response.data.file.name,
          size: response.data.file.size,
          mimeType: response.data.file.mimeType
        });
        setParsedData(response.data.parsed);
        
        // Phase 4: Trigger validation automatically
        const importModuleType = config.moduleType || moduleKey;
        if (response.data.parsed.totalRows > 0) {
          await validateImportData(response.data.parsed.data, importModuleType, response.data.parsed.columns);
        } else {
          setMessage(`File uploaded successfully. No data rows found.`);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Failed to upload file. Please try again.';
      setImportError(errorMessage);
      setImportFile(null);
      setParsedData(null);
    } finally {
      setIsImporting(false);
    }
  }

  // Validate import data
  async function validateImportData(data: Record<string, unknown>[], moduleType: string, columns: string[]) {
    setIsValidating(true);
    setExecuteResult(null);
    setValidationResult(null);

    try {
      const response = await api.post('/import/validate', {
        moduleType,
        data,
        columns // BUG 2 FIX: Pass columns for template validation
      });

      setValidationResult(response.data);
      
      if (response.data.success) {
        setMessage(`All ${response.data.validRows} row(s) are valid and ready for import.`);
      } else {
        // Check if it's a template validation error
        if (response.data.templateValidation) {
          setMessage(response.data.templateValidation.message);
        } else {
          setMessage(`Found ${response.data.invalidRows} row(s) with errors. Please fix them before importing.`);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Failed to validate data.';
      setImportError(errorMessage);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  }

  // Execute import (Phase 5)
  async function executeImport(data: Record<string, unknown>[], moduleType: string, columns: string[]) {
    if (!validationResult?.success) {
      setImportError('Cannot import: Some rows have validation errors.');
      return;
    }

    setIsExecuting(true);
    setImportError(null);

    try {
      const response = await api.post('/import/execute', {
        moduleType,
        data,
        columns // BUG 2 FIX: Pass columns for template validation
      });

      setExecuteResult(response.data);
      
      if (response.data.success) {
        // Success: Clear all import state and refresh
        setMessage(`✅ Import Successful! ${response.data.imported} record(s) imported.`);
        
        // Clear import state
        setImportFile(null);
        setImportResult(null);
        setParsedData(null);
        setValidationResult(null);
        
        // Refresh the data to show new records
        await load();
        
        // Close drawer if open to show the new data
        setSelected(null);
      } else {
        // Partial success: Show error report
        setMessage(`⚠️ Import completed with issues: ${response.data.imported} imported, ${response.data.failed} failed.`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Failed to execute import. Please try again.';
      setImportError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  }

  // Clear import file selection
  function handleClearImport() {
    setImportFile(null);
    setImportResult(null);
    setParsedData(null);
    setValidationResult(null);
    setExecuteResult(null);
    setImportError(null);
  }

  // ============================================================================
  // DOWNLOAD ERROR REPORT - Phase 8 Enhancement
  // ============================================================================

  // Download validation errors as CSV
  function downloadValidationErrorReport() {
    if (!validationResult || validationResult.invalidRows === 0) return;

    const headers = ['Row Number', 'Column', 'Error Message', ...parsedData?.columns || []];
    const rows: string[][] = [];

    Object.entries(validationResult.errorsByRow).forEach(([rowNum, errors]) => {
      const rowData = parsedData?.data[parseInt(rowNum) - 2];
      errors.forEach((error) => {
        const [field, ...messageParts] = error.split(': ');
        const message = messageParts.join(': ');
        const rowValues = (parsedData?.columns || []).map(col => 
          String(rowData?.[col] ?? '').replace(/"/g, '""')
        );
        rows.push([
          rowNum,
          field,
          `"${message}"`,
          ...rowValues
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csvContent, `validation_errors_${Date.now()}.csv`);
  }

  // Download import execution errors as CSV
  function downloadImportErrorReport() {
    if (!executeResult || executeResult.failed === 0) return;

    const headers = ['Row Number', 'Identifier', 'Error Message', ...parsedData?.columns || []];
    const rows: string[][] = [];

    executeResult.results
      .filter(r => !r.success)
      .forEach(result => {
        const rowData = parsedData?.data[result.row - 2];
        const rowValues = (parsedData?.columns || []).map(col => 
          String(rowData?.[col] ?? '').replace(/"/g, '""')
        );
        rows.push([
          String(result.row),
          `"${result.identifier || ''}"`,
          `"${result.error || ''}"`,
          ...rowValues
        ]);
      });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csvContent, `import_errors_${Date.now()}.csv`);
  }

  // Generic CSV download helper
  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Fetch roles for users-teams module
  useEffect(() => {
    if (moduleKey === 'users-teams') {
      api.get('/roles').then((res) => {
        setRoles(res.data.items || []);
      }).catch(() => {
        setRoles([]);
      });
    }
  }, [moduleKey]);

  // Load categories for inventory module (category management)
  useEffect(() => {
    if (moduleKey === 'inventory') {
      loadCategories();
    }
  }, [moduleKey]);

  const openCount = useMemo(() => items.filter((item) => {
    const value = item[config.statusKey || 'status'];
    return !['CLOSED', 'RESOLVED', 'DISPOSED', 'false', 'No'].includes(String(value));
  }).length, [items, config.statusKey]);
  const dueCount = useMemo(() => items.filter((item) => config.dateKey && item[config.dateKey]).length, [items, config.dateKey]);
  const riskCount = useMemo(() => items.filter((item) => ['HIGH', 'CRITICAL', 'SEV1', 'SEV2'].includes(String(item.priority || item.riskRating || item.severity || ''))).length, [items]);

  async function load(search?: string) {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const response = await api.get(`/${moduleKey}`, { params });
      setItems(response.data.items || []);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('Unable to load records. Check backend, database, and permissions.');
    } finally {
      setLoading(false);
    }
  }

  // Load compliance documents with search, filter, and sort
  async function loadComplianceDocuments() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (docSearchQuery.trim()) {
        params.search = docSearchQuery.trim();
      }
      if (docUploadedBy !== 'all') {
        params.uploadedBy = docUploadedBy;
      }
      if (docDateRange !== 'allTime') {
        params.dateRange = docDateRange;
      }
      params.sortBy = docSortBy;
      params.sortOrder = docSortOrder;
      
      const response = await api.get('/compliance', { params });
      setItems(response.data.items || []);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('Unable to load documents. Check backend, database, and permissions.');
    } finally {
      setLoading(false);
    }
  }

  // Load uploaders list for filter dropdown
  async function loadUploaders() {
    try {
      const response = await api.get('/compliance', { params: { uploaders: 'true' } });
      setUploaders(response.data.uploaders || []);
    } catch {
      setUploaders([]);
    }
  }

  // Debounced search for compliance documents
  const debouncedDocSearch = useCallback(() => {
    if (docDebounceRef.current) {
      clearTimeout(docDebounceRef.current);
    }
    docDebounceRef.current = setTimeout(() => {
      loadComplianceDocuments();
    }, 300);
  }, [docSearchQuery, docUploadedBy, docDateRange, docSortBy, docSortOrder]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setForm(getInitialForm(config.fields));
    setSelected(null);
    setCreateOpen(false);
    setSearchQuery('');
    
    if (config.isDocumentRepository) {
      // Reset compliance-specific state
      setDocSearchQuery('');
      setDocUploadedBy('all');
      setDocDateRange('allTime');
      setDocSortBy('createdAt');
      setDocSortOrder('desc');
      loadComplianceDocuments();
      loadUploaders();
    } else {
      load();
    }
  }, [moduleKey]);

  async function createRecord(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post(`/${moduleKey}`, form);
      setCreateOpen(false);
      setForm(getInitialForm(config.fields));
      await load();
    } catch {
      setMessage('Create failed. Check mandatory fields and backend logs.');
    }
  }

  async function updateStatus(status: string) {
    if (!selected?.id) return;
    try {
      const response = await api.patch(`/${moduleKey}/${selected.id}/status`, { status });
      setSelected(response.data.item);
      await load();
      setMessage('Status updated successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update status';
      setMessage(errorMsg);
    }
  }

  // ============================================================================
  // PDF Document Repository Functions
  // ============================================================================

  function handlePdfFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setPdfUploadError('Only PDF files are allowed');
      setPdfFile(null);
      return;
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setPdfUploadError('File size exceeds 25MB limit');
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setPdfUploadError(null);
    setPdfUploadSuccess(false);
  }

  async function uploadPdfDocument() {
    if (!pdfFile) return;

    setIsUploadingPdf(true);
    setPdfUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      await api.post('/compliance/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPdfUploadSuccess(true);
      setPdfFile(null);
      setMessage('PDF document uploaded successfully');
      
      // Refresh the document list
      await loadComplianceDocuments();

      // Close the modal after a short delay
      setTimeout(() => {
        setCreateOpen(false);
        setPdfUploadSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setPdfUploadError(error.response?.data?.error || 'Failed to upload PDF document');
    } finally {
      setIsUploadingPdf(false);
    }
  }

  // Handle document import file selection
  function handleDocImportClick() {
    docImportInputRef.current?.click();
  }

  // Handle file selection for document import
  function handleDocImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    importPdfDocuments(Array.from(files));
    // Reset input so the same file can be selected again
    e.target.value = '';
  }

  // Import multiple PDF documents
  async function importPdfDocuments(files: File[]) {
    if (files.length === 0) return;

    setIsImportingDocs(true);
    setDocImportResult(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }

      const response = await api.post('/compliance/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      setDocImportResult({
        imported: result.totalImported || result.imported?.length || 0,
        skipped: result.skipped || []
      });

      if (result.totalImported > 0) {
        setMessage(`${result.totalImported} document(s) imported successfully`);
        await loadComplianceDocuments();
      } else if (result.skipped?.length > 0) {
        setMessage('No documents imported. All files were skipped.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage(error.response?.data?.error || 'Failed to import documents');
    } finally {
      setIsImportingDocs(false);
    }
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (config.isDocumentRepository) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!config.isDocumentRepository) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      importPdfDocuments(files);
    }
  }

  function openDeleteDocumentDialog(item: RecordItem, event: React.MouseEvent) {
    event.stopPropagation();
    setDocumentToDelete(item);
    setShowDeleteConfirm(true);
  }

  function closeDeleteDocumentDialog() {
    setDocumentToDelete(null);
    setShowDeleteConfirm(false);
  }

  async function confirmDeleteDocument() {
    if (!documentToDelete?.id) return;

    setIsDeletingDocument(true);
    try {
      await api.delete(`/compliance/${documentToDelete.id}`);
      setMessage('Document deleted successfully');
      closeDeleteDocumentDialog();
      await loadComplianceDocuments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage(error.response?.data?.error || 'Failed to delete document');
    } finally {
      setIsDeletingDocument(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Export all compliance documents as ZIP
  async function exportAllDocuments() {
    try {
      setLoading(true);
      const response = await api.get('/compliance/export/all', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `compliance-documents-${new Date().toISOString().slice(0, 10)}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setMessage('No documents to export');
      } else {
        setMessage('Failed to export documents');
      }
    } finally {
      setLoading(false);
    }
  }

  // Export single document
  async function exportDocument(documentId: string) {
    try {
      const response = await api.get(`/compliance/${documentId}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setMessage('Document not found');
      } else {
        setMessage('Failed to export document');
      }
    }
  }

  function exportCsv() {
    const header = config.columns.map((c) => c.label).join(',');
    const rows = items.map((item) => config.columns.map((c) => {
      // Special handling for role column in users-teams
      if (moduleKey === 'users-teams' && c.key === 'role') {
        return `"${formatUserRoles((item as RecordItem & { roles?: Array<{ role: { name: string } }> }).roles).replace(/"/g, '""')}"`;
      }
      return `"${formatValue(item[c.key]).replace(/"/g, '""')}"`;
    }).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Open delete confirmation dialog
  function openDeleteDialog(item: RecordItem, event: React.MouseEvent) {
    event.stopPropagation();
    setDeletingItem(item);
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  // Confirm and execute delete
  async function confirmDelete() {
    if (!deletingItem?.id || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/${moduleKey}/${deletingItem.id}`);
      setDeleteOpen(false);
      setDeletingItem(null);
      setMessage('Record deleted successfully.');
      await load();
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to delete record.');
    } finally {
      setDeleting(false);
    }
  }

  // Close delete dialog
  function closeDeleteDialog() {
    setDeleteOpen(false);
    setDeletingItem(null);
    setDeleteConfirmText('');
  }

  // Open edit modal with item data
  function openEditDialog(item: RecordItem, event: React.MouseEvent) {
    event.stopPropagation();
    setEditingItem(item);
    const itemForm: Record<string, string> = {};
    config.fields.forEach((field) => {
      const value = item[field.key];
      if (value !== undefined && value !== null) {
        itemForm[field.key] = String(value);
      } else {
        itemForm[field.key] = '';
      }
    });
    setForm(itemForm);
    setEditOpen(true);
  }

  // Handle edit form submit
  async function updateRecord(event: FormEvent) {
    event.preventDefault();
    if (!editingItem?.id) return;
    try {
      await api.put(`/${moduleKey}/${editingItem.id}`, form);
      setEditOpen(false);
      setEditingItem(null);
      setForm(getInitialForm(config.fields));
      await load();
      setMessage('Record updated successfully.');
    } catch {
      setMessage('Update failed. Check backend logs.');
    }
  }

  // Close edit modal
  function closeEditDialog() {
    setEditOpen(false);
    setEditingItem(null);
    setForm(getInitialForm(config.fields));
  }

  return (
    <div 
      className={`page-stack ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Management</span>
          <h2>{title}</h2>
        </div>
        <div className="action-row">
          {moduleKey === 'users-teams' && (
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          )}
          {/* Document repository search and filters */}
          {config.isDocumentRepository && (
            <div className="doc-filters">
              <input
                type="text"
                className="search-input"
                placeholder="Search documents..."
                value={docSearchQuery}
                onChange={(e) => {
                  setDocSearchQuery(e.target.value);
                  if (docDebounceRef.current) clearTimeout(docDebounceRef.current);
                  docDebounceRef.current = setTimeout(() => loadComplianceDocuments(), 300);
                }}
              />
              <select
                className="filter-select"
                value={docUploadedBy}
                onChange={(e) => {
                  setDocUploadedBy(e.target.value);
                  loadComplianceDocuments();
                }}
              >
                <option value="all">All Users</option>
                {uploaders.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={docDateRange}
                onChange={(e) => {
                  setDocDateRange(e.target.value);
                  loadComplianceDocuments();
                }}
              >
                <option value="allTime">All Time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
          )}
          {/* Disable all buttons during any import operation */}
          <button className="secondary" onClick={() => config.isDocumentRepository ? loadComplianceDocuments() : load(searchQuery)} disabled={loading || isImporting || isValidating || isExecuting}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {/* Import button - shown only for modules with import permission */}
          {config.permissions.import && hasPermission(config.permissions.import) && (
            <>
              {/* Disable import button during any import operation */}
              <button 
                className="secondary" 
                onClick={handleImportClick}
                disabled={isImporting || isValidating || isExecuting}
              >
                {isImporting || isValidating || isExecuting ? 'Processing...' : 'Import'}
              </button>
              <input
                ref={importInputRef}
                type="file"
                id={importInputId}
                accept=".csv,.xlsx"
                onChange={handleImportChange}
                style={{ display: 'none' }}
                disabled={isImporting || isValidating || isExecuting}
              />
            </>
          )}
          {config.permissions.export && hasPermission(config.permissions.export) && !config.isCategoryManagement && (
            <button className="secondary" onClick={config.isDocumentRepository ? exportAllDocuments : exportCsv} disabled={loading || isImporting || isValidating || isExecuting || isUploadingPdf || isImportingDocs}>
              {config.isDocumentRepository ? '📥 Export All' : 'Export CSV'}
            </button>
          )}
          {/* Import button for document repository - accepts multiple PDFs */}
          {config.isDocumentRepository && config.permissions.create && hasPermission(config.permissions.create) && (
            <>
              <button 
                className="secondary" 
                onClick={handleDocImportClick}
                disabled={isImportingDocs || isUploadingPdf}
              >
                {isImportingDocs ? '⏳ Importing...' : '📥 Import'}
              </button>
              <input
                ref={docImportInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleDocImportChange}
                style={{ display: 'none' }}
                disabled={isImportingDocs || isUploadingPdf}
              />
            </>
          )}
          {config.permissions.create && hasPermission(config.permissions.create) && !config.isCategoryManagement && (
            <button className="primary" onClick={() => setCreateOpen(true)} disabled={isImporting || isValidating || isExecuting || isUploadingPdf || isImportingDocs}>
              {config.isDocumentRepository ? '📤 Upload' : 'Create'}
            </button>
          )}
          {/* Category Management: Create Category button for inventory */}
          {config.isCategoryManagement && isSuperAdmin && (
            <button className="primary" onClick={() => openCategoryForm()}>
              + Create Category
            </button>
          )}
        </div>
      </div>

      {/* Show selected file name */}
      {importFile && (
        <div className="import-file-info">
          {isImporting ? (
            <span className="import-file-name">⏳ Uploading {importFile.name}...</span>
          ) : (
            <>
              <span className="import-file-name">📄 {importFile.name}</span>
              <button className="import-clear-btn" onClick={handleClearImport}>×</button>
            </>
          )}
        </div>
      )}

      {/* Show upload success result */}
      {importResult && !isImporting && (
        <div className="import-success">
          <span>✅ Uploaded: {importResult.name}</span>
          <span className="import-meta">({(importResult.size / 1024).toFixed(1)} KB, {importResult.mimeType})</span>
        </div>
      )}

      {/* Show validating status */}
      {isValidating && (
        <div className="import-validating">
          <span>🔄 Validating data...</span>
        </div>
      )}

      {/* Show validation summary with Import button */}
      {validationResult && !isValidating && !executeResult && (
        <div className={`import-validation-summary ${validationResult.success ? 'success' : 'error'}`}>
          <div className="validation-summary-header">
            <span className="validation-icon">{validationResult.success ? '✅' : '❌'}</span>
            <span className="validation-message">{validationResult.summary.message}</span>
          </div>
          
          {/* Detailed validation stats */}
          <div className="validation-stats">
            <span className="stat total">📊 Total Rows: {validationResult.totalRows}</span>
            <span className="stat valid">✓ Valid: {validationResult.validRows}</span>
            <span className="stat invalid">✗ Invalid: {validationResult.invalidRows}</span>
          </div>
          
          {/* Template mismatch error */}
          {validationResult.templateValidation && !validationResult.templateValidation.valid && (
            <div className="template-error">
              <strong>⚠️ Template Mismatch:</strong> {validationResult.templateValidation.message}
              <br />
              <small>Missing columns: {validationResult.templateValidation.missingRequired?.join(', ')}</small>
            </div>
          )}
          
          {validationResult.success && (
            <div className="import-actions">
              <button 
                className="primary" 
                onClick={() => parsedData && executeImport(parsedData.data, config.moduleType || moduleKey, parsedData.columns)}
                disabled={isExecuting}
              >
                {isExecuting ? '⏳ Importing...' : '📥 Import to System'}
              </button>
            </div>
          )}
          
          {/* Download error report button for validation failures */}
          {validationResult.invalidRows > 0 && (
            <div className="import-actions">
              <button 
                className="secondary" 
                onClick={downloadValidationErrorReport}
              >
                📥 Download Error Report (CSV)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show executing status */}
      {isExecuting && (
        <div className="import-executing">
          <span>⏳ Importing... Please wait.</span>
        </div>
      )}

      {/* Show import result - Enhanced success summary */}
      {executeResult && !isExecuting && (
        <div className={`import-execute-result ${executeResult.success ? 'success' : 'warning'}`}>
          <div className="execute-result-header">
            <span className="execute-icon">{executeResult.success ? '✅' : '⚠️'}</span>
            <span className="execute-message">
              {executeResult.success ? 'Imported Successfully' : 'Import Completed with Issues'}
            </span>
          </div>
          
          {/* Detailed import summary */}
          <div className="import-success-summary">
            <div className="summary-stat">
              <span className="stat-value">{executeResult.totalRows}</span>
              <span className="stat-label">Total Rows</span>
            </div>
            <div className="summary-stat success">
              <span className="stat-value">{executeResult.imported}</span>
              <span className="stat-label">Imported</span>
            </div>
            {executeResult.skipped > 0 && (
              <div className="summary-stat skipped">
                <span className="stat-value">{executeResult.skipped}</span>
                <span className="stat-label">Skipped</span>
              </div>
            )}
            {executeResult.failed > 0 && (
              <div className="summary-stat failed">
                <span className="stat-value">{executeResult.failed}</span>
                <span className="stat-label">Failed</span>
              </div>
            )}
          </div>
          
          {/* Success message */}
          {executeResult.success && (
            <p className="success-message">
              All {executeResult.imported} record(s) have been imported successfully. 
              The module data has been refreshed.
            </p>
          )}
          
          {/* Show skipped rows with reasons */}
          {executeResult.skipped > 0 && (
            <div className="skipped-info">
              <h5>ℹ️ Skipped Rows:</h5>
              <p>Some rows were skipped because they already exist in the system.</p>
            </div>
          )}
          
          {/* Show email failures if any - these are warnings, not failures */}
          {executeResult.results.some(r => r.emailError) && (
            <div className="email-warnings">
              <h5>⚠️ Email Notification Issues:</h5>
              <p>Some activation emails failed to send, but the users were created successfully.</p>
              {executeResult.results.filter(r => r.emailError).map((r) => (
                <div key={r.row} className="email-warning-item">
                  <strong>Row {r.row} ({r.identifier}):</strong> {r.emailError}
                </div>
              ))}
            </div>
          )}

          {/* Show failed imports with download button */}
          {executeResult.failed > 0 && (
            <div className="import-failures">
              <h5>❌ Import Failures:</h5>
              <p>{executeResult.failed} row(s) failed to import. Download the error report to fix and re-import.</p>
              
              {/* Show first few errors inline */}
              {executeResult.results.filter(r => !r.success).slice(0, 5).map((r) => (
                <div key={r.row} className="failure-item">
                  <strong>Row {r.row} ({r.identifier}):</strong> {r.error}
                </div>
              ))}
              {executeResult.failed > 5 && (
                <p className="more-errors">...and {executeResult.failed - 5} more errors. Download the full report.</p>
              )}
              
              <div className="import-actions">
                <button className="secondary" onClick={downloadImportErrorReport}>
                  📥 Download Error Report (CSV)
                </button>
              </div>
            </div>
          )}

          <div className="import-actions">
            <button className="secondary" onClick={handleClearImport}>Import Another File</button>
          </div>
        </div>
      )}

      {/* Document Import Results - shown only for document repository */}
      {config.isDocumentRepository && docImportResult && !isImportingDocs && (
        <div className="import-validation-summary success">
          <div className="validation-summary-header">
            <span className="validation-icon">✅</span>
            <span className="validation-message">
              {docImportResult.imported} document(s) imported successfully
              {docImportResult.skipped.length > 0 && `, ${docImportResult.skipped.length} file(s) skipped`}
            </span>
          </div>
          
          {/* Show skipped files */}
          {docImportResult.skipped.length > 0 && (
            <div className="skipped-info">
              <h5>ℹ️ Skipped Files:</h5>
              <ul>
                {docImportResult.skipped.map((item, index) => (
                  <li key={index}>
                    <strong>{item.fileName}</strong> - {item.reason === 'duplicate' ? 'already exists' : 'not a PDF file'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Drag and drop overlay */}
      {isDragging && config.isDocumentRepository && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-content">
            <span className="drag-drop-icon">📥</span>
            <span className="drag-drop-text">Drop PDF files here to import</span>
          </div>
        </div>
      )}

      {/* Show parsed data preview with validation status */}
      {parsedData && !isImporting && (
        <div className="import-preview">
          <div className="import-preview-header">
            <h4>📊 Data Preview</h4>
            <span className="import-preview-info">
              {parsedData.totalRows} rows {parsedData.isPreview && '(showing first 10)'}
            </span>
          </div>
          <div className="import-preview-table-container">
            <table className="import-preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  {parsedData.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                  {validationResult && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {parsedData.data.map((row, index) => {
                  const rowNum = index + 2; // +2 because row 1 is headers
                  const rowValidation = validationResult?.rows.find(r => r.row === rowNum);
                  const hasErrors = rowValidation && !rowValidation.valid;
                  return (
                    <tr key={index} className={hasErrors ? 'row-error' : ''}>
                      <td>{index + 1}</td>
                      {parsedData.columns.map((col) => (
                        <td key={col}>{String(row[col] ?? '')}</td>
                      ))}
                      {validationResult && (
                        <td>
                          {isValidating ? (
                            <span className="status-validating">...</span>
                          ) : rowValidation?.valid ? (
                            <span className="status-valid">✓</span>
                          ) : (
                            <span className="status-invalid" title={validationResult.errorsByRow[rowNum]?.join(', ')}>✗</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Show error details */}
          {validationResult && validationResult.invalidRows > 0 && (
            <div className="import-errors">
              <h5>⚠️ Validation Errors:</h5>
              {Object.entries(validationResult.errorsByRow).map(([row, errors]) => (
                <div key={row} className="error-row">
                  <strong>Row {row}:</strong>
                  <ul>
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show upload error */}
      {importError && (
        <div className="notice error">{importError}</div>
      )}

      {message && <div className="notice">{message}</div>}

      {/* Category Management Content - Inventory Categories as Cards */}
      {config.isCategoryManagement ? (
        <>
          {/* Category cards grid */}
          {categoryMessage && (
            <div className={`notice ${categoryMessage.includes('Failed') ? 'notice-error' : 'notice-success'}`}>
              {categoryMessage}
              <button className="notice-close" onClick={() => setCategoryMessage('')}>×</button>
            </div>
          )}

          {categoriesLoading ? (
            <div className="listing-loading">
              <div className="spinner"></div>
              <span>Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="listing-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>{categorySearch ? 'No categories found' : 'No categories yet. Click "Create Category" to add your first category.'}</p>
            </div>
          ) : (
            <div className="category-cards-grid">
              {filteredCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="category-card"
                >
                  <div className="category-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div 
                    className="category-card-content"
                    onClick={() => navigate(`/inventory/${category.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3 className="category-card-name">{category.name}</h3>
                    <div className="category-card-stats">
                      <span className="category-card-stat">
                        <strong>{category.inventoryCount ?? category.subcategories.length}</strong> Inventories
                      </span>
                      <span className="category-card-stat">
                        <strong>{category.subcategoryCount ?? category.subcategories.length}</strong> Subcategories
                      </span>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="category-card-actions">
                      <button 
                        className="btn-icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategoryForm(category);
                        }}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2"/>
                          <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon-sm btn-icon-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryDeleteItem({ item: category, type: 'category' });
                        }}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="category-card-arrow" onClick={() => navigate(`/inventory/${category.id}`)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Regular Module Content */}
          {!config.isDocumentRepository && (
            <section className="grid cards-3">
              <StatCard label="Active" value={String(openCount)} hint="Current working queue" />
              <StatCard label="Tracked" value={String(items.length)} hint="Loaded records" />
              <StatCard label="Risk / Due" value={String(riskCount || dueCount)} hint="Needs review" />
            </section>
          )}

          {/* Document Repository Stats */}
          {config.isDocumentRepository && (
            <section className="grid cards-3">
              <StatCard label="Documents" value={String(items.length)} hint="Uploaded files" />
            </section>
          )}

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  {config.columns.map((column) => {
                    // Add sorting for document repository columns
                    if (config.isDocumentRepository && ['fileName', 'createdAt', 'fileSize'].includes(column.key)) {
                      const isActive = docSortBy === column.key;
                      const nextSortOrder = isActive && docSortOrder === 'asc' ? 'desc' : 'asc';
                      return (
                        <th 
                          key={column.key} 
                          className="sortable-header"
                          onClick={() => {
                            setDocSortBy(column.key as 'fileName' | 'createdAt' | 'fileSize');
                            setDocSortOrder(nextSortOrder);
                            loadComplianceDocuments();
                          }}
                        >
                          {column.label}
                          {isActive && <span className="sort-indicator">{docSortOrder === 'asc' ? ' ↑' : ' ↓'}</span>}
                    </th>
                  );
                }
                return <th key={column.key}>{column.label}</th>;
              })}
              {/* RBAC: Only show Actions column header if there are visible actions */}
              {config.isDocumentRepository && hasAnyPermission([config.permissions.export || "", config.permissions.delete || ""].filter(Boolean)) && <th>Actions</th>}
              {!config.isDocumentRepository && hasAnyPermission([config.permissions.view || "", config.permissions.write || "", config.permissions.create || "", config.permissions.delete || ""].filter(Boolean)) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={String(item.id || index)} onClick={() => {
                // For incidents, inventory, and projects-environments, navigate to detail page instead of opening sidebar
                if (moduleKey === 'incidents' && item.id) {
                  navigate(`/incidents/${item.id}`);
                } else if (moduleKey === 'projects-environments' && item.id) {
                  navigate(`/projects-environments/${item.id}`);
                } else if (!config.isDocumentRepository) {
                  setSelected(item);
                }
              }}>
                {config.columns.map((column) => {
                  // Special handling for role column in users-teams
                  if (moduleKey === 'users-teams' && column.key === 'role') {
                    return <td key={column.key}>{formatUserRoles((item as RecordItem & { roles?: Array<{ role: { name: string } }> }).roles)}</td>;
                  }
                  // Special handling for fileSize in document repository
                  if (config.isDocumentRepository && column.key === 'fileSize') {
                    return <td key={column.key}>{formatFileSize(item[column.key] as number)}</td>;
                  }
                  return <td key={column.key}>{formatValue(item[column.key])}</td>;
                })}
                {/* RBAC: Only show action cells if there are visible actions */}
                {config.isDocumentRepository ? (
                  hasAnyPermission([config.permissions.export || "", config.permissions.delete || ""].filter(Boolean)) && (
                  /* Document Repository Actions */
                  <td>
                    <div className="action-buttons">
                      {hasPermission(config.permissions.export || '') && (
                        <button 
                          className="link-button" 
                          onClick={(event) => {
                            event.stopPropagation();
                            exportDocument(item.id as string);
                          }}
                        >
                          Export
                        </button>
                      )}
                      {hasPermission(config.permissions.delete || '') && (
                        <button 
                          className="btn-delete" 
                          onClick={(event) => openDeleteDocumentDialog(item, event)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                  )
                ) : (
                  hasAnyPermission([
                    config.permissions.view || "",
                    config.permissions.write || "",
                    config.permissions.create || "",
                    config.permissions.delete || ""
                  ].filter(Boolean)) && (
                  /* Regular Module Actions */
                  <td>
                    <div className="action-buttons">
                      {hasPermission((config.permissions.view || config.permissions.create) || '') && (
                        <button className="link-button" onClick={(event) => { 
                          event.stopPropagation(); 
                          // For incidents, inventory, and projects-environments, navigate to detail page instead of opening panel
                          if (moduleKey === 'incidents') {
                            navigate(`/incidents/${item.id}`);
                          } else if (moduleKey === 'projects-environments') {
                            navigate(`/projects-environments/${item.id}`);
                          } else {
                            setSelected(item);
                          }
                        }} title="Open">Open</button>
                      )}
                      {hasPermission(config.permissions.delete || '') && (
                        <button className="btn-delete" onClick={(event) => openDeleteDialog(item, event)} title="Delete">Delete</button>
                      )}
                    </div>
                  </td>
                  )
                )}
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={config.columns.length + 1}>{loading ? 'Loading records...' : config.isDocumentRepository ? 'No documents uploaded yet. Click Upload to add your first document.' : 'No records found.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

      {/* Create/Upload Modal - Different for document repository */}
      {createOpen && (
        <div className="modal-backdrop">
          {config.isDocumentRepository ? (
            /* PDF Document Upload Modal */
            <div className="modal">
              <div className="page-title-row">
                <h3>Upload Compliance Document</h3>
                <button type="button" className="close" onClick={() => { setCreateOpen(false); setPdfFile(null); setPdfUploadError(null); }}>Close</button>
              </div>
              
              <div className="pdf-upload-area">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div className="pdf-drop-zone" onClick={() => pdfInputRef.current?.click()}>
                  {pdfFile ? (
                    <div className="pdf-selected">
                      <span className="pdf-icon">📄</span>
                      <span className="pdf-name">{pdfFile.name}</span>
                      <span className="pdf-size">{formatFileSize(pdfFile.size)}</span>
                    </div>
                  ) : (
                    <div className="pdf-placeholder">
                      <span className="upload-icon">📤</span>
                      <p>Click to select a PDF file</p>
                      <span className="pdf-hint">PDF files only, max 25MB</span>
                    </div>
                  )}
                </div>

                {pdfUploadError && (
                  <div className="notice error">{pdfUploadError}</div>
                )}

                {pdfUploadSuccess && (
                  <div className="notice success">✅ Document uploaded successfully!</div>
                )}

                <div className="pdf-upload-actions">
                  <button 
                    type="button" 
                    className="secondary" 
                    onClick={() => { setCreateOpen(false); setPdfFile(null); setPdfUploadError(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="primary" 
                    onClick={uploadPdfDocument}
                    disabled={!pdfFile || isUploadingPdf}
                  >
                    {isUploadingPdf ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Regular Create Form Modal */
            <form className="modal" onSubmit={createRecord}>
              <div className="page-title-row">
                <h3>Create {title}</h3>
                <button type="button" className="close" onClick={() => setCreateOpen(false)}>Close</button>
              </div>
              {config.fields.map((field) => {
                // Special handling for roleId in users-teams
                if (field.key === 'roleId' && moduleKey === 'users-teams') {
                  return (
                    <label key={field.key}>
                      {field.label}{field.required ? ' *' : ''}
                      <select 
                        value={form[field.key] || ''} 
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} 
                        required={field.required}
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </label>
                  );
                }
                
                return (
                  <label key={field.key}>
                    {field.label}{field.required ? ' *' : ''}
                    {field.type === 'textarea' ? (
                      <textarea value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} />
                    ) : field.type === 'select' ? (
                      <select value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required}>
                        {(field.options || []).map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input type={field.type || 'text'} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} />
                    )}
                  </label>
                );
              })}
              <button className="primary" type="submit">Save</button>
            </form>
          )}
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {showDeleteConfirm && documentToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete Record?</h3>
              <button type="button" className="close" onClick={closeDeleteDocumentDialog}>Close</button>
            </div>
            
            <div className="warning-box">
              <p>Are you sure you want to delete this record?</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteDocumentDialog}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={confirmDeleteDocument}
                disabled={isDeletingDocument}
              >
                {isDeletingDocument ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC: Check if user has any view/create/write permission to see the detail */}
      {selected && hasAnyPermission([
        config.permissions.view || '',
        config.permissions.write || '',
        config.permissions.create || '',
        config.permissions.delete || ''
      ].filter(Boolean)) && (
        <div className="drawer">
          <button className="close" onClick={() => setSelected(null)}>Close</button>
          <span className="eyebrow">{formatValue(selected[config.referenceKey])}</span>
          <h3>{formatValue(selected[config.titleKey])}</h3>
          <div className="record-detail">
            {config.columns.map((column) => {
              // Special handling for role column in users-teams
              if (moduleKey === 'users-teams' && column.key === 'role') {
                return <p key={column.key}><strong>{column.label}:</strong> {formatUserRoles((selected as RecordItem & { roles?: Array<{ role: { name: string } }> }).roles)}</p>;
              }
              return <p key={column.key}><strong>{column.label}:</strong> {formatValue(selected[column.key])}</p>;
            })}
          </div>
          {/* RBAC: Status actions require write permission */}
          {config.statusKey && statusActions.length > 0 && hasAnyPermission([
            config.permissions.write || '',
            config.permissions.create || ''
          ].filter(Boolean)) && (
            <div className="drawer-actions">
              {statusActions.map((action) => (
                <button key={action.value} onClick={() => updateStatus(action.value)}>{action.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* RBAC: Show 403 Unauthorized if user reaches detail without permission */}
      {selected && !hasAnyPermission([
        config.permissions.view || '',
        config.permissions.write || '',
        config.permissions.create || '',
        config.permissions.delete || ''
      ].filter(Boolean)) && (
        <div className="drawer">
          <button className="close" onClick={() => setSelected(null)}>Close</button>
          <div className="unauthorized-content">
            <span className="unauthorized-icon">🔒</span>
            <h3>403 - Unauthorized</h3>
            <p>You do not have permission to view this record.</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && deletingItem && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-title-row">
              <h3>Delete {title}</h3>
              <button type="button" className="close" onClick={closeDeleteDialog}>Close</button>
            </div>
            
            <div className="warning-box">
              <p>Are you sure you want to delete this record?</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="form-group">
              <label>
                Type <strong>DELETE</strong> to confirm:
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
              </label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeDeleteDialog}>
                Cancel
              </button>
              <button 
                type="button" 
                className="danger" 
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {categoryFormOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="page-title-row">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" className="close" onClick={closeCategoryForm}>×</button>
            </div>
            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Hardware"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={categoryForm.status}
                onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeCategoryForm}>Cancel</button>
              <button type="button" className="primary" onClick={saveCategory} disabled={savingCategory || !categoryForm.name.trim()}>
                {savingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Form Modal */}
      {subcategoryFormOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="page-title-row">
              <h3>{editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}</h3>
              <button type="button" className="close" onClick={closeSubcategoryForm}>×</button>
            </div>
            <div className="form-group">
              <label>Subcategory Name *</label>
              <input
                type="text"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                placeholder="e.g., Laptop"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={subcategoryForm.status}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeSubcategoryForm}>Cancel</button>
              <button type="button" className="primary" onClick={saveSubcategory} disabled={savingSubcategory || !subcategoryForm.name.trim()}>
                {savingSubcategory ? 'Saving...' : (editingSubcategory ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation */}
      {categoryDeleteOpen && categoryDeleteItem && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="page-title-row">
              <h3>Delete {categoryDeleteItem.type === 'category' ? 'Category' : 'Subcategory'}?</h3>
              <button type="button" className="close" onClick={closeCategoryDelete}>×</button>
            </div>
            <div className="warning-box">
              <p>Are you sure you want to delete <strong>{categoryDeleteItem.item.name}</strong>?</p>
              {categoryDeleteItem.type === 'category' && (
                <p>This will also delete all subcategories under this category.</p>
              )}
              <p>This action cannot be undone.</p>
            </div>
            <div className="form-group">
              <label>Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={categoryDeleteText}
                onChange={(e) => setCategoryDeleteText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={closeCategoryDelete}>Cancel</button>
              <button type="button" className="danger" onClick={confirmCategoryDelete} disabled={categoryDeleteText !== 'DELETE' || categoryDeleting}>
                {categoryDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
