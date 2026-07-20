import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';

const DEPARTMENTS = ['Engineering', 'Support', 'QA', 'DevOps', 'HR', 'Finance', 'Operations', 'Security', 'InfraOps'];
const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Intern', 'Consultant'];
const STATUS_VALUES = ['ACTIVE', 'INACTIVE'];

type Role = {
  id: string;
  name: string;
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

export function UsersImportExportPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const isAdmin = !isSuperAdmin;

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

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Export state
  const [exporting, setExporting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Fetch roles for validation
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.items || response.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handle Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all users with high limit to get all records
      const response = await api.get('/users-teams', { params: { limit: 50000 } });
      const users = response.data.items || response.data || [];

      // Prepare export data
      const exportData = users.map((user: any) => {
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
          'Designation': user.designation || '',
          'Role': user.roles?.[0]?.role?.name || '',
          'Reporting Manager': user.reportingManager || '',
          'Employment Type': user.employmentType || '',
          'Joining Date': user.dateJoined ? new Date(user.dateJoined).toISOString().split('T')[0] : '',
          'Status': user.status || '',
          'Address': user.address || '',
          'Remarks': user.remarks || ''
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

      // Download
      XLSX.writeFile(workbook, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export users. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle Import file selection
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
        validateImportData(jsonData);
      } catch (err) {
        alert('Failed to parse Excel file');
        setShowImportModal(false);
      }
      setImportProcessing(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  // Validate import data
  async function validateImportData(data: any[]) {
    const errors: Record<number, string[]> = {};
    const validRows: UserRow[] = [];
    const seenEmails = new Set<string>();
    const seenEmployeeIds = new Set<string>();

    // Get existing emails from database
    let existingEmails: Set<string> = new Set();
    try {
      const response = await api.get('/users-teams', { params: { limit: 1000 } });
      const users = response.data.items || response.data || [];
      users.forEach((u: any) => existingEmails.add(u.email.toLowerCase()));
    } catch (err) {
      console.error('Failed to fetch existing users:', err);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];

      // Normalize field names (handle both with and without spaces)
      const getField = (name1: string, name2: string) => 
        row[name1] || row[name2] || '';

      const employeeId = getField('Employee ID', 'EmployeeID') || getField('employeeId', 'employee_id') || '';
      const firstName = getField('First Name', 'FirstName') || getField('firstName', 'first_name') || '';
      const lastName = getField('Last Name', 'LastName') || getField('lastName', 'last_name') || '';
      const email = getField('Email', 'email') || '';
      const phoneNumber = getField('Phone Number', 'PhoneNumber') || getField('phoneNumber', 'phone_number') || '';
      const department = getField('Department', 'department') || '';
      const designation = getField('Designation', 'designation') || '';
      const role = getField('Role', 'role') || '';
      const reportingManager = getField('Reporting Manager', 'ReportingManager') || getField('reportingManager', 'reporting_manager') || '';
      const employmentType = getField('Employment Type', 'EmploymentType') || getField('employmentType', 'employment_type') || '';
      const joiningDate = getField('Joining Date', 'JoiningDate') || getField('dateJoined', 'date_joined') || '';
      const status = getField('Status', 'status') || 'ACTIVE';
      const address = getField('Address', 'address') || '';
      const remarks = getField('Remarks', 'remarks') || '';

      // Validate Employee ID (Required, Unique in file, Unique in DB)
      if (!employeeId) {
        rowErrors.push('Employee ID is required');
      } else {
        if (seenEmployeeIds.has(employeeId.toLowerCase())) {
          rowErrors.push(`Duplicate Employee ID "${employeeId}" in file`);
        }
        seenEmployeeIds.add(employeeId.toLowerCase());
      }

      // Validate First Name (Required)
      if (!firstName) {
        rowErrors.push('First Name is required');
      }

      // Validate Last Name (Required)
      if (!lastName) {
        rowErrors.push('Last Name is required');
      }

      // Validate Email (Required, Valid, Unique)
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

      // Validate Department (Required, Must exist)
      if (!department) {
        rowErrors.push('Department is required');
      } else if (!DEPARTMENTS.includes(department)) {
        rowErrors.push(`Invalid department "${department}". Allowed: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate Role (Required, Must exist)
      if (!role) {
        rowErrors.push('Role is required');
      } else {
        const roleExists = roles.some(r => r.name.toLowerCase() === role.toLowerCase());
        if (!roleExists) {
          rowErrors.push(`Role "${role}" does not exist. Available roles: ${roles.map(r => r.name).join(', ')}`);
        }
      }

      // Validate Designation (Required)
      if (!designation) {
        rowErrors.push('Designation is required');
      }

      // Validate Joining Date (Required, Valid date)
      if (!joiningDate) {
        rowErrors.push('Joining Date is required');
      } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(joiningDate)) {
          rowErrors.push(`Invalid date format for Joining Date: "${joiningDate}". Use YYYY-MM-DD`);
        } else {
          const parsedDate = new Date(joiningDate);
          if (isNaN(parsedDate.getTime())) {
            rowErrors.push(`Invalid date: "${joiningDate}"`);
          }
        }
      }

      // Validate Employment Type (Required, Allowed values)
      if (!employmentType) {
        rowErrors.push('Employment Type is required');
      } else if (!EMPLOYMENT_TYPES.includes(employmentType)) {
        rowErrors.push(`Invalid Employment Type "${employmentType}". Allowed: ${EMPLOYMENT_TYPES.join(', ')}`);
      }

      // Validate Status (Allowed values)
      if (status && !STATUS_VALUES.includes(status)) {
        rowErrors.push(`Invalid Status "${status}". Allowed: ${STATUS_VALUES.join(', ')}`);
      }

      // Validate Phone (Optional, Format)
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

    setImportErrors(errors);
    setImportValidRows(validRows);
  }

  // Confirm import
  async function handleImportConfirm() {
    if (importValidRows.length === 0) return;

    setImportProcessing(true);
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (const row of importValidRows) {
        try {
          // Find role ID from name
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

      setImportResult({
        success,
        failed,
        skipped
      });
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

  // Download validation report
  function downloadValidationReport() {
    const errors: any[][] = [['Row', 'Field', 'Error']];
    
    Object.entries(importErrors).forEach(([rowIdx, rowErrors]) => {
      rowErrors.forEach(error => {
        errors.push([`${parseInt(rowIdx) + 2}`, '', error]);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(errors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');
    XLSX.writeFile(workbook, `users-import-validation-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Close import modal
  function closeImportModal() {
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors({});
    setImportValidRows([]);
    setImportResult(null);
  }

  // Redirect back to users dashboard
  const handleBack = () => {
    navigate('/users-teams');
  };

  if (isAdmin) {
    return (
      <div className="workspace">
        <div className="page-stack">
          <div className="page-header">
            <div>
              <p className="eyebrow">Users & Teams</p>
              <h1>Import / Export</h1>
            </div>
          </div>
          <div className="access-restricted">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2>Access Restricted</h2>
            <p>You do not have permission to import or export users.</p>
            <button className="btn-primary" onClick={handleBack}>Back to Users</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Users & Teams</p>
            <h1>Import / Export</h1>
          </div>
          <button className="btn-secondary" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Users
          </button>
        </div>

        {/* Import/Export Options */}
        <div className="import-export-page">
          <div className="import-export-card" onClick={handleImportClick}>
            <div className="import-export-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Import Users</h3>
            <p>Upload an Excel file to bulk import users</p>
            <span className="import-export-badge">Super Admin</span>
          </div>

          <div className="import-export-card" onClick={handleExport}>
            <div className="import-export-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Export Users</h3>
            <p>Download all users as an Excel file</p>
            <span className="import-export-badge">Admin +</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="import-instructions">
          <h3>Import Instructions</h3>
          <ul>
            <li>Export the current users to get the template file</li>
            <li>The exported file is already in the correct format for import</li>
            <li>Fill in the user data following the column headers</li>
            <li>Upload the file using the Import Users option above</li>
            <li>Review the validation report before confirming the import</li>
          </ul>
        </div>

        {/* Required Fields Reference */}
        <div className="import-reference">
          <h3>Required Fields</h3>
          <div className="reference-grid">
            <div className="reference-item required">
              <span className="field-name">Employee ID</span>
              <span className="field-note">Unique identifier</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">First Name</span>
              <span className="field-note">Required</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Last Name</span>
              <span className="field-note">Required</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Email</span>
              <span className="field-note">Valid email format</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Department</span>
              <span className="field-note">{DEPARTMENTS.join(', ')}</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Designation</span>
              <span className="field-note">Required</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Role</span>
              <span className="field-note">Must exist in system</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Employment Type</span>
              <span className="field-note">{EMPLOYMENT_TYPES.join(', ')}</span>
            </div>
            <div className="reference-item required">
              <span className="field-name">Joining Date</span>
              <span className="field-note">YYYY-MM-DD format</span>
            </div>
            <div className="reference-item">
              <span className="field-name">Phone Number</span>
              <span className="field-note">Optional</span>
            </div>
            <div className="reference-item">
              <span className="field-name">Reporting Manager</span>
              <span className="field-note">Optional</span>
            </div>
            <div className="reference-item">
              <span className="field-name">Status</span>
              <span className="field-note">ACTIVE, INACTIVE</span>
            </div>
            <div className="reference-item">
              <span className="field-name">Address</span>
              <span className="field-note">Optional</span>
            </div>
            <div className="reference-item">
              <span className="field-name">Remarks</span>
              <span className="field-note">Optional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={importInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFileChange}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !importResult && closeImportModal()}>
          <div className="modal" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Import Users</h2>
              <button className="modal-close" onClick={closeImportModal}>×</button>
            </div>

            <div className="modal-body">
              {/* File Info */}
              {importFile && (
                <div className="import-file-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{importFile.name}</span>
                </div>
              )}

              {importProcessing && !importResult && (
                <div className="import-loading">
                  <div className="spinner"></div>
                  <span>Validating data...</span>
                </div>
              )}

              {/* Validation Summary */}
              {!importProcessing && !importResult && (
                <>
                  <div className="import-summary">
                    <div className="import-summary-card">
                      <div className="import-summary-icon total">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="import-summary-content">
                        <span className="import-summary-value">{importData.length}</span>
                        <span className="import-summary-label">Total Rows</span>
                      </div>
                    </div>
                    <div className="import-summary-card">
                      <div className="import-summary-icon valid">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="import-summary-content">
                        <span className="import-summary-value">{importValidRows.length}</span>
                        <span className="import-summary-label">Valid Rows</span>
                      </div>
                    </div>
                    <div className="import-summary-card">
                      <div className="import-summary-icon invalid">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="import-summary-content">
                        <span className="import-summary-value">{Object.keys(importErrors).length}</span>
                        <span className="import-summary-label">Invalid Rows</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  {importData.length > 0 && (
                    <div className="import-preview">
                      <h4>Preview</h4>
                      <div className="import-preview-table-container">
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
                </>
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
                  {importValidRows.length > 0 && (
                    <button 
                      className="primary" 
                      onClick={handleImportConfirm}
                      disabled={importProcessing}
                    >
                      {importProcessing ? 'Importing...' : `Import ${importValidRows.length} Users`}
                    </button>
                  )}
                </>
              )}
              {importResult && (
                <>
                  <button className="primary" onClick={closeImportModal}>
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
