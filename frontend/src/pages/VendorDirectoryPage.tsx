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
  const [sortBy, setSortBy] = useState('vendorName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Metadata
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

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
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
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
  }, [search, categoryFilter, statusFilter, countryFilter, contractStatusFilter, dateFrom, dateTo, yearFilter, sortBy, sortOrder, page]);

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
  }, [loadVendors]);

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

  // Sort handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
    loadVendors();
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

  // Export vendors
  const handleExport = async () => {
    try {
      const res = await api.get('/vendors/export');
      const data = res.data;

      const exportData = data.map((v: Vendor) => ({
        'Vendor Name': v.vendorName,
        'Vendor Code': v.vendorCode,
        'Category': v.category,
        'Status': v.status,
        'Website': v.website || '',
        'Country': v.country || '',
        'GST Number': v.gstNumber || '',
        'Registration Number': v.registrationNumber || '',
        'Primary Contact': v.primaryContactName,
        'Designation': v.designation || '',
        'Email': v.email,
        'Phone': v.phone,
        'Address': v.address || '',
        'Remarks': v.remarks || '',
        'Contract Start Date': v.contractStartDate ? formatDate(v.contractStartDate) : '',
        'Contract Expiry Date': v.contractExpiryDate ? formatDate(v.contractExpiryDate) : '',
        'Renewal Date': v.renewalDate ? formatDate(v.renewalDate) : '',
        'Payment Terms': v.paymentTerms || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
      XLSX.writeFile(wb, `vendors-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      setMessage('Vendors exported successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export vendors');
    }
  };

  // Import vendors
  const handleImport = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet) as any[];

          // Normalize headers
          const vendors = json.map(row => ({
            vendorName: row['Vendor Name'] || row['vendorName'] || '',
            vendorCode: row['Vendor Code'] || row['vendorCode'] || '',
            category: row['Category'] || row['category'] || '',
            status: row['Status'] || row['status'] || 'ACTIVE',
            website: row['Website'] || row['website'] || '',
            country: row['Country'] || row['country'] || '',
            gstNumber: row['GST Number'] || row['gstNumber'] || '',
            registrationNumber: row['Registration Number'] || row['registrationNumber'] || '',
            primaryContactName: row['Primary Contact'] || row['primaryContactName'] || '',
            designation: row['Designation'] || row['designation'] || '',
            email: row['Email'] || row['email'] || '',
            phone: row['Phone'] || row['phone'] || '',
            address: row['Address'] || row['address'] || '',
            remarks: row['Remarks'] || row['remarks'] || '',
            contractStartDate: row['Contract Start Date'] || row['contractStartDate'] || '',
            contractExpiryDate: row['Contract Expiry Date'] || row['contractExpiryDate'] || '',
            renewalDate: row['Renewal Date'] || row['renewalDate'] || '',
            paymentTerms: row['Payment Terms'] || row['paymentTerms'] || ''
          }));

          const res = await api.post('/vendors/import', { vendors });
          const result = res.data;

          setMessage(`Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`);
          setShowImportDialog(false);
          loadVendors();
          loadSummary();
          loadMetadata();
          resolve();
        } catch (err: any) {
          reject(new Error(err.response?.data?.message || 'Failed to import vendors'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const hasActiveFilters = categoryFilter || statusFilter || countryFilter || contractStatusFilter || dateFrom || dateTo || yearFilter;

  return (
    <div className="doc-repo-page">
      <div className="page-container">
        {/* Summary Cards */}
        <div className="doc-repo-summary-cards">
          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon folders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Total Vendors</span>
              <span className="doc-repo-summary-value">{summary.totalVendors}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon files">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Active Vendors</span>
              <span className="doc-repo-summary-value">{summary.activeVendors}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon storage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Expiring Contracts</span>
              <span className="doc-repo-summary-value">{summary.expiringContracts}</span>
            </div>
          </div>

          <div className="doc-repo-summary-card">
            <div className="doc-repo-summary-icon recent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="doc-repo-summary-content">
              <span className="doc-repo-summary-label">Pending Renewals</span>
              <span className="doc-repo-summary-value">{summary.pendingRenewals}</span>
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
            {error || message}
            <button onClick={() => { setError(''); setMessage(''); }}>×</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
            <button type="submit" className="toolbar-btn primary">Search</button>
          </form>

          <div className="toolbar-actions">
            <button type="button" className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4H21V6H3V4ZM7 11H17V13H7V11ZM10 18H14V20H10V18Z" stroke="currentColor" strokeWidth="2"/></svg>
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>

            <div className="sort-dropdown">
              <button type="button" className="toolbar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Sort
              </button>
              <div className="sort-dropdown-content">
                <button className={sortBy === 'vendorName' ? 'active' : ''} onClick={() => handleSort('vendorName')}>
                  Vendor Name {sortBy === 'vendorName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => handleSort('newest')}>
                  Newest First
                </button>
                <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => handleSort('oldest')}>
                  Oldest First
                </button>
                <button className={sortBy === 'contractExpiry' ? 'active' : ''} onClick={() => handleSort('contractExpiry')}>
                  Contract Expiry {sortBy === 'contractExpiry' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button className={sortBy === 'status' ? 'active' : ''} onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            <button type="button" className={`toolbar-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={refreshing ? 'spin' : ''}><path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Refresh
            </button>

            {isAdmin && (
              <>
                <button type="button" className="toolbar-btn" onClick={() => setShowImportDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/><path d="M12 15V3" stroke="currentColor" strokeWidth="2"/></svg>
                  Import
                </button>
                <button type="button" className="toolbar-btn" onClick={handleExport}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2"/><path d="M12 3V15" stroke="currentColor" strokeWidth="2"/></svg>
                  Export
                </button>
                <button type="button" className="toolbar-btn primary" onClick={() => setShowCreateDialog(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add Vendor
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h4>Filters</h4>
            </div>
            <div className="filters-content">
              <div className="filter-row">
                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <path d="M3 4h18M5 10h14M7 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Category
                  </label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {[...VENDOR_CATEGORIES, ...categories.filter(c => !VENDOR_CATEGORIES.includes(c))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Status
                  </label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 21.7C17.3 17 20 13 20 10C20 5.3 15.5 2 12 2C8.5 2 5 5.3 5 10C5 13 7.7 17 12 21.7z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Country
                  </label>
                  <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                    <option value="">All Countries</option>
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Contract Status
                  </label>
                  <select value={contractStatusFilter} onChange={(e) => setContractStatusFilter(e.target.value)}>
                    <option value="">All Contracts</option>
                    <option value="active">Active</option>
                    <option value="expiring">Expiring Soon (30 days)</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Contract Expiry
                  </label>
                  <div className="date-range-inputs">
                    <div className="date-input-wrapper">
                      <span className="date-label">From</span>
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <span className="date-separator">—</span>
                    <div className="date-input-wrapper">
                      <span className="date-label">To</span>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="filter-group">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Year
                  </label>
                  <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                    <option value="">All Years</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Clear Filters
              </button>
              <button type="button" className="apply-filters-btn" onClick={applyFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="doc-repo-grid-section">
          <div className="section-header">
            <span className="section-count">{totalVendors} vendor{totalVendors !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="doc-repo-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/></svg>
              <p>{hasActiveFilters || search ? 'No vendors match your filters' : 'No vendors yet'}</p>
              <span>{search || hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first vendor to get started'}</span>
              {isAdmin && !search && !hasActiveFilters && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" className="secondary" onClick={() => setShowImportDialog(true)}>Import Vendors</button>
                  <button type="button" className="primary" onClick={() => setShowCreateDialog(true)}>Add Vendor</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('vendorName')} className="sortable">
                      Vendor {sortBy === 'vendorName' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th>Category</th>
                    <th>Primary Contact</th>
                    <th onClick={() => handleSort('status')} className="sortable">
                      Status {sortBy === 'status' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th>Country</th>
                    <th onClick={() => handleSort('contractExpiry')} className="sortable">
                      Contract Expiry {sortBy === 'contractExpiry' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(vendor => (
                    <tr key={vendor.id} onClick={() => handleViewDetails(vendor)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="vendor-name-cell">
                          <strong>{vendor.vendorName}</strong>
                          <small>{vendor.vendorCode}</small>
                        </div>
                      </td>
                      <td>{vendor.category}</td>
                      <td>
                        <div className="contact-cell">
                          <span>{vendor.primaryContactName}</span>
                          <small>{vendor.email}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${vendor.status.toLowerCase()}`}>{vendor.status}</span>
                      </td>
                      <td>{vendor.country || '-'}</td>
                      <td>{vendor.contractExpiryDate ? formatDate(vendor.contractExpiryDate) : '-'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="actions-cell">
                          {isAdmin && (
                            <>
                              <button type="button" className="icon-btn" onClick={() => { setEditingVendor(vendor); setShowEditDialog(true); }} title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2"/></svg>
                              </button>
                              <button type="button" className="icon-btn danger" onClick={() => { setEditingVendor(vendor); setShowDeleteDialog(true); }} title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/></svg>
                              </button>
                            </>
                          )}
                          <button type="button" className="icon-btn" onClick={() => handleViewDetails(vendor)} title="View Details">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12S4 4 12 4S23 12 23 12S20 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
      {showDeleteDialog && editingVendor && (
        <div className="modal-overlay" onClick={() => { setShowDeleteDialog(false); setEditingVendor(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Delete Vendor</h3>
            <p>Are you sure you want to delete <strong>{editingVendor.vendorName}</strong>?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => { setShowDeleteDialog(false); setEditingVendor(null); }}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteVendor}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="modal-overlay" onClick={() => setShowImportDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Import Vendors</h3>
            <p>Upload an Excel file (.xlsx) with vendor data.</p>
            <div className="import-template-info">
              <h4>Required Columns:</h4>
              <ul>
                <li>Vendor Name *</li>
                <li>Vendor Code *</li>
                <li>Category *</li>
                <li>Primary Contact *</li>
                <li>Email *</li>
                <li>Phone *</li>
              </ul>
              <p><small>Duplicate vendor codes will be skipped.</small></p>
            </div>
            <ImportFileUpload onImport={handleImport} onClose={() => setShowImportDialog(false)} />
          </div>
        </div>
      )}
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content form-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Vendor Name *</label>
              <input type="text" value={form.vendorName || ''} onChange={e => setForm({ ...form, vendorName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Vendor Code *</label>
              <input type="text" value={form.vendorCode || ''} onChange={e => setForm({ ...form, vendorCode: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select Category</option>
                {VENDOR_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status || 'ACTIVE'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input type="url" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input type="text" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input type="text" value={form.gstNumber || ''} onChange={e => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Registration Number</label>
              <input type="text" value={form.registrationNumber || ''} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
          </div>

          <h4>Contact Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Contact Name *</label>
              <input type="text" value={form.primaryContactName || ''} onChange={e => setForm({ ...form, primaryContactName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input type="text" value={form.designation || ''} onChange={e => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
            </div>
          </div>

          <h4>Internal Owner</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Owner</label>
              <select 
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

          <h4>Contract Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Contract Start Date</label>
              <input type="date" value={form.contractStartDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, contractStartDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Contract Expiry Date</label>
              <input type="date" value={form.contractExpiryDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, contractExpiryDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Renewal Date</label>
              <input type="date" value={form.renewalDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, renewalDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <input type="text" value={form.paymentTerms || ''} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g., Net 30" />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Remarks</label>
            <textarea value={form.remarks || ''} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Import File Upload Component
// ============================================================
type ImportFileUploadProps = {
  onImport: (file: File) => Promise<void>;
  onClose: () => void;
};

function ImportFileUpload({ onImport, onClose }: ImportFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      await onImport(file);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="file-upload-area">
        <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file && <p>Selected: {file.name}</p>}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={importing}>Cancel</button>
        <button type="button" className="primary" onClick={handleImport} disabled={!file || importing}>
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>
    </>
  );
}
