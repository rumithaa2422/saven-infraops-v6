import React, { useState, useEffect } from 'react';
import { ReportDefinition } from './ReportCard';

interface ReportFilterModalProps {
  report: ReportDefinition | null;
  onClose: () => void;
  onApply: (reportId: string, filters: Record<string, string>) => void;
  loading?: boolean;
}

export function ReportFilterModal({ report, onClose, onApply, loading }: ReportFilterModalProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    setFilters({});
  }, [report]);

  if (!report) return null;

  const handleChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApply(report.id, filters);
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k]).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content filter-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate Report with Filters</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="report-info-banner">
            <h3>{report.name}</h3>
            <p>{report.description}</p>
          </div>

          <div className="filter-group">
            {report.filters.includes('dateFrom') && (
              <div className="filter-field">
                <label htmlFor="dateFrom">From Date</label>
                <input
                  type="date"
                  id="dateFrom"
                  value={filters.dateFrom || ''}
                  onChange={e => handleChange('dateFrom', e.target.value)}
                />
              </div>
            )}

            {report.filters.includes('dateTo') && (
              <div className="filter-field">
                <label htmlFor="dateTo">To Date</label>
                <input
                  type="date"
                  id="dateTo"
                  value={filters.dateTo || ''}
                  onChange={e => handleChange('dateTo', e.target.value)}
                />
              </div>
            )}

            {report.filters.includes('status') && (
              <div className="filter-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={filters.status || ''}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            )}

            {report.filters.includes('severity') && (
              <div className="filter-field">
                <label htmlFor="severity">Severity</label>
                <select
                  id="severity"
                  value={filters.severity || ''}
                  onChange={e => handleChange('severity', e.target.value)}
                >
                  <option value="">All Severities</option>
                  <option value="SEV1">SEV1 - Critical</option>
                  <option value="SEV2">SEV2 - High</option>
                  <option value="SEV3">SEV3 - Medium</option>
                  <option value="SEV4">SEV4 - Low</option>
                </select>
              </div>
            )}

            {report.filters.includes('priority') && (
              <div className="filter-field">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={filters.priority || ''}
                  onChange={e => handleChange('priority', e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            )}

            {report.filters.includes('category') && (
              <div className="filter-field">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  placeholder="Enter category"
                  value={filters.category || ''}
                  onChange={e => handleChange('category', e.target.value)}
                />
              </div>
            )}

            {report.filters.includes('department') && (
              <div className="filter-field">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  placeholder="Enter department"
                  value={filters.department || ''}
                  onChange={e => handleChange('department', e.target.value)}
                />
              </div>
            )}

            {report.filters.includes('owner') && (
              <div className="filter-field">
                <label htmlFor="owner">Owner</label>
                <input
                  type="text"
                  id="owner"
                  placeholder="Enter owner name"
                  value={filters.owner || ''}
                  onChange={e => handleChange('owner', e.target.value)}
                />
              </div>
            )}

            {report.filters.includes('project') && (
              <div className="filter-field">
                <label htmlFor="project">Project</label>
                <input
                  type="text"
                  id="project"
                  placeholder="Enter project name"
                  value={filters.project || ''}
                  onChange={e => handleChange('project', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleApply} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Generate Report {activeFilterCount > 0 && `(${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
