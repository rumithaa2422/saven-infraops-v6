import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  Ticket,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  History,
  Paperclip,
  Download,
  Trash2,
  Send,
  Edit2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  Users,
  Info,
  X,
  AlertCircle,
  Upload
} from 'lucide-react';
import {
  PageHeader,
  BackButton,
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
  SectionCard,
  InfoCard,
  InfoGrid,
  EmptyStateCard,
  LoadingCard,
  ModalLayout,
  ConfirmationDialog,
  Button
} from '../components/serviceRequests';

type ServiceRequest = {
  id: string;
  ticketNo: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  priority: string;
  status: string;
  requesterName: string;
  assigneeName?: string;
  assigneeId?: string;
  projectName?: string;
  requesterId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Attachment = {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
};

type Comment = {
  id: string;
  requestId: string;
  userId: string | null;
  userName: string;
  message: string;
  createdAt: string;
};

type TimelineEntry = {
  id: string;
  requestId: string;
  action: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
};

const ALLOWED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf,.docx,.xlsx,.txt';

export function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isChangingAssignment, setIsChangingAssignment] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    priority: '',
    projectName: ''
  });

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Ticket Progress state
  const [statusOptions, setStatusOptions] = useState<{ value: string; displayName: string }[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [canChangeStatus, setCanChangeStatus] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusComment, setStatusComment] = useState('');

  // Permission checks
  const canManage = hasPermission('tickets:update') || hasPermission('tickets:manage');
  const canDelete = hasPermission('tickets:delete');
  const canAssign = hasPermission('tickets:assign');
  
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;
  
  const canAccessFullDetails = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  const isAdminWithRestrictedAccess = isAdmin && request?.assigneeId !== user?.id && !isSuperAdmin;
  const canPerformActions = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);
  const canUpload = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  const canDeleteAttachment = isSuperAdmin;
  const canViewChat = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  const canPostChat = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  const canViewTimeline = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);
  const canViewAttachments = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id) || (isEmployee && request?.requesterId === user?.id);
  const canUpdateStatus = isSuperAdmin || (isAdmin && request?.assigneeId === user?.id);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/service-requests/${id}`);
      const loadedRequest = res.data.item;
      
      const requestIsSuperAdmin = user?.roles.includes('Super Admin') ?? false;
      const requestIsAdmin = user?.roles.includes('Admin') ?? false;
      const requestIsEmployee = !requestIsSuperAdmin && !requestIsAdmin;
      
      if (requestIsEmployee && loadedRequest.requesterId !== user?.id) {
        setError('Access Restricted. You can only view your own service requests.');
        setLoading(false);
        return;
      }
      
      if (requestIsAdmin && !requestIsSuperAdmin && loadedRequest.assigneeId !== user?.id) {
        setError('Access Restricted. You can only view service requests assigned to you.');
        setLoading(false);
        return;
      }
      
      setRequest(loadedRequest);
      setError('');
    } catch {
      setError('Failed to load service request details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAttachments() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/attachments`);
      setAttachments(res.data.attachments);
    } catch {
      setAttachments([]);
    }
  }

  async function loadComments() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/comments`);
      setComments(res.data.comments);
    } catch {
      setComments([]);
    }
  }

  async function loadTimeline() {
    if (!id) return;
    try {
      const res = await api.get(`/service-requests/${id}/timeline`);
      setTimeline(res.data.timeline);
    } catch {
      setTimeline([]);
    }
  }

  async function loadAdmins() {
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data);
    } catch {
      setAdmins([]);
    }
  }

  async function loadStatusOptions() {
    if (!id || !request) return;
    try {
      const res = await api.get(`/service-requests/${id}/status-options`);
      setStatusOptions(res.data.allowedTransitions || []);
      setCanChangeStatus(res.data.canChangeStatus || false);
      setSelectedStatus(request.status);
    } catch {
      setStatusOptions([]);
      setCanChangeStatus(false);
    }
  }

  async function updateTicketStatus() {
    if (!id || !request || !selectedStatus || selectedStatus === request.status) return;
    setIsUpdatingStatus(true);
    try {
      const response = await api.patch(`/service-requests/${id}/status`, {
        status: selectedStatus,
        comment: statusComment || undefined
      });
      // Update request with new data
      setRequest(response.data.item);
      // Reload timeline and comments
      setTimeline(response.data.timeline || []);
      setComments(response.data.comments || []);
      setStatusComment('');
      setMessage(response.data.message || 'Status updated successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    load();
    loadAdmins();
  }, [id]);

  useEffect(() => {
    if (request) {
      loadAttachments();
      loadComments();
      loadTimeline();
      loadStatusOptions();
    }
  }, [request?.id]);

  async function updateStatus(payload: Partial<ServiceRequest>) {
    if (!request) return;
    try {
      const response = await api.patch(`/service-requests/${request.id}`, payload);
      setRequest(response.data.item);
      await loadTimeline();
      setMessage('Status updated successfully.');
    } catch {
      setMessage('Failed to update status. Check backend logs.');
    }
  }

  async function sendChatMessage() {
    if (!request || !chatMessage.trim()) return;
    setSendingMessage(true);
    try {
      await api.post(`/service-requests/${request.id}/comments`, {
        message: chatMessage.trim()
      });
      setChatMessage('');
      await loadComments();
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setMessage('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function uploadAttachments(files: FileList) {
    if (!request || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await api.post(`/service-requests/${request.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadAttachments();
      setMessage('Attachments uploaded successfully.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setMessage('Failed to upload attachments.');
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!request) return;
    try {
      await api.delete(`/service-requests/${request.id}/attachments/${attachmentId}`);
      await loadAttachments();
      setMessage('Attachment deleted successfully.');
    } catch {
      setMessage('Failed to delete attachment.');
    }
  }

  function downloadAttachment(attachmentId: string, fileName: string) {
    if (!request) return;
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/service-requests/${request.id}/attachments/${attachmentId}/download`;
    
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
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setMessage('Failed to download attachment.');
      });
  }

  async function assignTicket() {
    if (!request || !selectedAssignee) return;
    try {
      const response = await api.patch(`/service-requests/${request.id}/assign`, {
        assigneeId: selectedAssignee
      });
      setRequest(response.data.item);
      setSelectedAssignee('');
      setMessage('Ticket assigned successfully.');
      await loadTimeline();
    } catch {
      setMessage('Assignment failed. Check backend logs.');
    }
  }

  function startChangeAssignment() {
    setPendingAssignee(request?.assigneeId || '');
    setIsChangingAssignment(true);
  }

  function cancelChangeAssignment() {
    setIsChangingAssignment(false);
    setPendingAssignee('');
  }

  async function saveAssignmentChange() {
    if (!request || !pendingAssignee || pendingAssignee === request.assigneeId) {
      cancelChangeAssignment();
      return;
    }
    try {
      const response = await api.patch(`/service-requests/${request.id}/assign`, {
        assigneeId: pendingAssignee
      });
      setRequest(response.data.item);
      setIsChangingAssignment(false);
      setPendingAssignee('');
      setMessage('Assignment changed successfully.');
      await loadTimeline();
    } catch {
      setMessage('Failed to change assignment. Check backend logs.');
    }
  }

  function handleBack() {
    navigate('/service-requests');
  }

  // Edit handlers
  function openEditDialog() {
    if (!request) return;
    setEditForm({
      title: request.title,
      description: request.description || '',
      category: request.category,
      subCategory: request.subCategory || '',
      priority: request.priority,
      projectName: request.projectName || ''
    });
    setEditOpen(true);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!request) return;
    try {
      await api.put(`/service-requests/${request.id}`, editForm);
      setEditOpen(false);
      await load();
      setMessage('Request updated successfully.');
    } catch {
      setMessage('Failed to update request.');
    }
  }

  function closeEditDialog() {
    setEditOpen(false);
  }

  // Delete handlers
  function openDeleteDialog() {
    setDeleteConfirmText('');
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!request || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(`/service-requests/${request.id}`);
      navigate('/service-requests');
    } catch {
      setMessage('Failed to delete request.');
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function closeDeleteDialog() {
    setDeleteOpen(false);
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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatChatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="bg-white border-b border-slate-200/60 px-6 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <BackButton onClick={handleBack} />
            <div className="flex-1 animate-pulse">
              <div className="h-8 w-48 bg-slate-100 rounded-lg mb-2" />
              <div className="h-4 w-32 bg-slate-50 rounded" />
            </div>
          </div>
        </div>
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <LoadingCard lines={5} />
        </main>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="bg-white border-b border-slate-200/60 px-6 py-4">
          <div className="max-w-[1600px] mx-auto">
            <BackButton onClick={handleBack} />
          </div>
        </div>
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <EmptyStateCard
            icon={AlertTriangle}
            title={error || 'Service request not found'}
            description="Please check the URL or go back to the service requests list."
            action={
              <Button onClick={handleBack}>
                Back to Service Requests
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header - Modern Purple Gradient */}
      <PageHeader
        title="Service Request Details"
        showBackButton
        onBackClick={handleBack}
        actions={
          <div className="flex items-center gap-2">
            {canPerformActions && (
              <button
                onClick={openEditDialog}
                className="px-4 py-2 rounded-xl bg-white text-purple-600 font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg shadow-purple-500/30 flex items-center gap-2 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={openDeleteDialog}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-500/30 flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        
        {/* Request Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1.5 bg-brand-50 text-brand-700 font-mono font-semibold rounded-lg">
                    {request.ticketNo}
                  </span>
                  <StatusBadge status={request.status} size="lg" />
                  <PriorityBadge priority={request.priority} size="lg" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{request.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{request.requesterName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(request.createdAt)}</span>
                  </div>
                  {request.projectName && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{request.projectName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          {(isSuperAdmin || canPerformActions) && (
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600 mr-2">Actions:</span>
                {isSuperAdmin && request.status === 'OPEN' && (
                  <>
                    <Button size="sm" variant="secondary" icon={Users} onClick={() => updateStatus({ status: 'ASSIGNED' })}>
                      Assign
                    </Button>
                    <Button size="sm" variant="secondary" icon={Play} onClick={() => updateStatus({ status: 'IN_PROGRESS' })}>
                      Start Progress
                    </Button>
                  </>
                )}
                {isSuperAdmin && request.status === 'ASSIGNED' && (
                  <>
                    <Button size="sm" variant="secondary" icon={Play} onClick={() => updateStatus({ status: 'IN_PROGRESS' })}>
                      Start Progress
                    </Button>
                    <Button size="sm" variant="secondary" icon={XCircle} onClick={() => updateStatus({ status: 'CLOSED' })}>
                      Close
                    </Button>
                  </>
                )}
                {(isSuperAdmin || canPerformActions) && request.status === 'IN_PROGRESS' && (
                  <>
                    <Button size="sm" variant="secondary" icon={Pause} onClick={() => updateStatus({ status: 'WAITING_FOR_USER' })}>
                      Wait for User
                    </Button>
                    <Button size="sm" variant="secondary" icon={CheckCircle} onClick={() => updateStatus({ status: 'COMPLETED' })}>
                      Mark Complete
                    </Button>
                  </>
                )}
                {(isSuperAdmin || canPerformActions) && request.status === 'WAITING_FOR_USER' && (
                  <>
                    <Button size="sm" variant="secondary" icon={Play} onClick={() => updateStatus({ status: 'IN_PROGRESS' })}>
                      Resume Progress
                    </Button>
                    <Button size="sm" variant="secondary" icon={CheckCircle} onClick={() => updateStatus({ status: 'COMPLETED' })}>
                      Mark Complete
                    </Button>
                  </>
                )}
                {(isSuperAdmin || canPerformActions) && request.status === 'COMPLETED' && (
                  <Button size="sm" variant="secondary" icon={XCircle} onClick={() => updateStatus({ status: 'CLOSED' })}>
                    Close Ticket
                  </Button>
                )}
                {(isSuperAdmin || canPerformActions) && request.status === 'CLOSED' && (
                  <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => updateStatus({ status: 'OPEN' })}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Access Notice */}
          {isAdminWithRestrictedAccess && (
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  This ticket is assigned to another admin. You can only view but not modify it.
                </span>
              </div>
            </div>
          )}

          {isEmployee && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Status changes are managed by the assigned administrator.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Request Information */}
            <SectionCard title="Request Information" icon={FileText}>
              <div className="space-y-6">
                {canAccessFullDetails ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {request.description || 'No description provided.'}
                      </p>
                    </div>
                    <InfoGrid columns={3}>
                      <InfoCard label="Category" value={request.category} />
                      <InfoCard label="Sub Category" value={request.subCategory || '—'} />
                      <InfoCard label="Project" value={request.projectName || '—'} />
                    </InfoGrid>
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-sm text-slate-500">Description is restricted</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Attachments */}
            <SectionCard title="Attachments" icon={Paperclip}>
              {canViewAttachments ? (
                <div className="space-y-4">
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-brand-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{attachment.fileName}</p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(attachment.fileSize)} • {formatTimeAgo(attachment.uploadedAt)}
                              {attachment.uploadedByName && ` by ${attachment.uploadedByName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadAttachment(attachment.id, attachment.fileName)}
                              className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {canDeleteAttachment && (
                              <button
                                onClick={() => deleteAttachment(attachment.id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard
                      icon={Paperclip}
                      title="No attachments"
                      description="Files uploaded to this request will appear here."
                    />
                  )}
                  {canUpload && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_FILE_TYPES}
                        multiple
                        onChange={(e) => e.target.files && uploadAttachments(e.target.files)}
                        className="hidden"
                        id="attachment-upload-detail"
                      />
                      <label htmlFor="attachment-upload-detail" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600">
                          {uploading ? 'Uploading...' : 'Click to upload files'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG, PDF, DOCX, XLSX, TXT
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-sm text-slate-500">Attachments not available</p>
                </div>
              )}
            </SectionCard>

            {/* Conversation */}
            <SectionCard title="Conversation" icon={MessageSquare}>
              {canViewChat ? (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {comments.length > 0 ? (
                      comments.map(comment => (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-xl ${comment.userId === user?.id ? 'bg-brand-50 ml-8' : 'bg-slate-50 mr-8'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900">{comment.userName}</span>
                            <span className="text-xs text-slate-500">{formatChatTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.message}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyStateCard
                        icon={MessageSquare}
                        title="No messages yet"
                        description="Start the conversation to discuss this request."
                      />
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {canPostChat ? (
                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                      />
                      <Button
                        icon={Send}
                        onClick={sendChatMessage}
                        disabled={sendingMessage || !chatMessage.trim()}
                        loading={sendingMessage}
                      >
                        Send
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <p className="text-sm text-slate-500">You cannot reply to this conversation.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-sm text-slate-500">Conversation not available</p>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Assignment */}
            <SectionCard title="Assignment" icon={Users}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.assigneeName || 'Unassigned'}
                    </p>
                    <p className="text-xs text-slate-500">Assigned Engineer</p>
                  </div>
                </div>
                {canAssign && (
                  <>
                    {isChangingAssignment ? (
                      <div className="space-y-3">
                        <select
                          value={pendingAssignee}
                          onChange={(e) => setPendingAssignee(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                        >
                          <option value="">Select an engineer</option>
                          {admins.map(admin => (
                            <option key={admin.id} value={admin.id}>{admin.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={cancelChangeAssignment} className="flex-1">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveAssignmentChange} className="flex-1">
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Edit2} onClick={startChangeAssignment} fullWidth>
                        Change Assignment
                      </Button>
                    )}
                  </>
                )}
              </div>
            </SectionCard>

            {/* Ticket Progress - Phase D1 */}
            {canUpdateStatus && (
              <SectionCard title="Ticket Progress" icon={Ticket}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {request.status === 'OPEN' && 'Open'}
                        {request.status === 'ASSIGNED' && 'Assigned'}
                        {request.status === 'IN_PROGRESS' && 'In Progress'}
                        {request.status === 'WAITING_FOR_USER' && 'Waiting for User'}
                        {request.status === 'COMPLETED' && 'Completed'}
                        {request.status === 'CLOSED' && 'Closed'}
                      </p>
                      <p className="text-xs text-slate-500">Current Status</p>
                    </div>
                  </div>
                  
                  {statusOptions.length > 0 ? (
                    <div className="space-y-3">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                      >
                        <option value={request.status} disabled>
                          {request.status === 'OPEN' && 'Open'}
                          {request.status === 'ASSIGNED' && 'Assigned'}
                          {request.status === 'IN_PROGRESS' && 'In Progress'}
                          {request.status === 'WAITING_FOR_USER' && 'Waiting for User'}
                          {request.status === 'COMPLETED' && 'Completed'}
                          {request.status === 'CLOSED' && 'Closed'}
                        </option>
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.displayName}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                      />
                      
                      <Button 
                        size="sm" 
                        onClick={updateTicketStatus}
                        disabled={!selectedStatus || selectedStatus === request.status || isUpdatingStatus}
                        loading={isUpdatingStatus}
                        fullWidth
                      >
                        Update Status
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No status transitions available from this status.
                    </p>
                  )}
                  
                  {request.updatedAt && (
                    <p className="text-xs text-slate-400">
                      Last updated: {new Date(request.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Timeline */}
            {canViewTimeline && timeline.length > 0 && (
              <SectionCard title="Activity Timeline" icon={History}>
                <div className="space-y-4">
                  {timeline.slice(0, 10).map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <History className="w-4 h-4 text-slate-500" />
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-100 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                        {entry.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {entry.performedByName || 'System'} • {formatTimeAgo(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <ModalLayout
        isOpen={editOpen}
        onClose={closeEditDialog}
        title="Edit Service Request"
        subtitle={`Editing ${request.ticketNo}`}
        size="xl"
        icon="✏️"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button icon={Edit2} onClick={submitEdit as any}>
              Update Request
            </Button>
          </div>
        }
      >
        <form onSubmit={submitEdit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </ModalLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Service Request"
        message={`Are you sure you want to delete ${request?.ticketNo}? This action cannot be undone.`}
        confirmText="Delete Request"
        variant="danger"
        isLoading={deleting}
        confirmInput
        confirmInputValue={deleteConfirmText}
        onConfirmInputChange={setDeleteConfirmText}
        confirmInputPlaceholder="Type DELETE to confirm"
      />

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-sm">{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
