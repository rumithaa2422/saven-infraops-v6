import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api, setAuthToken, API_BASE_URL } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { ReportCard, ReportFilterModal, ReportSummaryCard, ReportDefinition } from '../components/reports';

interface ReportStats {
  totalReportsAvailable: number;
  reportsGeneratedToday: number;
  totalReportsGenerated: number;
  lastGenerated: {
    type: string;
    by: string;
    at: string;
  } | null;
}

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('reports:view');
  const canExport = hasPermission('reports:export');

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, reportsRes] = await Promise.all([
        api.get('/reports/stats/summary'),
        api.get('/reports')
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data.reports);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, loadData]);

  const generateReport = async (reportId: string, filters?: Record<string, string>) => {
    console.log('[ReportsPage] generateReport called with reportId:', reportId);
    try {
      setGenerating(reportId);
      setError('');

      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      // Use the correct token key used by AuthContext
      const token = localStorage.getItem('infraops.token');
      console.log('[ReportsPage] Token found:', !!token);
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Use axios with the correct base URL and auth headers for blob download
      const url = `${API_BASE_URL}/reports/${reportId}/download?${params.toString()}`;
      console.log('[ReportsPage] Making request to:', url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob',
        timeout: 60000 // 60 second timeout for large reports
      });
      console.log('[ReportsPage] Response received:', response.status);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${reportId}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      // Check if the response is actually an error message (JSON)
      const blob = response.data as Blob;
      console.log('[ReportsPage] Blob type:', blob.type);
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to generate report');
      }

      // Create download link and trigger download
      console.log('[ReportsPage] Triggering download for file:', filename);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log('[ReportsPage] Download triggered successfully');

      // Refresh stats
      loadData();
    } catch (err: unknown) {
      console.error('[ReportsPage] Error generating report:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.data instanceof Blob) {
          // Try to read error from blob
          try {
            const text = await (err.response.data as Blob).text();
            const json = JSON.parse(text);
            setError(json.message || 'Failed to generate report');
          } catch {
            setError('Failed to generate report. Please try again.');
          }
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to generate report');
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
        setError(errorMessage);
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleOpenFilters = (report: ReportDefinition) => {
    setSelectedReport(report);
  };

  const handleCloseFilters = () => {
    setSelectedReport(null);
  };

  const handleApplyFilters = async (reportId: string, filters: Record<string, string>) => {
    setSelectedReport(null);
    await generateReport(reportId, filters);
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canView) {
    return (
      <div className="workspace">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You do not have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="subtitle">Generate downloadable reports from every InfraOps module</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <ReportSummaryCard
          title="Total Reports Available"
          value={stats?.totalReportsAvailable || 0}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
          color="#3b82f6"
        />
        <ReportSummaryCard
          title="Reports Generated Today"
          value={stats?.reportsGeneratedToday || 0}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
          color="#22c55e"
        />
        <ReportSummaryCard
          title="Total Reports Generated"
          value={stats?.totalReportsGenerated || 0}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
          color="#8b5cf6"
        />
        <ReportSummaryCard
          title="Last Generated Report"
          value={stats?.lastGenerated ? formatRelativeTime(stats.lastGenerated.at) : 'Never'}
          subtitle={stats?.lastGenerated ? `by ${stats.lastGenerated.by}` : ''}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          color="#f59e0b"
        />
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading reports...</p>
        </div>
      )}

      {/* Reports Grid */}
      {!loading && (
        <div className="reports-grid">
          {filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onGenerate={generateReport}
                onOpenFilters={handleOpenFilters}
                canExport={canExport}
                loading={generating === report.id}
              />
            ))
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>No reports found</h3>
              <p>{searchTerm ? 'Try a different search term' : 'Reports will appear here'}</p>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      <ReportFilterModal
        report={selectedReport}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        loading={generating === selectedReport?.id}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          padding: 24px 32px;
          border-radius: 16px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .page-header .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #6366f1;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .page-header .btn-secondary:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .page-header .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }

        .summary-title {
          font-size: 13px;
          color: var(--muted);
          margin-top: 2px;
        }

        .summary-subtitle {
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .search-bar svg {
          color: var(--muted);
          flex-shrink: 0;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          color: var(--text);
        }

        .search-bar input::placeholder {
          color: var(--muted);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          margin-bottom: 24px;
          color: #dc2626;
          font-size: 14px;
        }

        .error-banner button {
          margin-left: auto;
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          text-decoration: underline;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .report-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .report-card:hover {
          border-color: var(--brand);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .report-card-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .report-icon {
          width: 48px;
          height: 48px;
          background: var(--panel-soft);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand);
          flex-shrink: 0;
        }

        .report-info {
          flex: 1;
          min-width: 0;
        }

        .report-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 4px 0;
        }

        .report-description {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
          line-height: 1.4;
        }

        .report-card-stats {
          display: flex;
          gap: 24px;
          padding: 12px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          margin-bottom: 16px;
        }

        .report-stat {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .report-card-actions {
          display: flex;
          gap: 8px;
        }

        .btn-outline {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-outline:hover:not(:disabled) {
          background: var(--panel-soft);
          border-color: var(--brand);
        }

        .btn-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--brand);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          flex: 1;
          justify-content: center;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--brand-dark);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--panel-soft);
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid var(--line);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
        }

        .loading-container p {
          color: var(--muted);
          margin-top: 16px;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
          color: var(--muted);
        }

        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
        }

        .error-container h2 {
          color: var(--error);
          margin: 0 0 8px 0;
        }

        .error-container p {
          color: var(--muted);
          margin: 0;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--line);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .modal-close:hover {
          background: var(--panel-soft);
          color: var(--text);
        }

        .modal-body {
          padding: 24px;
        }

        .report-info-banner {
          padding: 16px;
          background: var(--panel-soft);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .report-info-banner h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .report-info-banner p {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .filter-field input,
        .filter-field select {
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 6px;
          font-size: 14px;
          color: var(--text);
          background: white;
          transition: border-color 0.15s;
        }

        .filter-field input:focus,
        .filter-field select:focus {
          outline: none;
          border-color: var(--brand);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--line);
        }

        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .reports-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
