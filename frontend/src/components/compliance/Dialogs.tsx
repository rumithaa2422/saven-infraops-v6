/**
 * Compliance Dialogs
 */

import React, { useState, useEffect } from 'react';

interface Framework {
  id: string;
  name: string;
  status: string;
}

interface AddFrameworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
}

export function AddFrameworkDialog({ isOpen, onClose, onSave }: AddFrameworkDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Framework name is required');
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create framework');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Framework</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="framework-name">Framework Name *</label>
              <input
                type="text"
                id="framework-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., ISO 27001, SOC 2, GDPR"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="framework-description">Description</label>
              <textarea
                id="framework-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the compliance framework..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Creating...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddControlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { frameworkId: string; name: string; description: string }) => Promise<void>;
  frameworks: Framework[];
}

export function AddControlDialog({ isOpen, onClose, onSave, frameworks }: AddControlDialogProps) {
  const [frameworkId, setFrameworkId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFrameworkId('');
      setName('');
      setDescription('');
      setError('');
    } else if (frameworks.length === 1) {
      setFrameworkId(frameworks[0].id);
    }
  }, [isOpen, frameworks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameworkId) {
      setError('Please select a framework');
      return;
    }
    if (!name.trim()) {
      setError('Control name is required');
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      await onSave({ frameworkId, name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create control');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Control</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="control-framework">Framework *</label>
              <select
                id="control-framework"
                value={frameworkId}
                onChange={(e) => setFrameworkId(e.target.value)}
              >
                <option value="">Select a framework...</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="control-name">Control Name *</label>
              <input
                type="text"
                id="control-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Access Control Policy, Data Encryption"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="control-description">Description</label>
              <textarea
                id="control-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the control requirement..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Creating...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditControlDialogProps {
  isOpen: boolean;
  control: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  onClose: () => void;
  onSave: (data: { id: string; name: string; description: string }) => Promise<void>;
}

export function EditControlDialog({ isOpen, control, onClose, onSave }: EditControlDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (control) {
      setName(control.name);
      setDescription(control.description || '');
    }
  }, [control]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Control name is required');
      return;
    }
    if (!control) return;
    
    setSaving(true);
    setError('');
    try {
      await onSave({ id: control.id, name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update control');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !control) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Control</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="edit-control-name">Control Name *</label>
              <input
                type="text"
                id="edit-control-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-control-description">Description</label>
              <textarea
                id="edit-control-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
