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
      setError(`File type not allowed. Allowed: ${ALLOWED_EXTENSIONS}`);
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

  // Handle file download
  const handleDownload = async (evidenceItem: Evidence) => {
    try {
      const response = await api.get(
        `/compliance-management/evidence/${evidenceItem.id}/download`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', evidenceItem.filePath);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal evidence-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>Evidence Documents</h2>
            <p className="modal-subtitle">{controlName}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              {error}
              <button type="button" className="alert-close" onClick={() => setError('')}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="evidence-upload-section">
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
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Evidence
                </>
              )}
            </button>
            <span className="upload-hint">
              Max 20 MB. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, ZIP
            </span>
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Evidence Table */}
          <div className="evidence-table-container">
            {loading ? (
              <div className="evidence-loading">
                <Loader2 size={24} className="spin" />
                <span>Loading evidence...</span>
              </div>
            ) : evidence.length === 0 ? (
              <div className="evidence-empty">
                <FileText size={48} strokeWidth={1} />
                <p>No evidence documents</p>
                <span>Upload files to document compliance</span>
              </div>
            ) : (
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Uploaded Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="file-name-cell">
                          <FileText size={16} />
                          <div className="file-info">
                            <span className="file-name">{item.filePath}</span>
                            <span className="file-size">{formatFileSize(item.fileSize)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="uploaded-by-cell">
                        {item.uploadedBy || 'System'}
                      </td>
                      <td className="date-cell">
                        {formatDate(item.uploadedAt)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="action-btn"
                            title="Download"
                            onClick={() => handleDownload(item)}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            className="action-btn danger"
                            title="Delete"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 size={14} />
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
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="confirmation-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Evidence</h3>
              <p>Are you sure you want to delete this evidence document? This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button 
                  type="button" 
                  className="secondary" 
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="danger" 
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
