import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';

type Project = {
  id: string;
  projectName: string;
  projectCode: string;
  client?: string;
  ownerName?: string;
  status: string;
  priority: string;
  department?: string;
  technologyStack?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  projectType?: string;
  projectLocation?: string;
  budget?: number;
  description?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  assignedAssets?: number;
};

type ProjectRow = {
  projectName: string;
  projectCode: string;
  client: string;
  ownerName: string;
  status: string;
  priority: string;
  department: string;
  technologyStack: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string;
  projectType: string;
  projectLocation: string;
  budget: string;
  description: string;
  remarks: string;
};

type ProjectSummary = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHold: number;
  delayed: number;
};

type AssetSummary = {
  totalAssigned: number;
  available: number;
  underRepair: number;
};

type Assignment = {
  id: string;
  inventory: {
    id: string;
    itemNo: string;
    itemName: string;
    status: string;
    category?: { name: string };
    subcategory?: { name: string };
  };
  user?: { id: string; name: string; email: string };
  project?: { id: string; projectName: string; projectCode: string };
  assignedDate: string;
  status: string;
};

export function ProjectDashboardPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectSummary>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHold: 0,
    delayed: 0
  });

  // Asset summary state
  const [assetSummary, setAssetSummary] = useState<AssetSummary>({
    totalAssigned: 0,
    available: 0,
    underRepair: 0
  });

  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [technologyFilter, setTechnologyFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // Unique values for filters
  const [departments, setDepartments] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [managers, setManagers] = useState<string[]>([]);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importValidRows, setImportValidRows] = useState<ProjectRow[]>([]);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    error?: string;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/projects-environments', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          department: departmentFilter || undefined,
          technology: technologyFilter || undefined,
          manager: managerFilter || undefined,
          sortBy,
          sortOrder
        }
      });

      let projectList: Project[] = res.data.items || res.data || [];
      
      // Calculate project summary
      const totalProjects = projectList.length;
      const activeProjects = projectList.filter((p) => p.status === 'ACTIVE').length;
      const completedProjects = projectList.filter((p) => p.status === 'COMPLETED').length;
      const onHold = projectList.filter((p) => p.status === 'ON_HOLD').length;
      const delayed = projectList.filter((p) => p.status === 'DELAYED').length;

      setSummary({
        totalProjects,
        activeProjects,
        completedProjects,
        onHold,
        delayed
      });

      // Extract unique filter values
      setDepartments([...new Set(projectList.map(p => p.department).filter(Boolean))] as string[]);
      setTechnologies([...new Set(projectList.map(p => p.technologyStack).filter(Boolean))] as string[]);
      setManagers([...new Set(projectList.map(p => p.ownerName).filter(Boolean))] as string[]);

      // Fetch assignment counts for each project
      const projectsWithAssets = await Promise.all(
        projectList.map(async (project) => {
          try {
            const assignRes = await api.get('/inventory-assignments', {
              params: { projectId: project.id, status: 'ACTIVE' }
            });
            const assignments: Assignment[] = assignRes.data.assignments || [];
            return {
              ...project,
              assignedAssets: assignments.length
            };
          } catch {
            return { ...project, assignedAssets: 0 };
          }
        })
      );

      setProjects(projectsWithAssets);

      // Calculate asset summary across all projects
      let totalAssigned = 0;
      for (const project of projectsWithAssets) {
        totalAssigned += project.assignedAssets || 0;
      }
      
      // Get global asset counts for reference
      try {
        const allAssignRes = await api.get('/inventory-assignments', {
          params: { status: 'ACTIVE' }
        });
        const allAssignments: Assignment[] = allAssignRes.data.assignments || [];
        const underRepair = allAssignments.filter((a) => a.inventory.status === 'UNDER_REPAIR').length;
        
        // Available = total assigned - under repair (simplified)
        setAssetSummary({
          totalAssigned,
          available: allAssignments.length - totalAssigned,
          underRepair
        });
      } catch {
        setAssetSummary({
          totalAssigned,
          available: 0,
          underRepair: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, priorityFilter, departmentFilter, technologyFilter, managerFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleRefresh = () => {
    fetchProjects(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setDepartmentFilter('');
    setTechnologyFilter('');
    setManagerFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/projects-environments?limit=10000');
      const allProjects = res.data.items || res.data || [];
      
      const exportData = allProjects.map((p: Project) => ({
        'Project Code': p.projectCode,
        'Project Name': p.projectName,
        'Client': p.client || '',
        'Project Manager': p.ownerName || '',
        'Department': p.department || '',
        'Technology Stack': p.technologyStack || '',
        'Status': p.status,
        'Priority': p.priority,
        'Start Date': p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
        'Expected End Date': p.expectedEndDate ? new Date(p.expectedEndDate).toISOString().split('T')[0] : '',
        'Actual End Date': p.actualEndDate ? new Date(p.actualEndDate).toISOString().split('T')[0] : '',
        'Budget': p.budget ? p.budget.toString() : '',
        'Project Type': p.projectType || '',
        'Location': p.projectLocation || '',
        'Description': p.description || '',
        'Remarks': p.remarks || '',
        'Created At': p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
        'Updated At': p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
      
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 30 },
        { wch: 15 }, { wch: 15 }
      ];

      XLSX.writeFile(workbook, `projects-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export projects');
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
    const validRows: ProjectRow[] = [];
    const seenCodes = new Set<string>();

    // Get existing codes from database
    let existingCodes: Set<string> = new Set();
    try {
      const response = await api.get('/projects-environments?limit=1000');
      const projectsData = response.data.items || response.data || [];
      projectsData.forEach((p: Project) => {
        existingCodes.add(p.projectCode.toLowerCase());
      });
    } catch (err) {
      console.error('Failed to fetch existing projects:', err);
    }

    const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'ON_HOLD', 'DELAYED', 'ARCHIVED'];
    const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const PROJECT_TYPES = ['Software Development', 'Infrastructure', 'Research', 'Consulting', 'Maintenance', 'Support', 'Other'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];

      const getField = (name: string) => String(row[name] || '').trim();

      const projectCode = getField('Project Code');
      const projectName = getField('Project Name');
      const client = getField('Client');
      const ownerName = getField('Project Manager');
      const department = getField('Department');
      const technologyStack = getField('Technology Stack');
      const status = getField('Status') || 'ACTIVE';
      const priority = getField('Priority') || 'MEDIUM';
      const startDate = getField('Start Date');
      const expectedEndDate = getField('Expected End Date');
      const actualEndDate = getField('Actual End Date');
      const budget = getField('Budget');
      const projectType = getField('Project Type');
      const projectLocation = getField('Location');
      const description = getField('Description');
      const remarks = getField('Remarks');

      // Validate Project Code
      if (!projectCode) {
        rowErrors.push('Project Code is required');
      } else {
        if (seenCodes.has(projectCode.toLowerCase())) {
          rowErrors.push(`Duplicate Project Code "${projectCode}" in file`);
        }
        if (existingCodes.has(projectCode.toLowerCase())) {
          rowErrors.push(`Project Code "${projectCode}" already exists in database`);
        }
        seenCodes.add(projectCode.toLowerCase());
      }

      // Validate Project Name
      if (!projectName) {
        rowErrors.push('Project Name is required');
      }

      // Validate Status
      if (status && !STATUS_OPTIONS.includes(status)) {
        rowErrors.push(`Invalid status "${status}". Allowed: ${STATUS_OPTIONS.join(', ')}`);
      }

      // Validate Priority
      if (priority && !PRIORITY_OPTIONS.includes(priority)) {
        rowErrors.push(`Invalid priority "${priority}". Allowed: ${PRIORITY_OPTIONS.join(', ')}`);
      }

      // Validate Project Type
      if (projectType && !PROJECT_TYPES.includes(projectType)) {
        rowErrors.push(`Invalid project type "${projectType}". Allowed: ${PROJECT_TYPES.join(', ')}`);
      }

      // Validate Date formats if provided (accept any format)
      if (startDate) {
        const parsed = new Date(startDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Start Date: "${startDate}"`);
        }
      }
      if (expectedEndDate) {
        const parsed = new Date(expectedEndDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Expected End Date: "${expectedEndDate}"`);
        }
      }
      if (actualEndDate) {
        const parsed = new Date(actualEndDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Actual End Date: "${actualEndDate}"`);
        }
      }

      // Validate Budget if provided
      if (budget && isNaN(parseFloat(budget))) {
        rowErrors.push(`Invalid budget value: "${budget}". Must be a number`);
      }

      if (rowErrors.length > 0) {
        errors[i] = rowErrors;
      } else {
        validRows.push({
          projectCode,
          projectName,
          client,
          ownerName,
          department,
          technologyStack,
          status,
          priority,
          startDate,
          expectedEndDate,
          actualEndDate,
          budget,
          projectType,
          projectLocation,
          description,
          remarks
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
            projectCode: row.projectCode,
            projectName: row.projectName,
            client: row.client || undefined,
            ownerName: row.ownerName || undefined,
            department: row.department || undefined,
            technologyStack: row.technologyStack || undefined,
            status: row.status,
            priority: row.priority,
            startDate: row.startDate || undefined,
            expectedEndDate: row.expectedEndDate || undefined,
            actualEndDate: row.actualEndDate || undefined,
            budget: row.budget ? parseFloat(row.budget) : undefined,
            projectType: row.projectType || undefined,
            projectLocation: row.projectLocation || undefined,
            description: row.description || undefined,
            remarks: row.remarks || undefined
          };

          await api.post('/projects-environments', payload);
          success++;
        } catch (err: any) {
          console.error('Failed to import project:', row.projectCode, err);
          failed++;
        }
      }

      setImportResult({ success, failed, skipped: 0 });
      
      if (success > 0) {
        fetchProjects();
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
    
    // Refresh projects list after closing modal
    fetchProjects();
  }

  function downloadValidationReport() {
    const errorData: any[][] = [['Row', 'Field', 'Error']];
    Object.entries(importErrors).forEach(([rowIdx, errors]) => {
      const row = importData[parseInt(rowIdx)];
      const projectCode = row?.['Project Code'] || 'N/A';
      errors.forEach(error => {
        errorData.push([`${parseInt(rowIdx) + 2} (${projectCode})`, '', error]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'import-validation-report.xlsx');
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasActiveFilters = search || statusFilter || priorityFilter || departmentFilter || technologyFilter || managerFilter;

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Projects & Environments</p>
            <h1>Project Dashboard</h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="project-summary-cards">
          <div className="project-summary-card" onClick={() => { setStatusFilter(''); fetchProjects(); }}>
            <div className="project-summary-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Total Projects</span>
              <span className="project-summary-value">{loading ? '...' : summary.totalProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('ACTIVE'); fetchProjects(); }}>
            <div className="project-summary-icon active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12H2M5.45 5.11L2 12V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V12L18.55 5.11C18.3844 4.77678 18.1293 4.49617 17.8141 4.30017C17.4988 4.10416 17.1354 4.00001 16.765 4H7.24C6.86957 4.00001 6.50622 4.10416 6.19097 4.30017C5.87573 4.49617 5.62064 4.77678 5.45 5.11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Active Projects</span>
              <span className="project-summary-value">{loading ? '...' : summary.activeProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('COMPLETED'); fetchProjects(); }}>
            <div className="project-summary-icon completed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Completed</span>
              <span className="project-summary-value">{loading ? '...' : summary.completedProjects}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('ON_HOLD'); fetchProjects(); }}>
            <div className="project-summary-icon onhold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 15V9M18 10C18 13.866 14.4183 17 10 17C5.58172 17 2 13.866 2 10C2 6.13401 5.58172 3 10 3C14.4183 3 18 6.13401 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">On Hold</span>
              <span className="project-summary-value">{loading ? '...' : summary.onHold}</span>
            </div>
          </div>

          <div className="project-summary-card" onClick={() => { setStatusFilter('DELAYED'); fetchProjects(); }}>
            <div className="project-summary-icon delayed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 7V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 3L12 5L14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Delayed</span>
              <span className="project-summary-value">{loading ? '...' : summary.delayed}</span>
            </div>
          </div>
        </div>

        {/* Asset Summary Cards */}
        <div className="project-summary-cards">
          <div className="project-summary-card asset">
            <div className="project-summary-icon assigned">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Assigned Assets</span>
              <span className="project-summary-value">{loading ? '...' : assetSummary.totalAssigned}</span>
            </div>
          </div>

          <div className="project-summary-card asset">
            <div className="project-summary-icon available">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Available Assets</span>
              <span className="project-summary-value">{loading ? '...' : assetSummary.available}</span>
            </div>
          </div>

          <div className="project-summary-card asset">
            <div className="project-summary-icon repair">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6.006 6.006 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6.006 6.006 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="project-summary-content">
              <span className="project-summary-label">Assets Under Repair</span>
              <span className="project-summary-value">{loading ? '...' : assetSummary.underRepair}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, code, client, manager, technology..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button
              type="button"
              className={`toolbar-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>

            <div className="sort-dropdown">
              <button type="button" className="toolbar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sort
              </button>
              <div className="sort-dropdown-content">
                <button className={sortBy === 'createdAt' && sortOrder === 'desc' ? 'active' : ''} onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}>
                  Newest {sortBy === 'createdAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'createdAt' && sortOrder === 'asc' ? 'active' : ''} onClick={() => { setSortBy('createdAt'); setSortOrder('asc'); }}>
                  Oldest {sortBy === 'createdAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'projectName' ? 'active' : ''} onClick={() => handleSort('projectName')}>
                  Name {sortBy === 'projectName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'startDate' ? 'active' : ''} onClick={() => handleSort('startDate')}>
                  Start Date {sortBy === 'startDate' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'expectedEndDate' ? 'active' : ''} onClick={() => handleSort('expectedEndDate')}>
                  End Date {sortBy === 'expectedEndDate' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button className={sortBy === 'priority' ? 'active' : ''} onClick={() => handleSort('priority')}>
                  Priority {sortBy === 'priority' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={refreshing ? 'spin' : ''}>
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            {(isSuperAdmin || isAdmin) && (
              <button type="button" className="toolbar-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Export
              </button>
            )}

            {isSuperAdmin && (
              <>
                <button type="button" className="toolbar-btn" onClick={handleImportClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Import
                </button>

                <button type="button" className="toolbar-btn primary" onClick={() => navigate('/projects-environments/create')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Priority</label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Department</label>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Technology</label>
                <select value={technologyFilter} onChange={(e) => setTechnologyFilter(e.target.value)}>
                  <option value="">All Technologies</option>
                  {technologies.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Project Manager</label>
                <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
                  <option value="">All Managers</option>
                  {managers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="filters-actions">
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={() => fetchProjects()}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Projects Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Projects</h3>
            <span className="table-count">{projects.length} items</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 && !hasActiveFilters ? (
            <div className="table-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No Projects Available</p>
              {isSuperAdmin && (
                <button type="button" className="primary" onClick={() => navigate('/projects-environments/create')}>
                  Create Project
                </button>
              )}
            </div>
          ) : projects.length === 0 ? (
            <div className="table-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No projects match your filters</p>
              <button type="button" className="secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project Code</th>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Project Manager</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Department</th>
                    <th>Start Date</th>
                    <th>Assigned Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} onClick={() => navigate(`/projects-environments/${project.id}`)}>
                      <td className="project-code">{project.projectCode}</td>
                      <td className="project-name">{project.projectName}</td>
                      <td>{project.client || '-'}</td>
                      <td>{project.ownerName || '-'}</td>
                      <td>
                        <span className={`status-badge status-${project.status.toLowerCase().replace('_', '_')}`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td>{project.department || '-'}</td>
                      <td>{formatDate(project.startDate)}</td>
                      <td>
                        <span className="asset-count-badge">
                          {project.assignedAssets || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
          <div className="modal-overlay" onClick={closeImportModal}>
            <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Import Projects</h3>
                <button className="modal-close" onClick={closeImportModal}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>

              <div className="modal-body">
                {!importResult && (
                  <div className="import-content">
                    {importFile && (
                      <div className="import-file-info">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 15L12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span>{importFile.name}</span>
                      </div>
                    )}

                    {importFile && !importProcessing && (
                      <div className="import-stats">
                        <div className="import-stat">
                          <span className="value">{importData.length}</span>
                          <span className="label">Total Rows</span>
                        </div>
                        <div className="import-stat">
                          <span className="value success">{importValidRows.length}</span>
                          <span className="label">Valid</span>
                        </div>
                        <div className="import-stat">
                          <span className="value danger">{Object.keys(importErrors).length}</span>
                          <span className="label">Invalid</span>
                        </div>
                      </div>
                    )}

                    {importFile && !importProcessing && (
                      <div className="import-preview">
                        <h4>Preview</h4>
                        <div className="import-preview-table-wrapper">
                          <table className="import-preview-table">
                            <thead>
                              <tr>
                                <th>Row</th>
                                <th>Project Code</th>
                                <th>Project Name</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Valid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 10).map((row, idx) => {
                                const hasError = importErrors[idx];
                                return (
                                  <tr key={idx} className={hasError ? 'invalid-row' : 'valid-row'}>
                                    <td>{idx + 2}</td>
                                    <td>{row['Project Code'] || '-'}</td>
                                    <td>{row['Project Name'] || '-'}</td>
                                    <td>{row['Status'] || '-'}</td>
                                    <td>{row['Priority'] || '-'}</td>
                                    <td>
                                      {hasError ? (
                                        <span className="badge badge-danger">Invalid</span>
                                      ) : (
                                        <span className="badge badge-success">Valid</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {importData.length > 10 && (
                          <p className="import-preview-note">Showing first 10 of {importData.length} rows</p>
                        )}
                      </div>
                    )}

                    {Object.keys(importErrors).length > 0 && (
                      <div className="import-errors">
                        <h4>Validation Errors</h4>
                        <div className="import-errors-list">
                          {Object.entries(importErrors).slice(0, 5).map(([rowIdx, errors]) => {
                            const row = importData[parseInt(rowIdx)];
                            const projectCode = row?.['Project Code'] || 'N/A';
                            return (
                              <div key={rowIdx} className="import-error-item">
                                <strong>Row {parseInt(rowIdx) + 2} ({projectCode}):</strong>
                                <ul>
                                  {errors.map((error, eIdx) => (
                                    <li key={eIdx}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                          {Object.keys(importErrors).length > 5 && (
                            <p className="import-errors-note">
                              And {Object.keys(importErrors).length - 5} more errors.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {importProcessing && (
                      <div className="import-loading">
                        <div className="loading-spinner"></div>
                        <p>Validating data...</p>
                      </div>
                    )}
                  </div>
                )}

                {importResult && !importResult.error && (
                  <div className="import-result">
                    <div className="import-result-icon success">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
                    </div>
                    <h3>Import Complete</h3>
                    <div className="import-result-stats">
                      <div className="import-result-stat">
                        <span className="value success">{importResult.success}</span>
                        <span className="label">Imported</span>
                      </div>
                      <div className="import-result-stat">
                        <span className="value danger">{importResult.failed}</span>
                        <span className="label">Failed</span>
                      </div>
                    </div>
                  </div>
                )}

                {importResult?.error && (
                  <div className="import-result">
                    <div className="import-result-icon error">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <h3>Import Failed</h3>
                    <p className="import-result-note">{importResult.error}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {!importResult && (
                  <>
                    {Object.keys(importErrors).length > 0 && (
                      <button className="secondary" onClick={downloadValidationReport}>
                        Download Report
                      </button>
                    )}
                    <div style={{ flex: 1 }}></div>
                    <button className="secondary" onClick={closeImportModal}>Cancel</button>
                    <button 
                      className="primary" 
                      onClick={handleImportConfirm}
                      disabled={importProcessing || importValidRows.length === 0}
                    >
                      {importProcessing ? 'Importing...' : `Import ${importValidRows.length} Projects`}
                    </button>
                  </>
                )}
                {importResult && (
                  <button className="primary" onClick={closeImportModal}>Done</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
