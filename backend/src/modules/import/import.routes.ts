import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { env } from '../../config/env.js';

export const importRouter = Router();

// Allowed MIME types for import
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

// File extensions for validation
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'];

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.EXCEL_MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Check MIME type
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    // Check extension as fallback
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only .csv and .xlsx files are allowed'));
  }
});

/**
 * POST /api/import/upload
 * Phase 2: Upload and validate file without reading contents
 * Returns file metadata only
 */
importRouter.post('/upload', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please select a .csv or .xlsx file.' });
  }

  // File successfully uploaded and validated
  res.json({
    success: true,
    file: {
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    }
  });
});

// Phase 3 (existing): Preview Excel file before import
importRouter.post('/excel/preview', requireAuth, requirePermission('settings:write'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Excel file is required' });

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  res.json({
    fileName: req.file.originalname,
    sheetName,
    rowCount: rows.length,
    columns: rows[0] ? Object.keys(rows[0]) : [],
    preview: rows.slice(0, 20)
  });
});

// Error handling middleware for multer
importRouter.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.includes('Only .csv and .xlsx files are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message.includes('File too large')) {
    return res.status(400).json({ error: `File too large. Maximum size is ${env.EXCEL_MAX_FILE_SIZE_MB}MB.` });
  }
  console.error('Import error:', err);
  res.status(500).json({ error: 'An error occurred while processing the file.' });
});
