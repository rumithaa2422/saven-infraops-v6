import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { env } from '../../config/env.js';
import { validateImport } from '../../services/importValidation.service.js';
import { importUsers, ImportUserInput } from '../../services/importUsers.service.js';

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
 */
function parseFile(buffer: Buffer): {
  columns: string[];
  data: Record<string, unknown>[];
  totalRows: number;
  sheetName?: string;
} {
  let workbook: XLSX.WorkBook;
  
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new Error('Invalid or corrupted Excel file');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No worksheet found in the file');
  }

  const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
    defval: '',
    raw: false
  });

  if (sheetData.length === 0) {
    throw new Error('File is empty or has no data rows');
  }

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
 * Convert parsed row data to ImportUserInput
 */
function convertToUserInput(data: Record<string, unknown>[], startRow: number = 2): ImportUserInput[] {
  // Column name variations (case-insensitive matching)
  const columnVariations: Record<string, string[]> = {
    name: ['name', 'user name', 'username', 'full name', 'fullname', 'user'],
    email: ['email', 'email address', 'e-mail', 'mail'],
    phone: ['phone', 'phone number', 'phonenumber', 'mobile', 'contact', 'telephone'],
    department: ['department', 'dept', 'division', 'team'],
    role: ['role', 'user role', 'userrole', 'access level']
  };

  // Find actual column names in the data
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  function findColumn(key: string): string | undefined {
    const variations = columnVariations[key] || [key];
    const lowerColumns = columns.map(c => c.toLowerCase().trim());
    
    for (const variation of variations) {
      const index = lowerColumns.indexOf(variation.toLowerCase());
      if (index !== -1) {
        return columns[index];
      }
    }
    return undefined;
  }

  function normalize(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  return data.map((row, index) => {
    const nameCol = findColumn('name');
    const emailCol = findColumn('email');
    const phoneCol = findColumn('phone');
    const departmentCol = findColumn('department');
    const roleCol = findColumn('role');

    return {
      name: normalize(nameCol ? row[nameCol] : row['Name']),
      email: normalize(emailCol ? row[emailCol] : row['Email']).toLowerCase(),
      phoneNumber: normalize(phoneCol ? row[phoneCol] : row['Phone']) || undefined,
      department: normalize(departmentCol ? row[departmentCol] : row['Department']) || undefined,
      role: normalize(roleCol ? row[roleCol] : row['Role']) || undefined,
      importedRow: startRow + index
    };
  });
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
    const parsed = parseFile(req.file.buffer);

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

/**
 * POST /api/import/validate
 * Phase 4: Validate parsed import data before importing
 * Returns validation results
 */
importRouter.post('/validate', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), async (req, res) => {
  try {
    const { moduleType, data } = req.body as {
      moduleType: string;
      data: Record<string, unknown>[];
    };

    if (!moduleType) {
      return res.status(400).json({ error: 'moduleType is required' });
    }

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data to validate' });
    }

    // Validate the data
    const validationResult = await validateImport(moduleType, data);

    res.json(validationResult);
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('not implemented')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Import validation error:', error);
    res.status(500).json({ error: 'Failed to validate the data. Please check the data format.' });
  }
});

/**
 * POST /api/import/execute
 * Phase 5: Execute the import (create users)
 * Reuses existing createUser business logic
 */
importRouter.post('/execute', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), async (req, res) => {
  try {
    const { moduleType, data } = req.body as {
      moduleType: string;
      data: Record<string, unknown>[];
    };

    if (!moduleType) {
      return res.status(400).json({ error: 'moduleType is required' });
    }

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data to import' });
    }

    // First validate the data
    const validationResult = await validateImport(moduleType, data);

    // Check if all rows are valid
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Some rows have validation errors. Please fix them before importing.',
        validationResult
      });
    }

    // Convert parsed data to import format
    const usersToImport: ImportUserInput[] = data.map((row, index) => {
      const normalized = validationResult.rows.find(r => r.row === index + 2);
      return {
        name: String(normalized?.data.name || row.Name || ''),
        email: String(normalized?.data.email || row.Email || '').toLowerCase(),
        phoneNumber: normalized?.data.phone ? String(normalized.data.phone) : undefined,
        department: normalized?.data.department ? String(normalized.data.department) : undefined,
        role: normalized?.data.role ? String(normalized.data.role) : undefined,
        importedRow: index + 2 // Excel row number (1-indexed, header is row 1)
      };
    });

    // Execute the import
    const importResult = await importUsers(usersToImport);

    res.json(importResult);
  } catch (err) {
    const error = err as Error;
    console.error('Import execute error:', error);
    res.status(500).json({ error: 'Failed to import users. Please try again.' });
  }
});

// Legacy endpoint kept for backward compatibility
importRouter.post('/excel/preview', requireAuth, requirePermission('settings:write'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Excel file is required' });

  try {
    const parsed = parseFile(req.file.buffer);

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
