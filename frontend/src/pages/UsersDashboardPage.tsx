import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';
import { Edit2, Trash2, Plus, Users, CircleCheck, XCircle, Shield, Monitor } from 'lucide-react';
import {
  PageHeader,
  TableContainer,
  SortHeader,
  TableRow,
  TableCell
} from '../components/serviceRequests';
import { SummaryCards } from '../components/common/SummaryCards';

const DEPARTMENTS = ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'];
const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Intern', 'Consultant'];
const STATUS_VALUES = ['ACTIVE', 'INACTIVE'];

type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  status: string;
  createdAt: string;
  employeeId?: string;
  roles: { role: { id: string; name: string } }[];
};

type Role = {
  id: string;
  name: string;
};

type UserSummary = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  managers: number;
  employees: number;
};

type UserRow = {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  designation: string;
  role: string;
  reportingManager: string;
  employmentType: string;
  joiningDate: string;
  status: string;
  address: string;
  remarks: string;
};

export function UsersDashboardPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const canCreate = isSuperAdmin;
  const canExport = isSuperAdmin || isAdmin;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; user: User | null }>({ show: false, user: null });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importValidRows, setImportValidRows] = useState<UserRow[]>([]);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    error?: string;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Debug effect
  useEffect(() => {
    console.log('Import state changed:', {
      importDataLength: importData.length,
      importValidRowsLength: importValidRows.length,
      importErrorsKeys: Object.keys(importErrors).length,
      importProcessing
    });
  }, [importData, importValidRows, importErrors, importProcessing]);

  // Summary state
  const [summary, setSummary] = useState<UserSummary>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
    managers: 0,
    employees: 0
  });

  // Summary cards data for Users Dashboard
  const summaryCards = useMemo(() => [
    {
      icon: Users,
      iconBgColor: 'bg-gradient-to-br from-slate-100 to-slate-50',
      iconColor: 'text-slate-600',
      value: loading ? '...' : summary.totalUsers,
      label: 'Total Users',
      onClick: () => { setStatusFilter(''); fetchUsers(); }
    },
    {
      icon: CircleCheck,
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconColor: 'text-emerald-600',
      value: loading ? '...' : summary.activeUsers,
      label: 'Active Users',
      onClick: () => { setStatusFilter('ACTIVE'); fetchUsers(); }
    },
    {
      icon: XCircle,
      iconBgColor: 'bg-gradient-to-br from-red-100 to-red-50',
      iconColor: 'text-red-600',
      value: loading ? '...' : summary.inactiveUsers,
      label: 'Inactive Users',
      onClick: () => { setStatusFilter('INACTIVE'); fetchUsers(); }
    },
    {
      icon: Shield,
      iconBgColor: 'bg-gradient-to-br from-purple-100 to-purple-50',
      iconColor: 'text-purple-600',
      value: loading ? '...' : summary.admins,
      label: 'Administrators'
    },
    {
      icon: Monitor,
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      value: loading ? '...' : summary.managers,
      label: 'Managers'
    }
  ], [summary, loading]);

  // Unique values
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/users-teams', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          department: departmentFilter || undefined,
          role: roleFilter || undefined,
          sortBy,
          sortOrder
        }
      });

      let userList: User[] = res.data.items || res.data || [];
      
      // Calculate summary
      const totalUsers = userList.length;
      const activeUsers = userList.filter(u => u.status === 'ACTIVE').length;
      const inactiveUsers = userList.filter(u => u.status === 'INACTIVE').length;
      
      let admins = 0, managers = 0, employees = 0;
      userList.forEach(u => {
        const roleNames = u.roles?.map(r => r.role?.name) || [];
        if (roleNames.includes('Super Admin')) admins++;
        else if (roleNames.includes('Admin')) admins++;
        else if (roleNames.includes('Manager')) managers++;
        else employees++;
      });

      setSummary({
        totalUsers,
        activeUsers,
        inactiveUsers,
        admins,
        managers,
        employees
      });

      // Extract unique departments
      setDepartments([...new Set(userList.map(u => u.department).filter(Boolean))] as string[]);

      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, departmentFilter, roleFilter, sortBy, sortOrder]);

  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const res = await api.get('/roles');
      setRoles(res.data.items || res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

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
        // Call validation and wait for it to complete
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
    const validRows: UserRow[] = [];
    const seenEmails = new Set<string>();
    const seenEmployeeIds = new Set<string>();

    console.log('Starting validation for', data.length, 'rows');

    // Get existing emails from database
    let existingEmails: Set<string> = new Set();
    try {
      const response = await api.get('/users-teams', { params: { limit: 1000 } });
      const users = response.data.items || response.data || [];
      users.forEach((u: any) => existingEmails.add(u.email.toLowerCase()));
      console.log('Loaded', existingEmails.size, 'existing emails');
    } catch (err) {
      console.error('Failed to fetch existing users:', err);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];

      // Simplified field getter that checks multiple possible column names
      const getField = (...names: string[]) => {
        for (const name of names) {
          if (row[name] !== undefined && row[name] !== '') {
            return String(row[name]).trim();
          }
        }
        return '';
      };

      const employeeId = getField('Employee ID', 'EmployeeID', 'employeeId', 'employee_id');
      const firstName = getField('First Name', 'FirstName', 'firstName', 'first_name');
      const lastName = getField('Last Name', 'LastName', 'lastName', 'last_name');
      const email = getField('Email', 'email');
      const phoneNumber = getField('Phone Number', 'PhoneNumber', 'phoneNumber', 'phone_number');
      const department = getField('Department', 'department');
      const designation = getField('Designation', 'designation');
      const role = getField('Role', 'role');
      const reportingManager = getField('Reporting Manager', 'ReportingManager', 'reportingManager', 'reporting_manager');
      const employmentType = getField('Employment Type', 'EmploymentType', 'employmentType', 'employment_type');
      const joiningDate = getField('Joining Date', 'JoiningDate', 'dateJoined', 'date_joined');
      const status = getField('Status', 'status') || 'ACTIVE';
      const address = getField('Address', 'address');
      const remarks = getField('Remarks', 'remarks');

      // Validate Employee ID
      if (!employeeId) {
        rowErrors.push('Employee ID is required');
      } else {
        if (seenEmployeeIds.has(employeeId.toLowerCase())) {
          rowErrors.push(`Duplicate Employee ID "${employeeId}" in file`);
        }
        seenEmployeeIds.add(employeeId.toLowerCase());
      }

      // Validate First Name
      if (!firstName) {
        rowErrors.push('First Name is required');
      }

      // Validate Last Name
      if (!lastName) {
        rowErrors.push('Last Name is required');
      }

      // Validate Email
      if (!email) {
        rowErrors.push('Email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          rowErrors.push(`Invalid email format: "${email}"`);
        } else if (seenEmails.has(email.toLowerCase())) {
          rowErrors.push(`Duplicate email "${email}" in file`);
        } else if (existingEmails.has(email.toLowerCase())) {
          rowErrors.push(`Email "${email}" already exists in database`);
        }
        seenEmails.add(email.toLowerCase());
      }

      // Validate Department (optional but must be valid if provided)
      if (department && !DEPARTMENTS.map(d => d.toLowerCase()).includes(department.toLowerCase())) {
        rowErrors.push(`Invalid department "${department}". Allowed: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate Role (required)
      if (!role) {
        rowErrors.push('Role is required');
      } else {
        const roleExists = roles.some(r => r.name.toLowerCase() === role.toLowerCase());
        if (!roleExists) {
          rowErrors.push(`Role "${role}" does not exist. Available roles: ${roles.map(r => r.name).join(', ')}`);
        }
      }

      // Validate Designation (optional)
      // No validation needed for optional fields

      // Validate Joining Date (optional, accept any date format)
      if (joiningDate) {
        const parsedDate = new Date(joiningDate);
        if (isNaN(parsedDate.getTime())) {
          rowErrors.push(`Invalid Joining Date: "${joiningDate}"`);
        }
      }

      // Validate Employment Type (optional but must be valid if provided)
      if (employmentType && !EMPLOYMENT_TYPES.includes(employmentType)) {
        rowErrors.push(`Invalid Employment Type "${employmentType}". Allowed: ${EMPLOYMENT_TYPES.join(', ')}`);
      }

      // Validate Status
      if (status && !STATUS_VALUES.includes(status)) {
        rowErrors.push(`Invalid Status "${status}". Allowed: ${STATUS_VALUES.join(', ')}`);
      }

      // Validate Phone
      if (phoneNumber) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phoneNumber)) {
          rowErrors.push(`Invalid phone format: "${phoneNumber}"`);
        }
      }

      if (rowErrors.length > 0) {
        errors[i] = rowErrors;
      } else {
        validRows.push({
          employeeId,
          firstName,
          lastName,
          email,
          phoneNumber,
          department,
          designation,
          role,
          reportingManager,
          employmentType,
          joiningDate,
          status: status || 'ACTIVE',
          address,
          remarks
        });
      }
    }

    console.log('Validation complete:', validRows.length, 'valid,', Object.keys(errors).length, 'invalid');
    setImportErrors(errors);
    setImportValidRows(validRows);
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Promise.resolve();
  }

  async function handleImportConfirm() {
    if (importValidRows.length === 0) return;

    setImportProcessing(true);
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (const row of importValidRows) {
        try {
          const role = roles.find(r => r.name.toLowerCase() === row.role.toLowerCase());
          if (!role) {
            failed++;
            continue;
          }

          const payload = {
            name: `${row.firstName} ${row.lastName}`.trim(),
            email: row.email,
            employeeId: row.employeeId,
            phoneNumber: row.phoneNumber || undefined,
            department: row.department,
            designation: row.designation,
            roleId: role.id,
            employmentType: row.employmentType,
            dateJoined: row.joiningDate,
            status: row.status || 'ACTIVE',
            address: row.address || undefined,
            remarks: row.remarks || undefined
          };

          await api.post('/users-teams', payload);
          success++;
        } catch (err: any) {
          console.error('Failed to import user:', row.email, err);
          failed++;
        }
      }

      setImportResult({ success, failed, skipped });
      
      // Refresh users list after successful import
      if (success > 0) {
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setImportResult({
        success,
        failed,
        skipped,
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
    
    // Refresh users list after closing modal
    fetchUsers();
  }

  function downloadValidationReport() {
    const errorData: any[][] = [['Row', 'Field', 'Error']];
    Object.entries(importErrors).forEach(([rowIdx, errors]) => {
      const row = importData[parseInt(rowIdx)];
      const employeeId = row?.['Employee ID'] || row?.['EmployeeID'] || 'N/A';
      errors.forEach(error => {
        errorData.push([`${parseInt(rowIdx) + 2} (${employeeId})`, '', error]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'import-validation-report.xlsx');
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRefresh = () => {
    fetchUsers(true);
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
    setSearchInput('');
    setStatusFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleExport = async () => {
    try {
      // Prepare export data with all user fields
      const exportData = users.map((user) => {
        const nameParts = user.name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          'Employee ID': user.employeeId || '',
          'First Name': firstName,
          'Last Name': lastName,
          'Email': user.email || '',
          'Phone Number': user.phoneNumber || '',
          'Department': user.department || '',
          'Designation': (user as any).designation || '',
          'Role': user.roles?.[0]?.role?.name || '',
          'Reporting Manager': (user as any).reportingManager || '',
          'Employment Type': (user as any).employmentType || '',
          'Joining Date': (user as any).dateJoined ? new Date((user as any).dateJoined).toISOString().split('T')[0] : '',
          'Status': user.status || '',
          'Address': (user as any).address || '',
          'Remarks': (user as any).remarks || ''
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Employee ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Department
        { wch: 20 }, // Designation
        { wch: 15 }, // Role
        { wch: 20 }, // Reporting Manager
        { wch: 15 }, // Employment Type
        { wch: 15 }, // Joining Date
        { wch: 12 }, // Status
        { wch: 30 }, // Address
        { wch: 30 }, // Remarks
      ];

      // Download Excel file
      XLSX.writeFile(workbook, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    
    // Prevent self-deletion
    if (deleteDialog.user.id === user?.id) {
      setDeleteError('You cannot delete your own account.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await api.delete(`/users-teams/${deleteDialog.user.id}`);
      setDeleteDialog({ show: false, user: null });
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeClass = (roleName: string): string => {
    if (roleName === 'Super Admin') return 'role-super-admin';
    if (roleName === 'Admin') return 'role-admin';
    if (roleName === 'Manager') return 'role-manager';
    return 'role-employee';
  };

  const hasActiveFilters = search || statusFilter || departmentFilter || roleFilter;

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply search
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.department?.toLowerCase().includes(searchLower) ||
        u.roles?.some(r => r.role?.name?.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [users, searchInput]);

  return (
    <div className="workspace">
      <div className="page-stack users-dashboard">
        {/* Header */}
        <PageHeader
          title="Users Dashboard"
          subtitle="Add users."
          icon={Plus}
          actions={
            canCreate && (
              <button
                onClick={() => navigate('/users-teams/create')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            )
          }
        />

        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

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
                placeholder="Search by name, email, department..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filters
            </button>

            <button type="button" className="toolbar-btn" onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            {canExport && (
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
              <button type="button" className="toolbar-btn" onClick={handleImportClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Import
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-row">
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
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
                <label>Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={`${sortBy}_${sortOrder}`} onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <option value="createdAt_desc">Newest First</option>
                  <option value="createdAt_asc">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="department_asc">Department (A-Z)</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="filters-actions">
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Users</h3>
            <span className="table-count">{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 && !hasActiveFilters ? (
            <div className="table-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No users found.</p>
              {canCreate && (
                <button type="button" className="primary" onClick={() => navigate('/users-teams/create')}>
                  Create User
                </button>
              )}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="table-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No users match your filters</p>
              <button type="button" className="secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <TableContainer loading={false} empty={filteredUsers.length === 0} emptyTitle="No users found" emptyDescription="Try adjusting your filters or add new users">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortHeader label="User" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Employee ID" sortKey="employeeId" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Department" sortKey="department" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Role" sortKey="role" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Created" sortKey="createdAt" currentSort={sortConfig} onSort={handleSort} />
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const primaryRole = u.roles?.[0]?.role?.name || 'Employee';
                    const isOwnAccount = u.id === user?.id;
                    return (
                      <TableRow key={u.id} onClick={() => navigate(`/users-teams/${u.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{u.name}</span>
                              <span className="text-xs text-slate-500">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 font-mono">{u.employeeId || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{u.department || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            primaryRole === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                            primaryRole === 'Admin' ? 'bg-blue-100 text-blue-700' :
                            primaryRole === 'Manager' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {primaryRole}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">{formatDate(u.createdAt)}</span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {(isSuperAdmin || isAdmin) && (
                              <button
                                className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                onClick={() => navigate(`/users-teams/${u.id}/edit`)}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => setDeleteDialog({ show: true, user: u })}
                                disabled={isOwnAccount}
                                title={isOwnAccount ? 'You cannot delete your own account' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </table>
            </TableContainer>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialog.show && (
          <div className="modal-overlay" onClick={() => setDeleteDialog({ show: false, user: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{deleteDialog.user?.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              {deleteError && <div className="alert alert-error">{deleteError}</div>}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteDialog({ show: false, user: null })}>
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleDeleteUser} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Import Users</h3>
                <button className="modal-close" onClick={closeImportModal}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                {/* File Selection / Preview */}
                {!importResult && (
                  <div className="import-content">
                    {importFile && (
                      <div className="import-file-info">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M9 15L12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{importFile.name}</span>
                        {!importProcessing && Object.keys(importErrors).length === 0 && importValidRows.length > 0 && (
                          <span className="badge badge-success">Valid</span>
                        )}
                      </div>
                    )}

                    {importProcessing && !importFile && (
                      <div className="import-loading">
                        <div className="loading-spinner"></div>
                        <p>Processing file...</p>
                      </div>
                    )}

                    {/* Validation Stats */}
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

                    {/* Preview Table */}
                    {importFile && !importProcessing && (
                      <div className="import-preview">
                        <h4>Preview</h4>
                        <div className="import-preview-table-wrapper">
                          <table className="import-preview-table">
                            <thead>
                              <tr>
                                <th>Row</th>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Valid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 10).map((row, idx) => {
                                const hasError = importErrors[idx];
                                const firstName = row['First Name'] || row['FirstName'] || row['firstName'] || '';
                                const lastName = row['Last Name'] || row['LastName'] || row['lastName'] || '';
                                return (
                                  <tr key={idx} className={hasError ? 'invalid-row' : 'valid-row'}>
                                    <td>{idx + 2}</td>
                                    <td>{row['Employee ID'] || row['EmployeeID'] || '-'}</td>
                                    <td>{firstName} {lastName}</td>
                                    <td>{row['Email'] || '-'}</td>
                                    <td>{row['Department'] || '-'}</td>
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

                    {/* Invalid Rows Detail */}
                    {Object.keys(importErrors).length > 0 && (
                      <div className="import-errors">
                        <h4>Validation Errors</h4>
                        <div className="import-errors-list">
                          {Object.entries(importErrors).slice(0, 10).map(([rowIdx, errors]) => {
                            const row = importData[parseInt(rowIdx)];
                            const employeeId = row?.['Employee ID'] || row?.['EmployeeID'] || 'N/A';
                            return (
                              <div key={rowIdx} className="import-error-item">
                                <strong>Row {parseInt(rowIdx) + 2} ({employeeId}):</strong>
                                <ul>
                                  {errors.map((error, eIdx) => (
                                    <li key={eIdx}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                          {Object.keys(importErrors).length > 10 && (
                            <p className="import-errors-note">
                              And {Object.keys(importErrors).length - 10} more errors. Download the validation report for full details.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Import Result */}
                {importResult && !importResult.error && (
                  <div className="import-result">
                    {importResult.failed === 0 ? (
                      <div className="import-result-icon success">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="import-result-icon partial">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="16" r="1" fill="currentColor"/>
                        </svg>
                      </div>
                    )}
                    <h3>Import Complete</h3>
                    <div className="import-result-stats">
                      <div className="import-result-stat">
                        <span className="value success">{importResult.success}</span>
                        <span className="label">Imported</span>
                      </div>
                      <div className="import-result-stat">
                        <span className="value warning">{importResult.skipped}</span>
                        <span className="label">Skipped</span>
                      </div>
                      <div className="import-result-stat">
                        <span className="value danger">{importResult.failed}</span>
                        <span className="label">Failed</span>
                      </div>
                    </div>
                    
                    {importResult.failed > 0 && (
                      <p className="import-result-note">
                        {importResult.failed} item(s) could not be imported due to errors.
                      </p>
                    )}
                  </div>
                )}

                {/* Import Error */}
                {importResult?.error && (
                  <div className="import-result">
                    <div className="import-result-icon error">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3>Import Failed</h3>
                    <p className="import-result-note">{importResult.error}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {/* Debug: show state */}
                <span style={{ fontSize: '11px', color: '#999', marginRight: '8px' }}>
                  {importValidRows.length} valid / {importData.length} total
                </span>
                {/* Before import result */}
                {!importResult && (
                  <>
                    {Object.keys(importErrors).length > 0 && (
                      <button className="secondary" onClick={downloadValidationReport}>
                        Download Report
                      </button>
                    )}
                    <div style={{ flex: 1 }}></div>
                    <button className="secondary" onClick={closeImportModal}>
                      Cancel
                    </button>
                    <button 
                      className="primary" 
                      onClick={handleImportConfirm}
                      disabled={importProcessing || importValidRows.length === 0}
                    >
                      {importProcessing ? 'Importing...' : `Import ${importValidRows.length} Users`}
                    </button>
                  </>
                )}
                {/* After import result */}
                {importResult && (
                  <button className="primary" onClick={closeImportModal}>
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
