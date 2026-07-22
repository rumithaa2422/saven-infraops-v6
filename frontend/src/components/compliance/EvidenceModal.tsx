/**
 * Evidence Modal Component
 * 
 * Modal for viewing, uploading, and managing evidence documents for a control.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { Upload, Download, Trash2, X, FileText, Loader2 } from 'lucide-react';

interface Evidence {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string | null;
  uploadedAt: string;
}

interface EvidenceModalProps {
  isOpen: boolean;
  controlId: string | null;
  controlName: string;
  onClose: () => void;
  onEvidenceChange: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip';
const ALLOWED_FORMATS = 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, ZIP';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function EvidenceModal({ isOpen, controlId, controlName, onClose, onEvidenceChange }: EvidenceModalProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch evidence when modal opens
  const fetchEvidence = useCallback(async () => {
    if (!controlId || !isOpen) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/compliance-management/evidence/${controlId}`);
      setEvidence(res.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [controlId, isOpen]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !controlId) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 20 MB limit');
      return;
    }

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ALLOWED_EXTENSIONS.split(',');
    if (!allowedExts.includes(ext)) {
      setError(`File type not allowed. Allowed: ${ALLOWED_FORMATS}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await api.post(`/compliance-management/evidence/${controlId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh evidence list
      await fetchEvidence();
      onEvidenceChange();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file download - uses fetch to get blob and trigger browser download
  const handleDownload = (evidenceItem: Evidence) => {
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/compliance-management/evidence/${evidenceItem.id}/download`;

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
        a.download = evidenceItem.filePath; // Use original filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setError('Failed to download file. Please try again.');
      });
  };

  // Handle file deletion
  const handleDelete = async (evidenceId: string) => {
    try {
      await api.delete(`/compliance-management/evidence/${evidenceId}`);
      setDeleteConfirm(null);
      await fetchEvidence();
      onEvidenceChange();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="evidence-modal-overlay" onClick={onClose}>
      <div className="evidence-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="evidence-modal-header">
          <div className="evidence-modal-header-content">
            <h2>Evidence Documents</h2>
            <p className="evidence-modal-subtitle">{controlName}</p>
          </div>
          <button type="button" className="evidence-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="evidence-modal-body">
          {/* Error Alert */}
          {error && (
            <div className="evidence-alert evidence-alert-error">
              <span>{error}</span>
              <button type="button" className="evidence-alert-close" onClick={() => setError('')}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="evidence-upload-section">
            <div className="evidence-upload-info">
              <div className="evidence-upload-stats">
                <span className="evidence-count">{evidence.length} document{evidence.length !== 1 ? 's' : ''}</span>
                <span className="evidence-separator">•</span>
                <span className="evidence-format">Max {formatFileSize(MAX_FILE_SIZE)}</span>
              </div>
              <div className="evidence-format-list">
                Allowed: {ALLOWED_FORMATS}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="evidence-file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="evidence-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="evidence-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Evidence
                </>
              )}
            </button>
            {uploading && (
              <div className="evidence-progress">
                <div className="evidence-progress-bar">
                  <div 
                    className="evidence-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="evidence-progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Evidence Table */}
          <div className="evidence-table-wrapper">
            {loading ? (
              <div className="evidence-state evidence-loading">
                <Loader2 size={32} className="evidence-spin" />
                <span>Loading evidence...</span>
              </div>
            ) : evidence.length === 0 ? (
              <div className="evidence-state evidence-empty">
                <FileText size={48} strokeWidth={1} />
                <p>No evidence documents</p>
                <span>Upload files to document compliance</span>
              </div>
            ) : (
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th className="col-filename">File Name</th>
                    <th className="col-filesize">File Size</th>
                    <th className="col-uploadedby">Uploaded By</th>
                    <th className="col-date">Uploaded Date</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((item) => (
                    <tr key={item.id}>
                      <td className="col-filename">
                        <div className="evidence-file-cell" title={item.filePath}>
                          <FileText size={18} />
                          <span className="evidence-filename">{item.filePath}</span>
                        </div>
                      </td>
                      <td className="col-filesize">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="col-uploadedby">
                        {item.uploadedBy || 'System'}
                      </td>
                      <td className="col-date">
                        {formatDate(item.uploadedAt)}
                      </td>
                      <td className="col-actions">
                        <div className="evidence-actions">
                          <button
                            type="button"
                            className="evidence-action-btn"
                            title="Download"
                            onClick={() => handleDownload(item)}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            className="evidence-action-btn evidence-action-delete"
                            title="Delete"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="evidence-modal-footer">
          <button type="button" className="evidence-btn evidence-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="evidence-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="evidence-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Evidence</h3>
              <p>Are you sure you want to delete this evidence document? This action cannot be undone.</p>
              <div className="evidence-confirm-actions">
                <button 
                  type="button" 
                  className="evidence-btn evidence-btn-secondary" 
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="evidence-btn evidence-btn-danger" 
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
