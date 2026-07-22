/**
 * Compliance Management Page
 * 
 * Enterprise compliance framework and control management interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { FileCheck, Plus, Download, ChevronDown, ExternalLink, Edit2, Trash2, Paperclip } from 'lucide-react';
import { StatusBadge, AddFrameworkDialog, AddControlDialog, EditControlDialog, EvidenceModal } from '../components/compliance';

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
  pendingReview: number;
  approved: number;
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
    pendingReview: 0,
    approved: 0,
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
  const handleExport = () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one control to export');
      return;
    }

    const token = localStorage.getItem('token');
    const exportUrl = '/api/compliance-management/export';

    fetch(exportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ controlIds: Array.from(selectedIds) })
    })
      .then(response => {
        if (!response.ok) throw new Error('Export failed');
        // Extract filename from Content-Disposition header
        const disposition = response.headers.get('Content-Disposition');
        let filename = `Compliance_Export_${new Date().toISOString().split('T')[0]}.zip`;
        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match) {
            filename = match[1];
          }
        }
        return response.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Failed to export data');
      });
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
  const handleUpdateControl = async (data: { id: string; name: string; description: string; status: string }) => {
    await api.patch(`/compliance-management/controls/${data.id}`, {
      name: data.name,
      description: data.description,
      status: data.status
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
            <div className="summary-icon pending">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.pendingReview}</span>
              <span className="summary-label">Pending Review</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon approved">
              <FileCheck size={20} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.approved}</span>
              <span className="summary-label">Approved</span>
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
        <div className="table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Control List Name</th>
                  <th>Description</th>
                  <th style={{ width: '100px' }}>Evidence</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '130px' }}>Last Updated</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="table-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading...</p>
                    </td>
                  </tr>
                ) : controls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      <FileCheck size={48} strokeWidth={1} />
                      <p>No controls found</p>
                      <span>Add a framework and controls to get started</span>
                    </td>
                  </tr>
                ) : (
                  controls.map((control) => (
                    <tr 
                      key={control.id}
                      onClick={() => setSelectedControl(control)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(control.id)}
                          onChange={(e) => handleRowSelect(control.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="control-name-cell">
                          <span className="control-name">{control.name}</span>
                          <span className="control-framework">{control.framework.name}</span>
                        </div>
                      </td>
                      <td className="description-cell">
                        {control.description || '-'}
                      </td>
                      <td className="evidence-cell" onClick={(e) => openEvidenceModal(control, e)}>
                        <button type="button" className="evidence-btn" title="View Evidence">
                          <Paperclip size={14} />
                          <span>{control._count.evidence}</span>
                        </button>
                      </td>
                      <td>
                        <StatusBadge status={control.status as any} />
                      </td>
                      <td className="date-cell">
                        {formatDate(control.updatedAt)}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button 
                            type="button" 
                            className="action-btn"
                            title="View Details"
                            onClick={() => setSelectedControl(control)}
                          >
                            <ExternalLink size={14} />
                          </button>
                          {(isSuperAdmin || isAdmin) && (
                            <>
                              <button 
                                type="button" 
                                className="action-btn"
                                title="Edit"
                                onClick={() => openEditControl(control)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                type="button" 
                                className="action-btn danger"
                                title="Delete"
                                onClick={() => handleDeleteControl(control)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
