import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  AlertTriangle,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  FileText,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCheck,
  History,
  Shield,
  Building2,
  Server,
  Users,
  X
} from 'lucide-react';
import {
  IncidentDetailHeader,
  IncidentStatusBadge,
  SeverityBadge,
  SectionCard,
  InfoCard,
  InfoGrid,
  EmptyStateCard,
  LoadingCard,
  TimelineItem,
  Button,
  ModalLayout,
  ResolveIncidentDialog,
  DeleteIncidentDialog
} from '../components/incidents';

/**
 * PART 3: Incidents Permission Enforcement
 * 
 * This module now enforces granular permissions:
 * - incidents:view - View incidents (list and details)
 * - incidents:create - Create new incidents
 * - incidents:update - Update incident details
 * - incidents:delete - Delete incidents
 * - incidents:update_status - Change incident status
 * - incidents:update_severity - Change incident severity
 * - incidents:upload_resolution - Upload resolution documents
 * - incidents:export - Export incidents
 */

type Incident = {
  id: string;
  incidentNo: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  impactedService?: string;
  impactedProject?: string;
  ownerName?: string;
  resolutionDocUploadedAt?: string;
  resolutionDocReplacedAt?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ResolutionDocument = {
  id: string;
  incidentId: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
};

type TimelineEntry = {
  action: string;
  description: string;
  performedByName: string | null;
  createdAt: string;
  icon: 'create' | 'ownership' | 'upload' | 'status' | 'system';
};

const ALLOWED_FILE_TYPES = '.pdf,.doc,.docx,.txt';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [resolutionDoc, setResolutionDoc] = useState<ResolutionDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [takingOwnership, setTakingOwnership] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PART 3: Permission checks using granular permissions
  const canView = hasPermission('incidents:view');
  const canUpdate = hasPermission('incidents:update');
  const canUpdateStatus = hasPermission('incidents:update_status');
  const canUpdateSeverity = hasPermission('incidents:update_severity');
  const canUploadResolution = hasPermission('incidents:upload_resolution');
  const canDeleteResolution = hasPermission('incidents:delete_resolution');
  const canDelete = hasPermission('incidents:delete');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  
  // Can view timeline: Admin, Super Admin, or has permission
  const canViewTimeline = isSuperAdmin || isAdmin || hasPermission('incidents:view');
  
  // Can take ownership: Admin, Super Admin (only if not already owned)
  const canTakeOwnership = (isSuperAdmin || isAdmin) && !incident?.ownerName;
  
  // Is already owned
  const isOwned = !!incident?.ownerName;
  
  // Is the owner of the incident (for resolution document upload)
  const isOwner = isOwned && incident?.ownerName === user?.name;
  
  // Can upload resolution document: owner only OR has permission
  const canUploadResolutionDoc = (isOwner && canUploadResolution) || (isSuperAdmin && canUploadResolution);
  
  // Can change status: owner only OR has permission
  const canChangeStatus = (isOwner && canUpdateStatus) || (isSuperAdmin && canUpdateStatus);
  
  // Get next status based on current status
  function getNextStatus(): string | null {
    if (!incident) return null;
    switch (incident.status) {
      case 'OPEN': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'RESOLVED';
      case 'RESOLVED': return 'CLOSED';
      default: return null;
    }
  }
  
  // Get button label for next status
  function getStatusButtonLabel(): string {
    switch (getNextStatus()) {
      case 'IN_PROGRESS': return 'Move to In Progress';
      case 'RESOLVED': return 'Mark as Resolved';
      case 'CLOSED': return 'Close Incident';
      default: return '';
    }
  }

  // Build timeline from incident data
  function buildTimeline(): TimelineEntry[] {
    if (!incident) return [];
    
    const entries: TimelineEntry[] = [];
    
    // Incident Created entry
    entries.push({
      action: 'Incident Created',
      description: `Incident ${incident.incidentNo} was created`,
      performedByName: null,
      createdAt: incident.createdAt || '',
      icon: 'create'
    });
    
    // Ownership Taken entry
    if (incident.ownerName) {
      entries.push({
        action: 'Ownership Taken',
        description: `${incident.ownerName} took ownership of this incident`,
        performedByName: incident.ownerName,
        createdAt: incident.updatedAt || incident.createdAt || '',
        icon: 'ownership'
      });
    }
    
    // Resolution Document Uploaded entry
    if (incident.resolutionDocUploadedAt) {
      entries.push({
        action: 'Resolution Document Uploaded',
        description: `Resolution document was uploaded`,
        performedByName: resolutionDoc?.uploadedByName || null,
        createdAt: incident.resolutionDocUploadedAt,
        icon: 'upload'
      });
    }
    
    // Status Changed entry
    if (incident.statusChangedAt) {
      entries.push({
        action: 'Status Changed',
        description: `Status changed to ${incident.status.replace(/_/g, ' ')}`,
        performedByName: incident.statusChangedBy || null,
        createdAt: incident.statusChangedAt,
        icon: 'status'
      });
    }
    
    return entries.reverse();
  }

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data.item);
      setError('');
    } catch {
      setError('Failed to load incident details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadResolutionDocument() {
    if (!id) return;
    try {
      const res = await api.get(`/incidents/${id}/resolution-document`);
      setResolutionDoc(res.data.document);
    } catch {
      setResolutionDoc(null);
    }
  }

  async function takeOwnership() {
    if (!incident || !user) return;
    setTakingOwnership(true);
    try {
      const response = await api.patch(`/incidents/${incident.id}/ownership`, {
        ownerName: user.name
      });
      setIncident(response.data.item);
      setMessage('Ownership taken successfully.');
    } catch {
      setMessage('Failed to take ownership.');
    } finally {
      setTakingOwnership(false);
    }
  }

  async function changeStatus() {
    if (!incident) return;
    const newStatus = getNextStatus();
    if (!newStatus) return;

    setChangingStatus(true);
    try {
      const response = await api.patch(`/incidents/${incident.id}/status`, {
        status: newStatus
      });
      setIncident(response.data.item);
      setResolveDialogOpen(false);
      setResolveNotes('');
      setMessage(`Status changed to ${newStatus.replace(/_/g, ' ')} successfully.`);
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to change status.');
    } finally {
      setChangingStatus(false);
    }
  }

  async function uploadResolutionDocument(files: FileList) {
    if (!incident || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      await api.post(`/incidents/${incident.id}/resolution-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Resolution document uploaded successfully.');
      await loadResolutionDocument();
      await load();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to upload resolution document.');
    } finally {
      setUploading(false);
    }
  }

  function downloadResolutionDocument() {
    if (!incident) return;
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/incidents/${incident.id}/resolution-document/download`;

    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resolutionDoc?.fileName || 'resolution-document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setMessage('Failed to download resolution document.');
      });
  }

  async function deleteIncident() {
    if (!incident || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/incidents/${incident.id}`);
      setMessage('Incident deleted successfully.');
      setDeleteDialogOpen(false);
      setTimeout(() => {
        navigate('/incidents');
      }, 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to delete incident.');
    } finally {
      setDeleting(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return '-';
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
    return formatDate(dateStr);
  }

  function getTimelineIcon(iconType: string) {
    switch (iconType) {
      case 'create': return AlertTriangle;
      case 'ownership': return Users;
      case 'upload': return FileCheck;
      case 'status': return History;
      default: return Clock;
    }
  }

  function getTimelineIconBg(iconType: string) {
    switch (iconType) {
      case 'create': return 'bg-blue-100';
      case 'ownership': return 'bg-purple-100';
      case 'upload': return 'bg-emerald-100';
      case 'status': return 'bg-amber-100';
      default: return 'bg-slate-100';
    }
  }

  function getTimelineIconColor(iconType: string) {
    switch (iconType) {
      case 'create': return 'text-blue-600';
      case 'ownership': return 'text-purple-600';
      case 'upload': return 'text-emerald-600';
      case 'status': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (incident) {
      loadResolutionDocument();
    }
  }, [incident?.id]);

  function handleBack() {
    navigate('/incidents');
  }

  if (loading) {
    return (
      <div className="workspace">
        <div className="page-stack incident-detail">
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-icon">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '16px', marginTop: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="workspace">
        <div className="page-stack incident-detail">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn-back" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="page-header-icon">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="page-header-title">Error</h1>
              </div>
            </div>
          </div>
          <div className="detail-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error || 'Incident not found.'}</p>
            <button className="btn-back" onClick={handleBack}>
              Back to Incidents
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeline = buildTimeline();
  const nextStatus = getNextStatus();

  return (
    <div className="workspace">
      <div className="page-stack incident-detail">
        {/* Header */}
        <IncidentDetailHeader
          incidentNo={incident.incidentNo}
          title={incident.title}
          statusBadge={<IncidentStatusBadge status={incident.status} size="lg" variant="light" />}
          severityBadge={<SeverityBadge severity={incident.severity} size="lg" variant="light" />}
          ownerName={incident.ownerName}
          createdAt={incident.createdAt || ''}
          onBackClick={handleBack}
          actions={
            <div className="flex items-center gap-2">
              {canUpdate && (
                <button className="btn-secondary">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canChangeStatus && nextStatus && (
                <button 
                  onClick={() => setResolveDialogOpen(true)}
                  className={`btn ${nextStatus === 'RESOLVED' ? 'btn-success' : 'btn-primary'}`}
                >
                  {nextStatus === 'RESOLVED' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {getStatusButtonLabel()}
                </button>
              )}
              {canDelete && (
                <button onClick={() => setDeleteDialogOpen(true)} className="btn-danger">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          }
        />

        <div className="content-section">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Description */}
            <SectionCard title="Description" icon={FileText}>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {incident.description || 'No description provided for this incident.'}
                </p>
              </div>
            </SectionCard>

            {/* Affected Services */}
            {(incident.impactedService || incident.impactedProject) && (
              <SectionCard title="Affected Services" icon={Server}>
                <InfoGrid columns={2}>
                  {incident.impactedService && (
                    <InfoCard 
                      label="Impacted Service" 
                      value={incident.impactedService}
                      icon={Building2}
                    />
                  )}
                  {incident.impactedProject && (
                    <InfoCard 
                      label="Impacted Project" 
                      value={incident.impactedProject}
                      icon={Server}
                    />
                  )}
                </InfoGrid>
              </SectionCard>
            )}

            {/* Resolution Document */}
            <SectionCard title="Resolution Document" icon={FileCheck}>
              {resolutionDoc ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{resolutionDoc.fileName}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span>{formatFileSize(resolutionDoc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {formatTimeAgo(resolutionDoc.uploadedAt)}</span>
                        {resolutionDoc.uploadedByName && (
                          <>
                            <span>•</span>
                            <span>by {resolutionDoc.uploadedByName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" icon={Download} onClick={downloadResolutionDocument}>
                      Download
                    </Button>
                  </div>
                  
                  {!canUploadResolutionDoc && isOwned && incident.ownerName !== user?.name && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-sm text-amber-700">
                        This incident is handled by <span className="font-semibold">{incident.ownerName}</span>
                      </p>
                    </div>
                  )}

                  {canUploadResolutionDoc && (
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_FILE_TYPES}
                        onChange={(e) => e.target.files && uploadResolutionDocument(e.target.files)}
                        className="hidden"
                        id="resolution-doc-upload"
                      />
                      <label 
                        htmlFor="resolution-doc-upload" 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Replace Document'}
                      </label>
                      <span className="text-xs text-slate-400">pdf, doc, docx, txt (max 25MB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">No resolution document uploaded</p>
                  
                  {!canUploadResolutionDoc && isOwned && incident.ownerName !== user?.name && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 inline-block">
                      <p className="text-sm text-amber-700">
                        This incident is handled by <span className="font-semibold">{incident.ownerName}</span>
                      </p>
                    </div>
                  )}

                  {canUploadResolutionDoc && (
                    <div className="mt-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_FILE_TYPES}
                        onChange={(e) => e.target.files && uploadResolutionDocument(e.target.files)}
                        className="hidden"
                        id="resolution-doc-upload-new"
                      />
                      <label 
                        htmlFor="resolution-doc-upload-new" 
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50/50 cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload Resolution Document'}
                      </label>
                      <p className="text-xs text-slate-400 mt-2">pdf, doc, docx, txt (max 25MB)</p>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Timeline */}
            {canViewTimeline ? (
              <SectionCard title="Activity Timeline" icon={History}>
                {timeline.length === 0 ? (
                  <EmptyStateCard
                    icon={Clock}
                    title="No activity yet"
                    description="Timeline events will appear as actions are taken on this incident."
                  />
                ) : (
                  <div className="space-y-0">
                    {timeline.map((entry, index) => {
                      const Icon = getTimelineIcon(entry.icon);
                      return (
                        <TimelineItem
                          key={index}
                          icon={Icon}
                          iconBg={getTimelineIconBg(entry.icon)}
                          iconColor={getTimelineIconColor(entry.icon)}
                          title={entry.action}
                          description={entry.description}
                          timestamp={formatTimeAgo(entry.createdAt)}
                          user={entry.performedByName || undefined}
                          isLast={index === timeline.length - 1}
                        />
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            ) : (
              <SectionCard title="Activity Timeline" icon={History}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">You do not have permission to view the timeline.</p>
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Info */}
            <SectionCard title="Quick Info" icon={AlertTriangle}>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Status</span>
                  <IncidentStatusBadge status={incident.status} size="sm" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Severity</span>
                  <SeverityBadge severity={incident.severity} size="sm" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Created</span>
                  <span className="text-sm font-medium text-slate-700">{formatDate(incident.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">Last Updated</span>
                  <span className="text-sm font-medium text-slate-700">{formatTimeAgo(incident.updatedAt)}</span>
                </div>
              </div>
            </SectionCard>

            {/* Ownership */}
            {(isSuperAdmin || isAdmin) && (
              <SectionCard title="Ownership" icon={Users}>
                {isOwned ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{incident.ownerName}</p>
                      <p className="text-xs text-slate-500">Assigned Engineer</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 mb-4">This incident is not assigned</p>
                    <Button 
                      onClick={takeOwnership} 
                      loading={takingOwnership}
                      icon={Users}
                      fullWidth
                    >
                      {takingOwnership ? 'Taking Ownership...' : 'Take Ownership'}
                    </Button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Status Actions */}
            <SectionCard title="Status Workflow" icon={AlertCircle}>
              <div className="space-y-4">
                {/* Current Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Current Status</p>
                  <IncidentStatusBadge status={incident.status} size="md" />
                </div>

                {/* Next Status */}
                {nextStatus ? (
                  canChangeStatus ? (
                    <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                      <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-2">Next Action</p>
                      <Button 
                        variant={nextStatus === 'RESOLVED' ? 'success' : 'primary'}
                        onClick={() => setResolveDialogOpen(true)}
                        icon={nextStatus === 'RESOLVED' ? CheckCircle : AlertTriangle}
                        fullWidth
                      >
                        {getStatusButtonLabel()}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-sm text-amber-700">
                        {isOwned 
                          ? 'Only the assigned owner can change the status' 
                          : 'Take ownership to change the status'}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Incident Closed</span>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Resolve/Close Dialog */}
      <ResolveIncidentDialog
        isOpen={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        onConfirm={changeStatus}
        incidentNo={incident.incidentNo}
        currentStatus={incident.status}
        action={getNextStatus() === 'CLOSED' ? 'close' : 'resolve'}
        notes={resolveNotes}
        onNotesChange={setResolveNotes}
        isLoading={changingStatus}
      />

      {/* Delete Dialog */}
      <DeleteIncidentDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={deleteIncident}
        incidentNo={incident.incidentNo}
        incidentTitle={incident.title}
        isLoading={deleting}
        confirmInput
        confirmInputValue={deleteConfirmText}
        onConfirmInputChange={setDeleteConfirmText}
      />

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-sm">{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
