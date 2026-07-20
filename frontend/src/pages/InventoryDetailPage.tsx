import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PermissionGate } from '../components/permissions';
import {
  Package,
  Edit2,
  Trash2,
  ArrowLeft,
  FileText,
  ShoppingCart,
  MapPin,
  Clock,
  AlertTriangle,
  Upload,
  Download,
  Plus,
  CheckCircle,
  X,
  Shield,
  Clipboard,
  History,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import {
  PageHeader,
  InventoryDetailHeader,
  StockStatusBadge,
  CategoryBadge,
  LocationBadge,
  SectionCard,
  InfoCard,
  InfoGrid,
  TimelineCard,
  TimelineItem,
  DetailSidebarCard,
  DetailField,
  WarrantyStatusBadge,
  EmptyStateCard,
  LoadingCard,
  ModalLayout,
  DeleteInventoryDialog,
  StockUpdateDialog,
  Button
} from '../components/inventory';

/**
 * PART 4: Inventory Detail Permission Enforcement
 * 
 * This module now enforces granular permissions:
 * - inventory:view - View inventory details
 * - inventory:assign - Assign inventory
 * - inventory:return - Return inventory
 * - inventory:upload_document - Upload documents
 * - inventory:download_document - Download documents
 */

type HistoryEntry = {
  id: string;
  action: string;
  description?: string;
  performedBy: string;
  createdAt: string;
};

type Document = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  documentType: string;
  uploadedBy?: string;
  createdAt: string;
};

type Assignment = {
  id: string;
  status: string;
  assignedDate: string;
  remarks?: string;
  user?: { id: string; name: string; email: string };
  project?: { id: string; projectName: string; projectCode: string };
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendorName?: string;
  vendorId?: string;
  invoiceNo?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  gst?: number;
  warrantyExpiry?: string;
  location?: string;
  status: string;
  currentQty: number;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
  history?: HistoryEntry[];
  documents?: Document[];
};

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  // PART 4: Permission checks using granular permissions
  const canView = hasPermission('inventory:view');
  const canAssign = hasPermission('inventory:assign');
  const canReturn = hasPermission('inventory:return');
  const canUploadDocument = hasPermission('inventory:upload_document');
  const canDownloadDocument = hasPermission('inventory:download_document');

  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockUpdateDialogOpen, setStockUpdateDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Assignment state
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // PART 4: Check access permissions
  useEffect(() => {
    if (!canView) {
      setError('Access Restricted. You do not have permission to access this page.');
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      loadItem();
      loadAssignment();
    }
  }, [id, canView]);

  async function loadItem() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/inventory-master/${id}`);
      setItem(res.data.item);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory item');
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignment() {
    if (!id) return;
    try {
      setLoadingAssignment(true);
      const res = await api.get(`/inventory-assignments/inventory/${id}`);
      setAssignment(res.data.assignment || null);
    } catch {
      setAssignment(null);
    } finally {
      setLoadingAssignment(false);
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(value?: number): string {
    if (value === undefined || value === null) return '-';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Validate file size (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25 MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: PDF, DOC, DOCX, XLSX');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          await api.post(`/inventory-master/${id}/documents`, {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: reader.result as string,
            documentType: 'Document'
          });
          setUploadSuccess('Document uploaded successfully!');
          showToast('Document uploaded successfully!', 'success');
          loadItem();
          e.target.value = '';
        } catch (err: any) {
          setUploadError(err.response?.data?.message || 'Failed to upload document');
          showToast('Failed to upload document', 'error');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document');
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: Document) {
    setDeletingDoc(doc.id);
    try {
      await api.delete(`/inventory-master/${id}/documents/${doc.id}`);
      showToast('Document deleted successfully!', 'success');
      loadItem();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    } finally {
      setDeletingDoc(null);
    }
  }

  async function handleDeleteInventory() {
    if (!item) return;
    
    setDeleting(true);
    try {
      await api.delete(`/inventory-master/${id}`);
      showToast('Inventory item deleted successfully!', 'success');
      setTimeout(() => {
        navigate(`/inventory/${item.category.id}`);
      }, 1000);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete inventory', 'error');
      setDeleting(false);
    }
  }

  async function handleStockUpdate(data: { newQuantity: number; adjustmentType: string; reason: string; notes: string }) {
    if (!item) return;
    try {
      await api.patch(`/inventory-master/${id}`, {
        currentQty: data.newQuantity
      });
      showToast('Stock updated successfully!', 'success');
      setStockUpdateDialogOpen(false);
      loadItem();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update stock', 'error');
    }
  }

  function getStockStatus(): string {
    if (!item) return 'ACTIVE';
    if (item.currentQty === 0) return 'OUT_OF_STOCK';
    if (item.minStock && item.currentQty <= item.minStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-100 rounded"></div>
              <div className="h-4 w-32 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LoadingCard />
              <LoadingCard />
            </div>
            <div className="space-y-6">
              <LoadingCard />
              <LoadingCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Item</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'Inventory item not found'}</p>
          <button
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <InventoryDetailHeader
        itemNo={item.itemNo}
        itemName={item.itemName}
        statusBadge={<StockStatusBadge status={getStockStatus()} />}
        categoryBadge={<CategoryBadge category={item.category.name} />}
        locationBadge={item.location && <LocationBadge location={item.location} />}
        quantity={item.currentQty}
        minStock={item.minStock}
        lastUpdated={item.updatedAt}
        onBackClick={() => navigate(`/inventory/${item.category.id}`)}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Package}
              onClick={() => setStockUpdateDialogOpen(true)}
            >
              Update Stock
            </Button>
            {isSuperAdmin && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => navigate(`/inventory/master/${item.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
            toastType === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            {toastType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage('')} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Stock</p>
                <p className={`text-2xl font-bold ${
                  item.currentQty === 0 
                    ? 'text-red-600' 
                    : item.minStock && item.currentQty <= item.minStock 
                      ? 'text-amber-600' 
                      : 'text-emerald-600'
                }`}>{item.currentQty}</p>
                {item.minStock && (
                  <p className="text-xs text-slate-400 mt-1">Min: {item.minStock}</p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-lg font-semibold text-slate-900 truncate">{item.location || '-'}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Brand</p>
                <p className="text-lg font-semibold text-slate-900 truncate">{item.brand || '-'}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Model</p>
                <p className="text-lg font-semibold text-slate-900 truncate">{item.model || '-'}</p>
              </div>
            </div>

            {/* General Information */}
            <SectionCard
              title="General Information"
              icon={Package}
              iconColor="text-brand-600"
              iconBg="bg-brand-50"
            >
              <InfoGrid columns={3}>
                <InfoCard label="Item Name" value={item.itemName} />
                <InfoCard label="Category" value={<CategoryBadge category={item.category.name} />} />
                <InfoCard label="Subcategory" value={item.subcategory.name} />
                <InfoCard label="Brand" value={item.brand || '-'} />
                <InfoCard label="Model" value={item.model || '-'} />
                <InfoCard label="Status" value={<StockStatusBadge status={getStockStatus()} />} />
              </InfoGrid>
            </SectionCard>

            {/* Stock Details */}
            <SectionCard
              title="Stock Details"
              icon={Package}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500">Current Quantity</p>
                    <p className="text-3xl font-bold text-slate-900">{item.currentQty}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    item.currentQty === 0 
                      ? 'bg-red-100' 
                      : item.minStock && item.currentQty <= item.minStock 
                        ? 'bg-amber-100' 
                        : 'bg-emerald-100'
                  }`}>
                    <Package className={`w-6 h-6 ${
                      item.currentQty === 0 
                        ? 'text-red-600' 
                        : item.minStock && item.currentQty <= item.minStock 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                    }`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Minimum Stock</p>
                    <p className="text-xl font-semibold text-slate-900">{item.minStock ?? '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Stock Status</p>
                    <div className="mt-1">
                      <StockStatusBadge status={getStockStatus()} size="lg" />
                    </div>
                  </div>
                </div>

                {item.minStock && item.currentQty < item.minStock && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-800 text-sm">Low Stock Alert</h4>
                      <p className="text-xs text-amber-600 mt-1">
                        Current stock ({item.currentQty}) is below minimum level ({item.minStock}).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* History */}
            <SectionCard
              title="Activity History"
              icon={History}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
              action={
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                  {item.history?.length || 0} entries
                </span>
              }
            >
              {!item.history || item.history.length === 0 ? (
                <EmptyStateCard
                  icon={History}
                  title="No history available"
                  description="Activity history will appear here as the item is updated."
                />
              ) : (
                <TimelineCard>
                  {item.history.map((entry, index) => (
                    <TimelineItem
                      key={entry.id}
                      icon={History}
                      iconBg={entry.action === 'Created' ? 'bg-emerald-100' : 'bg-slate-100'}
                      iconColor={entry.action === 'Created' ? 'text-emerald-600' : 'text-slate-600'}
                      title={entry.action}
                      description={entry.description}
                      timestamp={formatDateTime(entry.createdAt)}
                      user={entry.performedBy}
                      isLast={index === item.history!.length - 1}
                    />
                  ))}
                </TimelineCard>
              )}
            </SectionCard>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
                </div>
                <div className="p-4 space-y-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={Package}
                    onClick={() => setStockUpdateDialogOpen(true)}
                  >
                    Update Stock
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={Edit2}
                    onClick={() => navigate(`/inventory/master/${item.id}/edit`)}
                  >
                    Edit Item
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    icon={Trash2}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Item
                  </Button>
                </div>
              </div>
            )}

            {/* Purchase Information */}
            <DetailSidebarCard title="Purchase Information" icon={ShoppingCart}>
              <dl className="space-y-3">
                <DetailField label="Invoice Number" value={item.invoiceNo || '-'} />
                <DetailField label="Purchase Date" value={formatDate(item.purchaseDate)} />
                <DetailField label="Purchase Cost" value={formatCurrency(item.purchaseCost)} />
                <DetailField label="GST" value={item.gst ? `${item.gst}%` : '-'} />
                <DetailField 
                  label="Vendor" 
                  value={
                    item.vendorId ? (
                      <button 
                        onClick={() => navigate(`/vendors-licenses/${item.vendorId}`)}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {item.vendorName || 'View Vendor'}
                      </button>
                    ) : (
                      item.vendorName || '-'
                    )
                  } 
                />
              </dl>
            </DetailSidebarCard>

            {/* Warranty Information */}
            <DetailSidebarCard title="Warranty" icon={Shield}>
              <dl className="space-y-3">
                <DetailField label="Warranty Expiry" value={formatDate(item.warrantyExpiry)} />
                {item.warrantyExpiry && (
                  <div className="mt-2">
                    <WarrantyStatusBadge expiryDate={item.warrantyExpiry} size="lg" />
                  </div>
                )}
              </dl>
            </DetailSidebarCard>

            {/* Documents */}
            <DetailSidebarCard 
              title="Documents" 
              icon={FileText}
              className="sticky top-6"
            >
              {isSuperAdmin && (
                <div className="mb-4">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-all duration-200">
                    <Upload className="w-4 h-4" />
                    Upload Document
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400 text-center mt-2">PDF, DOC, DOCX, XLSX (max 25MB)</p>
                  {uploadError && (
                    <p className="text-xs text-red-600 mt-2">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="text-xs text-emerald-600 mt-2">{uploadSuccess}</p>
                  )}
                </div>
              )}

              {!item.documents || item.documents.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {item.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.fileName}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(doc.fileSize)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={doc.url}
                          download={doc.fileName}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            disabled={deletingDoc === doc.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSidebarCard>

            {/* Meta Information */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Item Details</p>
              <dl className="space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-900 font-medium">{formatDate(item.createdAt)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Last Updated</dt>
                  <dd className="text-slate-900 font-medium">{formatDate(item.updatedAt)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Item ID</dt>
                  <dd className="text-slate-900 font-mono text-xs">{item.itemNo}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteInventoryDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteInventory}
        itemNo={item.itemNo}
        itemName={item.itemName}
        isLoading={deleting}
        confirmInput
        confirmInputValue={deleteConfirmText}
        onConfirmInputChange={setDeleteConfirmText}
      />

      {/* Stock Update Dialog */}
      <StockUpdateDialog
        isOpen={stockUpdateDialogOpen}
        onClose={() => setStockUpdateDialogOpen(false)}
        onConfirm={handleStockUpdate}
        currentQuantity={item.currentQty}
        itemName={item.itemName}
      />
    </div>
  );
}
