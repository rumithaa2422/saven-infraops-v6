import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { env } from '../../config/env.js';

export const importRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.EXCEL_MAX_FILE_SIZE_MB * 1024 * 1024 }
});

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
