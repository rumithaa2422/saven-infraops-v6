/**
 * Compliance Management Page
 * 
 * Enterprise compliance framework and control management interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { FileCheck, Plus, Download, ChevronDown, ExternalLink, Edit2, Trash2, Paperclip } from 'lucide-react';
import { AddFrameworkDialog, AddControlDialog, EditControlDialog, EvidenceModal } from '../components/compliance';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell,
  Pagination
} from '../components/serviceRequests';

// Types
interface Framework {
  id: string;
  name: string;
  status: string;
}

interface Control {
  id: string;
  frameworkId: string;
  name: string;
  description: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  framework: {
    id: string;
    name: string;
  };
  _count: {
    evidence: number;
  };
}

interface Summary {
  frameworks: number;
  controls: number;
  evidenceDocuments: number;
  missingEvidence: number;
}

interface FrameworkDropdown {
  id: string;
  name: string;
  status: string;
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function CompliancePage() {
  const { user, isSuperAdmin } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  // Summary state
  const [summary, setSummary] = useState<Summary>({
    frameworks: 0,
    controls: 0,
    evidenceDocuments: 0,
    missingEvidence: 0
  });

  // Controls state
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // Framework dropdown state
  const [frameworks, setFrameworks] = useState<FrameworkDropdown[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Sort state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'updatedAt',
    direction: 'desc'
  });

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  // Dialog states
  const [showAddFramework, setShowAddFramework] = useState(false);
  const [showAddControl, setShowAddControl] = useState(false);
  const [showEditControl, setShowEditControl] = useState(false);
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceControl, setEvidenceControl] = useState<Control | null>(null);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/compliance-management/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // Fetch frameworks for dropdown
  const fetchFrameworks = useCallback(async () => {
    try {
      const res = await api.get('/compliance-management/frameworks/dropdown');
      setFrameworks(res.data.items || []);
      // Select first framework if none selected
      if (!selectedFrameworkId && res.data.items?.length > 0) {
        setSelectedFrameworkId(res.data.items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch frameworks:', err);
    }
  }, [selectedFrameworkId]);

  // Fetch controls
  const fetchControls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedFrameworkId) {
        params.frameworkId = selectedFrameworkId;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const res = await api.get('/compliance-management/controls', { params });
      setControls(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch controls:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFrameworkId, searchQuery]);

  useEffect(() => {
    fetchSummary();
    fetchFrameworks();
  }, [fetchSummary, fetchFrameworks]);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchControls();
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Handle framework change
  const handleFrameworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFrameworkId(e.target.value);
  };

  // Handle row selection
  const handleRowSelect = (controlId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(controlId);
    } else {
      newSelected.delete(controlId);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === controls.length && controls.length > 0);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(controls.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Handle export - downloads ZIP file with controls and evidence
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one control to export');
      return;
    }

    try {
      const response = await api.post(
        '/compliance-management/export',
        { controlIds: Array.from(selectedIds) },
        { responseType: 'blob' }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/zip' });

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Compliance_Export_${new Date().toISOString().split('T')[0]}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  };

  // Handle framework creation
  const handleCreateFramework = async (data: { name: string; description: string }) => {
    await api.post('/compliance-management/frameworks', data);
    fetchFrameworks();
    fetchSummary();
  };

  // Handle control creation
  const handleCreateControl = async (data: { frameworkId: string; name: string; description: string }) => {
    await api.post('/compliance-management/controls', data);
    fetchControls();
    fetchSummary();
  };

  // Handle control update
  const handleUpdateControl = async (data: { id: string; name: string; description: string }) => {
    await api.patch(`/compliance-management/controls/${data.id}`, {
      name: data.name,
      description: data.description
    });
    fetchControls();
    fetchSummary();
  };

  // Handle control deletion
  const handleDeleteControl = async (control: Control) => {
    if (!confirm(`Delete control "${control.name}"?`)) return;
    
    try {
      await api.delete(`/compliance-management/controls/${control.id}`);
      fetchControls();
      fetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete control');
    }
  };

  // Open edit control dialog
  const openEditControl = (control: Control) => {
    setEditingControl(control);
    setShowEditControl(true);
  };

  // Open evidence modal
  const openEvidenceModal = (control: Control, e: React.MouseEvent) => {
    e.stopPropagation();
    setEvidenceControl(control);
    setShowEvidenceModal(true);
  };

  // Handle evidence change (refresh controls after upload/delete)
  const handleEvidenceChange = () => {
    fetchControls();
    fetchSummary();
  };

  return (
    <div className="compliance-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Compliance</h1>
            <p className="header-subtitle">Manage Compliance Frameworks and Controls</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="compliance-summary-grid">
          <div className="summary-card">
            <div className="summary-icon frameworks">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.frameworks}</span>
              <span className="summary-label">Frameworks</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon controls">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.controls}</span>
              <span className="summary-label">Controls</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon evidence">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.evidenceDocuments}</span>
              <span className="summary-label">Evidence Documents</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon missing">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.missingEvidence}</span>
              <span className="summary-label">Missing Evidence</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="toolbar-select-wrapper">
              <select 
                value={selectedFrameworkId} 
                onChange={handleFrameworkChange}
                className="toolbar-select"
              >
                <option value="">All Frameworks</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>{fw.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="select-icon" />
            </div>

            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search controls..." 
                value={searchQuery}
                onChange={handleSearch}
                className="search-input" 
              />
            </div>
          </div>

          <div className="toolbar-actions">
            {(isSuperAdmin || isAdmin) && (
              <button 
                type="button" 
                className="toolbar-btn"
                onClick={handleExport}
                disabled={selectedIds.size === 0}
              >
                <Download size={14} />
                Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
            )}
            
            {(isSuperAdmin || isAdmin) && (
              <button 
                type="button" 
                className="toolbar-btn" 
                onClick={() => setShowAddFramework(true)}
              >
                <Plus size={14} />
                Add Framework
              </button>
            )}
            
            {(isSuperAdmin || isAdmin) && (
              <button 
                type="button" 
                className="toolbar-btn primary" 
                onClick={() => setShowAddControl(true)}
                disabled={frameworks.length === 0}
              >
                <Plus size={14} />
                Add Control
              </button>
            )}
          </div>
        </div>

        {/* Main Table */}
        <TableContainer loading={loading} empty={!loading && controls.length === 0} emptyTitle="No controls found" emptyDescription="Add a framework and controls to get started" emptyIcon={FileCheck}>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5" style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <SortHeader label="Control Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Framework" sortKey="framework" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Evidence" sortKey="evidence" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Last Updated" sortKey="updatedAt" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {controls.map((control) => (
                <TableRow 
                  key={control.id}
                  onClick={() => setSelectedControl(control)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(control.id)}
                      onChange={(e) => handleRowSelect(control.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{control.name}</span>
                      <span className="text-xs text-slate-500">{control.framework.name}</span>
                    </div>
                  </TableCell>
                  <TableCell truncate>
                    <span className="text-sm text-slate-600">
                      {control.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => openEvidenceModal(control, e)}>
                    <button 
                      type="button" 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                      title="View Evidence"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{control._count.evidence}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {formatDate(control.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button" 
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View Details"
                        onClick={() => setSelectedControl(control)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {(isSuperAdmin || isAdmin) && (
                        <>
                          <button 
                            type="button" 
                            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                            onClick={() => openEditControl(control)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button" 
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteControl(control)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableContainer>

        {/* Dialogs */}
        <AddFrameworkDialog
          isOpen={showAddFramework}
          onClose={() => setShowAddFramework(false)}
          onSave={handleCreateFramework}
        />

        <AddControlDialog
          isOpen={showAddControl}
          onClose={() => setShowAddControl(false)}
          onSave={handleCreateControl}
          frameworks={frameworks}
        />

        <EditControlDialog
          isOpen={showEditControl}
          control={editingControl}
          onClose={() => {
            setShowEditControl(false);
            setEditingControl(null);
          }}
          onSave={handleUpdateControl}
        />

        <EvidenceModal
          isOpen={showEvidenceModal}
          controlId={evidenceControl?.id || null}
          controlName={evidenceControl?.name || ''}
          onClose={() => {
            setShowEvidenceModal(false);
            setEvidenceControl(null);
          }}
          onEvidenceChange={handleEvidenceChange}
        />
      </div>
    </div>
  );
}
