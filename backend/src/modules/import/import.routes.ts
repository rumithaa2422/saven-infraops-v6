import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
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

// Preview row limit for large files
const PREVIEW_ROW_LIMIT = 10;

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
 * Parse Excel/CSV file and return JSON data
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Parsed data with metadata
 */
function parseFile(buffer: Buffer, mimeType: string): {
  columns: string[];
  data: Record<string, unknown>[];
  totalRows: number;
  sheetName?: string;
} {
  // Determine file type and parse accordingly
  let workbook: XLSX.WorkBook;
  
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new Error('Invalid or corrupted Excel file');
  }

  // For CSV, use the first sheet
  // For Excel, use the first worksheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No worksheet found in the file');
  }

  // Convert sheet to JSON using header row
  // defval: '' ensures empty cells become empty strings
  // header: 1 uses first row as headers
  const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
    defval: '',
    raw: false
  });

  if (sheetData.length === 0) {
    throw new Error('File is empty or has no data rows');
  }

  // Get column names from the first row
  const columns = Object.keys(sheetData[0]);

  if (columns.length === 0) {
    throw new Error('No columns found. File may be missing a header row.');
  }

  // Filter out completely empty rows
  const data = sheetData.filter(row => {
    return columns.some(col => {
      const value = row[col];
      return value !== undefined && value !== null && value !== '';
    });
  });

  return {
    columns,
    data,
    totalRows: data.length,
    sheetName
  };
}

/**
 * POST /api/import/upload
 * Phase 2-3: Upload file, validate, and parse to JSON
 * Returns file metadata and parsed data
 */
importRouter.post('/upload', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please select a .csv or .xlsx file.' });
  }

  try {
    // Parse the file
    const parsed = parseFile(req.file.buffer, req.file.mimetype);

    // Determine if we should return full data or preview
    const isLargeFile = parsed.totalRows > PREVIEW_ROW_LIMIT;
    const dataToReturn = isLargeFile ? parsed.data.slice(0, PREVIEW_ROW_LIMIT) : parsed.data;

    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      parsed: {
        totalRows: parsed.totalRows,
        columns: parsed.columns,
        sheetName: parsed.sheetName,
        isPreview: isLargeFile,
        data: dataToReturn
      }
    });
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('Invalid or corrupted')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('empty') || error.message.includes('No')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Import parse error:', error);
    res.status(500).json({ error: 'Failed to parse the file. Please check the file format.' });
  }
});

// Legacy endpoint kept for backward compatibility
importRouter.post('/excel/preview', requireAuth, requirePermission('settings:write'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Excel file is required' });

  try {
    const parsed = parseFile(req.file.buffer, req.file.mimetype);

    res.json({
      fileName: req.file.originalname,
      sheetName: parsed.sheetName,
      rowCount: parsed.totalRows,
      columns: parsed.columns,
      preview: parsed.data.slice(0, 20)
    });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ message: error.message });
  }
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
