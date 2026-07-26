/**
 * Vendor Directory Page
 * 
 * Enterprise vendor management with full CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';
import { Building2, Plus, Search, Download, Filter, X, Edit2, Trash2, Eye, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from 'lucide-react';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  Pagination,
  ConfirmationDialog,
  PageHeader,
  ModalLayout,
  Button
} from '../components/serviceRequests';
import { SummaryCards } from '../components/common/SummaryCards';
import { Building2 as VendorIcon, CheckCircle, Clock, FileText } from 'lucide-react';

type Vendor = {
  id: string;
  vendorName: string;
  vendorCode: string;
  category: string;
  status: string;
  website?: string;
  country?: string;
  gstNumber?: string;
  registrationNumber?: string;
  primaryContactName: string;
  designation?: string;
  email: string;
  phone: string;
  address?: string;
  remarks?: string;
  contractStartDate?: string;
  contractExpiryDate?: string;
  renewalDate?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
};

type VendorRow = {
  vendorName: string;
  vendorCode: string;
  category: string;
  status: string;
  website: string;
  country: string;
  gstNumber: string;
  registrationNumber: string;
  primaryContactName: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  remarks: string;
  contractStartDate: string;
  contractExpiryDate: string;
  renewalDate: string;
  paymentTerms: string;
};

type VendorSummary = {
  totalVendors: number;
  activeVendors: number;
  expiringContracts: number;
  pendingRenewals: number;
};

const VENDOR_CATEGORIES = [
  'IT Services',
  'Hardware',
  'Software',
  'Networking',
  'Security',
  'Cloud Services',
  'Consulting',
  'Maintenance',
  'Logistics',
  'Other'
];

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'BLOCKED'];
const CONTRACT_STATUS_OPTIONS = ['active', 'expiring', 'expired'];

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function VendorDirectoryPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.roles.includes('Admin') || user?.roles.includes('Super Admin');

  // State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<VendorSummary>({
    totalVendors: 0,
    activeVendors: 0,
    expiringContracts: 0,
    pendingRenewals: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'vendorName',
    direction: 'asc'
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Metadata
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importValidRows, setImportValidRows] = useState<VendorRow[]>([]);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    error?: string;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Load vendors
  const loadVendors = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (countryFilter) params.append('country', countryFilter);
      if (contractStatusFilter) params.append('contractStatus', contractStatusFilter);
      if (dateFrom) params.append('contractExpiryFrom', dateFrom);
      if (dateTo) params.append('contractExpiryTo', dateTo);
      if (yearFilter) params.append('year', yearFilter);
      params.append('sortBy', sortConfig.key);
      params.append('sortOrder', sortConfig.direction);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await api.get(`/vendors?${params.toString()}`);
      setVendors(res.data.vendors || []);
      setTotalVendors(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, categoryFilter, statusFilter, countryFilter, contractStatusFilter, dateFrom, dateTo, yearFilter, sortConfig, page]);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get('/vendors/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  }, []);

  // Load metadata
  const loadMetadata = useCallback(async () => {
    try {
      const [catRes, countryRes, yearRes] = await Promise.all([
        api.get('/vendors/categories'),
        api.get('/vendors/countries'),
        api.get('/vendors/years')
      ]);
      setCategories(catRes.data.categories || []);
      setCountries(countryRes.data.countries || []);
      setYears(yearRes.data.years || []);
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors, sortConfig]);

  useEffect(() => {
    loadSummary();
    loadMetadata();
  }, [loadSummary, loadMetadata]);

  // Refresh handler
  const handleRefresh = () => {
    loadVendors(true);
    loadSummary();
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVendors();
  };

  // Sort handler - reloads data when sort changes
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      key: field,
      direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setCountryFilter('');
    setContractStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setYearFilter('');
    setPage(1);
    setTimeout(() => loadVendors(), 0);
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    loadVendors();
  };

  // View details - navigate to full details page
  const handleViewDetails = (vendor: Vendor) => {
    navigate(`/vendors-licenses/${vendor.id}`);
  };

  // Create vendor
  const handleCreateVendor = async (data: Partial<Vendor>) => {
    try {
      await api.post('/vendors', data);
      setMessage('Vendor created successfully');
      setShowCreateDialog(false);
      loadVendors();
      loadSummary();
      loadMetadata();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create vendor');
    }
  };

  // Update vendor
  const handleUpdateVendor = async (data: Partial<Vendor>) => {
    try {
      await api.put(`/vendors/${editingVendor?.id}`, data);
      setMessage('Vendor updated successfully');
      setShowEditDialog(false);
      setEditingVendor(null);
      loadVendors();
      loadSummary();
      loadMetadata();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update vendor');
    }
  };

  // Delete vendor
  const handleDeleteVendor = async () => {
    if (!editingVendor) return;
    try {
      await api.delete(`/vendors/${editingVendor.id}`);
      setMessage('Vendor deleted successfully');
      setShowDeleteDialog(false);
      setEditingVendor(null);
      loadVendors();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
      setShowDeleteDialog(false);
    }
  };

  // Export vendors to Excel
  const handleExport = async () => {
    try {
      const res = await api.get('/vendors?limit=10000');
      const allVendors = res.data.vendors || [];
      
      const exportData = allVendors.map((v: Vendor) => ({
        'Vendor Name': v.vendorName,
        'Vendor Code': v.vendorCode,
        'Category': v.category,
        'Status': v.status,
        'Website': v.website || '',
        'Country': v.country || '',
        'GST Number': v.gstNumber || '',
        'Registration Number': v.registrationNumber || '',
        'Primary Contact Name': v.primaryContactName,
        'Designation': v.designation || '',
        'Email': v.email,
        'Phone': v.phone,
        'Address': v.address || '',
        'Remarks': v.remarks || '',
        'Contract Start Date': v.contractStartDate ? new Date(v.contractStartDate).toISOString().split('T')[0] : '',
        'Contract Expiry Date': v.contractExpiryDate ? new Date(v.contractExpiryDate).toISOString().split('T')[0] : '',
        'Renewal Date': v.renewalDate ? new Date(v.renewalDate).toISOString().split('T')[0] : '',
        'Payment Terms': v.paymentTerms || '',
        'Created At': v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : '',
        'Updated At': v.updatedAt ? new Date(v.updatedAt).toISOString().split('T')[0] : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');
      
      worksheet['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 },
        { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];

      XLSX.writeFile(workbook, `vendors-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export vendors');
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
    const validRows: VendorRow[] = [];
    const seenCodes = new Set<string>();
    const seenEmails = new Set<string>();

    // Get existing codes and emails from database
    let existingCodes: Set<string> = new Set();
    let existingEmails: Set<string> = new Set();
    try {
      const response = await api.get('/vendors?limit=1000');
      const vendors = response.data.vendors || [];
      vendors.forEach((v: Vendor) => {
        existingCodes.add(v.vendorCode.toLowerCase());
        existingEmails.add(v.email.toLowerCase());
      });
    } catch (err) {
      console.error('Failed to fetch existing vendors:', err);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];

      const getField = (name: string) => String(row[name] || '').trim();

      const vendorName = getField('Vendor Name');
      const vendorCode = getField('Vendor Code');
      const category = getField('Category');
      const status = getField('Status') || 'ACTIVE';
      const website = getField('Website');
      const country = getField('Country');
      const gstNumber = getField('GST Number');
      const registrationNumber = getField('Registration Number');
      const primaryContactName = getField('Primary Contact Name');
      const designation = getField('Designation');
      const email = getField('Email');
      const phone = getField('Phone');
      const address = getField('Address');
      const remarks = getField('Remarks');
      const contractStartDate = getField('Contract Start Date');
      const contractExpiryDate = getField('Contract Expiry Date');
      const renewalDate = getField('Renewal Date');
      const paymentTerms = getField('Payment Terms');

      // Validate Vendor Name
      if (!vendorName) {
        rowErrors.push('Vendor Name is required');
      }

      // Validate Vendor Code
      if (!vendorCode) {
        rowErrors.push('Vendor Code is required');
      } else {
        if (seenCodes.has(vendorCode.toLowerCase())) {
          rowErrors.push(`Duplicate Vendor Code "${vendorCode}" in file`);
        }
        if (existingCodes.has(vendorCode.toLowerCase())) {
          rowErrors.push(`Vendor Code "${vendorCode}" already exists in database`);
        }
        seenCodes.add(vendorCode.toLowerCase());
      }

      // Validate Category
      if (!category) {
        rowErrors.push('Category is required');
      } else if (!VENDOR_CATEGORIES.includes(category)) {
        rowErrors.push(`Invalid category "${category}". Allowed: ${VENDOR_CATEGORIES.join(', ')}`);
      }

      // Validate Status
      if (status && !STATUS_OPTIONS.includes(status)) {
        rowErrors.push(`Invalid status "${status}". Allowed: ${STATUS_OPTIONS.join(', ')}`);
      }

      // Validate Primary Contact Name
      if (!primaryContactName) {
        rowErrors.push('Primary Contact Name is required');
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

      // Validate Phone
      if (!phone) {
        rowErrors.push('Phone is required');
      }

      // Validate Date formats if provided (accept any format)
      if (contractStartDate) {
        const parsed = new Date(contractStartDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Contract Start Date: "${contractStartDate}"`);
        }
      }
      if (contractExpiryDate) {
        const parsed = new Date(contractExpiryDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Contract Expiry Date: "${contractExpiryDate}"`);
        }
      }
      if (renewalDate) {
        const parsed = new Date(renewalDate);
        if (isNaN(parsed.getTime())) {
          rowErrors.push(`Invalid Renewal Date: "${renewalDate}"`);
        }
      }

      if (rowErrors.length > 0) {
        errors[i] = rowErrors;
      } else {
        validRows.push({
          vendorName,
          vendorCode,
          category,
          status,
          website,
          country,
          gstNumber,
          registrationNumber,
          primaryContactName,
          designation,
          email,
          phone,
          address,
          remarks,
          contractStartDate,
          contractExpiryDate,
          renewalDate,
          paymentTerms
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
            vendorName: row.vendorName,
            vendorCode: row.vendorCode,
            category: row.category,
            status: row.status,
            website: row.website || undefined,
            country: row.country || undefined,
            gstNumber: row.gstNumber || undefined,
            registrationNumber: row.registrationNumber || undefined,
            primaryContactName: row.primaryContactName,
            designation: row.designation || undefined,
            email: row.email,
            phone: row.phone,
            address: row.address || undefined,
            remarks: row.remarks || undefined,
            contractStartDate: row.contractStartDate || undefined,
            contractExpiryDate: row.contractExpiryDate || undefined,
            renewalDate: row.renewalDate || undefined,
            paymentTerms: row.paymentTerms || undefined
          };

          await api.post('/vendors', payload);
          success++;
        } catch (err: any) {
          console.error('Failed to import vendor:', row.vendorCode, err);
          failed++;
        }
      }

      setImportResult({ success, failed, skipped: 0 });
      
      if (success > 0) {
        loadVendors();
        loadSummary();
        loadMetadata();
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
    
    // Refresh vendors list after closing modal
    loadVendors();
    loadSummary();
  }

  function downloadValidationReport() {
    const errorData: any[][] = [['Row', 'Field', 'Error']];
    Object.entries(importErrors).forEach(([rowIdx, errors]) => {
      const row = importData[parseInt(rowIdx)];
      const vendorCode = row?.['Vendor Code'] || 'N/A';
      errors.forEach(error => {
        errorData.push([`${parseInt(rowIdx) + 2} (${vendorCode})`, '', error]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'import-validation-report.xlsx');
  }

  const hasActiveFilters = categoryFilter || statusFilter || countryFilter || contractStatusFilter || dateFrom || dateTo || yearFilter;

  // Summary cards data for Vendor Directory
  const summaryCards = [
    {
      icon: VendorIcon,
      iconBgColor: 'bg-gradient-to-br from-purple-100 to-purple-50',
      iconColor: 'text-purple-600',
      value: summary.totalVendors,
      label: 'Total Vendors'
    },
    {
      icon: CheckCircle,
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconColor: 'text-emerald-600',
      value: summary.activeVendors,
      label: 'Active Vendors'
    },
    {
      icon: Clock,
      iconBgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-600',
      value: summary.expiringContracts,
      label: 'Expiring Contracts'
    },
    {
      icon: FileText,
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      value: summary.pendingRenewals,
      label: 'Pending Renewals'
    }
  ];

  return (
    <div className="workspace">
      <div className="page-stack vendor-directory">
        {/* Header */}
        <PageHeader
          title="Vendor Directory"
          subtitle="Manage vendor relationships and contracts"
          icon={Building2}
          actions={
            <>
              <button 
                className="btn-secondary" 
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button 
                  className="btn-primary"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Vendor
                </button>
              )}
            </>
          }
        />

        {/* Main Content */}
        <div className="content-section">
        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

        {(error || message) && (
          <div className={`px-4 py-3 rounded-xl flex items-center justify-between ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            <span>{error || message}</span>
            <button onClick={() => { setError(''); setMessage(''); }} className="text-xl leading-none hover:opacity-70">×</button>
          </div>
        )}

        {/* Toolbar - Modern Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <form className="flex-1 flex gap-2 w-full md:w-auto" onSubmit={handleSearch}>
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300" />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">Search</button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setShowFilters(!showFilters)}>
              <svg className="inline w-4 h-4 mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/></svg>
              Filters
              {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-purple-600 rounded-full inline-block"></span>}
            </button>

            <div className="relative group">
              <button type="button" className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Sort
              </button>
              <div className="absolute right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg py-2 min-w-[140px] z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortConfig.key === 'vendorName' ? 'text-purple-600 font-semibold' : 'text-slate-600'}`} onClick={() => handleSort('vendorName')}>
                  Vendor Name {sortConfig.key === 'vendorName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortConfig.key === 'newest' ? 'text-purple-600 font-semibold' : 'text-slate-600'}`} onClick={() => handleSort('newest')}>
                  Newest First
                </button>
                <button className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortConfig.key === 'oldest' ? 'text-purple-600 font-semibold' : 'text-slate-600'}`} onClick={() => handleSort('oldest')}>
                  Oldest First
                </button>
                <button className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortConfig.key === 'contractExpiry' ? 'text-purple-600 font-semibold' : 'text-slate-600'}`} onClick={() => handleSort('contractExpiry')}>
                  Contract Expiry {sortConfig.key === 'contractExpiry' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortConfig.key === 'status' ? 'text-purple-600 font-semibold' : 'text-slate-600'}`} onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            <button type="button" className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all flex items-center gap-2" onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={refreshing ? 'animate-spin' : ''}><path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Refresh
            </button>

            {isAdmin && (
              <>
                <button type="button" className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all flex items-center gap-2" onClick={handleExport}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Export
                </button>

                <button type="button" className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all flex items-center gap-2" onClick={handleImportClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Import
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel - Modern Card */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 4h18M5 10h14M7 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Category
                </label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                  <option value="">All Categories</option>
                  {[...VENDOR_CATEGORIES, ...categories.filter(c => !VENDOR_CATEGORIES.includes(c))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Status
                </label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10C20 5.3 15.5 2 12 2C8.5 2 5 5.3 5 10C5 13 7.7 17 12 21.7z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Country
                </label>
                <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                  <option value="">All Countries</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Contract Status
                </label>
                <select value={contractStatusFilter} onChange={(e) => setContractStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                  <option value="">All Contracts</option>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring Soon (30 days)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Contract Expiry From
                </label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Contract Expiry To
                </label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <svg className="inline w-4 h-4 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Year
                </label>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300">
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button type="button" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" onClick={clearFilters}>
                  Clear Filters
                </button>
                <button type="button" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors" onClick={applyFilters}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Section - Modern Card */}
        <TableContainer loading={loading} empty={!loading && vendors.length === 0} emptyTitle={hasActiveFilters || search ? 'No vendors match your filters' : 'No vendors yet'} emptyDescription={search || hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first vendor to get started'}>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <SortHeader label="Vendor" sortKey="vendorName" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Primary Contact" sortKey="primaryContactName" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Country" sortKey="country" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Contract Expiry" sortKey="contractExpiry" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map(vendor => (
                <TableRow key={vendor.id} onClick={() => handleViewDetails(vendor)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{vendor.vendorName}</span>
                      <span className="text-xs text-slate-500 font-mono">{vendor.vendorCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                      {vendor.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700">{vendor.primaryContactName}</span>
                      <span className="text-xs text-slate-500">{vendor.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      vendor.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      vendor.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {vendor.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-700">{vendor.country || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-700">
                      {vendor.contractExpiryDate ? formatDate(vendor.contractExpiryDate) : '-'}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => { setEditingVendor(vendor); setShowEditDialog(true); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingVendor(vendor); setShowDeleteDialog(true); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(vendor)}
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalVendors}
            pageSize={20}
            onPageChange={setPage}
          />
        )}
      </div>
      {/* Create Vendor Dialog */}
      {showCreateDialog && (
        <VendorFormDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateVendor}
          title="Add Vendor"
        />
      )}

      {/* Edit Vendor Dialog */}
      {showEditDialog && editingVendor && (
        <VendorFormDialog
          vendor={editingVendor}
          onClose={() => { setShowEditDialog(false); setEditingVendor(null); }}
          onSubmit={handleUpdateVendor}
          title="Edit Vendor"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setEditingVendor(null); }}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${editingVendor?.vendorName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
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
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Vendors</h3>
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
                              <th>Vendor Code</th>
                              <th>Vendor Name</th>
                              <th>Category</th>
                              <th>Email</th>
                              <th>Valid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importData.slice(0, 10).map((row, idx) => {
                              const hasError = importErrors[idx];
                              return (
                                <tr key={idx} className={hasError ? 'invalid-row' : 'valid-row'}>
                                  <td>{idx + 2}</td>
                                  <td>{row['Vendor Code'] || '-'}</td>
                                  <td>{row['Vendor Name'] || '-'}</td>
                                  <td>{row['Category'] || '-'}</td>
                                  <td>{row['Email'] || '-'}</td>
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
                          const vendorCode = row?.['Vendor Code'] || 'N/A';
                          return (
                            <div key={rowIdx} className="import-error-item">
                              <strong>Row {parseInt(rowIdx) + 2} ({vendorCode}):</strong>
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
                            And {Object.keys(importErrors).length - 5} more errors. Download the validation report for full details.
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
                  <button className="secondary" onClick={closeImportModal}>
                    Cancel
                  </button>
                  <button 
                    className="primary" 
                    onClick={handleImportConfirm}
                    disabled={importProcessing || importValidRows.length === 0}
                  >
                    {importProcessing ? 'Importing...' : `Import ${importValidRows.length} Vendors`}
                  </button>
                </>
              )}
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

// ============================================================
// Vendor Form Dialog Component
// ============================================================
type VendorFormDialogProps = {
  vendor?: Vendor;
  onClose: () => void;
  onSubmit: (data: Partial<Vendor>) => Promise<void>;
  title: string;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

function VendorFormDialog({ vendor, onClose, onSubmit, title }: VendorFormDialogProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [form, setForm] = useState<Partial<Vendor> & { internalOwnerId?: string }>(vendor ? {
    ...vendor,
    internalOwnerId: (vendor as any).internalOwnerId || ''
  } : {
    vendorName: '',
    vendorCode: '',
    category: '',
    status: 'ACTIVE',
    website: '',
    country: '',
    gstNumber: '',
    registrationNumber: '',
    primaryContactName: '',
    designation: '',
    email: '',
    phone: '',
    address: '',
    remarks: '',
    contractStartDate: '',
    contractExpiryDate: '',
    renewalDate: '',
    paymentTerms: '',
    internalOwnerId: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setUsersLoading(true);
      const res = await api.get('/users?per_page=1000');
      setUsers(res.data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ ...form, internalOwnerId: form.internalOwnerId || undefined } as Partial<Vendor>);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none";
  const labelClass = "block text-sm font-medium text-slate-700 mb-2";
  const sectionTitleClass = "text-base font-semibold text-slate-800 mb-4 mt-6 flex items-center gap-2";

  return (
    <ModalLayout
      isOpen={true}
      onClose={onClose}
      title={title}
      subtitle={vendor ? 'Update vendor information' : 'Add a new vendor to your directory'}
      icon={vendor ? '📝' : '🏢'}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleSubmit}
            loading={saving}
          >
            {saving ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className={sectionTitleClass}>
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Vendor Name <span className="text-red-500">*</span></label>
              <input type="text" className={inputClass} value={form.vendorName || ''} onChange={e => setForm({ ...form, vendorName: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Vendor Code <span className="text-red-500">*</span></label>
              <input type="text" className={inputClass} value={form.vendorCode || ''} onChange={e => setForm({ ...form, vendorCode: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select className={`${inputClass} bg-white`} value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select Category</option>
                {VENDOR_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={`${inputClass} bg-white`} value={form.status || 'ACTIVE'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input type="url" className={inputClass} value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" className={inputClass} value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>GST Number</label>
              <input type="text" className={inputClass} value={form.gstNumber || ''} onChange={e => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Registration Number</label>
              <input type="text" className={inputClass} value={form.registrationNumber || ''} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className={sectionTitleClass}>
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Primary Contact Name <span className="text-red-500">*</span></label>
              <input type="text" className={inputClass} value={form.primaryContactName || ''} onChange={e => setForm({ ...form, primaryContactName: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input type="text" className={inputClass} value={form.designation || ''} onChange={e => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" className={inputClass} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Phone <span className="text-red-500">*</span></label>
              <input type="tel" className={inputClass} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea className={`${inputClass} resize-none`} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
            </div>
          </div>
        </div>

        {/* Internal Owner */}
        <div>
          <h3 className={sectionTitleClass}>
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Internal Owner
          </h3>
          <div>
            <label className={labelClass}>Owner</label>
            <select 
              className={`${inputClass} bg-white`}
              value={form.internalOwnerId || ''} 
              onChange={e => setForm({ ...form, internalOwnerId: e.target.value || undefined })}
              disabled={usersLoading}
            >
              <option value="">Select Owner</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contract Information */}
        <div>
          <h3 className={sectionTitleClass}>
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Contract Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contract Start Date</label>
              <input type="date" className={inputClass} value={form.contractStartDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, contractStartDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Contract Expiry Date</label>
              <input type="date" className={inputClass} value={form.contractExpiryDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, contractExpiryDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Renewal Date</label>
              <input type="date" className={inputClass} value={form.renewalDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, renewalDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Payment Terms</label>
              <input type="text" className={inputClass} value={form.paymentTerms || ''} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g., Net 30" />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className={labelClass}>Remarks</label>
          <textarea className={`${inputClass} resize-none`} value={form.remarks || ''} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} />
        </div>
      </form>
    </ModalLayout>
  );
}

