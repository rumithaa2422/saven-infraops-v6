import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface ReportData {
  reportName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

interface ReportStats {
  totalReportsGenerated: number;
  availableTemplates: number;
  exportCount: number;
  lastGenerated: {
    type: string;
    by: string;
    at: string;
  } | null;
}

const REPORT_TYPES = [
  { id: 'incidents', name: 'Incident Summary Report', description: 'Summary of all incidents' },
  { id: 'service-requests', name: 'Service Request Report', description: 'All service requests' },
  { id: 'changes', name: 'Change Request Report', description: 'Change requests with risk levels' },
  { id: 'inventory', name: 'Inventory Report', description: 'Asset inventory details' },
  { id: 'access-requests', name: 'Access Request Report', description: 'System access requests' },
  { id: 'compliance', name: 'Compliance Status Report', description: 'Compliance documents status' },
  { id: 'projects', name: 'Project Report', description: 'Projects and environments' },
  { id: 'vendors', name: 'Vendor License Report', description: 'Vendor licenses and renewals' },
  { id: 'users', name: 'User Report', description: 'User accounts and roles' }
];

const STATUS_OPTIONS = [
  'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'PENDING', 'APPROVED', 
  'REJECTED', 'DRAFT', 'PUBLISHED', 'ARCHIVED', 'ACTIVE', 'INACTIVE'
];

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('reports:view');
  const canExport = hasPermission('reports:export');

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    owner: ''
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await api.get('/reports/stats/summary');
      setStats(res.data);
    } catch {
      setStats({
        totalReportsGenerated: 0,
        availableTemplates: REPORT_TYPES.length,
        exportCount: 0,
        lastGenerated: null
      });
    }
  }

  async function generateReport() {
    if (!selectedReport) {
      setMessage('Please select a report type');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.owner) params.owner = filters.owner;

      const res = await api.get(`/reports/${selectedReport}`, { params });
      setReportData(res.data);
      setViewModalOpen(true);
      await loadStats(); // Refresh stats
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!reportData || !reportData.rows.length) return;

    const headers = reportData.headers.join(',');
    const rows = reportData.rows.map(row => 
      reportData.headers.map(h => {
        const value = row[h];
        const stringValue = value === null || value === undefined ? '' : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setReportData(null);
  }

  if (!canView) {
    return (
      <div className="page-stack">
        <div className="page-title-row">
          <h2>Reports & Analytics</h2>
        </div>
        <div className="notice error">You do not have permission to view reports.</div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Analytics</span>
          <h2>Reports & Analytics</h2>
        </div>
      </div>

      {message && <div className="notice error">{message}</div>}

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reports Generated</div>
          <div className="stat-value">{stats?.totalReportsGenerated || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Templates</div>
          <div className="stat-value">{stats?.availableTemplates || REPORT_TYPES.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Export Count</div>
          <div className="stat-value">{stats?.exportCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Generated</div>
          <div className="stat-value small">
            {stats?.lastGenerated 
              ? `${stats.lastGenerated.type.replace('-', ' ')} by ${stats.lastGenerated.by}`
              : 'No reports yet'
            }
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="table-card">
        <h3>Generate Report</h3>
        
        <div className="filters-row">
          <div className="filter-group">
            <label>Report Type *</label>
            <select 
              value={selectedReport} 
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="">Select a report...</option>
              {REPORT_TYPES.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label>Owner/Department</label>
            <input 
              type="text" 
              placeholder="Filter by owner..."
              value={filters.owner}
              onChange={(e) => setFilters({...filters, owner: e.target.value})}
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="primary" 
            onClick={generateReport}
            disabled={!selectedReport || loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Available Report Templates */}
      <div className="table-card">
        <h3>Available Report Templates</h3>
        <table>
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {REPORT_TYPES.map(rt => (
              <tr key={rt.id}>
                <td><strong>{rt.name}</strong></td>
                <td>{rt.description}</td>
                <td>
                  <button 
                    className="link-button"
                    onClick={() => {
                      setSelectedReport(rt.id);
                      generateReport();
                    }}
                    disabled={loading}
                  >
                    Generate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Report Modal */}
      {viewModalOpen && reportData && (
        <div className="modal-backdrop">
          <div className="modal large">
            <div className="page-title-row">
              <h3>{reportData.reportName}</h3>
              <button type="button" className="close" onClick={closeViewModal}>Close</button>
            </div>

            <div className="modal-actions">
              {canExport && reportData.rows.length > 0 && (
                <button className="secondary" onClick={exportCsv}>
                  Export CSV
                </button>
              )}
              <span className="record-count">
                {reportData.rows.length} record{reportData.rows.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="report-table-container">
              <table>
                <thead>
                  <tr>
                    {reportData.headers.map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={reportData.headers.length} className="empty-row">
                        No records found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    reportData.rows.map((row, idx) => (
                      <tr key={idx}>
                        {reportData.headers.map(h => (
                          <td key={h}>{row[h] !== undefined && row[h] !== null ? String(row[h]) : '-'}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
